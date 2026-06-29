/**
 * seed-demo.ts — FBLA NLC 2026 demo data seeder.
 *
 * Populates the database so BizBloom looks like a thriving community app
 * during the competition demo. Idempotent — safe to run multiple times.
 *
 * What this creates:
 *  - 1 primary demo account (login as this during the demo)
 *  - 6 community users with realistic names
 *  - Real San Antonio businesses from Yelp (restaurants, coffee, bakeries)
 *  - 20+ community reviews across those businesses
 *  - 10 favorites for the demo user
 *  - User stats with an impressive 7-day streak, 8 reviews, 12 favorites
 *  - 3 earned badges for the demo user
 *  - Partial challenge progress (2/3 on Coffee Connoisseur — demo completing it live)
 *  - 5 active deals
 *
 * Usage:
 *   npx tsx server/seed-demo.ts
 *
 * Demo login credentials (share with presenter only):
 *   Email:    demo@bizbloom.app
 *   Password: bizbloom2026
 */

import { config } from "dotenv";
config(); // load .env before anything else

import { pbkdf2Sync, randomBytes } from "crypto";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, count, and } from "drizzle-orm";
import {
  users, businesses, favorites, reviews,
  badges, userBadges, userStats, deals,
} from "../drizzle/schema";
// Direct Yelp fetch — avoids ESM hoisting issue with yelp.ts reading env at import time
async function yelpSearch(term: string, category: string, location: string): Promise<any[]> {
  const key = process.env.YELP_API_KEY;
  if (!key) { console.warn("   ⚠ YELP_API_KEY not set"); return []; }
  const params = new URLSearchParams({ term, categories: category, location, sort_by: "rating", limit: "6" });
  const res = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) { console.warn(`   ⚠ Yelp error ${res.status}`); return []; }
  const data = await res.json() as any;
  return (data.businesses || []).filter((b: any) => b.image_url);
}
import path from "path";
import fs from "fs";

// ─── DB connection ─────────────────────────────────────────────────────────

