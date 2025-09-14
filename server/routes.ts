import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { 
  insertProductSchema, insertChatSchema, insertMessageSchema, 
  insertUserSchema, insertPosterGenerationSchema, userRegisterSchema,
  insertEscrowTransactionSchema, escrowPublicCreateSchema
} from "@shared/schema";
import { generatePoster } from "./openai";
import { seedDatabase } from "./seed";

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Authentication utilities
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

const generateToken = (user: { id: number; username: string; email: string; role: string }): string => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Skip seeding - Laravel handles this now
  console.log("🔄 Skipping Node.js database seeding - Laravel handles this now");

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<number, WebSocket>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId') || '0');
    
    if (userId) {
      clients.set(userId, ws);
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat_message') {
          // Save message to database
          const newMessage = await storage.createMessage({
            chatId: message.chatId,
            senderId: message.senderId,
            content: message.content,
            messageType: 'text'
          });

          // Get chat participants
          const chat = await storage.getChat(message.chatId);
          if (chat) {
            // Send to both buyer and seller
            [chat.buyerId, chat.sellerId].forEach(participantId => {
              const participantWs = clients.get(participantId);
              if (participantWs && participantWs.readyState === WebSocket.OPEN) {
                participantWs.send(JSON.stringify({
                  type: 'new_message',
                  message: newMessage
                }));
              }
            });

            // Check for @admin mention
            if (message.content.includes('@admin')) {
              // AI Admin will process this
              setTimeout(async () => {
                const chatHistory = await storage.getMessagesByChatId(message.chatId);
                // This would trigger AI admin response
                const aiResponse = await processAdminMention(chatHistory, chat);
                
                const adminMessage = await storage.createMessage({
                  chatId: message.chatId,
                  senderId: 0, // AI admin ID
                  content: aiResponse,
                  messageType: 'ai_admin'
                });

                [chat.buyerId, chat.sellerId].forEach(participantId => {
                  const participantWs = clients.get(participantId);
                  if (participantWs && participantWs.readyState === WebSocket.OPEN) {
                    participantWs.send(JSON.stringify({
                      type: 'new_message',
                      message: adminMessage
                    }));
                  }
                });
              }, 1000);
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  // Auth middleware with JWT validation
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Get fresh user data from database
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.userId = user.id;
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };

  // Optional auth middleware (doesn't fail if no token)
  const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded) {
          const user = await storage.getUser(decoded.id);
          if (user) {
            req.userId = user.id;
            req.user = {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            };
          }
        }
      }
      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  };

  // Admin middleware - checks for admin or owner role
  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to access admin panel' 
        });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Owner always has access
      if (user.role === 'owner') {
        return next();
      }

      // Admin must be approved by owner
      if (user.role === 'admin' && user.isAdminApproved) {
        return next();
      }

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have admin access. Only approved admins and owners can access this area.'
      });
    } catch (error) {
      console.error('Admin middleware error:', error);
      return res.status(500).json({ error: 'Authorization failed' });
    }
  };

  // Owner middleware - checks for owner role only
  const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in' 
        });
      }

      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== 'owner') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the owner can access this area.'
        });
      }

      next();
    } catch (error) {
      console.error('Owner middleware error:', error);
      return res.status(500).json({ error: 'Authorization failed' });
    }
  };

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      // Use secure registration schema (no privilege escalation)
      const userData = userRegisterSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user with secure defaults
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        // Security: Always set role to 'user' for public registration
        role: 'user',
        walletBalance: '0',
        isVerified: false,
        isAdminApproved: false,
        adminRequestPending: false
      });
      
      // Generate JWT token
      const token = generateToken({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      });
      
      // Remove password from response
      const { password, ...userResponse } = newUser;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        token
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }
      
      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }
      
      // Generate JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      res.json({
        message: 'Login successful',
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  app.post('/api/auth/logout', requireAuth, async (req, res) => {
    try {
      // With JWT, logout is mainly handled client-side by removing the token
      // In a more sophisticated setup, you'd maintain a blacklist of tokens
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });
  
  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      res.json({ user: userResponse });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user data' });
    }
  });
  
  // User profile routes

  app.get('/api/users/profile/:id', optionalAuth, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/users/profile', requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      // Security: Remove sensitive fields that users shouldn't be able to update
      const { role, walletBalance, isVerified, isAdminApproved, ...safeUpdates } = updates;
      
      const user = await storage.updateUser(req.userId!, safeUpdates);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/users/switch-role', requireAuth, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['buyer', 'seller'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      
      // Security: Only allow switching between buyer/seller, not admin roles
      if (req.user?.role !== 'user' && !['buyer', 'seller'].includes(req.user?.role || '')) {
        return res.status(403).json({ error: 'Cannot switch from admin role' });
      }
      
      const user = await storage.updateUser(req.userId!, { role });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error('Role switch error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { category, limit, offset } = req.query;
      const products = await storage.getProducts({
        category: category as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/products/featured', async (req, res) => {
    try {
      const products = await storage.getProducts({ limit: 10 });
      const featured = products.filter(p => p.isPremium);
      res.json(featured);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/products', requireAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.userId!
      });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      console.error('Create product error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Only seller can update their own products
      if (product.sellerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to update this product' });
      }
      
      const updates = req.body;
      const updatedProduct = await storage.updateProduct(productId, updates);
      res.json(updatedProduct);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Only seller can delete their own products
      if (product.sellerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this product' });
      }
      
      await storage.updateProduct(productId, { status: 'draft' });
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Chat routes
  app.get('/api/chats', requireAuth, async (req, res) => {
    try {
      const chats = await storage.getChatsByUser(req.userId!);
      res.json(chats);
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/chats', requireAuth, async (req, res) => {
    try {
      const chatData = insertChatSchema.parse({
        ...req.body,
        buyerId: req.userId!
      });
      const chat = await storage.createChat(chatData);
      res.json(chat);
    } catch (error: any) {
      console.error('Create chat error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to create chat' });
    }
  });

  app.get('/api/chats/:id', requireAuth, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      // Only participants can access the chat
      if (chat.buyerId !== req.userId && chat.sellerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to access this chat' });
      }
      
      res.json(chat);
    } catch (error) {
      console.error('Get chat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/chats/:id/messages', requireAuth, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      // Only participants can access messages
      if (chat.buyerId !== req.userId && chat.sellerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to access this chat' });
      }
      
      const messages = await storage.getMessagesByChatId(chatId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/chats/:id/messages', requireAuth, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      // Only participants can send messages
      if (chat.buyerId !== req.userId && chat.sellerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to send messages in this chat' });
      }
      
      const messageData = insertMessageSchema.parse({
        chatId: chatId,
        senderId: req.userId!,
        content: req.body.content,
        messageType: req.body.messageType || 'text'
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error: any) {
      console.error('Send message error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Status routes
  app.get('/api/status', async (req, res) => {
    try {
      const statuses = await storage.getActiveStatusUpdates();
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Notifications routes
  app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.userId!);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Wallet routes
  app.get('/api/wallet/balance', requireAuth, async (req, res) => {
    try {
      const balance = await storage.getWalletBalance(req.userId!);
      res.json({ balance });
    } catch (error) {
      console.error('Get wallet balance error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/wallet/deposit', requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      
      // In a real implementation, this would integrate with payment gateway
      const currentBalance = await storage.getWalletBalance(req.userId!);
      const newBalance = (parseFloat(currentBalance) + parseFloat(amount)).toString();
      
      await storage.updateWalletBalance(req.userId!, newBalance);
      
      res.json({ 
        message: 'Deposit successful',
        balance: newBalance 
      });
    } catch (error) {
      console.error('Deposit error:', error);
      res.status(500).json({ error: 'Deposit failed' });
    }
  });

  app.post('/api/wallet/withdraw', requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      
      const currentBalance = await storage.getWalletBalance(req.userId!);
      
      if (parseFloat(currentBalance) < parseFloat(amount)) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      const newBalance = (parseFloat(currentBalance) - parseFloat(amount)).toString();
      await storage.updateWalletBalance(req.userId!, newBalance);
      
      res.json({ 
        message: 'Withdrawal successful',
        balance: newBalance 
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({ error: 'Withdrawal failed' });
    }
  });

  app.get('/api/wallet/transactions', requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUser(req.userId!);
      res.json(transactions);
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Poster generation routes
  app.post('/api/poster/generate', requireAuth, async (req, res) => {
    try {
      const posterData = insertPosterGenerationSchema.parse({
        ...req.body,
        userId: req.userId!
      });
      
      const poster = await storage.createPosterGeneration(posterData);
      
      // Start async poster generation
      generatePoster(poster.id, posterData.profileImage, posterData.selectedSkins as string[])
        .then(async (resultUrl) => {
          await storage.updatePosterGeneration(poster.id, {
            status: 'completed',
            resultUrl
          });
        })
        .catch(async (error) => {
          console.error('Poster generation failed:', error);
          await storage.updatePosterGeneration(poster.id, {
            status: 'failed'
          });
        });
      
      res.json(poster);
    } catch (error: any) {
      console.error('Poster generation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to generate poster' });
    }
  });

  // Admin Management Routes
  
  // Owner setup route (protected by setup key and throttling)
  app.post('/api/setup/owner', async (req, res) => {
    try {
      const { setupKey, username, email, password } = req.body;
      
      // In production, this should be an environment variable
      const SETUP_KEY = process.env.SETUP_KEY || 'admin-setup-key-change-in-production';
      
      if (setupKey !== SETUP_KEY) {
        return res.status(403).json({ error: 'Invalid setup key' });
      }
      
      // Check if owner already exists
      const existingOwner = await storage.getUserByEmail(email);
      if (existingOwner && existingOwner.role === 'owner') {
        return res.status(400).json({ error: 'Owner already exists' });
      }
      
      const hashedPassword = await hashPassword(password);
      
      const owner = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: 'owner',
        walletBalance: '0',
        isVerified: true,
        isAdminApproved: true
      });
      
      const token = generateToken({
        id: owner.id,
        username: owner.username,
        email: owner.email,
        role: owner.role
      });
      
      const { password: _, ...ownerResponse } = owner;
      
      res.status(201).json({
        message: 'Owner created successfully',
        user: ownerResponse,
        token
      });
    } catch (error) {
      console.error('Owner setup error:', error);
      res.status(500).json({ error: 'Failed to create owner' });
    }
  });

  // Request admin access
  app.post('/api/users/request-admin', requireAuth, async (req, res) => {
    try {
      const { reason } = req.body;
      
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ 
          error: 'Admin request reason must be at least 10 characters' 
        });
      }
      
      const user = await storage.updateUser(req.userId!, {
        adminRequestPending: true,
        adminRequestReason: reason,
        adminRequestAt: new Date()
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { password, ...userResponse } = user;
      res.json({
        message: 'Admin access request submitted successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Admin request error:', error);
      res.status(500).json({ error: 'Failed to submit admin request' });
    }
  });

  // Admin routes (Owner and approved Admins)
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      // This would typically have pagination and filtering
      // For now, return a basic implementation
      res.json({ message: 'Admin access granted - implement user list' });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
      // Basic admin stats implementation
      res.json({
        totalUsers: 0, // Implement actual counting
        totalProducts: 0,
        totalTransactions: 0,
        pendingEscrows: 0
      });
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Owner-only admin management routes
  app.get('/api/admin/requests', requireAuth, requireOwner, async (req, res) => {
    try {
      // Get pending admin requests - implement actual query
      res.json({ message: 'Owner access granted - implement pending requests' });
    } catch (error) {
      console.error('Get pending requests error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/admin/approve', requireAuth, requireOwner, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const user = await storage.updateUser(userId, {
        role: 'admin',
        isAdminApproved: true,
        adminApprovedAt: new Date(),
        approvedByOwnerId: req.userId!,
        adminRequestPending: false
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        message: 'Admin request approved successfully',
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      console.error('Approve admin error:', error);
      res.status(500).json({ error: 'Failed to approve admin' });
    }
  });

  app.post('/api/admin/deny', requireAuth, requireOwner, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const user = await storage.updateUser(userId, {
        adminRequestPending: false,
        adminRequestReason: null,
        adminRequestAt: null
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'Admin request denied successfully' });
    } catch (error) {
      console.error('Deny admin error:', error);
      res.status(500).json({ error: 'Failed to deny admin request' });
    }
  });

  // Escrow System Routes
  
  // Create escrow transaction (all authenticated users)
  app.post('/api/escrow/create', requireAuth, async (req, res) => {
    try {
      const escrowData = escrowPublicCreateSchema.parse({
        ...req.body,
        buyerId: req.userId!
      });
      
      const escrow = await storage.createEscrowTransaction({
        ...escrowData,
        status: 'pending',
        aiStatus: 'processing',
        riskScore: 0
      });
      
      res.json(escrow);
    } catch (error: any) {
      console.error('Create escrow error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to create escrow transaction' });
    }
  });

  app.post('/api/escrow/complete', requireAuth, async (req, res) => {
    try {
      const { escrowId } = req.body;
      
      if (!escrowId) {
        return res.status(400).json({ error: 'Escrow ID is required' });
      }
      
      const escrow = await storage.getEscrowTransaction(escrowId);
      
      if (!escrow) {
        return res.status(404).json({ error: 'Escrow transaction not found' });
      }
      
      // Only buyer can complete escrow
      if (escrow.buyerId !== req.userId) {
        return res.status(403).json({ error: 'Only buyer can complete escrow' });
      }
      
      const updatedEscrow = await storage.updateEscrowTransaction(escrowId, {
        status: 'completed',
        completedBy: req.userId!,
        completedAt: new Date()
      });
      
      res.json(updatedEscrow);
    } catch (error) {
      console.error('Complete escrow error:', error);
      res.status(500).json({ error: 'Failed to complete escrow transaction' });
    }
  });

  // Escrow system routes (Owner and Admin access)
  app.get('/api/escrow/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getEscrowStats();
      res.json(stats);
    } catch (error) {
      console.error('Get escrow stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/escrow/transactions', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      let transactions;
      
      if (status) {
        transactions = await storage.getEscrowTransactionsByStatus(status as string);
      } else {
        transactions = await storage.getEscrowTransactionsByStatus('pending');
      }
      
      res.json(transactions);
    } catch (error) {
      console.error('Get escrow transactions error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/escrow/process', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { escrowId, action, note } = req.body;
      
      if (!escrowId || !action) {
        return res.status(400).json({ error: 'Escrow ID and action are required' });
      }
      
      const updates: any = {
        approvedBy: req.userId!,
        approvedAt: new Date(),
        adminNote: note || null
      };
      
      if (action === 'approve') {
        updates.status = 'active';
        updates.aiStatus = 'approved';
      } else if (action === 'reject') {
        updates.status = 'cancelled';
        updates.aiStatus = 'flagged';
      }
      
      const escrow = await storage.updateEscrowTransaction(escrowId, updates);
      
      if (!escrow) {
        return res.status(404).json({ error: 'Escrow transaction not found' });
      }
      
      res.json(escrow);
    } catch (error) {
      console.error('Process escrow error:', error);
      res.status(500).json({ error: 'Failed to process escrow transaction' });
    }
  });

  app.post('/api/escrow/reanalyze', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { escrowId } = req.body;
      
      if (!escrowId) {
        return res.status(400).json({ error: 'Escrow ID is required' });
      }
      
      const escrow = await storage.updateEscrowTransaction(escrowId, {
        aiStatus: 'processing',
        riskScore: 0, // Reset risk score for re-analysis
        aiDecision: null
      });
      
      if (!escrow) {
        return res.status(404).json({ error: 'Escrow transaction not found' });
      }
      
      res.json({ 
        message: 'Escrow transaction queued for re-analysis',
        escrow 
      });
    } catch (error) {
      console.error('Re-analyze escrow error:', error);
      res.status(500).json({ error: 'Failed to re-analyze escrow transaction' });
    }
  });

  // Admin panel routes (owner + approved admins)
  app.get('/api/panel/dashboard', requireAuth, requireAdmin, async (req, res) => {
    try {
      res.json({ message: 'Admin panel access granted' });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return httpServer;
}

// AI Admin helper function
async function processAdminMention(chatHistory: any[], chat: any): Promise<string> {
  // This would use OpenAI to analyze chat and provide resolution
  // For now, return a simple response
  return "Hello! I'm the AI Admin. I've reviewed your conversation and I'm here to help resolve any issues. Please let me know what specific assistance you need.";
}
