import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { 
  insertProductSchema, insertChatSchema, insertMessageSchema, 
  insertUserSchema, insertPosterGenerationSchema, userRegisterSchema 
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

  app.get('/api/chats/:id/messages', requireAuth, async (req, res) => {
    try {
      const messages = await storage.getMessagesByChatId(parseInt(req.params.id));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
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

  return httpServer;
}

// AI Admin helper function
async function processAdminMention(chatHistory: any[], chat: any): Promise<string> {
  // This would use OpenAI to analyze chat and provide resolution
  // For now, return a simple response
  return "Hello! I'm the AI Admin. I've reviewed your conversation and I'm here to help resolve any issues. Please let me know what specific assistance you need.";
}
