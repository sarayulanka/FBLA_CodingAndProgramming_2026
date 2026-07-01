/**
 * db.ts — Database access layer for BizBloom.
 *
 * Uses Drizzle ORM with libSQL (SQLite) for type-safe database queries.
 * All database operations are grouped by domain:
 *   - Users          — upsert and lookup
 *   - Businesses     — cache Yelp data locally
 *   - Favorites      — user bookmarks
 *   - Reviews        — user-submitted ratings and comments
 *   - Deals          — admin-created promotional offers
 *   - Gamification   — badges, challenges, streaks, and stats
 *   - Analytics      — aggregated community metrics
 */

import { eq, and, desc, sql, inArray, lte, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  InsertUser, users,
  businesses, InsertBusiness, Business,
  favorites, InsertFavorite,
  reviews, InsertReview, Review,
  deals, InsertDeal, Deal,
  badges, Badge,
  userBadges, InsertUserBadge,
  challenges, Challenge, InsertChallenge,
  userChallenges, InsertUserChallenge, UserChallenge,
  userStats, InsertUserStats, UserStats
} from "../drizzle/schema";
import { ENV } from './_core/env';
import path from "path";
import fs from "fs";

// Singleton database instance — lazily initialized on first use
let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Lazily create the Drizzle ORM instance.
 * Supports both local file-based SQLite and remote libSQL (Turso) URLs.
 * Returns null gracefully if DATABASE_URL is not configured.
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbPath = process.env.DATABASE_URL;
      const isRemote = dbPath.startsWith("libsql://") || dbPath.startsWith("https://");
      if (!isRemote) {
        const dir = path.dirname(dbPath);
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      const url = isRemote ? dbPath : `file:${dbPath}`;
      const client = createClient({
        url,
        authToken: isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined,
      });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================

/**
 * Insert a new user or update an existing one (matched by openId).
 * Automatically assigns the 'admin' role if the user's openId matches the owner.
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/** Look up a user by email address (for local auth). */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Look up a user by their OAuth openId. Returns undefined if not found. */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== BUSINESS FUNCTIONS ====================

/**
 * Insert or update a cached business record.
 * Uses the Yelp ID as the conflict target for upserts.
 */
export async function upsertBusiness(business: InsertBusiness): Promise<Business> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(businesses).values(business).onConflictDoUpdate({
    target: businesses.yelpId,
    set: {
      name: business.name,
      imageUrl: business.imageUrl,
      url: business.url,
      rating: business.rating,
      reviewCount: business.reviewCount,
      price: business.price,
      phone: business.phone,
      categories: business.categories,
      address: business.address,
      city: business.city,
      state: business.state,
      zipCode: business.zipCode,
      country: business.country,
      latitude: business.latitude,
      longitude: business.longitude,
      isClosed: business.isClosed,
      updatedAt: new Date(),
    }
  });

  const [inserted] = await db.select().from(businesses).where(eq(businesses.yelpId, business.yelpId)).limit(1);
  return inserted;
}

export async function getBusinessByYelpId(yelpId: string): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(businesses).where(eq(businesses.yelpId, yelpId)).limit(1);
  return result[0];
}

export async function getBusinessById(id: number): Promise<Business | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return result[0];
}

// ==================== FAVORITES FUNCTIONS ====================

/** Save a business to the user's favorites list */
export async function addFavorite(userId: number, businessId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(favorites).values({ userId, businessId });
}

/** Remove a business from the user's favorites list */
export async function removeFavorite(userId: number, businessId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(favorites).where(
    and(
      eq(favorites.userId, userId),
      eq(favorites.businessId, businessId)
    )
  );
}

/** Get all favorited businesses for a user, ordered by most recently added */
export async function getUserFavorites(userId: number): Promise<Business[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      business: businesses,
    })
    .from(favorites)
    .innerJoin(businesses, eq(favorites.businessId, businesses.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  return result.map(r => r.business);
}

export async function isFavorite(userId: number, businessId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(favorites).where(
    and(
      eq(favorites.userId, userId),
      eq(favorites.businessId, businessId)
    )
  ).limit(1);

  return result.length > 0;
}

// ==================== REVIEWS FUNCTIONS ====================

/** Create a new review and return the inserted record */
export async function createReview(review: InsertReview): Promise<Review> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(reviews).values(review);
  const [inserted] = await db.select().from(reviews).where(
    and(
      eq(reviews.userId, review.userId),
      eq(reviews.businessId, review.businessId)
    )
  ).orderBy(desc(reviews.createdAt)).limit(1);
  return inserted;
}

