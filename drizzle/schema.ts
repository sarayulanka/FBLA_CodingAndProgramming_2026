import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Businesses table - caches Yelp business data
 */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  yelpId: varchar("yelpId", { length: 255 }).notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("imageUrl"),
  url: text("url"),
  rating: int("rating").notNull(), // Store as integer (e.g., 45 for 4.5) to avoid decimal
  reviewCount: int("reviewCount").notNull().default(0),
  price: varchar("price", { length: 10 }),
  phone: varchar("phone", { length: 50 }),
  categories: text("categories"), // JSON string of categories
  address: text("address"),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 50 }),
  latitude: int("latitude"), // Store as integer (multiply by 1000000)
  longitude: int("longitude"), // Store as integer (multiply by 1000000)
  isClosed: boolean("isClosed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  yelpIdIdx: index("yelpId_idx").on(table.yelpId),
}));

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Favorites table - user bookmarked businesses
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  businessId: int("businessId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userBusinessIdx: index("user_business_idx").on(table.userId, table.businessId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Reviews table - user reviews for businesses
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  businessId: int("businessId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  businessIdx: index("business_idx").on(table.businessId),
  userIdx: index("user_idx").on(table.userId),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Deals table - special offers and coupons for businesses
 */
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 100 }),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  businessIdx: index("business_idx").on(table.businessId),
  activeIdx: index("active_idx").on(table.isActive),
}));

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

/**
 * Badges table - available badges users can earn
 */
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 100 }).notNull(), // Emoji or icon name
  category: mysqlEnum("category", ["reviews", "visits", "support", "challenges"]).notNull(),
  requirement: int("requirement").notNull(), // Number needed to unlock (e.g., 5 reviews)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * User badges table - tracks which badges users have earned
 */
export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  userBadgeIdx: index("user_badge_idx").on(table.userId, table.badgeId),
}));

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

/**
 * Challenges table - weekly/monthly challenges for users
 */
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["visit", "review", "category", "streak"]).notNull(),
  target: int("target").notNull(), // Number to complete (e.g., 3 bakeries)
  category: varchar("category", { length: 100 }), // For category-specific challenges
  rewardBadgeId: int("rewardBadgeId"), // Badge earned on completion
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  activeIdx: index("active_idx").on(table.isActive),
}));

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

/**
 * User challenges table - tracks user progress on challenges
 */
export const userChallenges = mysqlTable("user_challenges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  challengeId: int("challengeId").notNull(),
  progress: int("progress").notNull().default(0),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  challengeIdx: index("challenge_idx").on(table.challengeId),
  userChallengeIdx: index("user_challenge_idx").on(table.userId, table.challengeId),
}));

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = typeof userChallenges.$inferInsert;

/**
 * User stats table - tracks overall user activity for streaks and badges
 */
export const userStats = mysqlTable("user_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalReviews: int("totalReviews").notNull().default(0),
  totalVisits: int("totalVisits").notNull().default(0),
  totalFavorites: int("totalFavorites").notNull().default(0),
  currentStreak: int("currentStreak").notNull().default(0), // Days in a row
  longestStreak: int("longestStreak").notNull().default(0),
  lastActivityDate: timestamp("lastActivityDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;
