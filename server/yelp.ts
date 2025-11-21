/**
 * Yelp Fusion API integration
 * Docs: https://docs.developer.yelp.com/docs/places-intro
 */

const YELP_API_BASE = "https://api.yelp.com/v3";
const YELP_API_KEY = process.env.YELP_API_KEY || 'bPaQv14J0dOcg62aGElD5-TVf4GR1r3nNHIDI9tnUyMELdDdMupkB3TO72KYFCBhgsNOKu4i5M52IKCbJm5YDj5j7SlR-vyiaur88v3dD9sygKuFzU_wULXCHHMaaXYx';

if (!YELP_API_KEY) {
  console.warn("[Yelp API] YELP_API_KEY not configured");
}

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

/**
 * Search for businesses
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
  if (!YELP_API_KEY) {
    throw new Error("YELP_API_KEY not configured");
  }

  const queryParams = new URLSearchParams();
  
  if (params.location) queryParams.append("location", params.location);
  if (params.latitude !== undefined) queryParams.append("latitude", params.latitude.toString());
  if (params.longitude !== undefined) queryParams.append("longitude", params.longitude.toString());
  if (params.term) queryParams.append("term", params.term);
  if (params.categories) queryParams.append("categories", params.categories);
  if (params.radius) queryParams.append("radius", params.radius.toString());
  if (params.price) queryParams.append("price", params.price);
  if (params.open_now !== undefined) queryParams.append("open_now", params.open_now.toString());
  if (params.sort_by) queryParams.append("sort_by", params.sort_by);
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.offset) queryParams.append("offset", params.offset.toString());

  const response = await fetch(`${YELP_API_BASE}/businesses/search?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Yelp API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get business details by Yelp ID
 */
export async function getBusinessDetails(yelpId: string): Promise<YelpBusinessDetails> {
  if (!YELP_API_KEY) {
    throw new Error("YELP_API_KEY not configured");
  }

  const response = await fetch(`${YELP_API_BASE}/businesses/${yelpId}`, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Yelp API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get reviews for a business
 */
export async function getBusinessReviews(yelpId: string): Promise<YelpReviewsResponse> {
  if (!YELP_API_KEY) {
    throw new Error("YELP_API_KEY not configured");
  }

  const response = await fetch(`${YELP_API_BASE}/businesses/${yelpId}/reviews`, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Yelp API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Autocomplete suggestions
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
  if (!YELP_API_KEY) {
    throw new Error("YELP_API_KEY not configured");
  }

  const queryParams = new URLSearchParams();
  queryParams.append("text", params.text);
  if (params.latitude !== undefined) queryParams.append("latitude", params.latitude.toString());
  if (params.longitude !== undefined) queryParams.append("longitude", params.longitude.toString());

  const response = await fetch(`${YELP_API_BASE}/autocomplete?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Yelp API error: ${response.status} - ${error}`);
  }

  return response.json();
}
