import { 
  users, products, chats, messages, transactions, walletTransactions, 
  statusUpdates, notifications, posterGenerations, escrowTransactions, reposts,
  type User, type InsertUser, type Product, type InsertProduct,
  type Chat, type InsertChat, type Message, type InsertMessage,
  type Transaction, type InsertTransaction, type StatusUpdate, type InsertStatusUpdate,
  type Notification, type InsertNotification, type PosterGeneration, type InsertPosterGeneration,
  type EscrowTransaction, type InsertEscrowTransaction, type Repost, type InsertRepost
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, or, gt, lt } from "drizzle-orm";
import session, { SessionData, Store } from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(filters?: { category?: string; sellerId?: number; limit?: number; offset?: number }): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  
  // Chat operations
  getChat(id: number): Promise<Chat | undefined>;
  getChatsByUser(userId: number): Promise<Chat[]>;
  getChatWithDetails(id: number): Promise<any>;
  getChatsWithDetailsByUser(userId: number): Promise<any[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  
  // Message operations
  getMessagesByChatId(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // Wallet operations
  getWalletBalance(userId: number): Promise<string>;
  updateWalletBalance(userId: number, amount: string): Promise<void>;
  
  // Status operations
  getActiveStatusUpdates(): Promise<StatusUpdate[]>;
  createStatusUpdate(status: InsertStatusUpdate): Promise<StatusUpdate>;
  
  // Notification operations
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // Poster generation operations
  createPosterGeneration(poster: InsertPosterGeneration): Promise<PosterGeneration>;
  updatePosterGeneration(id: number, updates: Partial<PosterGeneration>): Promise<PosterGeneration | undefined>;
  
  // Escrow transaction operations
  getEscrowTransaction(id: number): Promise<EscrowTransaction | undefined>;
  getEscrowTransactionsByUser(userId: number): Promise<EscrowTransaction[]>;
  getEscrowTransactionsByStatus(status: string): Promise<EscrowTransaction[]>;
  getEscrowTransactionByChat(productId: number, buyerId: number, sellerId: number): Promise<EscrowTransaction | undefined>;
  createEscrowTransaction(escrow: InsertEscrowTransaction): Promise<EscrowTransaction>;
  updateEscrowTransaction(id: number, updates: Partial<EscrowTransaction>): Promise<EscrowTransaction | undefined>;
  getEscrowStats(): Promise<{ pending: number; active: number; completed: number; disputed: number }>;
  
  // Repost operations
  getRepost(userId: number, productId?: number, statusId?: number): Promise<Repost | undefined>;
  createRepost(repost: InsertRepost): Promise<Repost>;
  deleteRepost(userId: number, productId?: number, statusId?: number): Promise<void>;
  getRepostsByUser(userId: number): Promise<Repost[]>;
  getRepostCountByProduct(productId: number): Promise<number>;
  getRepostCountByStatus(statusId: number): Promise<number>;
  
  // Session store for authentication
  sessionStore: Store;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(filters?: { category?: string; sellerId?: number; limit?: number; offset?: number }): Promise<Product[]> {
    // Build where conditions array
    const conditions = [eq(products.status, "active")];
    
    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    if (filters?.sellerId) {
      conditions.push(eq(products.sellerId, filters.sellerId));
    }
    
    // Build query in single expression to avoid type issues
    const baseQuery = db.select()
      .from(products)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(products.createdAt));
      
    // Apply pagination if needed
    if (filters?.limit && filters?.offset) {
      return await baseQuery.limit(filters.limit).offset(filters.offset);
    } else if (filters?.limit) {
      return await baseQuery.limit(filters.limit);
    }
    
    return await baseQuery;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Ensure JSONB fields are properly typed
    const productData = {
      ...product,
      images: product.images ? [...product.images] as string[] : [],
      gameData: product.gameData || {}
    };
    const result = await db.insert(products).values([productData]).returning();
    return result[0];
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat || undefined;
  }

  async getChatsByUser(userId: number): Promise<Chat[]> {
    return await db.select().from(chats)
      .where(or(eq(chats.buyerId, userId), eq(chats.sellerId, userId)))
      .orderBy(desc(chats.createdAt));
  }

  async getChatWithDetails(id: number): Promise<any> {
    const result = await db.select({
      // Chat fields
      id: chats.id,
      productId: chats.productId,
      buyerId: chats.buyerId,
      sellerId: chats.sellerId,
      status: chats.status,
      createdAt: chats.createdAt,
      // Product fields
      productTitle: products.title,
      productThumbnail: products.thumbnail,
      productPrice: products.price,
      productCategory: products.category,
      // Buyer fields
      buyerUsername: users.username,
      buyerDisplayName: users.displayName,
      buyerProfilePicture: users.profilePicture,
      buyerIsVerified: users.isVerified,
      // Seller fields - we'll get this in a separate query
    })
    .from(chats)
    .leftJoin(products, eq(chats.productId, products.id))
    .leftJoin(users, eq(chats.buyerId, users.id))
    .where(eq(chats.id, id));
    
    if (!result[0]) return undefined;
    
    // Get seller details separately
    const sellerResult = await db.select({
      sellerUsername: users.username,
      sellerDisplayName: users.displayName,
      sellerProfilePicture: users.profilePicture,
      sellerIsVerified: users.isVerified,
    })
    .from(users)
    .where(eq(users.id, result[0].sellerId));
    
    // Get latest message
    const latestMessage = await db.select({
      content: messages.content,
      messageType: messages.messageType,
      createdAt: messages.createdAt,
      senderId: messages.senderId
    })
    .from(messages)
    .where(eq(messages.chatId, id))
    .orderBy(desc(messages.createdAt))
    .limit(1);
    
    // Get escrow transaction for this chat if exists
    const escrowTransaction = result[0].productId ? 
      await this.getEscrowTransactionByChat(result[0].productId, result[0].buyerId, result[0].sellerId) :
      null;
    
    return {
      ...result[0],
      ...sellerResult[0],
      lastMessage: latestMessage[0]?.content || null,
      lastMessageType: latestMessage[0]?.messageType || null,
      lastMessageTime: latestMessage[0]?.createdAt || null,
      lastMessageSenderId: latestMessage[0]?.senderId || null,
      unreadCount: 0,
      // Escrow transaction info
      escrowTransaction: escrowTransaction || null
    };
  }

  async getChatsWithDetailsByUser(userId: number): Promise<any[]> {
    // Get all chats for user with product and user details
    const result = await db.select({
      // Chat fields
      id: chats.id,
      productId: chats.productId,
      buyerId: chats.buyerId,
      sellerId: chats.sellerId,
      status: chats.status,
      createdAt: chats.createdAt,
      // Product fields
      productTitle: products.title,
      productThumbnail: products.thumbnail,
      productPrice: products.price,
      productCategory: products.category,
    })
    .from(chats)
    .leftJoin(products, eq(chats.productId, products.id))
    .where(or(eq(chats.buyerId, userId), eq(chats.sellerId, userId)))
    .orderBy(desc(chats.createdAt));
    
    // Enrich each chat with participant info and latest message
    const enrichedChats = await Promise.all(result.map(async (chat) => {
      // Get the other participant (if current user is buyer, get seller and vice versa)
      const otherUserId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
      const isCurrentUserBuyer = chat.buyerId === userId;
      
      const otherUserResult = await db.select({
        username: users.username,
        displayName: users.displayName,
        profilePicture: users.profilePicture,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, otherUserId));
      
      // Get latest message
      const latestMessage = await db.select({
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        senderId: messages.senderId
      })
      .from(messages)
      .where(eq(messages.chatId, chat.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);
      
      // Get escrow transaction for this chat if exists
      const escrowTransaction = chat.productId ? 
        await this.getEscrowTransactionByChat(chat.productId, chat.buyerId, chat.sellerId) :
        null;
      
      // Return the exact structure expected by ChatListItem interface
      return {
        id: chat.id,
        productId: chat.productId,
        buyerId: chat.buyerId,
        sellerId: chat.sellerId,
        status: chat.status,
        createdAt: chat.createdAt,
        // Product info
        productTitle: chat.productTitle || undefined,
        productThumbnail: chat.productThumbnail || undefined,
        productPrice: chat.productPrice || undefined,
        productCategory: chat.productCategory || undefined,
        // Other participant info (properly structured)
        otherUser: otherUserResult[0] ? {
          username: otherUserResult[0].username,
          displayName: otherUserResult[0].displayName || undefined,
          profilePicture: otherUserResult[0].profilePicture || undefined,
          isVerified: otherUserResult[0].isVerified || false,
        } : undefined,
        isCurrentUserBuyer,
        // Latest message info with null-safe defaults
        lastMessage: latestMessage[0]?.content || undefined,
        lastMessageType: latestMessage[0]?.messageType || undefined,
        lastMessageTime: latestMessage[0]?.createdAt || undefined,
        lastMessageSenderId: latestMessage[0]?.senderId || undefined,
        unreadCount: 0, // TODO: Implement proper unread count logic
        // Escrow transaction info
        escrowTransaction: escrowTransaction || null
      };
    }));
    
    // Sort by latest message time if available, otherwise by chat creation time
    enrichedChats.sort((a, b) => {
      const timeA = a.lastMessageTime || a.createdAt;
      const timeB = b.lastMessageTime || b.createdAt;
      if (!timeA || !timeB) return 0;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
    
    return enrichedChats;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async getMessagesByChatId(chatId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessageById(messageId: number): Promise<Message | null> {
    const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
    return message || null;
  }

  async updateMessageStatus(messageId: number, status: 'delivered' | 'read'): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status === 'read') {
      updateData.readAt = new Date();
      // Also mark as delivered if not already
      updateData.deliveredAt = new Date();
    }
    
    await db.update(messages)
      .set(updateData)
      .where(eq(messages.id, messageId));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(or(eq(transactions.buyerId, userId), eq(transactions.sellerId, userId)))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return transaction || undefined;
  }

  async getWalletBalance(userId: number): Promise<string> {
    const [user] = await db.select({ balance: users.walletBalance }).from(users).where(eq(users.id, userId));
    return user?.balance || "0";
  }

  async updateWalletBalance(userId: number, amount: string): Promise<void> {
    await db.update(users).set({ walletBalance: amount }).where(eq(users.id, userId));
  }

  async getActiveStatusUpdates(): Promise<StatusUpdate[]> {
    return await db.select().from(statusUpdates)
      .orderBy(desc(statusUpdates.createdAt));
  }

  async createStatusUpdate(status: InsertStatusUpdate): Promise<StatusUpdate> {
    const [newStatus] = await db.insert(statusUpdates).values(status).returning();
    return newStatus;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async createPosterGeneration(poster: InsertPosterGeneration): Promise<PosterGeneration> {
    // Ensure JSONB fields are properly typed
    const posterData = {
      ...poster,
      selectedSkins: [...poster.selectedSkins] as string[]
    };
    const result = await db.insert(posterGenerations).values([posterData]).returning();
    return result[0];
  }

  async updatePosterGeneration(id: number, updates: Partial<PosterGeneration>): Promise<PosterGeneration | undefined> {
    const [poster] = await db.update(posterGenerations).set(updates).where(eq(posterGenerations.id, id)).returning();
    return poster || undefined;
  }

  async getEscrowTransaction(id: number): Promise<EscrowTransaction | undefined> {
    const [escrow] = await db.select().from(escrowTransactions).where(eq(escrowTransactions.id, id));
    return escrow || undefined;
  }

  async getEscrowTransactionsByUser(userId: number): Promise<EscrowTransaction[]> {
    return await db.select().from(escrowTransactions)
      .where(or(eq(escrowTransactions.buyerId, userId), eq(escrowTransactions.sellerId, userId)))
      .orderBy(desc(escrowTransactions.createdAt));
  }

  async getEscrowTransactionsByStatus(status: string): Promise<EscrowTransaction[]> {
    return await db.select().from(escrowTransactions)
      .where(eq(escrowTransactions.status, status))
      .orderBy(desc(escrowTransactions.createdAt));
  }

  async createEscrowTransaction(escrow: InsertEscrowTransaction): Promise<EscrowTransaction> {
    const [newEscrow] = await db.insert(escrowTransactions).values(escrow).returning();
    return newEscrow;
  }

  async getEscrowTransactionByChat(productId: number, buyerId: number, sellerId: number): Promise<EscrowTransaction | undefined> {
    const [escrow] = await db.select().from(escrowTransactions)
      .where(
        and(
          eq(escrowTransactions.productId, productId),
          eq(escrowTransactions.buyerId, buyerId),
          eq(escrowTransactions.sellerId, sellerId)
        )
      )
      .orderBy(desc(escrowTransactions.createdAt))
      .limit(1);
    return escrow || undefined;
  }

  async updateEscrowTransaction(id: number, updates: Partial<EscrowTransaction>): Promise<EscrowTransaction | undefined> {
    const [escrow] = await db.update(escrowTransactions).set(updates).where(eq(escrowTransactions.id, id)).returning();
    return escrow || undefined;
  }

  async getEscrowStats(): Promise<{ pending: number; active: number; completed: number; disputed: number }> {
    const [stats] = await db.select({
      pending: db.$count(escrowTransactions, eq(escrowTransactions.status, "pending")),
      active: db.$count(escrowTransactions, eq(escrowTransactions.status, "active")),
      completed: db.$count(escrowTransactions, eq(escrowTransactions.status, "completed")),
      disputed: db.$count(escrowTransactions, eq(escrowTransactions.status, "disputed"))
    }).from(escrowTransactions);
    return stats || { pending: 0, active: 0, completed: 0, disputed: 0 };
  }

  async getRepost(userId: number, productId?: number, statusId?: number): Promise<Repost | undefined> {
    const conditions = [eq(reposts.userId, userId)];
    
    if (productId) {
      conditions.push(eq(reposts.productId, productId));
    }
    if (statusId) {
      conditions.push(eq(reposts.statusId, statusId));
    }
    
    const [repost] = await db.select().from(reposts)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    return repost || undefined;
  }

  async createRepost(repost: InsertRepost): Promise<Repost> {
    const [newRepost] = await db.insert(reposts).values(repost).returning();
    return newRepost;
  }

  async deleteRepost(userId: number, productId?: number, statusId?: number): Promise<void> {
    const conditions = [eq(reposts.userId, userId)];
    
    if (productId) {
      conditions.push(eq(reposts.productId, productId));
    }
    if (statusId) {
      conditions.push(eq(reposts.statusId, statusId));
    }
    
    await db.delete(reposts)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));
  }

  async getRepostsByUser(userId: number): Promise<Repost[]> {
    return await db.select().from(reposts)
      .where(eq(reposts.userId, userId))
      .orderBy(desc(reposts.createdAt));
  }

  async getRepostCountByProduct(productId: number): Promise<number> {
    const [result] = await db.select({ count: db.$count(reposts) }).from(reposts)
      .where(eq(reposts.productId, productId));
    return result?.count || 0;
  }

  async getRepostCountByStatus(statusId: number): Promise<number> {
    const [result] = await db.select({ count: db.$count(reposts) }).from(reposts)
      .where(eq(reposts.statusId, statusId));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
