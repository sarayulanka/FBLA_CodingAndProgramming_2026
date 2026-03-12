/**
 * Yelp Fusion API integration with local fallback.
 *
 * When the Yelp API is reachable the live data is returned as-is.
 * When the API key is missing, the network is down, or any request fails,
 * every function transparently falls back to a local seed database so the
 * application keeps working fully offline.
 *
 * Docs: https://docs.developer.yelp.com/docs/places-intro
 */

import {
  fallbackSearch,
  fallbackGetDetails,
  fallbackGetReviews,
  fallbackAutocomplete,
} from "./fallback-data";

// ===== Configuration =====

const YELP_API_BASE = "https://api.yelp.com/v3";
const YELP_API_KEY = process.env.YELP_API_KEY || "";

if (!YELP_API_KEY) {
  console.warn("[Yelp API] YELP_API_KEY not configured — using local fallback data");
}

// ===== Shared types =====

export interface YelpBusiness {
  id: string;
  alias: string;
  name: string;
  image_url: string;
  is_closed: boolean;
  url: string;
  review_count: number;
  categories: Array<{
    alias: string;
    title: string;
  }>;
  rating: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2: string | null;
    address3: string | null;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance?: number;
}

export interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
  region: {
    center: {
      longitude: number;
      latitude: number;
    };
  };
}

export interface YelpBusinessDetails extends YelpBusiness {
  hours?: Array<{
    open: Array<{
      is_overnight: boolean;
      start: string;
      end: string;
      day: number;
    }>;
    hours_type: string;
    is_open_now: boolean;
  }>;
  photos: string[];
}

export interface YelpReview {
  id: string;
  rating: number;
  user: {
    id: string;
    profile_url: string;
    image_url: string | null;
    name: string;
  };
  text: string;
  time_created: string;
  url: string;
}

export interface YelpReviewsResponse {
  reviews: YelpReview[];
  total: number;
  possible_languages: string[];
}

// ===== Internal helpers =====

async function yelpFetch<T>(path: string): Promise<T> {
  if (!YELP_API_KEY) {
    throw new Error("YELP_API_KEY not configured");
  }

  const response = await fetch(`${YELP_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${YELP_API_KEY}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Yelp API error: ${response.status} - ${body}`);
  }

  return response.json();
}

function buildSearchQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  }
  return qs.toString();
}

// ===== Public API =====

/**
 * Search for businesses.
 * Falls back to local seed data when the Yelp API is unavailable.
 */
export async function searchBusinesses(params: {
  location?: string;
  latitude?: number;
  longitude?: number;
  term?: string;
  categories?: string;
  radius?: number;
  price?: string;
  open_now?: boolean;
  sort_by?: "best_match" | "rating" | "review_count" | "distance";
  limit?: number;
  offset?: number;
}): Promise<YelpSearchResponse> {
  try {
    return await yelpFetch<YelpSearchResponse>(
      `/businesses/search?${buildSearchQuery(params)}`
    );
  } catch (error) {
    console.warn("[Yelp API] searchBusinesses failed, using fallback:", (error as Error).message);
    return fallbackSearch(params);
  }
}

/**
 * Get business details by Yelp ID.
 * Falls back to local seed data when the Yelp API is unavailable.
 */
export async function getBusinessDetails(yelpId: string): Promise<YelpBusinessDetails> {
  try {
    return await yelpFetch<YelpBusinessDetails>(`/businesses/${yelpId}`);
  } catch (error) {
    console.warn("[Yelp API] getBusinessDetails failed, using fallback:", (error as Error).message);
    const details = fallbackGetDetails(yelpId);
    if (!details) {
      throw new Error(`Business not found: ${yelpId}`);
    }
    return details;
  }
}

/**
 * Get reviews for a business.
 * Falls back to locally-generated reviews when the Yelp API is unavailable.
 */
export async function getBusinessReviews(yelpId: string): Promise<YelpReviewsResponse> {
  try {
    return await yelpFetch<YelpReviewsResponse>(`/businesses/${yelpId}/reviews`);
  } catch (error) {
    console.warn("[Yelp API] getBusinessReviews failed, using fallback:", (error as Error).message);
    return fallbackGetReviews(yelpId);
  }
}

/**
 * Autocomplete suggestions.
 * Falls back to local seed data when the Yelp API is unavailable.
 */
export async function autocomplete(params: {
  text: string;
  latitude?: number;
  longitude?: number;
}): Promise<{
  terms: Array<{ text: string }>;
  businesses: Array<{ id: string; name: string }>;
  categories: Array<{ alias: string; title: string }>;
}> {
  try {
    return await yelpFetch(`/autocomplete?${buildSearchQuery(params)}`);
  } catch (error) {
    console.warn("[Yelp API] autocomplete failed, using fallback:", (error as Error).message);
    return fallbackAutocomplete(params);
  }
}
