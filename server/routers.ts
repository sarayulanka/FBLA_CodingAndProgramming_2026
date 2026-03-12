import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
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

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Business search and details
  business: router({
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
  }),

  // Favorites
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

  // Reviews
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

  // Deals
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

  // Gamification (Badges & Challenges)
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
      return await db.getActiveChallenges();
    }),

    myProgress: protectedProcedure.query(async ({ ctx }) => {
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

  // Help / AI Chat
  help: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string().min(1).max(2000),
        })),
      }))
      .mutation(async ({ input }) => {
        // Use AWS Bedrock for intelligent Q&A
        const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");

        const { fromIni } = await import("@aws-sdk/credential-provider-ini");

        const client = new BedrockRuntimeClient({
          region: process.env.AWS_REGION || "us-east-1",
          credentials: fromIni({ profile: "sarayu" }),
        });

        // Build the system prompt dynamically from actual app state
        const stats = await db.getAnalyticsSummary("all");
        const activeChallenges = await db.getActiveChallenges();
        const allBadges = await db.getAllBadges();

        const systemPrompt = `You are BizBloom's helpful assistant. BizBloom is a web platform for discovering and supporting local small businesses. Answer ONLY based on the information below — do not guess or invent features.

## Pages & Navigation (top nav bar)
- **Home** ("/") — Main page with search, hero section, and business results
- **Trending** ("/trending") — Businesses with the most community activity in the last 30 days
- **Deals** ("/deals") — Special offers and coupons posted by admins
- **Reviews** ("/community-reviews") — Browse all community reviews, searchable by business name, user, or content
- **Favorites** ("/favorites") — Saved businesses (sign-in required)
- **Analytics** ("/analytics") — Community activity charts with date filters (7d, 30d, all time), category breakdowns, top-rated table, and CSV export
- **Help** — This chat panel, accessible from the nav bar

## How to Search
1. Go to the Home page
2. Type a search term (e.g. "pizza") and/or enter a location, or allow the browser to detect your location
3. Optionally pick a category: Restaurants, Shopping, Home Services, Beauty & Spas, or Automotive
4. Choose a sort: Best Match, Highest Rated, Most Reviewed, or Nearest
5. Click "Search" — business cards appear with photo, rating, price, categories, and distance

## How to Write a Review
1. Sign in to your account (click "Sign In" in the top-right)
2. Search for a business on the Home page
3. Click on a business card to open its details dialog
4. Click "Write a Review" (only appears if you haven't already reviewed this business)
5. Select a star rating (1–5) and optionally write a comment (up to 5,000 characters)
6. Click "Submit Review" — done!

## How to Favorite a Business
- On any business card, click the heart icon (you must be signed in)
- A filled red heart means it's saved; click again to remove
- View all saved businesses on the Favorites page

## Badges & Challenges
Available badges: ${allBadges.map(b => `${b.icon} ${b.name} (${b.description})`).join(", ") || "loading..."}
Active challenges: ${activeChallenges.length > 0 ? activeChallenges.map(c => `"${c.title}" — ${c.description}`).join("; ") : "new challenges are generated weekly"}
- Badges are earned automatically when you hit milestones (e.g. write your first review)
- Challenges are weekly — check in on the Badges page to track progress

## Current Stats
- ${stats.totalReviews} total reviews, ${stats.totalBusinesses} businesses cached, ${stats.totalFavorites} favorites, average rating: ${stats.avgRating}

## Sign-in Required For
Writing reviews, saving favorites, viewing badges/challenges, and personalized recommendations.

IMPORTANT RULES:
- Keep responses SHORT — 2-4 sentences max. Use bullet points only when listing steps.
- Never write long paragraphs. Get straight to the point.
- Be friendly but brief. If asked about something outside BizBloom, politely say you can only help with the platform.`;

        const conversationMessages = input.messages.filter(m => m.role !== "system");

        try {
          const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 300,
            system: systemPrompt,
            messages: conversationMessages.map(m => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          };

          const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-haiku-20240307-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(payload),
          });

          const response = await client.send(command);
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));

          return {
            reply: responseBody.content?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.",
          };
        } catch (error: any) {
          console.error("[Help Chat] Bedrock error:", error);
          // Fallback to built-in FAQ responses if Bedrock is unavailable
          const lastMessage = conversationMessages[conversationMessages.length - 1]?.content?.toLowerCase() || "";

          const faqResponses: Record<string, string> = {
            search: "To search for businesses, use the search bar on the home page. Enter what you're looking for and optionally a location. You can filter by category and sort results by rating, reviews, or distance.",
            review: "To write a review: 1) Sign in to your account, 2) Search for a business on the home page, 3) Click on a business card to open its details, 4) Click 'Write a Review', 5) Select your star rating (1-5), optionally write a comment, and click Submit!",
            favorite: "To save a business to your favorites, click the heart icon on any business card. You need to be signed in. View all your saved favorites from the 'Favorites' link in the navigation.",
            deal: "Browse current deals and special offers on the Deals page. These are posted by business administrators and may include discount codes.",
            badge: "Earn badges by being active on BizBloom! Write reviews to earn review badges, visit businesses for explorer badges, and complete weekly challenges. Check your progress on the Badges page.",
            trending: "The Trending page shows businesses with the most community activity in the last 30 days, including favorites and reviews.",
            analytics: "The Analytics page shows community activity data with charts. You can filter by date range (7 days, 30 days, all time) and see category breakdowns, review activity over time, and top-rated businesses. You can also export data to CSV.",
            challenge: "Weekly challenges appear on the Badges page. Check in to challenges to track your progress. Complete them to earn special badges!",
            category: "BizBloom supports categories including Restaurants, Shopping, Home Services, Beauty & Spas, and Automotive. Use the category filter when searching.",
          };

          for (const [keyword, response] of Object.entries(faqResponses)) {
            if (lastMessage.includes(keyword)) {
              return { reply: response };
            }
          }

          return {
            reply: "I'm BizBloom's help assistant! I can help you with:\n\n- **Searching** for businesses\n- **Writing reviews** and earning badges\n- **Saving favorites**\n- **Browsing deals** and trending businesses\n- **Understanding analytics**\n- **Completing challenges**\n\nWhat would you like to know?",
          };
        }
      }),
  }),

  // Analytics
  analytics: router({
    summary: publicProcedure
      .input(z.object({
        dateRange: z.enum(["7d", "30d", "all"]).default("30d"),
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
  }),
});

export type AppRouter = typeof appRouter;