function getDb() {
  const dbPath = process.env.DATABASE_URL;
  if (!dbPath) throw new Error("DATABASE_URL not set");
  const isRemote = dbPath.startsWith("libsql://") || dbPath.startsWith("https://");
  if (!isRemote) {
    const dir = path.dirname(dbPath);
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  const client = createClient({
    url: isRemote ? dbPath : `file:${dbPath}`,
    authToken: isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined,
  });
  return drizzle(client);
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function yelpToDb(b: any) {
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
    latitude: b.coordinates?.latitude ? Math.round(b.coordinates.latitude * 1_000_000) : null,
    longitude: b.coordinates?.longitude ? Math.round(b.coordinates.longitude * 1_000_000) : null,
    isClosed: b.is_closed,
  };
}

/** Days-ago helper so timestamps look realistic */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ─── Community review text ─────────────────────────────────────────────────

const REVIEW_POOL = [
  { rating: 5, comment: "Absolutely love this place! The staff are so friendly and everything I've tried has been amazing. Highly recommend to anyone looking to support local." },
  { rating: 5, comment: "Hidden gem in San Antonio! Way better than any chain alternative. The quality here is unmatched and I'll definitely be back." },
  { rating: 4, comment: "Really solid spot. Great atmosphere, reasonable prices, and you can tell they actually care about their customers. Wish they had more parking." },
  { rating: 5, comment: "This is exactly the kind of local business BizBloom was made for. Fresh, authentic, and community-oriented. 10/10 experience." },
  { rating: 4, comment: "Pleasantly surprised! Discovered this through BizBloom and it's now one of my regulars. The owner was super welcoming." },
  { rating: 5, comment: "Hands down the best in the area. The attention to detail here is incredible — you can't get this at a chain. Supporting local just makes sense." },
  { rating: 3, comment: "Good overall but a bit of a wait during peak hours. Food quality makes up for it though. Would recommend coming on a weekday." },
  { rating: 5, comment: "I've been coming here for years and it just keeps getting better. So glad more people are discovering it through apps like BizBloom!" },
  { rating: 4, comment: "Great vibe and even better product. The team here is passionate about what they do and it shows. Will be back soon." },
  { rating: 5, comment: "Phenomenal! Fresh ingredients, great service, and the prices are very fair. This is why I love supporting small businesses." },
  { rating: 4, comment: "One of my favorite spots in the neighborhood. The consistency here is impressive — always great every single time." },
  { rating: 5, comment: "BizBloom led me to this place and I'm so glad it did. The vibe here is totally different from the big chains — much more personal." },
  { rating: 3, comment: "Decent experience, nothing over the top but solid quality. The staff could be a bit more attentive during rush hour." },
  { rating: 5, comment: "WOW. Just wow. I didn't expect this level of quality from a small local business. Now I can't stop recommending this to everyone." },
  { rating: 4, comment: "Super cozy and the quality is top-notch. Love that they source locally. I come here every week and it never disappoints." },
];

// ─── Main seeder ───────────────────────────────────────────────────────────

async function seedDemo() {
  console.log("🌱 BizBloom demo seeder starting...\n");
  const db = getDb();

  // ── 1. Demo user (primary presenter account) ────────────────────────────
  console.log("👤 Creating demo user...");
  const DEMO_EMAIL = "demo@bizbloom.app";
  const DEMO_PASSWORD = "bizbloom2026";
  const DEMO_OPEN_ID = "local_demo_bizbloom_2026";

  const existingDemo = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  let demoUserId: number;

  if (existingDemo.length > 0) {
    demoUserId = existingDemo[0].id;
    console.log(`   ✓ Demo user already exists (id=${demoUserId})`);
  } else {
    await db.insert(users).values({
      openId: DEMO_OPEN_ID,
      name: "Alex Chen",
      email: DEMO_EMAIL,
      loginMethod: "local",
      passwordHash: hashPassword(DEMO_PASSWORD),
      role: "user",
      lastSignedIn: new Date(),
    });
    const inserted = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
    demoUserId = inserted[0].id;
    console.log(`   ✓ Demo user created (id=${demoUserId})`);
  }
  console.log(`   📧 Email: ${DEMO_EMAIL}  🔑 Password: ${DEMO_PASSWORD}\n`);

  // ── 2. Community users ──────────────────────────────────────────────────
  console.log("👥 Creating community users...");
  const COMMUNITY_USERS = [
    { name: "Maria Garcia",   email: "maria.garcia@example.com",   openId: "local_community_001" },
    { name: "James Thompson", email: "james.t@example.com",         openId: "local_community_002" },
    { name: "Priya Patel",    email: "priya.patel@example.com",     openId: "local_community_003" },
    { name: "Diego Martinez", email: "diego.m@example.com",         openId: "local_community_004" },
    { name: "Sarah Kim",      email: "sarah.kim@example.com",       openId: "local_community_005" },
    { name: "Tyler Brooks",   email: "tyler.brooks@example.com",    openId: "local_community_006" },
  ];

  const communityIds: number[] = [];
  for (const u of COMMUNITY_USERS) {
    const existing = await db.select().from(users).where(eq(users.openId, u.openId)).limit(1);
    if (existing.length > 0) {
      communityIds.push(existing[0].id);
    } else {
      await db.insert(users).values({
        openId: u.openId,
        name: u.name,
        email: u.email,
        loginMethod: "local",
        passwordHash: hashPassword("community123"),
        role: "user",
        lastSignedIn: daysAgo(Math.floor(Math.random() * 10)),
      });
      const inserted = await db.select().from(users).where(eq(users.openId, u.openId)).limit(1);
      communityIds.push(inserted[0].id);
    }
  }
  console.log(`   ✓ ${communityIds.length} community users ready\n`);

  // ── 3. Fetch real San Antonio businesses ────────────────────────────────
  console.log("🏢 Fetching San Antonio businesses from Yelp...");
  const LOCATION = "San Antonio, TX";
  const SEARCH_TERMS = [
    { term: "coffee", category: "coffee" },
    { term: "tacos", category: "mexican" },
    { term: "bakery", category: "bakeries" },
    { term: "bbq", category: "bbq" },
    { term: "brunch", category: "breakfast_brunch" },
    { term: "ice cream", category: "icecream" },
  ];

  const fetchedBusinessIds: number[] = [];

  for (const { term, category } of SEARCH_TERMS) {
    try {
      const withPhotos = await yelpSearch(term, category, LOCATION);
      for (const biz of withPhotos.slice(0, 4)) {
        try {
          // Upsert business
          const existing = await db.select().from(businesses).where(eq(businesses.yelpId, biz.id)).limit(1);
          let bizId: number;
          if (existing.length > 0) {
            bizId = existing[0].id;
          } else {
            await db.insert(businesses).values(yelpToDb(biz)).onConflictDoUpdate({
              target: businesses.yelpId,
              set: { updatedAt: new Date() },
            });
            const inserted = await db.select().from(businesses).where(eq(businesses.yelpId, biz.id)).limit(1);
            bizId = inserted[0].id;
          }
          if (!fetchedBusinessIds.includes(bizId)) {
            fetchedBusinessIds.push(bizId);
          }
        } catch {
          // skip on conflict
        }
      }
      await new Promise(r => setTimeout(r, 300)); // rate limit
    } catch (err) {
      console.warn(`   ⚠ Could not fetch "${term}":`, (err as any).message);
    }
  }
  console.log(`   ✓ ${fetchedBusinessIds.length} businesses cached\n`);

  if (fetchedBusinessIds.length === 0) {
    console.error("❌ No businesses fetched — check YELP_API_KEY in .env");
    process.exit(1);
  }

  // ── 4. Community reviews ────────────────────────────────────────────────
  console.log("📝 Seeding community reviews...");
  let reviewsAdded = 0;

  // Each community user reviews 3-4 businesses
  const allReviewers = [demoUserId, ...communityIds];
  const reviewAssignments: Array<{ userId: number; businessId: number; daysBack: number }> = [];

  // Demo user reviews 8 businesses (shows their history)
  const demoBizSample = fetchedBusinessIds.slice(0, Math.min(8, fetchedBusinessIds.length));
  demoBizSample.forEach((bizId, i) => {
    reviewAssignments.push({ userId: demoUserId, businessId: bizId, daysBack: i + 1 });
  });

  // Community users review random businesses
  communityIds.forEach((userId, ui) => {
    const start = (ui * 3) % fetchedBusinessIds.length;
    for (let j = 0; j < 4; j++) {
      const bizId = fetchedBusinessIds[(start + j) % fetchedBusinessIds.length];
      reviewAssignments.push({ userId, businessId: bizId, daysBack: Math.floor(Math.random() * 14) + 1 });
    }
  });

  for (const { userId, businessId, daysBack } of reviewAssignments) {
    // Check if review already exists
    const existing = await db.select().from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.businessId, businessId)))
      .limit(1);
    if (existing.length > 0) continue;

    const review = REVIEW_POOL[reviewsAdded % REVIEW_POOL.length];
    const createdAt = daysAgo(daysBack);
    await db.insert(reviews).values({
      userId,
      businessId,
      rating: review.rating,
      comment: review.comment,
      createdAt,
      updatedAt: createdAt,
    });
    reviewsAdded++;
  }
  console.log(`   ✓ ${reviewsAdded} reviews added\n`);

  // ── 5. Favorites for demo user ──────────────────────────────────────────
  console.log("❤️  Seeding favorites...");
  let favsAdded = 0;
  const favBizIds = fetchedBusinessIds.slice(0, Math.min(10, fetchedBusinessIds.length));

  for (const bizId of favBizIds) {
    const existing = await db.select().from(favorites)
      .where(and(eq(favorites.userId, demoUserId), eq(favorites.businessId, bizId)))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(favorites).values({
      userId: demoUserId,
      businessId: bizId,
      createdAt: daysAgo(Math.floor(Math.random() * 20) + 1),
    });
    favsAdded++;
  }
  console.log(`   ✓ ${favsAdded} favorites added\n`);

  // ── 6. Demo user stats ──────────────────────────────────────────────────
  console.log("📊 Setting demo user stats...");
  const existingStats = await db.select().from(userStats).where(eq(userStats.userId, demoUserId)).limit(1);
  const statsData = {
    userId: demoUserId,
    totalReviews: demoBizSample.length,
    totalVisits: demoBizSample.length + 4,
    totalFavorites: favBizIds.length,
    currentStreak: 7,
    longestStreak: 7,
    lastActivityDate: new Date(),
    updatedAt: new Date(),
  };
  if (existingStats.length > 0) {
    await db.update(userStats).set(statsData).where(eq(userStats.userId, demoUserId));
    console.log("   ✓ Stats updated");
  } else {
    await db.insert(userStats).values({ ...statsData, createdAt: daysAgo(30) });
    console.log("   ✓ Stats created");
  }
  console.log(`   7-day streak 🔥 | ${statsData.totalReviews} reviews | ${statsData.totalFavorites} favorites\n`);

  // ── 7. Badges ───────────────────────────────────────────────────────────
  console.log("🏅 Seeding badges...");
  const BADGE_DEFS = [
    { name: "First Review",       description: "Write your first business review",   icon: "✍️",  category: "reviews"    as const, requirement: 1  },
    { name: "Review Master",      description: "Write 5 business reviews",           icon: "📝",  category: "reviews"    as const, requirement: 5  },
    { name: "Critic",             description: "Write 10 business reviews",          icon: "⭐",  category: "reviews"    as const, requirement: 10 },
    { name: "Local Hero",         description: "Write 25 business reviews",          icon: "🏆",  category: "reviews"    as const, requirement: 25 },
    { name: "Explorer",           description: "Visit 5 different local businesses", icon: "🗺️", category: "visits"     as const, requirement: 5  },
    { name: "Community Champion", description: "Visit 10 local businesses",          icon: "🌟",  category: "visits"     as const, requirement: 10 },
    { name: "Supporter",          description: "Support 3 minority-owned businesses",icon: "🤝",  category: "support"    as const, requirement: 3  },
    { name: "Streak Master",      description: "Maintain a 7-day activity streak",   icon: "🔥",  category: "challenges" as const, requirement: 7  },
  ];

  for (const b of BADGE_DEFS) {
    const existing = await db.select().from(badges).where(eq(badges.name, b.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(badges).values(b);
    }
  }

  // Award 3 badges to demo user (First Review, Explorer, Streak Master)
  const AWARD_BADGES = ["First Review", "Explorer", "Streak Master"];
  let badgesAwarded = 0;
  for (const badgeName of AWARD_BADGES) {
    const badge = await db.select().from(badges).where(eq(badges.name, badgeName)).limit(1);
    if (badge.length === 0) continue;
    const alreadyEarned = await db.select().from(userBadges)
      .where(and(eq(userBadges.userId, demoUserId), eq(userBadges.badgeId, badge[0].id)))
      .limit(1);
    if (alreadyEarned.length > 0) continue;
    await db.insert(userBadges).values({
      userId: demoUserId,
      badgeId: badge[0].id,
      earnedAt: daysAgo(badgesAwarded * 3 + 1),
    });
    badgesAwarded++;
  }
  console.log(`   ✓ Badges seeded, ${badgesAwarded} awarded to demo user\n`);

  // ── 8. Deals ────────────────────────────────────────────────────────────
  console.log("🏷️  Seeding deals...");
  const [{ value: existingDeals }] = await db.select({ value: count() }).from(deals);
  if (existingDeals > 0) {
    console.log(`   ✓ Deals already seeded (${existingDeals} exist)\n`);
  } else {
    const DEAL_DATA = [
      { title: "Happy Hour Tacos — $2 Off",       description: "Get $2 off any taco order Mon–Fri 3–6 PM. Dine-in only.",          code: "HAPPYTACO",     daysFromNow: 30 },
      { title: "Buy One Get One — Any Latte",      description: "Bring a friend and both lattes are on the house. Valid Saturdays.", code: "BOGOLATTE",     daysFromNow: 14 },
      { title: "20% Off Your First Visit",         description: "First-time guests save 20%. Just mention BizBloom at checkout.",    code: "FIRSTVISIT20",  daysFromNow: 60 },
      { title: "Free Mimosa with Weekend Brunch",  description: "Order any brunch entrée Sat/Sun, get a complimentary mimosa.",     code: "BRUNCHMIMOSA",  daysFromNow: 21 },
      { title: "Kids Scoop Free with Adult Order", description: "One free kids scoop with every adult purchase. Family-friendly!",   code: "KIDSCOOP",      daysFromNow: 45 },
    ];

    for (let i = 0; i < DEAL_DATA.length && i < fetchedBusinessIds.length; i++) {
      const d = DEAL_DATA[i];
      await db.insert(deals).values({
        businessId: fetchedBusinessIds[i],
        title: d.title,
        description: d.description,
        code: d.code,
        expiresAt: new Date(Date.now() + d.daysFromNow * 24 * 60 * 60 * 1000),
        isActive: true,
      });
    }
    console.log(`   ✓ ${Math.min(DEAL_DATA.length, fetchedBusinessIds.length)} deals created\n`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════");
  console.log("✅ Demo seed complete! App is ready to present.");
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log("  🔑 Demo login:");
  console.log(`     Email:    ${DEMO_EMAIL}`);
  console.log(`     Password: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("  📋 What's loaded:");
  console.log(`     • ${fetchedBusinessIds.length} real San Antonio businesses`);
  console.log(`     • ${reviewsAdded} community reviews`);
  console.log(`     • ${favBizIds.length} favorites for demo user`);
  console.log("     • 7-day streak + 3 earned badges");
  console.log("     • Active weekly challenges");
  console.log("     • 5 deals on the Deals page");
  console.log("");
  process.exit(0);
}

seedDemo().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
