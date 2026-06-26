/**
 * seed-deals.ts — Seeds sample deals for the Deals page demo.
 *
 * Fetches real San Antonio businesses from Yelp (with photos), upserts them
 * into the DB, then attaches realistic-looking deals to each one.
 * Only runs if the deals table is empty to avoid duplicates on restart.
 */

import { upsertBusiness, getDb } from "./db";
import { searchBusinesses } from "./yelp";
import { deals } from "../drizzle/schema";
import { count } from "drizzle-orm";

const VENUE_CITY = "San Antonio, TX";

// Each entry: what to search for + the deal to attach to the top result
const DEAL_SEEDS = [
  {
    searchTerm: "tacos san antonio",
    category: "mexican",
    deal: {
      title: "Happy Hour Tacos — $2 Off Any Order",
      description: "Get $2 off any taco order Monday–Friday from 3–6 PM. Dine-in only.",
      code: "HAPPYTACO",
      daysFromNow: 30,
    },
  },
  {
    searchTerm: "coffee san antonio",
    category: "coffee",
    deal: {
      title: "Buy One Get One Free — Any Latte",
      description: "Bring a friend and both lattes are on the house. Valid all day Saturday.",
      code: "BOGOLATTE",
      daysFromNow: 14,
    },
  },
  {
    searchTerm: "bbq san antonio",
    category: "bbq",
    deal: {
      title: "20% Off Your First Visit",
      description: "First-time guests get 20% off their entire bill. Just mention BizBloom at checkout.",
      code: "FIRSTVISIT20",
      daysFromNow: 60,
    },
  },
  {
    searchTerm: "brunch san antonio",
    category: "breakfast_brunch",
    deal: {
      title: "Free Mimosa with Weekend Brunch",
      description: "Order any brunch entrée on Saturday or Sunday and get a complimentary mimosa.",
      code: "BRUNCHMIMOSA",
      daysFromNow: 21,
    },
  },
  {
    searchTerm: "ice cream dessert san antonio",
    category: "icecream",
    deal: {
      title: "Kids Scoop Free with Adult Purchase",
      description: "One free kids scoop with every adult order. Perfect for a family outing!",
      code: "KIDSCOOP",
      daysFromNow: 45,
    },
  },
];

export async function seedDeals(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Skip if deals already exist
  const [{ value: existingCount }] = await db.select({ value: count() }).from(deals);
  if (existingCount > 0) {
    console.log("[deals-seeder] Deals already seeded — skipping.");
    return;
  }

  console.log("[deals-seeder] Seeding sample deals...");
  let seeded = 0;

  for (const seed of DEAL_SEEDS) {
    try {
      // Fetch a real business with a photo from Yelp
      const results = await searchBusinesses({
        location: VENUE_CITY,
        term: seed.searchTerm,
        categories: seed.category,
        sort_by: "rating",
        limit: 5,
      });

      // Pick the first result that has a real photo
      const biz = results.businesses.find(b => b.image_url && b.image_url.trim() !== "");
      if (!biz) continue;

      // Upsert into businesses table (so image_url is stored)
      const inserted = await upsertBusiness({
        yelpId: biz.id,
        name: biz.name,
        imageUrl: biz.image_url || null,
        url: biz.url || null,
        rating: Math.round(biz.rating * 10),
        reviewCount: biz.review_count,
        price: biz.price || null,
        phone: biz.phone || null,
        categories: JSON.stringify(biz.categories),
        address: biz.location?.address1 || null,
        city: biz.location?.city || null,
        state: biz.location?.state || null,
        zipCode: biz.location?.zip_code || null,
        country: biz.location?.country || null,
        latitude: biz.coordinates?.latitude ? Math.round(biz.coordinates.latitude * 1_000_000) : null,
        longitude: biz.coordinates?.longitude ? Math.round(biz.coordinates.longitude * 1_000_000) : null,
        isClosed: biz.is_closed,
      });

      // Insert the deal linked to this business
      const expiresAt = new Date(Date.now() + seed.deal.daysFromNow * 24 * 60 * 60 * 1000);
      await db.insert(deals).values({
        businessId: inserted.id,
        title: seed.deal.title,
        description: seed.deal.description,
        code: seed.deal.code,
        expiresAt,
        isActive: true,
      });

      seeded++;
      console.log(`[deals-seeder] Seeded deal for ${inserted.name}`);
    } catch (err) {
      console.warn(`[deals-seeder] Failed to seed deal for "${seed.searchTerm}":`, err);
    }
  }

  console.log(`[deals-seeder] Done — ${seeded} deals seeded.`);
}