/** Update a review (only the owning user can modify their own review) */
export async function updateReview(id: number, userId: number, rating: number, comment: string | null): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reviews).set({ rating, comment, updatedAt: new Date() }).where(
    and(
      eq(reviews.id, id),
      eq(reviews.userId, userId)
    )
  );
}

/** Delete a review (only the owning user can delete their own review) */
export async function deleteReview(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(reviews).where(
    and(
      eq(reviews.id, id),
      eq(reviews.userId, userId)
    )
  );
}

/** Get all reviews for a business, joined with the reviewer's display name */
export async function getBusinessReviews(businessId: number): Promise<(Review & { userName: string | null })[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      review: reviews,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.businessId, businessId))
    .orderBy(desc(reviews.createdAt));

  return result.map(r => ({ ...r.review, userName: r.userName }));
}

export async function getUserReviewForBusiness(userId: number, businessId: number): Promise<Review | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reviews).where(
    and(
      eq(reviews.userId, userId),
      eq(reviews.businessId, businessId)
    )
  ).limit(1);

  return result[0];
}

/** Get all reviews across all businesses (for the Community Reviews page) */
export async function getAllReviewsWithBusinessInfo(): Promise<Array<Review & { userName: string | null; businessName: string; businessCategories: string | null }>> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      review: reviews,
      userName: users.name,
      businessName: businesses.name,
      businessCategories: businesses.categories,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(businesses, eq(reviews.businessId, businesses.id))
    .orderBy(desc(reviews.createdAt));

  return result.map(r => ({ ...r.review, userName: r.userName, businessName: r.businessName, businessCategories: r.businessCategories }));
}

/**
 * Compute a sentiment score (0–1) for a review comment.
 * Uses keyword matching across positive/negative word lists.
 * Returns 0.5 (neutral) for empty or unscored text.
 */
export function computeSentimentScore(comment: string | null): number {
  if (!comment || comment.trim().length < 3) return 0.5;
  const text = comment.toLowerCase();
  const positiveWords = [
    "love", "amazing", "great", "excellent", "fantastic", "best", "delicious",
    "wonderful", "perfect", "recommend", "outstanding", "superb", "incredible",
    "awesome", "phenomenal", "exceptional", "brilliant", "favorite", "gem",
    "underrated", "hidden gem", "must try", "worth", "impressed", "friendly",
    "fresh", "clean", "cozy", "welcoming", "authentic", "quality", "good",
    "nice", "pleasant", "enjoyed", "happy", "satisfied", "beautiful", "helpful",
  ];
  const negativeWords = [
    "terrible", "awful", "horrible", "bad", "disappointing", "worst", "avoid",
    "disgusting", "rude", "dirty", "overpriced", "slow", "cold", "stale",
    "mediocre", "bland", "boring", "waste", "never return", "not worth",
    "poor", "gross", "nasty", "unfriendly", "unpleasant", "closed", "empty",
  ];
  let positiveCount = 0;
  let negativeCount = 0;
  for (const word of positiveWords) if (text.includes(word)) positiveCount++;
  for (const word of negativeWords) if (text.includes(word)) negativeCount++;
  const total = positiveCount + negativeCount;
  if (total === 0) return 0.5 + (Math.min(comment.length, 200) / 4000); // slight boost for long reviews
  return Math.max(0, Math.min(1, (positiveCount / total) * 0.8 + 0.1));
}

/**
 * Get trending businesses using a sentiment-velocity algorithm.
 *
 * Score = (recentFavoriteMomentum × 1.5) + (recentReviewVelocity × avgSentiment × 2) + (communityRatingBonus)
 *
 * This means a business with rapidly improving reviews beats one with
 * stale favorites — rewarding businesses the community is excited about *right now*.
 */
