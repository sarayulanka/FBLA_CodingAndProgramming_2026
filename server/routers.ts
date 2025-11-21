import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as yelp from "./yelp";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Business search and details
  business: router({
    search: publicProcedure
      .input(z.object({
        location: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        term: z.string().optional(),
        categories: z.string().optional(),
        radius: z.number().optional(),
        price: z.string().optional(),
        open_now: z.boolean().optional(),
        sort_by: z.enum(["best_match", "rating", "review_count", "distance"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const result = await yelp.searchBusinesses(input);
        
        // Cache businesses in database
        for (const business of result.businesses) {
          try {
            await db.upsertBusiness({
              yelpId: business.id,
              name: business.name,
              imageUrl: business.image_url || null,
              url: business.url || null,
              rating: Math.round(business.rating * 10),
              reviewCount: business.review_count,
              price: business.price || null,
              phone: business.phone || null,
              categories: JSON.stringify(business.categories),
              address: business.location.address1 || null,
              city: business.location.city || null,
              state: business.location.state || null,
              zipCode: business.location.zip_code || null,
              country: business.location.country || null,
              latitude: business.coordinates.latitude ? Math.round(business.coordinates.latitude * 1000000) : null,
              longitude: business.coordinates.longitude ? Math.round(business.coordinates.longitude * 1000000) : null,
              isClosed: business.is_closed,
            });
          } catch (error) {
            console.error(`Failed to cache business ${business.id}:`, error);
          }
        }
        
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
          await db.upsertBusiness({
            yelpId: details.id,
            name: details.name,
            imageUrl: details.image_url || null,
            url: details.url || null,
            rating: Math.round(details.rating * 10),
            reviewCount: details.review_count,
            price: details.price || null,
            phone: details.phone || null,
            categories: JSON.stringify(details.categories),
            address: details.location.address1 || null,
            city: details.location.city || null,
            state: details.location.state || null,
            zipCode: details.location.zip_code || null,
            country: details.location.country || null,
            latitude: details.coordinates.latitude ? Math.round(details.coordinates.latitude * 1000000) : null,
            longitude: details.coordinates.longitude ? Math.round(details.coordinates.longitude * 1000000) : null,
            isClosed: details.is_closed,
          });
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
        text: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
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
        let business = await db.getBusinessByYelpId(input.yelpId);
        
        if (!business) {
          const yelpBusiness = await yelp.getBusinessDetails(input.yelpId);
          business = await db.upsertBusiness({
            yelpId: yelpBusiness.id,
            name: yelpBusiness.name,
            imageUrl: yelpBusiness.image_url || null,
            url: yelpBusiness.url || null,
            rating: Math.round(yelpBusiness.rating * 10),
            reviewCount: yelpBusiness.review_count,
            price: yelpBusiness.price || null,
            phone: yelpBusiness.phone || null,
            categories: JSON.stringify(yelpBusiness.categories),
            address: yelpBusiness.location.address1 || null,
            city: yelpBusiness.location.city || null,
            state: yelpBusiness.location.state || null,
            zipCode: yelpBusiness.location.zip_code || null,
            country: yelpBusiness.location.country || null,
            latitude: yelpBusiness.coordinates.latitude ? Math.round(yelpBusiness.coordinates.latitude * 1000000) : null,
            longitude: yelpBusiness.coordinates.longitude ? Math.round(yelpBusiness.coordinates.longitude * 1000000) : null,
            isClosed: yelpBusiness.is_closed,
          });
        }
        
        await db.addFavorite(ctx.user.id, business.id);
        
        // Update user stats
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
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let business = await db.getBusinessByYelpId(input.yelpId);
        
        if (!business) {
          const yelpBusiness = await yelp.getBusinessDetails(input.yelpId);
          business = await db.upsertBusiness({
            yelpId: yelpBusiness.id,
            name: yelpBusiness.name,
            imageUrl: yelpBusiness.image_url || null,
            url: yelpBusiness.url || null,
            rating: Math.round(yelpBusiness.rating * 10),
            reviewCount: yelpBusiness.review_count,
            price: yelpBusiness.price || null,
            phone: yelpBusiness.phone || null,
            categories: JSON.stringify(yelpBusiness.categories),
            address: yelpBusiness.location.address1 || null,
            city: yelpBusiness.location.city || null,
            state: yelpBusiness.location.state || null,
            zipCode: yelpBusiness.location.zip_code || null,
            country: yelpBusiness.location.country || null,
            latitude: yelpBusiness.coordinates.latitude ? Math.round(yelpBusiness.coordinates.latitude * 1000000) : null,
            longitude: yelpBusiness.coordinates.longitude ? Math.round(yelpBusiness.coordinates.longitude * 1000000) : null,
            isClosed: yelpBusiness.is_closed,
          });
        }
        
        const existing = await db.getUserReviewForBusiness(ctx.user.id, business.id);
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have already reviewed this business" });
        }
        
        const review = await db.createReview({
          userId: ctx.user.id,
          businessId: business.id,
          rating: input.rating,
          comment: input.comment || null,
        });
        
        // Update user stats
        await db.updateUserStats(ctx.user.id, 'review');
        
        // Check for badge earning
        await db.checkAndAwardBadges(ctx.user.id);
        
        return review;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateReview(input.id, ctx.user.id, input.rating, input.comment || null);
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
        title: z.string(),
        description: z.string().optional(),
        code: z.string().optional(),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create deals" });
        }
        
        const business = await db.getBusinessByYelpId(input.yelpId);
        if (!business) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
        }
        
        const deal = await db.createDeal({
          businessId: business.id,
          title: input.title,
          description: input.description || null,
          code: input.code || null,
          expiresAt: input.expiresAt || null,
          isActive: true,
        });
        
        return deal;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        code: z.string().optional(),
        expiresAt: z.date().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update deals" });
        }
        
        const { id, ...updates } = input;
        await db.updateDeal(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete deals" });
        }
        
        await db.deleteDeal(input.id);
        return { success: true };
      }),
  }),

  // Gamification (Badges & Challenges)
  gamification: router({
    // Get user stats
    stats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStats(ctx.user.id);
    }),

    // Get all available badges
    allBadges: publicProcedure.query(async () => {
      return await db.getAllBadges();
    }),

    // Get user's earned badges
    myBadges: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserBadges(ctx.user.id);
    }),

    // Get active challenges
    activeChallenges: publicProcedure.query(async () => {
      return await db.getActiveChallenges();
    }),

    // Get user's challenge progress
    myProgress: protectedProcedure.query(async ({ ctx }) => {
      // Check if challenges need regeneration
      await db.regenerateWeeklyChallenges();
      return await db.getUserChallengeProgress(ctx.user.id);
    }),

    // Check in to a challenge (manual progress update)
    checkIn: protectedProcedure
      .input(z.object({
        challengeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.updateChallengeProgress(ctx.user.id, input.challengeId);
        
        // Update visit stats
        await db.updateUserStats(ctx.user.id, 'visit');
        
        // Check for badge earning
        await db.checkAndAwardBadges(ctx.user.id);
        
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
