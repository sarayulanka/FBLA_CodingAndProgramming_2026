/**
 * seed-venue.ts — FBLA Nationals venue city pre-seeder.
 *
 * Caches Yelp search results for the top business categories in the FBLA
 * Nationals venue city so that BizBloom works in demo mode even without
 * live WiFi or Yelp API connectivity on competition day.
 *
 * This runs once at server startup (async, non-blocking). Cached businesses
 * are stored in the local SQLite DB and serve as fallback when the Yelp API
 * is unavailable.
 *
 * 2025 FBLA Nationals: San Antonio, TX (Henry B. González Convention Center)
 */

import { upsertBusiness } from "./db";
import { searchBusinesses } from "./yelp";

const VENUE_CITY = "San Antonio, TX";

// Categories to pre-seed so the demo shows rich, diverse local results
const SEED_CATEGORIES = [
  "restaurants",
  "coffee",
  "bakeries",
  "bars",
  "shopping",
];

/** Convert a Yelp API business result to the DB upsert shape */
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
    latitude: b.coordinates?.latitude ? Math.round(b.coordinates.latitude * 1_000_000) : null,
    longitude: b.coordinates?.longitude ? Math.round(b.coordinates.longitude * 1_000_000) : null,
    isClosed: b.is_closed,
  };
}

/**
 * Seeds the DB with local business data for the FBLA Nationals venue city.
 * Called once at server startup; any failures are silently swallowed so they
 * never crash the server.
 */
export async function seedVenueCity(): Promise<void> {
  // Check if we can reach the Yelp API at all — if not, skip silently
  let apiAvailable = true;
  try {
    await searchBusinesses({ location: VENUE_CITY, term: "coffee", limit: 1 });
  } catch {
    apiAvailable = false;
  }

  if (!apiAvailable) {
    console.log("[venue-seeder] Yelp API unavailable — using cached data if present.");
    return;
  }

  console.log(`[venue-seeder] Pre-seeding businesses for ${VENUE_CITY}...`);
  let totalSeeded = 0;

  for (const category of SEED_CATEGORIES) {
    try {
      const result = await searchBusinesses({
        location: VENUE_CITY,
        categories: category,
        sort_by: "rating",
        limit: 20,
      });

      // Upsert each business into the DB in parallel
      const businesses: any[] = result?.businesses ?? [];
      await Promise.allSettled(
        businesses.map(b => upsertBusiness(yelpToUpsert(b)))
      );
      totalSeeded += businesses.length;
    } catch {
      // Silently continue to next category
    }

    // Small delay between requests to respect Yelp rate limits
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  console.log(`[venue-seeder] Done — ${totalSeeded} businesses cached for offline demo.`);
}
