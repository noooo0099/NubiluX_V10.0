import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertProductSchema, insertChatSchema, insertMessageSchema, insertUserSchema, insertPosterGenerationSchema } from "@shared/schema";
import { generatePoster } from "./openai";
import { seedDatabase } from "./seed";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Seed database on startup
  await seedDatabase();

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

  // Auth middleware (simplified for demo)
  const requireAuth = (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'] || '1'; // Default to user 1 for demo
    req.userId = parseInt(userId as string);
    next();
  };

  // User routes
  app.post('/api/users/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Invalid user data' });
    }
  });

  app.get('/api/users/profile/:id', async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/users/profile', requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.userId, updates);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/users/switch-role', requireAuth, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['buyer', 'seller'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      
      const user = await storage.updateUser(req.userId, { role });
      res.json(user);
    } catch (error) {
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
        sellerId: req.userId
      });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: 'Invalid product data' });
    }
  });

  // Chat routes
  app.get('/api/chats', requireAuth, async (req, res) => {
    try {
      const chats = await storage.getChatsByUser(req.userId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/chats', requireAuth, async (req, res) => {
    try {
      const chatData = insertChatSchema.parse({
        ...req.body,
        buyerId: req.userId
      });
      const chat = await storage.createChat(chatData);
      res.json(chat);
    } catch (error) {
      res.status(400).json({ error: 'Invalid chat data' });
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
      const notifications = await storage.getNotificationsByUser(req.userId);
      res.json(notifications);
    } catch (error) {
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
      const balance = await storage.getWalletBalance(req.userId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Poster generation routes
  app.post('/api/poster/generate', requireAuth, async (req, res) => {
    try {
      const posterData = insertPosterGenerationSchema.parse({
        ...req.body,
        userId: req.userId
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
    } catch (error) {
      res.status(400).json({ error: 'Invalid poster data' });
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