export async function getTrendingBusinesses(): Promise<(Business & { trendScore: number; sentimentAvg: number; recentActivity: number })[]> {
  const db = await getDb();
  if (!db) return [];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Fetch recent reviews with their sentiment-eligible content
  const recentReviews = await db
    .select({ businessId: reviews.businessId, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt })
    .from(reviews)
    .where(sql`${reviews.createdAt} >= ${thirtyDaysAgo}`);

  // Fetch recent favorites
  const recentFavorites = await db
    .select({ businessId: favorites.businessId, createdAt: favorites.createdAt })
    .from(favorites)
    .where(sql`${favorites.createdAt} >= ${thirtyDaysAgo}`);

  // Aggregate per business
  const scoreMap = new Map<number, { reviewCount: number; sentimentSum: number; favCount30d: number; favCount7d: number }>();
  for (const r of recentReviews) {
    if (!r.businessId) continue;
    const entry = scoreMap.get(r.businessId) ?? { reviewCount: 0, sentimentSum: 0, favCount30d: 0, favCount7d: 0 };
    entry.reviewCount++;
    entry.sentimentSum += computeSentimentScore(r.comment);
    scoreMap.set(r.businessId, entry);
  }
  for (const f of recentFavorites) {
    if (!f.businessId) continue;
    const entry = scoreMap.get(f.businessId) ?? { reviewCount: 0, sentimentSum: 0, favCount30d: 0, favCount7d: 0 };
    entry.favCount30d++;
    if (f.createdAt && f.createdAt >= sevenDaysAgo) entry.favCount7d++;
    scoreMap.set(f.businessId, entry);
  }

  if (scoreMap.size === 0) {
    // Fallback: return top-rated
    const fallback = await db.select().from(businesses).orderBy(desc(businesses.rating), desc(businesses.reviewCount)).limit(10);
    return fallback.map(b => ({ ...b, trendScore: b.rating / 10, sentimentAvg: 0.5, recentActivity: 0 }));
  }

  const businessIds = Array.from(scoreMap.keys());
  const businessList = await db.select().from(businesses).where(sql`${businesses.id} IN (${sql.join(businessIds.map(id => sql`${id}`), sql`, `)})`);

  const scored = businessList.map(b => {
    const stats = scoreMap.get(b.id) ?? { reviewCount: 0, sentimentSum: 0, favCount30d: 0, favCount7d: 0 };
    const avgSentiment = stats.reviewCount > 0 ? stats.sentimentSum / stats.reviewCount : 0.5;
    const favMomentum = stats.favCount30d * 1.5 + stats.favCount7d * 1.0; // 7-day recency bonus
    const reviewVelocity = stats.reviewCount * avgSentiment * 2;
    const ratingBonus = (b.rating / 10) * 0.5;
    const trendScore = favMomentum + reviewVelocity + ratingBonus;
    return { ...b, trendScore, sentimentAvg: avgSentiment, recentActivity: stats.reviewCount + stats.favCount30d };
  });

  return scored.sort((a, b) => b.trendScore - a.trendScore).slice(0, 10);
}

/**
 * Generate personalized recommendations for a user.
 * Analyzes the user's favorite categories and suggests businesses
 * in those same categories that they haven't already favorited.
 * Falls back to top-rated businesses if the user has no favorites.
 */
export async function getRecommendationsForUser(userId: number): Promise<Business[]> {
  const db = await getDb();
  if (!db) return [];

  // Get user's favorite categories and business IDs in one query
  const userFavorites = await db
    .select({ categories: businesses.categories, businessId: favorites.businessId })
    .from(favorites)
    .innerJoin(businesses, eq(favorites.businessId, businesses.id))
    .where(eq(favorites.userId, userId));

  if (userFavorites.length === 0) {
    // If no favorites, return top-rated businesses
    return await db
      .select()
      .from(businesses)
      .orderBy(desc(businesses.rating), desc(businesses.reviewCount))
      .limit(10);
  }

  // Extract category aliases and favorited business IDs from the same query
  const categoryAliases = new Set<string>();
  const favoritedIdSet = new Set<number>();
  userFavorites.forEach(fav => {
    if (fav.businessId) favoritedIdSet.add(fav.businessId);
    if (fav.categories) {
      try {
        const cats = JSON.parse(fav.categories);
        cats.forEach((cat: any) => categoryAliases.add(cat.alias));
      } catch {}
    }
  });

  const allBusinesses = await db.select().from(businesses).orderBy(desc(businesses.rating)).limit(50);

  const recommendations = allBusinesses
    .filter(business => {
      if (favoritedIdSet.has(business.id)) return false;
      if (!business.categories) return false;
      try {
        const cats = JSON.parse(business.categories);
        return cats.some((cat: any) => categoryAliases.has(cat.alias));
      } catch {
        return false;
      }
    })
    .slice(0, 10);

  return recommendations;
}

