/**
 * schema.ts — Drizzle ORM database schema definitions.
 *
 * Defines all SQLite tables used by BizBloom:
 *  - users          — OAuth-authenticated user accounts
 *  - businesses     — Cached Yelp business data
 *  - favorites      — User-to-business bookmark relationships
 *  - reviews        — User-submitted star ratings and comments
 *  - deals          — Admin-created promotional offers
 *  - badges         — Achievement badge definitions
 *  - userBadges     — Tracks which badges each user has earned
 *  - challenges     — Weekly challenge definitions
 *  - userChallenges — Tracks user progress on challenges
 *  - userStats      — Aggregate activity stats (reviews, visits, streaks)
 *
 * Each table exports inferred Select and Insert types for type safety.
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Businesses table - caches Yelp business data
 */
export const businesses = sqliteTable("businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  yelpId: text("yelpId").notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("imageUrl"),
  url: text("url"),
  rating: integer("rating").notNull(), // Store as integer (e.g., 45 for 4.5) to avoid decimal
  reviewCount: integer("reviewCount").notNull().default(0),
  price: text("price"),
  phone: text("phone"),
  categories: text("categories"), // JSON string of categories
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zipCode"),
  country: text("country"),
  latitude: integer("latitude"), // Store as integer (multiply by 1000000)
  longitude: integer("longitude"), // Store as integer (multiply by 1000000)
  isClosed: integer("isClosed", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  yelpIdIdx: index("yelpId_idx").on(table.yelpId),
}));

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Favorites table - user bookmarked businesses
 */
export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  businessId: integer("businessId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  userBusinessIdx: index("user_business_idx").on(table.userId, table.businessId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Reviews table - user reviews for businesses
 */
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  businessId: integer("businessId").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  businessIdx: index("business_idx").on(table.businessId),
  userIdx: index("user_idx").on(table.userId),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Deals table - special offers and coupons for businesses
 */
export const deals = sqliteTable("deals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("businessId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  code: text("code"),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  businessIdx: index("deals_business_idx").on(table.businessId),
  activeIdx: index("deals_active_idx").on(table.isActive),
}));

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

/**
 * Badges table - available badges users can earn
 */
export const badges = sqliteTable("badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Emoji or icon name
  category: text("category", { enum: ["reviews", "visits", "support", "challenges"] }).notNull(),
  requirement: integer("requirement").notNull(), // Number needed to unlock (e.g., 5 reviews)
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

/**
 * User badges table - tracks which badges users have earned
 */
export const userBadges = sqliteTable("user_badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  badgeId: integer("badgeId").notNull(),
  earnedAt: integer("earnedAt", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("ub_user_idx").on(table.userId),
  userBadgeIdx: index("user_badge_idx").on(table.userId, table.badgeId),
}));

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

/**
 * Challenges table - weekly/monthly challenges for users
 */
export const challenges = sqliteTable("challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["visit", "review", "category", "streak"] }).notNull(),
  target: integer("target").notNull(), // Number to complete (e.g., 3 bakeries)
  category: text("category"), // For category-specific challenges
  rewardBadgeId: integer("rewardBadgeId"), // Badge earned on completion
  startsAt: integer("startsAt", { mode: "timestamp" }).notNull(),
  endsAt: integer("endsAt", { mode: "timestamp" }).notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  activeIdx: index("challenges_active_idx").on(table.isActive),
}));

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

/**
 * User challenges table - tracks user progress on challenges
 */
export const userChallenges = sqliteTable("user_challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  challengeId: integer("challengeId").notNull(),
  progress: integer("progress").notNull().default(0),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("uc_user_idx").on(table.userId),
  challengeIdx: index("challenge_idx").on(table.challengeId),
  userChallengeIdx: index("user_challenge_idx").on(table.userId, table.challengeId),
}));

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = typeof userChallenges.$inferInsert;

/**
 * User stats table - tracks overall user activity for streaks and badges
 */
export const userStats = sqliteTable("user_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  totalReviews: integer("totalReviews").notNull().default(0),
  totalVisits: integer("totalVisits").notNull().default(0),
  totalFavorites: integer("totalFavorites").notNull().default(0),
  currentStreak: integer("currentStreak").notNull().default(0), // Days in a row
  longestStreak: integer("longestStreak").notNull().default(0),
  lastActivityDate: integer("lastActivityDate", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index("us_user_idx").on(table.userId),
}));

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;
