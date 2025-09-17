import express, { type Request, Response } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRegisterSchema, userUpdateSchema, insertProductSchema, insertChatSchema, insertMessageSchema, insertStatusUpdateSchema, insertRepostSchema } from "@shared/schema";
import { processAdminMention } from "./deepseek";
import { generatePoster } from "./deepseek";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { db } from "./db";
import { users, products, chats, messages, statusUpdates, reposts, notifications, escrowTransactions } from "@shared/schema";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware untuk autentikasi JWT
function authenticateToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware untuk role checking
function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}

export function registerRoutes(app: express.Application) {
  const server = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  // WebSocket connection handling
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Handle authentication via query parameter
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      (ws as any).userId = decoded.id;
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          // Handle different message types
          console.log('WebSocket message received:', message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });
      
    } catch (error) {
      ws.close(1008, 'Invalid token');
    }
  });

  // Auth routes
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = userRegisterSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/user", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    res.json({ success: true });
  });

  // Products routes
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const { category, sellerId, limit, offset } = req.query;
      
      const filters: any = {};
      if (category && category !== 'all') filters.category = category as string;
      if (sellerId) filters.sellerId = parseInt(sellerId as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const products = await storage.getProducts(filters);
      
      // Add seller information to each product
      const productsWithSeller = await Promise.all(
        products.map(async (product) => {
          const seller = await storage.getUser(product.sellerId);
          return {
            ...product,
            seller: seller ? {
              username: seller.username,
              displayName: seller.displayName,
              isVerified: seller.isVerified
            } : null
          };
        })
      );

      res.json(productsWithSeller);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get seller information
      const seller = await storage.getUser(product.sellerId);
      
      // Get repost count and check if current user has reposted
      const repostCount = await storage.getRepostCountByProduct(productId);
      let isReposted = false;
      
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          const existingRepost = await storage.getRepost(decoded.id, productId);
          isReposted = !!existingRepost;
        } catch (error) {
          // Token invalid, continue without repost status
        }
      }

      res.json({
        ...product,
        seller: seller ? {
          id: seller.id,
          username: seller.username,
          displayName: seller.displayName,
          profilePicture: seller.profilePicture,
          isVerified: seller.isVerified,
          rating: "4.8" // Mock rating for now
        } : null,
        repostCount,
        isReposted
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.post("/api/products", authenticateToken, async (req: Request, res: Response) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.user.id
      });

      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Create product error:', error);
      res.status(400).json({ message: error.message || "Failed to create product" });
    }
  });

  // Status updates routes
  app.get("/api/status", async (req: Request, res: Response) => {
    try {
      const statusUpdates = await storage.getActiveStatusUpdates();
      
      // Add user information to each status
      const statusWithUsers = await Promise.all(
        statusUpdates.map(async (status) => {
          const user = await storage.getUser(status.userId);
          return {
            id: status.id,
            username: user?.username || 'Unknown',
            content: status.content || '',
            createdAt: status.createdAt || new Date().toISOString()
          };
        })
      );

      res.json(statusWithUsers);
    } catch (error) {
      console.error('Get status updates error:', error);
      res.status(500).json({ message: "Failed to get status updates" });
    }
  });

  app.post("/api/status", authenticateToken, async (req: Request, res: Response) => {
    try {
      const statusData = insertStatusUpdateSchema.parse({
        ...req.body,
        userId: req.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });

      const status = await storage.createStatusUpdate(statusData);
      res.status(201).json(status);
    } catch (error: any) {
      console.error('Create status error:', error);
      res.status(400).json({ message: error.message || "Failed to create status" });
    }
  });

  // Reposts routes
  app.post("/api/reposts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { productId, statusId, comment } = req.body;
      const userId = req.user.id;

      if (!productId && !statusId) {
        return res.status(400).json({ message: "Either productId or statusId is required" });
      }

      // Check if already reposted
      const existingRepost = await storage.getRepost(userId, productId, statusId);
      
      if (existingRepost) {
        // Remove repost (toggle off)
        await storage.deleteRepost(userId, productId, statusId);
        res.json({ isReposted: false, message: "Repost removed" });
      } else {
        // Create new repost
        const repostData = insertRepostSchema.parse({
          userId,
          productId: productId || null,
          statusId: statusId || null,
          comment: comment || null
        });

        await storage.createRepost(repostData);
        res.json({ isReposted: true, message: "Repost created" });
      }
    } catch (error: any) {
      console.error('Repost error:', error);
      res.status(400).json({ message: error.message || "Failed to handle repost" });
    }
  });

  app.get("/api/reposts/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const reposts = await storage.getRepostsByUser(userId);
      
      // Populate repost data with product/status information
      const repostsWithData = await Promise.all(
        reposts.map(async (repost) => {
          let populatedRepost: any = { ...repost };
          
          if (repost.productId) {
            const product = await storage.getProduct(repost.productId);
            populatedRepost.product = product;
          }
          
          if (repost.statusId) {
            // Get status update - would need to implement this in storage
            // For now, return basic info
            populatedRepost.status = {
              id: repost.statusId,
              content: "Status content",
              createdAt: repost.createdAt
            };
          }
          
          return populatedRepost;
        })
      );

      res.json(repostsWithData);
    } catch (error) {
      console.error('Get user reposts error:', error);
      res.status(500).json({ message: "Failed to get reposts" });
    }
  });

  // Chat routes
  app.get("/api/chats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const chats = await storage.getChatsWithDetailsByUser(req.user.id);
      res.json(chats);
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ message: "Failed to get chats" });
    }
  });

  app.post("/api/chats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { productId, sellerId } = req.body;
      const buyerId = req.user.id;

      // Check if chat already exists
      const existingChats = await storage.getChatsByUser(buyerId);
      const existingChat = existingChats.find(chat => 
        chat.productId === productId && 
        chat.sellerId === sellerId && 
        chat.buyerId === buyerId
      );

      if (existingChat) {
        return res.json(existingChat);
      }

      const chatData = insertChatSchema.parse({
        productId,
        buyerId,
        sellerId
      });

      const chat = await storage.createChat(chatData);
      res.status(201).json(chat);
    } catch (error: any) {
      console.error('Create chat error:', error);
      res.status(400).json({ message: error.message || "Failed to create chat" });
    }
  });

  app.get("/api/chats/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChatWithDetails(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Verify user has access to this chat
      if (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(chat);
    } catch (error) {
      console.error('Get chat error:', error);
      res.status(500).json({ message: "Failed to get chat" });
    }
  });

  app.get("/api/chats/:id/messages", authenticateToken, async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.id);
      
      // Verify user has access to this chat
      const chat = await storage.getChat(chatId);
      if (!chat || (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getMessagesByChatId(chatId);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/chats/:id/messages", authenticateToken, async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.id);
      const { content, messageType = 'text' } = req.body;

      // Verify user has access to this chat
      const chat = await storage.getChat(chatId);
      if (!chat || (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messageData = insertMessageSchema.parse({
        chatId,
        senderId: req.user.id,
        content,
        messageType
      });

      const message = await storage.createMessage(messageData);

      // Handle AI admin mentions
      if (content.includes('@admin')) {
        try {
          const chatHistory = await storage.getMessagesByChatId(chatId);
          const aiResponse = await processAdminMention(chatHistory, chat);
          
          // Create AI admin response
          const aiMessage = await storage.createMessage({
            chatId,
            senderId: 0, // Special ID for AI admin
            content: aiResponse,
            messageType: 'ai_admin'
          });
        } catch (aiError) {
          console.error('AI admin processing failed:', aiError);
        }
      }

      res.status(201).json(message);
    } catch (error: any) {
      console.error('Create message error:', error);
      res.status(400).json({ message: error.message || "Failed to create message" });
    }
  });

  // Wallet routes
  app.get("/api/wallet/balance", authenticateToken, async (req: Request, res: Response) => {
    try {
      const balance = await storage.getWalletBalance(req.user.id);
      res.json({ balance });
    } catch (error) {
      console.error('Get wallet balance error:', error);
      res.status(500).json({ message: "Failed to get wallet balance" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // User profile routes
  app.get("/api/users/profile/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return public profile data (exclude sensitive information)
      const { password, email, ...publicProfile } = user;
      res.json(publicProfile);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });

  app.put("/api/users/profile", authenticateToken, async (req: Request, res: Response) => {
    try {
      const updates = userUpdateSchema.parse(req.body);
      const userId = req.user.id;

      // If updating password, verify current password
      if (updates.newPassword && updates.currentPassword) {
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(updates.currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(updates.newPassword, 10);
        updates.password = hashedPassword;
      }

      // Remove password fields from updates object before saving
      const { currentPassword, newPassword, ...safeUpdates } = updates;
      if (updates.newPassword) {
        (safeUpdates as any).password = (updates as any).password;
      }

      const updatedUser = await storage.updateUser(userId, safeUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error('Update user profile error:', error);
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  // Search routes
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const { q, category, minPrice, maxPrice, sortBy, isPremium } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Build search query
      let query = db.select().from(products).where(eq(products.status, "active"));
      
      // Add search conditions
      const searchConditions = [
        like(products.title, `%${q}%`),
        like(products.description, `%${q}%`)
      ];
      
      query = query.where(and(
        eq(products.status, "active"),
        or(...searchConditions)
      ));

      // Add filters
      if (category && category !== 'all') {
        query = query.where(and(
          eq(products.status, "active"),
          or(...searchConditions),
          eq(products.category, category as string)
        ));
      }

      if (isPremium && isPremium !== 'all') {
        const premiumValue = isPremium === 'premium';
        query = query.where(and(
          eq(products.status, "active"),
          or(...searchConditions),
          eq(products.isPremium, premiumValue)
        ));
      }

      // Execute query
      const results = await query.limit(50);
      
      // Add seller information
      const resultsWithSeller = await Promise.all(
        results.map(async (product) => {
          const seller = await storage.getUser(product.sellerId);
          return {
            ...product,
            seller: seller ? {
              username: seller.username,
              isVerified: seller.isVerified
            } : null
          };
        })
      );

      res.json(resultsWithSeller);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", authenticateToken, requireRole(['admin', 'owner']), async (req: Request, res: Response) => {
    try {
      // Get admin statistics
      const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [totalAdmins] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'admin'));
      const [pendingRequests] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.adminRequestPending, true));
      const [totalOwners] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'owner'));

      res.json({
        totalUsers: totalUsers.count,
        totalAdmins: totalAdmins.count,
        pendingAdminRequests: pendingRequests.count,
        totalOwners: totalOwners.count,
        recentAdminApprovals: 0 // TODO: Implement this
      });
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireRole(['admin', 'owner']), async (req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      
      // Remove passwords from response
      const usersWithoutPasswords = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Get admin users error:', error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/requests", authenticateToken, requireRole(['admin', 'owner']), async (req: Request, res: Response) => {
    try {
      const pendingRequests = await db.select().from(users)
        .where(eq(users.adminRequestPending, true))
        .orderBy(desc(users.adminRequestAt));
      
      // Remove passwords from response
      const requestsWithoutPasswords = pendingRequests.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(requestsWithoutPasswords);
    } catch (error) {
      console.error('Get admin requests error:', error);
      res.status(500).json({ message: "Failed to get admin requests" });
    }
  });

  // Poster generation routes
  app.post("/api/poster/generate", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { profileImage, selectedSkins, productId } = req.body;
      
      if (!profileImage || !selectedSkins || selectedSkins.length === 0) {
        return res.status(400).json({ message: "Profile image and skins are required" });
      }

      // Create poster generation record
      const posterData = {
        userId: req.user.id,
        productId: productId || null,
        profileImage,
        selectedSkins,
        status: 'processing' as const
      };

      const poster = await storage.createPosterGeneration(posterData);

      // Generate poster using AI (async)
      try {
        const resultUrl = await generatePoster(poster.id, profileImage, selectedSkins);
        await storage.updatePosterGeneration(poster.id, {
          status: 'completed',
          resultUrl
        });
        
        res.json({ 
          id: poster.id, 
          status: 'completed', 
          resultUrl 
        });
      } catch (error) {
        await storage.updatePosterGeneration(poster.id, {
          status: 'failed'
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Poster generation error:', error);
      res.status(500).json({ message: error.message || "Failed to generate poster" });
    }
  });

  // Fallback untuk semua route yang tidak ditemukan
  app.use("/api/*", (req: Request, res: Response) => {
    res.status(404).json({ message: "API endpoint not found" });
  });

  return server;
}