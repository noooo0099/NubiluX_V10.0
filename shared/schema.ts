import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // user, admin, owner
  profilePicture: text("profile_picture"),
  bannerImage: text("banner_image"),
  displayName: text("display_name"),
  bio: text("bio"),
  walletBalance: decimal("wallet_balance", { precision: 15, scale: 2 }).default("0"),
  isVerified: boolean("is_verified").default(false),
  // Admin management fields
  isAdminApproved: boolean("is_admin_approved").default(false),
  adminApprovedAt: timestamp("admin_approved_at"),
  approvedByOwnerId: integer("approved_by_owner_id"),
  adminRequestPending: boolean("admin_request_pending").default(false),
  adminRequestReason: text("admin_request_reason"),
  adminRequestAt: timestamp("admin_request_at"),
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
  messageType: text("message_type").default("text"), // text, image, file, system, ai_admin
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  // WhatsApp-style message status fields
  status: text("status").notNull().default("sent"), // sent, delivered, read
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
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

export const escrowTransactions = pgTable("escrow_transactions", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, active, completed, disputed, cancelled
  aiStatus: text("ai_status").notNull().default("processing"), // processing, approved, flagged, manual_review
  riskScore: integer("risk_score").default(0), // 0-100 risk score
  aiDecision: jsonb("ai_decision").$type<Record<string, any>>(),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  adminNote: text("admin_note"),
  completedBy: integer("completed_by").references(() => users.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at"),
  completionNote: text("completion_note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Database indexes for better performance
  buyerStatusIdx: index("escrow_buyer_status_idx").on(table.buyerId, table.status),
  sellerStatusIdx: index("escrow_seller_status_idx").on(table.sellerId, table.status),
  statusAiStatusIdx: index("escrow_status_ai_status_idx").on(table.status, table.aiStatus),
  createdAtIdx: index("escrow_created_at_idx").on(table.createdAt),
}));

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

export const reposts = pgTable("reposts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  statusId: integer("status_id").references(() => statusUpdates.id),
  comment: text("comment"), // optional comment when reposting
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Ensure a user can only repost once per item
  uniqueUserProduct: index("unique_user_product_repost").on(table.userId, table.productId),
  uniqueUserStatus: index("unique_user_status_repost").on(table.userId, table.statusId),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  products: many(products),
  buyerChats: many(chats, { relationName: "buyer" }),
  sellerChats: many(chats, { relationName: "seller" }),
  messages: many(messages),
  statusUpdates: many(statusUpdates),
  notifications: many(notifications),
  walletTransactions: many(walletTransactions),
  buyerEscrowTransactions: many(escrowTransactions, { relationName: "buyer" }),
  sellerEscrowTransactions: many(escrowTransactions, { relationName: "seller" }),
  reposts: many(reposts),
  approvedAdmins: many(users, { relationName: "approved_by_owner" }),
  approvedByOwner: one(users, {
    fields: [users.approvedByOwnerId],
    references: [users.id],
    relationName: "approved_by_owner",
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  chats: many(chats),
  transactions: many(transactions),
  escrowTransactions: many(escrowTransactions),
  reposts: many(reposts),
}));

export const escrowTransactionsRelations = relations(escrowTransactions, ({ one }) => ({
  buyer: one(users, {
    fields: [escrowTransactions.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  seller: one(users, {
    fields: [escrowTransactions.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  product: one(products, {
    fields: [escrowTransactions.productId],
    references: [products.id],
  }),
  approvedByUser: one(users, {
    fields: [escrowTransactions.approvedBy],
    references: [users.id],
  }),
  completedByUser: one(users, {
    fields: [escrowTransactions.completedBy],
    references: [users.id],
  }),
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

export const repostsRelations = relations(reposts, ({ one }) => ({
  user: one(users, {
    fields: [reposts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reposts.productId],
    references: [products.id],
  }),
  status: one(statusUpdates, {
    fields: [reposts.statusId],
    references: [statusUpdates.id],
  }),
}));

export const statusUpdatesRelations = relations(statusUpdates, ({ one, many }) => ({
  user: one(users, {
    fields: [statusUpdates.userId],
    references: [users.id],
  }),
  reposts: many(reposts),
}));

// Zod schemas
// SECURITY: Original insertUserSchema is too permissive - kept for internal admin use only
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// SECURE: Safe user registration schema - only allows non-sensitive fields
export const userRegisterSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  // Security: Exclude all sensitive fields that could lead to privilege escalation
  role: true,
  walletBalance: true,
  isVerified: true,
  isAdminApproved: true,
  adminApprovedAt: true,
  approvedByOwnerId: true,
  adminRequestPending: true,
  adminRequestReason: true,
  adminRequestAt: true,
});

// SECURE: User profile update schema - only allows safe fields to be updated
export const userUpdateSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50, "Display name must be less than 50 characters").optional(),
  bio: z.string().max(150, "Bio must be less than 150 characters").optional(),
  profilePicture: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
}).refine((data) => {
  // If new password is provided, current password must also be provided
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required when setting a new password",
  path: ["currentPassword"],
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

// SECURITY: Original insertEscrowTransactionSchema is too permissive - kept for internal admin use only
export const insertEscrowTransactionSchema = createInsertSchema(escrowTransactions).omit({
  id: true,
  createdAt: true,
  riskScore: true,
  aiStatus: true,
});

// SECURE: Safe escrow creation schema - only allows public fields
export const escrowPublicCreateSchema = createInsertSchema(escrowTransactions).omit({
  id: true,
  createdAt: true,
  // Security: Exclude all admin-only fields
  status: true,
  aiStatus: true,
  riskScore: true,
  aiDecision: true,
  approvedBy: true,
  approvedAt: true,
  adminNote: true,
  completedBy: true,
  completedAt: true,
  completionNote: true,
});

export const insertPosterGenerationSchema = createInsertSchema(posterGenerations).omit({
  id: true,
  createdAt: true,
});

export const insertRepostSchema = createInsertSchema(reposts).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserRegister = z.infer<typeof userRegisterSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
export type InsertEscrowTransaction = z.infer<typeof insertEscrowTransactionSchema>;
export type EscrowPublicCreate = z.infer<typeof escrowPublicCreateSchema>;
export type StatusUpdate = typeof statusUpdates.$inferSelect;
export type InsertStatusUpdate = z.infer<typeof insertStatusUpdateSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type PosterGeneration = typeof posterGenerations.$inferSelect;
export type InsertPosterGeneration = z.infer<typeof insertPosterGenerationSchema>;
export type Repost = typeof reposts.$inferSelect;
export type InsertRepost = z.infer<typeof insertRepostSchema>;