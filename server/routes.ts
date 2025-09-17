import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  insertProductSchema, insertChatSchema, insertMessageSchema, 
  insertUserSchema, insertPosterGenerationSchema, userRegisterSchema,
  insertEscrowTransactionSchema, escrowPublicCreateSchema, insertRepostSchema
} from "@shared/schema";
import { generatePoster, processAdminMention } from "./deepseek";
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

// JWT Secret (required in production, secure fallback for development)
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production' 
    ? (() => { console.error('FATAL: JWT_SECRET environment variable is required in production'); process.exit(1); })()
    : 'dev-secure-fallback-jwt-secret-at-least-32-chars-long-change-in-production'
);

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

// File upload configuration
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat-files');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const fileUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_randomstring_originalname
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '_' + sanitizedName);
  }
});

// File filter for security
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip', 'application/x-zip-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'), false);
  }
};

const upload = multer({
  storage: fileUploadStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize database with seed data if needed
  console.log("🔄 Node.js backend initializing...");
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads'), { 
    index: false,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }));

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<number, WebSocket>();

  wss.on('connection', async (ws, req) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1000, 'Authentication required');
        return;
      }
      
      const decoded = verifyToken(token);
      if (!decoded) {
        ws.close(1000, 'Invalid token');
        return;
      }
      
      const user = await storage.getUser(decoded.id);
      if (!user) {
        ws.close(1000, 'User not found');
        return;
      }
      
      clients.set(user.id, ws);
      
      // Store user info for this connection
      (ws as any).userId = user.id;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat_message') {
          // Validate message using authenticated user ID
          const messageData = insertMessageSchema.parse({
            chatId: message.chatId,
            senderId: (ws as any).userId, // Use authenticated user ID, not client-provided
            content: message.content,
            messageType: 'text'
          });
          
          // Verify user can send messages to this chat
          const chat = await storage.getChat(messageData.chatId);
          if (!chat || (chat.buyerId !== messageData.senderId && chat.sellerId !== messageData.senderId)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to send messages in this chat' }));
            return;
          }
          
          // Save message to database
          const newMessage = await storage.createMessage(messageData);

          // Send to chat participants  
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
                
                // Create AI admin system user if doesn't exist
                let aiAdminUser = await storage.getUserByUsername('ai-admin');
                if (!aiAdminUser) {
                  aiAdminUser = await storage.createUser({
                    username: 'ai-admin',
                    email: 'ai-admin@system.local',
                    password: await hashPassword('system-ai-admin'),
                    role: 'admin',
                    displayName: 'AI Admin',
                    isVerified: true,
                    isAdminApproved: true,
                    walletBalance: '0'
                  });
                }
                const aiAdminId = aiAdminUser.id;
                
                const adminMessage = await storage.createMessage({
                  chatId: message.chatId,
                  senderId: aiAdminId,
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
      const userId = (ws as any).userId;
      if (userId) {
        clients.delete(userId);
      }
    });
    
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1000, 'Connection failed');
    }
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
      const { category, limit, offset, sellerId } = req.query;
      
      // Validate sellerId if provided
      let validatedSellerId: number | undefined;
      if (sellerId) {
        const id = Number(sellerId);
        if (Number.isNaN(id)) {
          return res.status(400).json({ error: 'Invalid sellerId' });
        }
        validatedSellerId = id;
      }
      
      // Validate and set pagination limits
      let validatedLimit = 12; // Default limit for better performance
      let validatedOffset = 0; // Default offset
      
      if (limit) {
        const parsedLimit = parseInt(limit as string);
        if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
          validatedLimit = Math.min(parsedLimit, 50); // Max 50 items per page
        }
      }
      
      if (offset) {
        const parsedOffset = parseInt(offset as string);
        if (!Number.isNaN(parsedOffset) && parsedOffset >= 0) {
          validatedOffset = parsedOffset;
        }
      }
      
      const products = await storage.getProducts({
        category: category as string,
        sellerId: validatedSellerId,
        limit: validatedLimit,
        offset: validatedOffset
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
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get repost metadata
      const repostCount = await storage.getRepostCountByProduct(productId);
      const isReposted = req.userId ? !!(await storage.getRepost(req.userId, productId)) : false;

      // Add repost metadata to product
      const productWithReposts = {
        ...product,
        repostCount,
        isReposted
      };

      res.json(productWithReposts);
    } catch (error) {
      console.error('Get product error:', error);
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

  // Repost routes
  app.post('/api/reposts', requireAuth, async (req, res) => {
    try {
      const { productId, statusId, comment } = req.body;
      const userId = req.userId!;
      
      // Validate that either productId or statusId is provided, not both
      if ((!productId && !statusId) || (productId && statusId)) {
        return res.status(400).json({ error: 'Must provide either productId or statusId, not both' });
      }
      
      // Check if already reposted
      const existingRepost = await storage.getRepost(userId, productId, statusId);
      if (existingRepost) {
        // Delete the existing repost (toggle off)
        await storage.deleteRepost(userId, productId, statusId);
        return res.json({ message: 'Repost removed successfully', isReposted: false });
      }
      
      // If reposting a product, check if it exists and user is not the owner
      if (productId) {
        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        if (product.sellerId === userId) {
          return res.status(400).json({ error: 'Cannot repost your own product' });
        }
      }
      
      // Create the repost
      const repostData = insertRepostSchema.parse({
        userId,
        productId: productId || null,
        statusId: statusId || null,
        comment: comment || null
      });
      
      const repost = await storage.createRepost(repostData);
      res.json({ message: 'Reposted successfully', repost, isReposted: true });
    } catch (error) {
      console.error('Repost error:', error);
      res.status(500).json({ error: 'Failed to create repost' });
    }
  });

  app.get('/api/reposts/user/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reposts = await storage.getRepostsByUser(userId);
      res.json(reposts);
    } catch (error) {
      console.error('Get user reposts error:', error);
      res.status(500).json({ error: 'Failed to get user reposts' });
    }
  });

  app.delete('/api/reposts', requireAuth, async (req, res) => {
    try {
      const { productId, statusId } = req.query;
      const userId = req.userId!;
      
      if ((!productId && !statusId) || (productId && statusId)) {
        return res.status(400).json({ error: 'Must provide either productId or statusId, not both' });
      }
      
      await storage.deleteRepost(userId, parseInt(productId as string), parseInt(statusId as string));
      res.json({ message: 'Repost removed successfully' });
    } catch (error) {
      console.error('Delete repost error:', error);
      res.status(500).json({ error: 'Failed to remove repost' });
    }
  });

  app.get('/api/reposts/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reposts = await storage.getRepostsByUser(userId);
      res.json(reposts);
    } catch (error) {
      console.error('Get reposts error:', error);
      res.status(500).json({ error: 'Failed to get reposts' });
    }
  });

  // Chat routes
  // File upload endpoint for chat attachments
  app.post('/api/chats/:id/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      // Only participants can upload files
      if (chat.buyerId !== req.userId && chat.sellerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to upload files in this chat' });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Generate file URL
      const fileUrl = `/uploads/chat-files/${req.file.filename}`;
      
      // Determine message type based on file mimetype
      let messageType = 'file';
      if (req.file.mimetype.startsWith('image/')) {
        messageType = 'image';
      }
      
      // Create message with file attachment
      const messageData = insertMessageSchema.parse({
        chatId: chatId,
        senderId: req.userId!,
        content: fileUrl,
        messageType: messageType,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedAt: new Date().toISOString()
        }
      });
      
      const message = await storage.createMessage(messageData);
      
      // Broadcast file message to WebSocket clients (both sender and receiver)
      const otherUserId = chat.buyerId === req.userId ? chat.sellerId : chat.buyerId;
      const wsMessageData = {
        type: 'new_message',
        chatId: chatId,
        message: message
      };
      
      // Send to other participant
      const otherClient = clients.get(otherUserId);
      if (otherClient && otherClient.readyState === WebSocket.OPEN) {
        otherClient.send(JSON.stringify(wsMessageData));
      }
      
      // Send to sender for immediate feedback
      const senderClient = clients.get(req.userId!);
      if (senderClient && senderClient.readyState === WebSocket.OPEN) {
        senderClient.send(JSON.stringify(wsMessageData));
      }
      
      res.json(message);
    } catch (error: any) {
      console.error('File upload error:', error);
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Message status update endpoints
  app.post('/api/messages/:id/delivered', requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      // Get message and verify authorization
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Get chat to verify user is participant
      const chat = await storage.getChat(message.chatId);
      if (!chat || (chat.buyerId !== req.userId && chat.sellerId !== req.userId)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Only receiver can mark as delivered (not sender)
      if (message.senderId === req.userId) {
        return res.status(400).json({ error: 'Cannot mark own message as delivered' });
      }
      
      // Update message status to delivered
      await storage.updateMessageStatus(messageId, 'delivered');
      
      // Broadcast status update via WebSocket
      const senderClient = clients.get(message.senderId);
      if (senderClient && senderClient.readyState === WebSocket.OPEN) {
        senderClient.send(JSON.stringify({
          type: 'message_status_update',
          messageId: messageId,
          status: 'delivered',
          chatId: message.chatId
        }));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Mark delivered error:', error);
      res.status(500).json({ error: 'Failed to mark as delivered' });
    }
  });

  app.post('/api/messages/:id/read', requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      // Get message and verify authorization
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Get chat to verify user is participant
      const chat = await storage.getChat(message.chatId);
      if (!chat || (chat.buyerId !== req.userId && chat.sellerId !== req.userId)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Only receiver can mark as read (not sender)
      if (message.senderId === req.userId) {
        return res.status(400).json({ error: 'Cannot mark own message as read' });
      }
      
      // Update message status to read (and delivered if not already)
      await storage.updateMessageStatus(messageId, 'read');
      
      // Broadcast status update via WebSocket
      const senderClient = clients.get(message.senderId);
      if (senderClient && senderClient.readyState === WebSocket.OPEN) {
        senderClient.send(JSON.stringify({
          type: 'message_status_update',
          messageId: messageId,
          status: 'read',
          chatId: message.chatId
        }));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Mark read error:', error);
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  });

  app.get('/api/chats', requireAuth, async (req, res) => {
    try {
      const chats = await storage.getChatsWithDetailsByUser(req.userId!);
      res.json(chats);
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/chats/unread', requireAuth, async (req, res) => {
    try {
      // For now, return 0 as we don't have unread logic implemented yet
      // TODO: Implement proper unread count logic based on last message read timestamp
      res.json(0);
    } catch (error) {
      console.error('Get unread chats error:', error);
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
      const chat = await storage.getChatWithDetails(chatId);
      
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

  // Escrow transaction actions for chats
  app.post('/api/chats/:id/actions/complete', requireAuth, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      
      // Validate request body
      const { completionNote } = req.body;
      if (completionNote && (typeof completionNote !== 'string' || completionNote.length > 500)) {
        return res.status(400).json({ error: 'Invalid completion note' });
      }
      
      // Get chat and verify authorization
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      if (chat.buyerId !== req.userId && chat.sellerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to access this chat' });
      }
      
      // CRITICAL: Only buyers can complete transactions to prevent financial fraud
      if (chat.buyerId !== req.userId) {
        return res.status(403).json({ error: 'Only buyers can complete transactions' });
      }
      
      // Get escrow transaction
      if (!chat.productId) {
        return res.status(400).json({ error: 'No product associated with this chat' });
      }
      
      const escrowTransaction = await storage.getEscrowTransactionByChat(
        chat.productId, chat.buyerId, chat.sellerId
      );
      
      if (!escrowTransaction) {
        return res.status(404).json({ error: 'No escrow transaction found for this chat' });
      }
      
      if (escrowTransaction.status !== 'active') {
        return res.status(400).json({ error: 'Transaction must be active to complete' });
      }
      
      // Update escrow transaction to completed
      const updatedEscrow = await storage.updateEscrowTransaction(escrowTransaction.id, {
        status: 'completed',
        completedBy: req.userId!,
        completedAt: new Date(),
        completionNote: completionNote || null
      });
      
      // Create system message about completion
      const systemMessage = await storage.createMessage({
        chatId,
        senderId: req.userId!,
        content: `✅ Transaksi telah diselesaikan oleh pembeli. Dana akan dirilis ke penjual.`,
        messageType: 'system'
      });
      
      // TODO: Broadcast system message to both participants via WebSocket
      // This should notify both buyer and seller immediately
      
      res.json(updatedEscrow);
    } catch (error) {
      console.error('Complete transaction error:', error);
      res.status(500).json({ error: 'Failed to complete transaction' });
    }
  });

  app.post('/api/chats/:id/actions/dispute', requireAuth, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      
      // Validate request body
      const { disputeReason } = req.body;
      if (!disputeReason || typeof disputeReason !== 'string' || disputeReason.trim().length === 0) {
        return res.status(400).json({ error: 'Dispute reason is required' });
      }
      if (disputeReason.length > 1000) {
        return res.status(400).json({ error: 'Dispute reason too long (max 1000 characters)' });
      }
      
      // Get chat and verify authorization
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      if (chat.buyerId !== req.userId && chat.sellerId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to access this chat' });
      }
      
      // Get escrow transaction
      if (!chat.productId) {
        return res.status(400).json({ error: 'No product associated with this chat' });
      }
      
      const escrowTransaction = await storage.getEscrowTransactionByChat(
        chat.productId, chat.buyerId, chat.sellerId
      );
      
      if (!escrowTransaction) {
        return res.status(404).json({ error: 'No escrow transaction found for this chat' });
      }
      
      // Enforce proper status constraints for disputes
      if (!['pending', 'active'].includes(escrowTransaction.status)) {
        return res.status(400).json({ error: 'Transaction can only be disputed when pending or active' });
      }
      
      // Update escrow transaction to disputed
      const updatedEscrow = await storage.updateEscrowTransaction(escrowTransaction.id, {
        status: 'disputed',
        adminNote: disputeReason || 'Dispute raised by user'
      });
      
      // Create system message about dispute
      const systemMessage = await storage.createMessage({
        chatId,
        senderId: req.userId!,
        content: `🚨 Transaksi telah dilaporkan sebagai sengketa oleh ${chat.buyerId === req.userId ? 'pembeli' : 'penjual'}. Tim admin akan segera meninjau. Alasan: ${disputeReason.trim()}`,
        messageType: 'system'
      });
      
      // TODO: Broadcast system message to both participants via WebSocket
      // This should notify both buyer and seller immediately
      
      res.json(updatedEscrow);
    } catch (error) {
      console.error('Dispute transaction error:', error);
      res.status(500).json({ error: 'Failed to dispute transaction' });
    }
  });

  // Status routes
  app.get('/api/status', async (req, res) => {
    try {
      const statuses = await storage.getActiveStatusUpdates();
      res.json(statuses);
    } catch (error) {
      console.error('Status route error:', error);
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
        status: 'pending'
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
      } else if (action === 'reject') {
        updates.status = 'cancelled';
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

  // Laravel-compatible route aliases for seamless migration
  app.post('/api/register', async (req, res) => {
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
    
  app.post('/api/login', async (req, res) => {
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
  
  app.post('/api/logout', requireAuth, async (req, res) => {
    try {
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });
  
  app.get('/api/user', requireAuth, async (req, res) => {
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

  // Missing endpoints for new pages
  
  // Notifications (reuse wallet notifications for now)
  app.get('/api/notifications', requireAuth, async (req, res) => {
    try {
      // For now, return empty array as notification system is not fully implemented
      // In production, this would return user-specific notifications
      res.json([]);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Mark notification as read
  app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      // Mock response - would update notification read status in database
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Delete notification
  app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      // Mock response - would delete notification from database
      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Mark all notifications as read
  app.patch('/api/notifications/mark-all-read', requireAuth, async (req, res) => {
    try {
      // Mock response - would mark all user notifications as read
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Transaction history endpoints
  app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
      // Return empty array for now - would implement transaction history later
      res.json([]);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  app.get('/api/wallet/transactions', requireAuth, async (req, res) => {
    try {
      // Return empty array for now - would get from wallet transaction storage
      res.json([]);
    } catch (error) {
      console.error('Get wallet transactions error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Seller dashboard endpoints
  app.get('/api/seller/stats', requireAuth, async (req, res) => {
    try {
      // Mock seller statistics
      const mockStats = {
        totalProducts: 0,
        activeProducts: 0,
        totalSales: 0,
        totalEarnings: "0",
        totalViews: 0,
        averageRating: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
      
      res.json(mockStats);
    } catch (error) {
      console.error('Get seller stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  app.get('/api/seller/products', requireAuth, async (req, res) => {
    try {
      // Get products by current user (seller)
      const products = await storage.getProducts({});
      const userProducts = products.filter(p => p.sellerId === req.userId);
      res.json(userProducts);
    } catch (error) {
      console.error('Get seller products error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  app.get('/api/seller/sales', requireAuth, async (req, res) => {
    try {
      // Return empty array for now - would implement sales tracking later
      res.json([]);
    } catch (error) {
      console.error('Get seller sales error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Category products endpoint
  app.get('/api/products/category/:categoryId', async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const products = await storage.getProducts({ category: categoryId });
      res.json(products);
    } catch (error) {
      console.error('Get category products error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Search endpoint
  app.get('/api/search', async (req, res) => {
    try {
      const { q: query, category, minPrice, maxPrice, sortBy, isPremium } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.json([]);
      }
      
      // Simple search implementation - in production would use proper search engine
      const allProducts = await storage.getProducts({});
      let searchResults = allProducts.filter(product => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      
      // Apply filters
      if (category && category !== 'all') {
        searchResults = searchResults.filter(p => p.category === category);
      }
      
      if (minPrice) {
        const min = parseFloat(minPrice as string);
        searchResults = searchResults.filter(p => parseFloat(p.price) >= min);
      }
      
      if (maxPrice) {
        const max = parseFloat(maxPrice as string);
        searchResults = searchResults.filter(p => parseFloat(p.price) <= max);
      }
      
      if (isPremium && isPremium !== 'all') {
        const premium = isPremium === 'premium';
        searchResults = searchResults.filter(p => p.isPremium === premium);
      }
      
      // Apply sorting
      if (sortBy) {
        switch (sortBy) {
          case 'price_low':
            searchResults.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
          case 'price_high':
            searchResults.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
          case 'newest':
            searchResults.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            break;
          default:
            // Keep relevance order (default)
            break;
        }
      }
      
      res.json(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  // Status updates endpoints
  app.get('/api/status', requireAuth, async (req, res) => {
    try {
      // For now, return empty array as status system is not fully implemented
      // In production, this would return active status updates
      res.json([]);
    } catch (error) {
      console.error('Get status updates error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  app.post('/api/status', requireAuth, async (req, res) => {
    try {
      const { content, mediaType } = req.body;
      
      // Mock response - would create status update in database
      const newStatus = {
        id: Date.now(), // Mock ID
        userId: req.userId,
        content,
        mediaType: mediaType || 'text',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      res.json(newStatus);
    } catch (error) {
      console.error('Create status update error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return httpServer;
}

