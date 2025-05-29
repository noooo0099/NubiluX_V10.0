import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("buyer"), // buyer, seller, admin
  profilePicture: text("profile_picture"),
  bannerImage: text("banner_image"),
  displayName: text("display_name"),
  bio: text("bio"),
  walletBalance: decimal("wallet_balance", { precision: 15, scale: 2 }).default("0"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // mobile_legends, pubg_mobile, free_fire, valorant, etc.
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  thumbnail: text("thumbnail"),
  images: jsonb("images").$type<string[]>().default([]),
  gameData: jsonb("game_data").$type<Record<string, any>>().default({}),
  status: text("status").notNull().default("active"), // active, sold, suspended
  isPremium: boolean("is_premium").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  status: text("status").notNull().default("active"), // active, completed, disputed
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, system, ai_admin
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, refunded
  paymentMethod: text("payment_method").default("qris"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // topup, withdrawal, payment, commission
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const statusUpdates = pgTable("status_updates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content"),
  media: text("media"), // image or video URL
  mediaType: text("media_type"), // image, video
  isPublic: boolean("is_public").default(true),
  viewCount: integer("view_count").default(0),
  expiresAt: timestamp("expires_at"), // 24 hours from creation
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // order, message, payment, system
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posterGenerations = pgTable("poster_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  profileImage: text("profile_image").notNull(),
  selectedSkins: jsonb("selected_skins").$type<string[]>().notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  resultUrl: text("result_url"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  buyerChats: many(chats, { relationName: "buyer" }),
  sellerChats: many(chats, { relationName: "seller" }),
  messages: many(messages),
  statusUpdates: many(statusUpdates),
  notifications: many(notifications),
  walletTransactions: many(walletTransactions),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  chats: many(chats),
  transactions: many(transactions),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  product: one(products, {
    fields: [chats.productId],
    references: [products.id],
  }),
  buyer: one(users, {
    fields: [chats.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  seller: one(users, {
    fields: [chats.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertStatusUpdateSchema = createInsertSchema(statusUpdates).omit({
  id: true,
  createdAt: true,
  viewCount: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertPosterGenerationSchema = createInsertSchema(posterGenerations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type StatusUpdate = typeof statusUpdates.$inferSelect;
export type InsertStatusUpdate = z.infer<typeof insertStatusUpdateSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type PosterGeneration = typeof posterGenerations.$inferSelect;
export type InsertPosterGeneration = z.infer<typeof insertPosterGenerationSchema>;