/** Get the top 10 highest-rated businesses, optionally filtered by category */
export async function getTopRatedBusinesses(category?: string): Promise<Business[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(businesses);

  const allBusinesses = await query.orderBy(desc(businesses.rating), desc(businesses.reviewCount)).limit(50);

  if (category) {
    return allBusinesses
      .filter(business => {
        if (!business.categories) return false;
        try {
          const cats = JSON.parse(business.categories);
          return cats.some((cat: any) => cat.alias === category);
        } catch {
          return false;
        }
      })
      .slice(0, 10);
  }

  return allBusinesses.slice(0, 10);
}

// ==================== DEALS FUNCTIONS ====================

/** Create a new promotional deal for a business (admin only) */
export async function createDeal(deal: InsertDeal): Promise<Deal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(deals).values(deal);
  const [inserted] = await db.select().from(deals).where(
    eq(deals.businessId, deal.businessId)
  ).orderBy(desc(deals.createdAt)).limit(1);
  return inserted;
}

export async function updateDeal(id: number, updates: Partial<InsertDeal>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(deals).set({ ...updates, updatedAt: new Date() }).where(eq(deals.id, id));
}

export async function deleteDeal(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(deals).where(eq(deals.id, id));
}

export async function getBusinessDeals(businessId: number): Promise<Deal[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.businessId, businessId),
        eq(deals.isActive, true)
      )
    )
    .orderBy(desc(deals.createdAt));

  return result;
}

/** Get all active deals, joined with their associated business info */
export async function getAllActiveDeals(): Promise<(Deal & { business: Business })[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      deal: deals,
      business: businesses,
    })
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .where(eq(deals.isActive, true))
    .orderBy(desc(deals.createdAt));

  return result.map(r => ({ ...r.deal, business: r.business }));
}

// ==================== GAMIFICATION FUNCTIONS ====================

/**
 * Get or create user stats
 */
export async function getUserStats(userId: number): Promise<UserStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new stats
  await db.insert(userStats).values({ userId });
  const newStats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
  return newStats[0];
}

/**
 * Update user stats and check for badge unlocks
 */
export async function updateUserStats(userId: number, type: 'review' | 'visit' | 'favorite'): Promise<Badge[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await getUserStats(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Update streak
  let newStreak = stats.currentStreak;
  if (stats.lastActivityDate) {
    const lastActivity = new Date(stats.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      newStreak = stats.currentStreak + 1;
    } else if (daysDiff > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  // Update stats
  const updates: Partial<InsertUserStats> = {
    lastActivityDate: new Date(),
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, stats.longestStreak),
  };

  if (type === 'review') updates.totalReviews = stats.totalReviews + 1;
  if (type === 'visit') updates.totalVisits = stats.totalVisits + 1;
  if (type === 'favorite') updates.totalFavorites = stats.totalFavorites + 1;

  await db.update(userStats).set(updates).where(eq(userStats.userId, userId));

  // Check for new badges
  const newBadges: Badge[] = [];
  const allBadges = await db.select().from(badges);
  const earnedBadges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const earnedBadgeIds = new Set(earnedBadges.map(ub => ub.badgeId));

  const updatedStats = await getUserStats(userId);

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    let shouldEarn = false;
    if (badge.category === 'reviews' && updatedStats.totalReviews >= badge.requirement) shouldEarn = true;
    if (badge.category === 'visits' && updatedStats.totalVisits >= badge.requirement) shouldEarn = true;

    if (shouldEarn) {
      await db.insert(userBadges).values({ userId, badgeId: badge.id });
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: number): Promise<(Badge & { earnedAt: Date })[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: badges.id,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
      category: badges.category,
      requirement: badges.requirement,
      createdAt: badges.createdAt,
      earnedAt: userBadges.earnedAt,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));

  return result;
}

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(badges);
}

