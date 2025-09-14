import { 
  users, products, chats, messages, transactions, walletTransactions, 
  statusUpdates, notifications, posterGenerations, escrowTransactions,
  type User, type InsertUser, type Product, type InsertProduct,
  type Chat, type InsertChat, type Message, type InsertMessage,
  type Transaction, type InsertTransaction, type StatusUpdate, type InsertStatusUpdate,
  type Notification, type InsertNotification, type PosterGeneration, type InsertPosterGeneration,
  type EscrowTransaction, type InsertEscrowTransaction
} from "@shared/schema";
import { db } from "./db";
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
  createEscrowTransaction(escrow: InsertEscrowTransaction): Promise<EscrowTransaction>;
  updateEscrowTransaction(id: number, updates: Partial<EscrowTransaction>): Promise<EscrowTransaction | undefined>;
  getEscrowStats(): Promise<{ pending: number; active: number; completed: number; disputed: number }>;
  
  // Session store for authentication
  sessionStore: Store;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: (db as any).pool, 
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
      .where(and(...conditions))
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
    const now = new Date();
    return await db.select().from(statusUpdates)
      .where(and(
        eq(statusUpdates.isPublic, true),
        gt(statusUpdates.expiresAt, now)
      ))
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
}

export const storage = new DatabaseStorage();
