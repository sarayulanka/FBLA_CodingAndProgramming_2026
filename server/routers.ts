/**
 * routers.ts — tRPC API router definitions for BizBloom.
 *
 * All server-side API endpoints are defined here using tRPC procedures.
 * Routes are grouped into sub-routers:
 *   - auth        — login state and logout
 *   - business    — search, details, trending, leaderboard, autocomplete
 *   - favorites   — add/remove/check/list user favorites
 *   - reviews     — CRUD for user reviews
 *   - deals       — admin-managed promotional offers
 *   - gamification — badges, challenges, stats
 *   - help        — AI chat assistant (AWS Bedrock)
 *   - analytics   — community activity insights
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as yelp from "./yelp";
import { TRPCError } from "@trpc/server";
import { checkRateLimit } from "./rateLimit";

// ===== Helpers =====

/** Strip HTML tags from user-provided text to prevent stored XSS */
function sanitize(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

/** Shared admin guard */
function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can perform this action" });
  }
}

/** Hardcoded weekly challenges that always rotate based on the current week */
function getHardcodedChallenges() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Rotate challenge sets based on week number
  const weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const sets = [
    [
      { id: 1001, title: "Bakery Explorer", description: "Visit 3 different bakeries this week", type: "category" as const, target: 3, category: "bakeries", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 1002, title: "Coffee Connoisseur", description: "Try 3 different coffee shops this week", type: "category" as const, target: 3, category: "coffee", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 1003, title: "Review Streak", description: "Write 3 reviews this week", type: "review" as const, target: 3, category: null, rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 1004, title: "Local Support", description: "Visit 2 minority or student-owned businesses", type: "visit" as const, target: 2, category: "support", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 1005, title: "Foodie Adventure", description: "Try 5 different restaurants this week", type: "category" as const, target: 5, category: "restaurants", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
    ],
    [
      { id: 2001, title: "Sweet Tooth", description: "Visit 3 dessert places this week", type: "category" as const, target: 3, category: "desserts", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 2002, title: "Pizza Quest", description: "Try 3 different pizza places this week", type: "category" as const, target: 3, category: "pizza", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 2003, title: "Review Champion", description: "Write 5 detailed reviews this week", type: "review" as const, target: 5, category: null, rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 2004, title: "Community Explorer", description: "Visit 5 new businesses this week", type: "visit" as const, target: 5, category: "support", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 2005, title: "Brunch Hunter", description: "Visit 3 brunch spots this week", type: "category" as const, target: 3, category: "breakfast_brunch", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
    ],
    [
      { id: 3001, title: "Bar Hopper", description: "Visit 4 bars this week", type: "category" as const, target: 4, category: "bars", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 3002, title: "Helpful Reviewer", description: "Write 4 reviews to help others this week", type: "review" as const, target: 4, category: null, rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 3003, title: "Neighborhood Tour", description: "Visit 4 businesses in your area this week", type: "visit" as const, target: 4, category: "support", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 3004, title: "Bakery Explorer", description: "Visit 3 different bakeries this week", type: "category" as const, target: 3, category: "bakeries", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
      { id: 3005, title: "Foodie Adventure", description: "Try 5 different restaurants this week", type: "category" as const, target: 5, category: "restaurants", rewardBadgeId: null, isActive: true, startsAt: weekStart, endsAt: weekEnd, createdAt: weekStart },
    ],
  ];

  return sets[weekNum % sets.length];
}

/** Build business upsert data from Yelp API response */
function yelpToUpsert(b: any) {
  return {
    yelpId: b.id,
    name: b.name,
    imageUrl: b.image_url || null,
    url: b.url || null,
    rating: Math.round(b.rating * 10),
    reviewCount: b.review_count,
    price: b.price || null,
    phone: b.phone || null,
    categories: JSON.stringify(b.categories),
    address: b.location?.address1 || null,
    city: b.location?.city || null,
    state: b.location?.state || null,
    zipCode: b.location?.zip_code || null,
    country: b.location?.country || null,
    latitude: b.coordinates?.latitude ? Math.round(b.coordinates.latitude * 1000000) : null,
    longitude: b.coordinates?.longitude ? Math.round(b.coordinates.longitude * 1000000) : null,
    isClosed: b.is_closed,
  };
}

// Main application router — exported for type inference on the client
export const appRouter = router({
  system: systemRouter,

  // ==================== AUTH ====================
  auth: router({
    /** Returns the currently logged-in user (or null if unauthenticated) */
    me: publicProcedure.query(opts => opts.ctx.user),

    /** Register a new local account */
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const { pbkdf2Sync, randomBytes } = await import("crypto");
        const existing = await db.getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
        const salt = randomBytes(16).toString("hex");
        const hash = pbkdf2Sync(input.password, salt, 100000, 64, "sha512").toString("hex");
        const passwordHash = `${salt}:${hash}`;
        const openId = `local_${randomBytes(8).toString("hex")}`;
        await db.upsertUser({ openId, name: input.name, email: input.email, loginMethod: "local", passwordHash, lastSignedIn: new Date() });
        const token = await sdk.createSessionToken(openId, { name: input.name, expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true };
      }),

    /** Login with email + password */
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const { pbkdf2Sync } = await import("crypto");
        const user = await db.getUserByEmail(input.email);
        if (!user?.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        const [salt, storedHash] = user.passwordHash.split(":");
        const hash = pbkdf2Sync(input.password, salt, 100000, 64, "sha512").toString("hex");
        if (hash !== storedHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        const token = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true };
      }),

    /** Clears the session cookie and logs the user out */
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== BUSINESS SEARCH & DETAILS ====================
  business: router({
    /** Search for businesses via the Yelp Fusion API, then cache results in our DB */
    search: publicProcedure
      .input(z.object({
        location: z.string().min(1).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        term: z.string().min(1).optional(),
        categories: z.string().optional(),
        radius: z.number().min(1).max(40000).optional(),
        price: z.string().optional(),
        open_now: z.boolean().optional(),
        sort_by: z.enum(["best_match", "rating", "review_count", "distance"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const result = await yelp.searchBusinesses(input);

        // Cache businesses in database — parallel upserts
        await Promise.all(
          result.businesses.map((business: any) =>
            db.upsertBusiness(yelpToUpsert(business)).catch((error) => {
              console.error(`Failed to cache business ${business.id}:`, error);
            })
          )
        );

        return result;
      }),

    details: publicProcedure
      .input(z.object({
        yelpId: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const details = await yelp.getBusinessDetails(input.yelpId);

          // Update cache
          try {
            await db.upsertBusiness(yelpToUpsert(details));
          } catch (error) {
            console.error(`Failed to cache business details ${details.id}:`, error);
          }

          return details;
        } catch (error: any) {
          if (error.message?.includes('404')) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
          }
          throw error;
        }
      }),

    yelpReviews: publicProcedure
      .input(z.object({
        yelpId: z.string(),
      }))
      .query(async ({ input }) => {
        return await yelp.getBusinessReviews(input.yelpId);
      }),

    trending: publicProcedure
      .query(async () => {
        return await db.getTrendingBusinesses();
      }),

    recommendations: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getRecommendationsForUser(ctx.user.id);
      }),

    leaderboard: publicProcedure
      .input(z.object({
        category: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getTopRatedBusinesses(input.category);
      }),

    autocomplete: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(100),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      }))
      .query(async ({ input }) => {
        return await yelp.autocomplete(input);
      }),

    /**
     * AI-powered Community Pulse — summarizes reviews for a business using Bedrock.
     * Returns a 1-sentence "what locals say" summary + sentiment label.
     */
    summarizeReviews: publicProcedure
      .input(z.object({ yelpId: z.string() }))
      .query(async ({ input }) => {
        const business = await db.getBusinessByYelpId(input.yelpId);
        if (!business) return null;
        const businessReviews = await db.getBusinessReviews(business.id);
        if (businessReviews.length < 2) return null;

        const sentimentScores = businessReviews.map(r => db.computeSentimentScore(r.comment));
        const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;

        // Build a short text to summarize
        const reviewSnippets = businessReviews
          .filter(r => r.comment && r.comment.length > 10)
          .slice(0, 5)
          .map(r => `${r.rating}★: "${r.comment?.slice(0, 120)}"`)
          .join("\n");

        if (!reviewSnippets) return null;

        try {
          const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
          const client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || "us-east-1",
          });
          const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 80,
            system: "You summarize customer reviews in exactly one punchy sentence under 20 words. Start with what people love most. Be specific, not generic.",
            messages: [{ role: "user", content: `Summarize these reviews:\n${reviewSnippets}` }],
          };
          const command = new InvokeModelCommand({
            modelId: (() => { const m = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-3-5-haiku-20241022-v1:0"; return m.startsWith("us.") || m.startsWith("eu.") || m.startsWith("ap.") ? m : `us.${m}`; })(),
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(payload),
          });
          const response = await client.send(command);
          const body = JSON.parse(new TextDecoder().decode(response.body));
          const summary = body.content?.[0]?.text ?? null;
          const sentiment = avgSentiment >= 0.7 ? "positive" : avgSentiment >= 0.45 ? "mixed" : "critical";
          return { summary, sentiment, reviewCount: businessReviews.length };
        } catch {
          // Fallback: keyword-based summary
          const sentiment = avgSentiment >= 0.7 ? "positive" : avgSentiment >= 0.45 ? "mixed" : "critical";
          const topWords = avgSentiment >= 0.7 ? "Community loves this spot!" : avgSentiment >= 0.45 ? "Mixed reviews from the community." : "Some concerns flagged by reviewers.";
          return { summary: topWords, sentiment, reviewCount: businessReviews.length };
        }
      }),
  }),

  // ==================== FAVORITES ====================
  favorites: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserFavorites(ctx.user.id);
      }),

    add: protectedProcedure
      .input(z.object({
        yelpId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!checkRateLimit(ctx.user.id, 'favorite', 10)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many favorites. Please wait a moment." });
        }

        let business = await db.getBusinessByYelpId(input.yelpId);

        if (!business) {
          const yelpBusiness = await yelp.getBusinessDetails(input.yelpId);
          business = await db.upsertBusiness(yelpToUpsert(yelpBusiness));
        }

        await db.addFavorite(ctx.user.id, business.id);
        await db.updateUserStats(ctx.user.id, 'favorite');

        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({
        yelpId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessByYelpId(input.yelpId);
        if (!business) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
        }

        await db.removeFavorite(ctx.user.id, business.id);
        return { success: true };
      }),

    check: protectedProcedure
      .input(z.object({
        yelpId: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const business = await db.getBusinessByYelpId(input.yelpId);
        if (!business) return { isFavorite: false };

        return { isFavorite: await db.isFavorite(ctx.user.id, business.id) };
      }),
  }),

  // ==================== REVIEWS ====================
  reviews: router({
    list: publicProcedure
      .input(z.object({
        yelpId: z.string(),
      }))
      .query(async ({ input }) => {
        const business = await db.getBusinessByYelpId(input.yelpId);
        if (!business) return [];

        return await db.getBusinessReviews(business.id);
      }),

    create: protectedProcedure
      .input(z.object({
        yelpId: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().min(1).max(5000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Rate limit: max 5 reviews per minute
        if (!checkRateLimit(ctx.user.id, 'review', 5)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many reviews. Please wait a moment." });
        }

        let business = await db.getBusinessByYelpId(input.yelpId);

        if (!business) {
          const yelpBusiness = await yelp.getBusinessDetails(input.yelpId);
          business = await db.upsertBusiness(yelpToUpsert(yelpBusiness));
        }

        const existing = await db.getUserReviewForBusiness(ctx.user.id, business.id);
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have already reviewed this business" });
        }

        const review = await db.createReview({
          userId: ctx.user.id,
          businessId: business.id,
          rating: input.rating,
          comment: input.comment ? sanitize(input.comment) : null,
        });

        await db.updateUserStats(ctx.user.id, 'review');
        await db.checkAndAwardBadges(ctx.user.id);

        return review;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(5000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateReview(input.id, ctx.user.id, input.rating, input.comment ? sanitize(input.comment) : null);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteReview(input.id, ctx.user.id);
        return { success: true };
      }),

    myReview: protectedProcedure
      .input(z.object({
        yelpId: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const business = await db.getBusinessByYelpId(input.yelpId);
        if (!business) return null;

        const review = await db.getUserReviewForBusiness(ctx.user.id, business.id);
        return review || null;
      }),

    getAllReviews: publicProcedure
      .query(async () => {
        return await db.getAllReviewsWithBusinessInfo();
      }),
  }),

  // ==================== DEALS (admin-only creation) ====================
  deals: router({
    list: publicProcedure
      .input(z.object({
        yelpId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        if (input.yelpId) {
          const business = await db.getBusinessByYelpId(input.yelpId);
          if (!business) return [];
          return await db.getBusinessDeals(business.id);
        }

        return await db.getAllActiveDeals();
      }),

    create: protectedProcedure
      .input(z.object({
        yelpId: z.string(),
        title: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        code: z.string().optional(),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);

        const business = await db.getBusinessByYelpId(input.yelpId);
        if (!business) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
        }

        const deal = await db.createDeal({
          businessId: business.id,
          title: sanitize(input.title),
          description: input.description ? sanitize(input.description) : null,
          code: input.code || null,
          expiresAt: input.expiresAt || null,
          isActive: true,
        });

        return deal;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
        code: z.string().optional(),
        expiresAt: z.date().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);

        const { id, ...updates } = input;
        if (updates.title) updates.title = sanitize(updates.title);
        if (updates.description) updates.description = sanitize(updates.description);
        await db.updateDeal(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        requireAdmin(ctx.user.role);

        await db.deleteDeal(input.id);
        return { success: true };
      }),
  }),

  // ==================== GAMIFICATION (Badges & Challenges) ====================
  gamification: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStats(ctx.user.id);
    }),

    allBadges: publicProcedure.query(async () => {
      return await db.getAllBadges();
    }),

    myBadges: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserBadges(ctx.user.id);
    }),

    activeChallenges: publicProcedure.query(async () => {
      // Ensure weekly challenges are seeded before returning
      await db.regenerateWeeklyChallenges();
      return await db.getActiveChallenges();
    }),

    myProgress: protectedProcedure.query(async ({ ctx }) => {
      // Ensure weekly challenges are seeded, then return real DB progress
      await db.regenerateWeeklyChallenges();
      return await db.getUserChallengeProgress(ctx.user.id);
    }),

    checkIn: protectedProcedure
      .input(z.object({
        challengeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.updateChallengeProgress(ctx.user.id, input.challengeId);

        await db.updateUserStats(ctx.user.id, 'visit');
        await db.checkAndAwardBadges(ctx.user.id);

        return result;
      }),
  }),

  // ==================== HELP / AI CHAT (AWS Bedrock integration) ====================
  help: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string().min(1).max(2000),
        })),
        /** Optional personalization context injected by the client */
        userContext: z.object({
          userLocation: z.object({ lat: z.number(), lng: z.number(), city: z.string().optional() }).optional(),
          nearbyBusinesses: z.array(z.object({
            name: z.string(),
            categories: z.string().optional(),
            rating: z.number(),
            distance: z.number().optional(),
            hasDeals: z.boolean().optional(),
          })).max(8).optional(),
          userProfile: z.object({
            name: z.string().optional(),
            totalReviews: z.number(),
            totalFavorites: z.number(),
            badgesEarned: z.array(z.string()),
            activeChallenges: z.array(z.object({
              title: z.string(),
              description: z.string(),
              progress: z.number(),
              target: z.number(),
              category: z.string().nullable().optional(),
            })),
            recentFavoriteCategories: z.array(z.string()),
          }).optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        // Use AWS Bedrock for intelligent Q&A
        const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");

        const client = new BedrockRuntimeClient({
          region: process.env.AWS_REGION || "us-east-1",
        });

        // Build the system prompt dynamically from actual app state
        const stats = await db.getAnalyticsSummary("all");
        const activeChallenges = await db.getActiveChallenges();
        const allBadges = await db.getAllBadges();
        const ctx = input.userContext;

        // Build personalized context block
        let personalizedSection = "";
        if (ctx?.userProfile) {
          const p = ctx.userProfile;
          personalizedSection += `\n## About This User\n`;
          if (p.name) personalizedSection += `- Name: ${p.name}\n`;
          personalizedSection += `- They've written ${p.totalReviews} reviews and saved ${p.totalFavorites} favorites\n`;
          if (p.badgesEarned.length > 0) personalizedSection += `- Badges earned: ${p.badgesEarned.join(", ")}\n`;
          if (p.recentFavoriteCategories.length > 0) personalizedSection += `- They love: ${p.recentFavoriteCategories.join(", ")}\n`;
          if (p.activeChallenges.length > 0) {
            personalizedSection += `- Active challenges:\n`;
            for (const c of p.activeChallenges) {
              personalizedSection += `  • "${c.title}" — ${c.progress}/${c.target} complete (${c.description})\n`;
            }
          }
        }
        if (ctx?.userLocation) {
          const loc = ctx.userLocation;
          personalizedSection += `\n## User's Current Location\n`;
          personalizedSection += `- Coordinates: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}${loc.city ? ` (${loc.city})` : ""}\n`;
        }
        if (ctx?.nearbyBusinesses && ctx.nearbyBusinesses.length > 0) {
          personalizedSection += `\n## Nearby Businesses (sorted closest first)\n`;
          const sorted = [...ctx.nearbyBusinesses].sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
          for (const b of sorted) {
            const cats = b.categories ? (() => { try { return JSON.parse(b.categories!).map((c: any) => c.title).join(", "); } catch { return b.categories; } })() : "";
            personalizedSection += `- ${b.name} — ${(b.rating / 10).toFixed(1)} stars${b.distance ? `, ${b.distance.toFixed(1)} miles away` : ""}${cats ? `, ${cats}` : ""}${b.hasDeals ? ", has deals" : ""}\n`;
          }
          personalizedSection += `\nSTRICT RULE: You may ONLY mention businesses that appear in this exact list above. Do not invent, guess, or add any business names that are not listed here. If you are not 100% certain a business name came from this list, do not mention it. When making recommendations, pick 2-3 from this list only.\n`;
        }

        const hasNearbyBusinesses = ctx?.nearbyBusinesses && ctx.nearbyBusinesses.length > 0;
        const personalizedBlock = personalizedSection ? "\n" + personalizedSection : "";
        const systemPrompt = `You are BizBloom's helpful assistant. BizBloom is a web platform for discovering and supporting local small businesses. Answer ONLY based on the information below — do not guess or invent features.

CRITICAL RULE: If the user asks what's good nearby, what to visit, or for recommendations AND there are no nearby businesses listed below, say: "Do a quick search on the Home page first — once you search I can see your results and give you specific picks!" Do NOT give navigation steps.${hasNearbyBusinesses ? " Since search results ARE available below, give specific business recommendations by name — do not tell them to search." : ""}${personalizedBlock}

## Pages & Navigation (top nav bar)
- **Home** ("/") — Main page with search, hero section, and business results
- **Trending** ("/trending") — Businesses with the most community activity in the last 30 days
- **Deals** ("/deals") — Special offers and coupons posted by admins
- **Reviews** ("/community-reviews") — Browse all community reviews, searchable by business name, user, or content
- **Favorites** ("/favorites") — Saved businesses (sign-in required)
- **Impact** ("/impact") — Local Impact Dashboard showing community stats, live activity feed, and sentiment gauge
- **Analytics** ("/analytics") — Community activity charts with date filters (7d, 30d, all time), category breakdowns, top-rated table, and CSV export
- **Help** — This chat panel, accessible from the nav bar

## How to Search
1. Go to the Home page
2. Type a search term (e.g. "pizza") and/or enter a location, or allow the browser to detect your location
3. Optionally pick a category: Restaurants, Shopping, Home Services, Beauty & Spas, or Automotive
4. Choose a sort: Best Match, Highest Rated, Most Reviewed, or Nearest
5. Click "Search" — business cards appear with photo, rating, price, categories, and distance
6. Toggle between List view and Map view using the buttons above the results

## How to Write a Review
1. Sign in to your account (click "Sign In" in the top-right)
2. Search for a business on the Home page
3. Click on a business card to open its details dialog
4. Click "Write a Review" (only appears if you haven't already reviewed this business)
5. Select a star rating (1–5) and optionally write a comment (up to 5,000 characters)
6. Click "Submit Review" — done!

## How to Favorite a Business
- On any business card, click the heart icon (you must be signed in)
- A filled red heart means it\'s saved; click again to remove
- View all saved businesses on the Favorites page

## Badges & Challenges
Available badges: ${allBadges.map(b => b.icon + " " + b.name + " (" + b.description + ")").join(", ") || "loading..."}
Active challenges: ${activeChallenges.length > 0 ? activeChallenges.map(c => '"' + c.title + '" — ' + c.description).join("; ") : "new challenges are generated weekly"}
- Badges are earned automatically when you hit milestones (e.g. write your first review)
- Challenges are weekly — check in on the Badges page to track progress

## Current Stats
- ${stats.totalReviews} total reviews, ${stats.totalBusinesses} businesses cached, ${stats.totalFavorites} favorites, average rating: ${stats.avgRating}

## Sign-in Required For
Writing reviews, saving favorites, viewing badges/challenges, and personalized recommendations.

IMPORTANT RULES:
- Write like a friendly, casual person texting — NOT like a formatted document.
- NEVER use bullet points, dashes, asterisks, bold, or any markdown formatting. No "•", no "**", no "-" lists. Ever.
- Keep it to 2-3 short sentences max. Conversational, warm, direct.
- When recommending businesses, weave them naturally into a sentence. Example: "Grace's Thai Kitchen is probably your best bet — really solid ratings and only half a mile away. Myanmar Thai is great too if you're feeling adventurous."
- If asked about something outside BizBloom, politely say you can only help with the platform.`;

        // Filter out system messages (Bedrock only accepts user/assistant roles)
        const conversationMessages = input.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

        if (conversationMessages.length === 0) {
          return { reply: "Hi! How can I help you discover local businesses today?" };
        }

        try {
          const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 500,
            system: systemPrompt,
            messages: conversationMessages,
          };

          const command = new InvokeModelCommand({
            modelId: (() => { const m = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-3-5-haiku-20241022-v1:0"; return m.startsWith("us.") || m.startsWith("eu.") || m.startsWith("ap.") ? m : `us.${m}`; })(),
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(payload),
          });

          const response = await client.send(command);
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));
          const raw = responseBody.content?.[0]?.text ?? "I couldn't generate a response. Please try again.";

          // Strip markdown so responses are always plain conversational text
          const reply = raw
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/^[\s•\-–]+/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

          return { reply };
        } catch (error) {
          console.error("Bedrock error:", error);
          const lastMsg = conversationMessages[conversationMessages.length - 1]?.content?.toLowerCase() ?? "";
          const faqMap: Record<string, string> = {
            search: "Go to the Home page, type what you\'re looking for, optionally pick a category or location, then click Search.",
            review: "Open a business card, click \'Write a Review\', pick a star rating, add a comment, and submit.",
            favorite: "Click the heart icon on any business card. Sign in first if you haven\'t.",
            badge: "Badges are earned automatically. Write reviews, save favorites, and visit businesses to unlock them.",
            challenge: "Weekly challenges appear on the Badges page. Complete them before Sunday to earn bonus points.",
            trending: "Visit the Trending page to see which businesses have the most community activity this week.",
            deal: "Go to the Deals page to browse special offers posted by local businesses.",
            impact: "Visit the Impact page to see the community\'s collective stats — total reviews, favorites, and a live activity feed.",
            map: "On the Home page, click the Map icon above search results to switch to map view with color-coded pins.",
          };
          for (const [key, answer] of Object.entries(faqMap)) {
            if (lastMsg.includes(key)) return { reply: answer };
          }
          return { reply: "I\'m having trouble connecting right now. Please try asking again in a moment!" };
        }
      }),
  }),

  // ==================== ANALYTICS ====================
  analytics: router({
    summary: publicProcedure
      .input(z.object({
        dateRange: z.enum(["7d", "30d", "all"]).default("all"),
      }))
      .query(async ({ input }) => {
        return await db.getAnalyticsSummary(input.dateRange);
      }),

    reviewsByDate: publicProcedure
      .input(z.object({
        dateRange: z.enum(["7d", "30d", "all"]).default("30d"),
      }))
      .query(async ({ input }) => {
        return await db.getReviewsByDateRange(input.dateRange);
      }),

    categoryBreakdown: publicProcedure
      .query(async () => {
        return await db.getFavoritesByCategory();
      }),

    topRated: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
      }))
      .query(async ({ input }) => {
        return await db.getTopRatedBusinesses();
      }),

    /** Live community activity feed — recent reviews and favorites */
    communityFeed: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        return await db.getCommunityFeed(input.limit);
      }),

    /** Aggregate impact metrics for the Local Impact Dashboard */
    communityImpact: publicProcedure
      .query(async () => {
        return await db.getCommunityImpact();
      }),
  }),
});

/** Exported router type — imported by the client for end-to-end type safety */
export type AppRouter = typeof appRouter;