/**
 * Get active challenges
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const all = await db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.isActive, true),
        lte(challenges.startsAt, now),
        gte(challenges.endsAt, now)
      )
    );

  // Deduplicate by title — keep only the first (lowest id) per title
  const seen = new Set<string>();
  return all.filter(c => {
    if (seen.has(c.title)) return false;
    seen.add(c.title);
    return true;
  });
}

/**
 * Get user's challenge progress
 */
export async function getUserChallengeProgress(userId: number): Promise<(UserChallenge & { challenge: Challenge })[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const activeChallenges = await getActiveChallenges();
  const result: (UserChallenge & { challenge: Challenge })[] = [];

  for (const challenge of activeChallenges) {
    let userChallenge = await db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.challengeId, challenge.id)
        )
      )
      .limit(1);

    if (userChallenge.length === 0) {
      // Create new challenge progress
      await db.insert(userChallenges).values({
        userId,
        challengeId: challenge.id,
        progress: 0,
        completed: false,
      });

      userChallenge = await db
        .select()
        .from(userChallenges)
        .where(
          and(
            eq(userChallenges.userId, userId),
            eq(userChallenges.challengeId, challenge.id)
          )
        )
        .limit(1);
    }

    result.push({
      ...userChallenge[0],
      challenge,
    });
  }

  return result;
}

/**
 * Update challenge progress (manual check-in)
 */
export async function updateChallengeProgress(userId: number, challengeId: number): Promise<{ completed: boolean; badge?: Badge }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userChallenge = await db
    .select()
    .from(userChallenges)
    .where(
      and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.challengeId, challengeId)
      )
    )
    .limit(1);

  if (userChallenge.length === 0) {
    throw new Error("Challenge not found");
  }

  const challenge = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (challenge.length === 0) throw new Error("Challenge not found");

  const newProgress = userChallenge[0].progress + 1;
  const completed = newProgress >= challenge[0].target;

  await db
    .update(userChallenges)
    .set({
      progress: newProgress,
      completed,
      completedAt: completed ? new Date() : null,
    })
    .where(eq(userChallenges.id, userChallenge[0].id));

  // Award challenge badge if completed
  let badge: Badge | undefined;
  if (completed) {
    const stats = await getUserStats(userId);
    const completedChallenges = await db
      .select()
      .from(userChallenges)
      .where(and(eq(userChallenges.userId, userId), eq(userChallenges.completed, true)));

    // Check for challenge completion badges
    const allBadges = await db.select().from(badges).where(eq(badges.category, 'challenges'));
    const earnedBadges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    const earnedBadgeIds = new Set(earnedBadges.map(ub => ub.badgeId));

    for (const b of allBadges) {
      if (!earnedBadgeIds.has(b.id) && completedChallenges.length >= b.requirement) {
        await db.insert(userBadges).values({ userId, badgeId: b.id });
        badge = b;
        break;
      }
    }
  }

  return { completed, badge };
}

/**
 * Check user stats against all badge requirements and award any
 * newly-earned badges. Called after reviews, visits, and favorites.
 */
export async function checkAndAwardBadges(userId: number) {
  const database = await getDb();
  if (!database) return;

  const stats = await getUserStats(userId);
  const allBadges = await getAllBadges();
  const earnedBadges = await getUserBadges(userId);
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.id));

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    let shouldAward = false;

    switch (badge.id) {
      case 1: // First Review
        shouldAward = stats.totalReviews >= 1;
        break;
      case 2: // Explorer
        shouldAward = stats.totalVisits >= 5;
        break;
      case 3: // Critic
        shouldAward = stats.totalReviews >= 10;
        break;
      case 4: // Local Hero
        shouldAward = stats.totalReviews >= 25;
        break;
      case 5: // Streak Master
        shouldAward = stats.currentStreak >= 7;
        break;
    }

    if (shouldAward) {
      await database.insert(userBadges).values({
        userId,
        badgeId: badge.id,
        earnedAt: new Date(),
      });
    }
  }
}

/**
 * Check if challenges need regeneration and create new weekly challenges
 */
export async function regenerateWeeklyChallenges(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();

  // Check if any active challenges have expired
  const activeChallenges = await db
    .select()
    .from(challenges)
    .where(eq(challenges.isActive, true));

  const hasExpired = activeChallenges.some(c => new Date(c.endsAt) < now);

  if (!hasExpired && activeChallenges.length > 0) {
    // Challenges are still active
    return;
  }

  console.log("[Challenge Regeneration] Generating new weekly challenges...");

  // Mark all old challenges as inactive
  await db.update(challenges).set({ isActive: false }).where(eq(challenges.isActive, true));

  // Calculate new week dates
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Challenge templates with variations
  const categoryTemplates = [
    { title: "Bakery Explorer", description: "Visit {target} bakeries this week", category: "bakeries", target: 3 },
    { title: "Coffee Connoisseur", description: "Visit {target} coffee shops this week", category: "coffee", target: 3 },
    { title: "Foodie Adventure", description: "Try {target} different restaurants this week", category: "restaurants", target: 5 },
    { title: "Sweet Tooth", description: "Visit {target} dessert places this week", category: "desserts", target: 3 },
    { title: "Pizza Quest", description: "Try {target} different pizza places this week", category: "pizza", target: 3 },
    { title: "Brunch Hunter", description: "Visit {target} brunch spots this week", category: "breakfast_brunch", target: 3 },
    { title: "Bar Hopper", description: "Visit {target} bars this week", category: "bars", target: 4 },
  ];

  const reviewTemplates = [
    { title: "Review Streak", description: "Write {target} reviews this week", target: 3 },
    { title: "Review Champion", description: "Write {target} detailed reviews this week", target: 5 },
    { title: "Helpful Reviewer", description: "Write {target} reviews to help others this week", target: 4 },
  ];

  const visitTemplates = [
    { title: "Local Support", description: "Visit {target} minority or student-owned businesses this week", target: 2 },
    { title: "Community Explorer", description: "Visit {target} new businesses this week", target: 5 },
    { title: "Neighborhood Tour", description: "Visit {target} businesses in your area this week", target: 4 },
  ];

  // Randomly select challenges
  const selectedChallenges: InsertChallenge[] = [];

  // Pick 2 category challenges
  const shuffledCategories = categoryTemplates.sort(() => Math.random() - 0.5);
  for (let i = 0; i < 2; i++) {
    const template = shuffledCategories[i];
    selectedChallenges.push({
      title: template.title,
      description: template.description.replace("{target}", template.target.toString()),
      type: "category",
      target: template.target,
      category: template.category,
      rewardBadgeId: null,
      startsAt: weekStart,
      endsAt: weekEnd,
      isActive: true,
    });
  }

  // Pick 2 review challenges
  const shuffledReviews = reviewTemplates.sort(() => Math.random() - 0.5);
  for (let i = 0; i < 2; i++) {
    const template = shuffledReviews[i];
    selectedChallenges.push({
      title: template.title,
      description: template.description.replace("{target}", template.target.toString()),
      type: "review",
      target: template.target,
      category: null,
      rewardBadgeId: null,
      startsAt: weekStart,
      endsAt: weekEnd,
      isActive: true,
    });
  }

  // Pick 1 visit challenge
  const visitTemplate = visitTemplates[Math.floor(Math.random() * visitTemplates.length)];
  selectedChallenges.push({
    title: visitTemplate.title,
    description: visitTemplate.description.replace("{target}", visitTemplate.target.toString()),
    type: "visit",
    target: visitTemplate.target,
    category: "support",
    rewardBadgeId: null,
    startsAt: weekStart,
    endsAt: weekEnd,
    isActive: true,
  });

  // Get titles already in the DB for this week to avoid duplicates
  const existing = await db
    .select({ title: challenges.title })
    .from(challenges)
    .where(eq(challenges.isActive, true));
  const existingTitles = new Set(existing.map(c => c.title));

  // Insert only challenges whose title isn't already present
  for (const challenge of selectedChallenges) {
    if (!existingTitles.has(challenge.title)) {
      await db.insert(challenges).values(challenge);
    }
  }
}

// ==================== ANALYTICS FUNCTIONS ====================

/** Convert a date range filter string into a start Date (or null for "all time") */
function getDateRangeStart(range: "7d" | "30d" | "all"): Date | null {
  if (range === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - (range === "7d" ? 7 : 30));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Compute aggregate metrics (review count, business count, favorites, avg rating) */
export async function getAnalyticsSummary(dateRange: "7d" | "30d" | "all") {
  const db = await getDb();
  if (!db) return { totalReviews: 0, totalBusinesses: 0, totalFavorites: 0, avgRating: 0 };

  const start = getDateRangeStart(dateRange);

  const reviewCount = start
    ? await db.select({ count: sql<number>`COUNT(*)` }).from(reviews).where(sql`${reviews.createdAt} >= ${start}`)
    : await db.select({ count: sql<number>`COUNT(*)` }).from(reviews);

  const favCount = start
    ? await db.select({ count: sql<number>`COUNT(*)` }).from(favorites).where(sql`${favorites.createdAt} >= ${start}`)
    : await db.select({ count: sql<number>`COUNT(*)` }).from(favorites);

  const bizCount = await db.select({ count: sql<number>`COUNT(*)` }).from(businesses);

  const avgRating = start
    ? await db.select({ avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` }).from(reviews).where(sql`${reviews.createdAt} >= ${start}`)
    : await db.select({ avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` }).from(reviews);

  return {
    totalReviews: reviewCount[0]?.count ?? 0,
    totalBusinesses: bizCount[0]?.count ?? 0,
    totalFavorites: favCount[0]?.count ?? 0,
    avgRating: Number((avgRating[0]?.avg ?? 0).toFixed(1)),
  };
}

/** Get review counts grouped by date (for the review activity chart) */
export async function getReviewsByDateRange(dateRange: "7d" | "30d" | "all") {
  const db = await getDb();
  if (!db) return [];

  const start = getDateRangeStart(dateRange);

  const query = start
    ? db.select({
        date: sql<string>`DATE(${reviews.createdAt} / 1000, 'unixepoch')`,
        count: sql<number>`COUNT(*)`,
      }).from(reviews).where(sql`${reviews.createdAt} >= ${start}`).groupBy(sql`DATE(${reviews.createdAt} / 1000, 'unixepoch')`).orderBy(sql`DATE(${reviews.createdAt} / 1000, 'unixepoch')`)
    : db.select({
        date: sql<string>`DATE(${reviews.createdAt} / 1000, 'unixepoch')`,
        count: sql<number>`COUNT(*)`,
      }).from(reviews).groupBy(sql`DATE(${reviews.createdAt} / 1000, 'unixepoch')`).orderBy(sql`DATE(${reviews.createdAt} / 1000, 'unixepoch')`);

  return await query;
}

/** Get favorite counts grouped by business category (for the pie chart) */
export async function getFavoritesByCategory() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      categories: businesses.categories,
      count: sql<number>`COUNT(${favorites.id})`,
    })
    .from(favorites)
    .innerJoin(businesses, eq(favorites.businessId, businesses.id))
    .groupBy(businesses.categories);

  // Parse categories and aggregate by first category title
  const categoryMap = new Map<string, number>();
  for (const row of result) {
    if (!row.categories) continue;
    try {
      const cats = JSON.parse(row.categories);
      const name = cats[0]?.title || "Other";
      categoryMap.set(name, (categoryMap.get(name) || 0) + row.count);
    } catch {
      categoryMap.set("Other", (categoryMap.get("Other") || 0) + row.count);
    }
  }

  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get a live community activity feed — recent reviews and favorites
 * with business and user context, ordered newest-first.
 * Used by the Community Feed UI to show what's happening right now.
 */
export async function getCommunityFeed(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // Recent reviews with user + business info
  const recentReviews = await db
    .select({
      id: reviews.id,
      type: sql<string>`'review'`,
      userId: reviews.userId,
      businessId: reviews.businessId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userName: users.name,
      businessName: businesses.name,
      businessImageUrl: businesses.imageUrl,
      businessCategories: businesses.categories,
      businessCity: businesses.city,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(businesses, eq(reviews.businessId, businesses.id))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);

  // Recent favorites with user + business info
  const recentFavorites = await db
    .select({
      id: favorites.id,
      type: sql<string>`'favorite'`,
      userId: favorites.userId,
      businessId: favorites.businessId,
      rating: sql<number>`null`,
      comment: sql<string>`null`,
      createdAt: favorites.createdAt,
      userName: users.name,
      businessName: businesses.name,
      businessImageUrl: businesses.imageUrl,
      businessCategories: businesses.categories,
      businessCity: businesses.city,
    })
    .from(favorites)
    .innerJoin(users, eq(favorites.userId, users.id))
    .innerJoin(businesses, eq(favorites.businessId, businesses.id))
    .orderBy(desc(favorites.createdAt))
    .limit(limit);

  // Merge and sort by date, return most recent
  const combined = [...recentReviews, ...recentFavorites]
    .sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);

  return combined;
}

/**
 * Get aggregate local impact metrics for the Impact Dashboard.
 * These numbers tell the story of the community's support for local businesses.
 */
export async function getCommunityImpact() {
  const db = await getDb();
  if (!db) return {
    totalReviews: 0, totalFavorites: 0, totalBusinessesSupported: 0,
    totalUsers: 0, thisWeekReviews: 0, thisWeekFavorites: 0,
    topSupportedCity: null as string | null, avgSentiment: 0,
  };

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalReviewsRes, totalFavRes, totalBizRes, totalUsersRes, weekReviewsRes, weekFavRes] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(reviews),
    db.select({ count: sql<number>`COUNT(*)` }).from(favorites),
    db.select({ count: sql<number>`COUNT(DISTINCT ${favorites.businessId})` }).from(favorites),
    db.select({ count: sql<number>`COUNT(*)` }).from(users),
    db.select({ count: sql<number>`COUNT(*)` }).from(reviews).where(sql`${reviews.createdAt} >= ${weekAgo}`),
    db.select({ count: sql<number>`COUNT(*)` }).from(favorites).where(sql`${favorites.createdAt} >= ${weekAgo}`),
  ]);

  // Compute average sentiment from recent review comments
  const recentComments = await db
    .select({ comment: reviews.comment })
    .from(reviews)
    .orderBy(desc(reviews.createdAt))
    .limit(100);
  const sentimentScores = recentComments.map(r => computeSentimentScore(r.comment));
  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    : 0.5;

  // Find the city with the most supported businesses
  const cityResult = await db
    .select({ city: businesses.city, count: sql<number>`COUNT(${favorites.id})` })
    .from(favorites)
    .innerJoin(businesses, eq(favorites.businessId, businesses.id))
    .groupBy(businesses.city)
    .orderBy(desc(sql<number>`COUNT(${favorites.id})`))
    .limit(1);

  return {
    totalReviews: totalReviewsRes[0]?.count ?? 0,
    totalFavorites: totalFavRes[0]?.count ?? 0,
    totalBusinessesSupported: totalBizRes[0]?.count ?? 0,
    totalUsers: totalUsersRes[0]?.count ?? 0,
    thisWeekReviews: weekReviewsRes[0]?.count ?? 0,
    thisWeekFavorites: weekFavRes[0]?.count ?? 0,
    topSupportedCity: cityResult[0]?.city ?? null,
    avgSentiment: Math.round(avgSentiment * 100),
  };
}

/**
 * Get recent per-business activity counts (how many people favorited
 * a given business in the last 7 days). Used for "X people saved this recently" UI.
 */
export async function getRecentFavoriteCountsForBusinesses(businessIds: number[]): Promise<Map<number, number>> {
  const db = await getDb();
  if (!db || businessIds.length === 0) return new Map();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Use OR-chain instead of IN() to avoid complex nested sql template literals
  const allRows = await db
    .select({ businessId: favorites.businessId, count: sql<number>`COUNT(*)` })
    .from(favorites)
    .where(and(
      inArray(favorites.businessId, businessIds),
      sql`${favorites.createdAt} >= ${weekAgo}`
    ))
    .groupBy(favorites.businessId);

  const map = new Map<number, number>();
  for (const row of allRows) if (row.businessId) map.set(row.businessId, row.count);
  return map;
}
