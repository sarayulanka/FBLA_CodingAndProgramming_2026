/**
 * Local fallback business data used when the Yelp API is unavailable.
 * All data is realistic but fictional — no real businesses are represented.
 */

import type { YelpBusiness, YelpBusinessDetails, YelpSearchResponse, YelpReview, YelpReviewsResponse } from "./yelp";

// ===== Placeholder image generator =====

/** Category → colour palette (background gradient start, gradient end, icon colour) */
const CATEGORY_COLORS: Record<string, [string, string, string]> = {
  restaurants: ["#E85D3A", "#C62828", "#FFFFFF"],
  shopping:    ["#7B1FA2", "#4A148C", "#FFFFFF"],
  homeservices:["#1565C0", "#0D47A1", "#FFFFFF"],
  beautysvc:   ["#D81B60", "#AD1457", "#FFFFFF"],
  auto:        ["#37474F", "#263238", "#FFD54F"],
};

/** Category → emoji-style SVG icon path */
const CATEGORY_ICONS: Record<string, string> = {
  restaurants: `<path d="M30 18c0-5.5 3.5-10 8-10v20c-4.5 0-8-4.5-8-10zm-6 10V8h2v8h3V8h2v8h3V8h2v20h-2l-1-8h-6l-1 8h-2z" fill="currentColor"/>`,
  shopping:    `<path d="M20 12a4 4 0 118 0h6l-3 20H17l-3-20h6zm4-2a2 2 0 00-2 2h4a2 2 0 00-2-2z" fill="currentColor"/>`,
  homeservices:`<path d="M24 10l12 10h-4v12H16V20h-4l12-10zm-4 20h4v-6h4v6h4V22l-6-5-6 5v8z" fill="currentColor"/>`,
  beautysvc:   `<path d="M24 8c-2 0-4 3-4 8s2 8 4 8 4-3 4-8-2-8-4-8zm-8 20c0-2 4-4 8-4s8 2 8 4v2H16v-2z" fill="currentColor"/>`,
  auto:        `<path d="M14 26v-4l2-8h16l2 8v4h-2v2h-4v-2h-8v2h-4v-2h-2zm4-10l-1 4h14l-1-4H18zm-1 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm14 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>`,
};

function getBusinessCategory(categories: Array<{ alias: string }>): string {
  for (const cat of categories) {
    for (const [key, aliases] of Object.entries(CATEGORY_MAP)) {
      if (aliases.includes(cat.alias)) return key;
    }
  }
  return "restaurants";
}

/**
 * Generate a unique, self-contained SVG data-URI placeholder for a business.
 * No network request needed — the image is fully embedded.
 */
function generatePlaceholderImage(name: string, categories: Array<{ alias: string }>): string {
  const cat = getBusinessCategory(categories);
  const [gradStart, gradEnd, iconColor] = CATEGORY_COLORS[cat] || CATEGORY_COLORS.restaurants;
  const iconPath = CATEGORY_ICONS[cat] || CATEGORY_ICONS.restaurants;

  // Get initials (up to 2 chars)
  const initials = name
    .split(/\s+/)
    .filter(w => w.length > 0 && w[0] === w[0].toUpperCase())
    .map(w => w[0])
    .slice(0, 2)
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradStart}"/>
        <stop offset="100%" stop-color="${gradEnd}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#bg)"/>
    <g transform="translate(176,60) scale(2.2)" color="${iconColor}" opacity="0.25">${iconPath}</g>
    <text x="200" y="175" text-anchor="middle" font-family="system-ui,sans-serif" font-size="64" font-weight="700" fill="${iconColor}" opacity="0.9">${initials}</text>
    <text x="200" y="215" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="${iconColor}" opacity="0.6">${name}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// ===== Category mapping =====

/** Category alias mapping — maps broad Yelp-style category to our seed sub-categories */
const CATEGORY_MAP: Record<string, string[]> = {
  restaurants: ["restaurants", "chinese", "italian", "mexican", "japanese", "sushi", "newamerican", "cafes", "bakeries", "bbq", "vietnamese", "pizza", "breakfast_brunch", "coffee", "desserts", "bars"],
  shopping: ["shopping", "vintage", "bookstores", "gardening", "petstore", "artsandcrafts"],
  homeservices: ["homeservices", "electricians", "plumbing", "heating", "homecleaning", "landscaping"],
  beautysvc: ["beautysvc", "spas", "hair", "nailtechnicians", "skincare", "barbers"],
  auto: ["auto", "autorepair", "oilchange", "autodetailing", "tires", "carwash"],
};

// ===== SEED BUSINESSES =====

const FALLBACK_BUSINESSES: YelpBusinessDetails[] = [
  // ── Restaurants ──
  {
    id: "local-golden-dragon-bistro",
    alias: "golden-dragon-bistro",
    name: "Golden Dragon Bistro",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 312,
    categories: [{ alias: "chinese", title: "Chinese" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.5,
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    transactions: ["delivery", "pickup"],
    price: "$$",
    location: {
      address1: "1428 Maple Avenue",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62704",
      country: "US",
      state: "IL",
      display_address: ["1428 Maple Avenue", "Springfield, IL 62704"],
    },
    phone: "+12175551234",
    display_phone: "(217) 555-1234",
    distance: 850,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1100", end: "2130", day: 0 },
        { is_overnight: false, start: "1100", end: "2130", day: 1 },
        { is_overnight: false, start: "1100", end: "2130", day: 2 },
        { is_overnight: false, start: "1100", end: "2130", day: 3 },
        { is_overnight: false, start: "1100", end: "2200", day: 4 },
        { is_overnight: false, start: "1100", end: "2200", day: 5 },
        { is_overnight: false, start: "1200", end: "2100", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-mama-roses-italian",
    alias: "mama-roses-italian",
    name: "Mama Rose's Italian Kitchen",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 487,
    categories: [{ alias: "italian", title: "Italian" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.7,
    coordinates: { latitude: 37.7755, longitude: -122.4180 },
    transactions: ["delivery", "pickup"],
    price: "$$$",
    location: {
      address1: "305 Oak Street",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["305 Oak Street", "Springfield, IL 62701"],
    },
    phone: "+12175552345",
    display_phone: "(217) 555-2345",
    distance: 1200,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1600", end: "2200", day: 0 },
        { is_overnight: false, start: "1600", end: "2200", day: 1 },
        { is_overnight: false, start: "1600", end: "2200", day: 2 },
        { is_overnight: false, start: "1600", end: "2200", day: 3 },
        { is_overnight: false, start: "1600", end: "2300", day: 4 },
        { is_overnight: false, start: "1600", end: "2300", day: 5 },
        { is_overnight: false, start: "1200", end: "2100", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-sunrise-tacos",
    alias: "sunrise-tacos",
    name: "Sunrise Tacos",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 198,
    categories: [{ alias: "mexican", title: "Mexican" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.3,
    coordinates: { latitude: 37.7760, longitude: -122.4200 },
    transactions: ["delivery", "pickup"],
    price: "$",
    location: {
      address1: "712 Elm Boulevard",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62702",
      country: "US",
      state: "IL",
      display_address: ["712 Elm Boulevard", "Springfield, IL 62702"],
    },
    phone: "+12175553456",
    display_phone: "(217) 555-3456",
    distance: 600,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0800", end: "2100", day: 0 },
        { is_overnight: false, start: "0800", end: "2100", day: 1 },
        { is_overnight: false, start: "0800", end: "2100", day: 2 },
        { is_overnight: false, start: "0800", end: "2100", day: 3 },
        { is_overnight: false, start: "0800", end: "2200", day: 4 },
        { is_overnight: false, start: "0800", end: "2200", day: 5 },
        { is_overnight: false, start: "0900", end: "2000", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-blue-fin-sushi",
    alias: "blue-fin-sushi",
    name: "Blue Fin Sushi Bar",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 256,
    categories: [{ alias: "japanese", title: "Japanese" }, { alias: "sushi", title: "Sushi Bars" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.6,
    coordinates: { latitude: 37.7740, longitude: -122.4210 },
    transactions: ["delivery", "pickup"],
    price: "$$$",
    location: {
      address1: "89 Pine Street",
      address2: "Suite 102",
      address3: null,
      city: "Springfield",
      zip_code: "62703",
      country: "US",
      state: "IL",
      display_address: ["89 Pine Street", "Suite 102", "Springfield, IL 62703"],
    },
    phone: "+12175554567",
    display_phone: "(217) 555-4567",
    distance: 1450,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1130", end: "2200", day: 0 },
        { is_overnight: false, start: "1130", end: "2200", day: 1 },
        { is_overnight: false, start: "1130", end: "2200", day: 2 },
        { is_overnight: false, start: "1130", end: "2200", day: 3 },
        { is_overnight: false, start: "1130", end: "2300", day: 4 },
        { is_overnight: false, start: "1130", end: "2300", day: 5 },
        { is_overnight: false, start: "1200", end: "2100", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-harvest-table",
    alias: "harvest-table",
    name: "The Harvest Table",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 374,
    categories: [{ alias: "newamerican", title: "American (New)" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.8,
    coordinates: { latitude: 37.7770, longitude: -122.4185 },
    transactions: ["pickup"],
    price: "$$$$",
    location: {
      address1: "2200 Grand Avenue",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62704",
      country: "US",
      state: "IL",
      display_address: ["2200 Grand Avenue", "Springfield, IL 62704"],
    },
    phone: "+12175555678",
    display_phone: "(217) 555-5678",
    distance: 2100,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1700", end: "2200", day: 1 },
        { is_overnight: false, start: "1700", end: "2200", day: 2 },
        { is_overnight: false, start: "1700", end: "2200", day: 3 },
        { is_overnight: false, start: "1700", end: "2300", day: 4 },
        { is_overnight: false, start: "1700", end: "2300", day: 5 },
        { is_overnight: false, start: "1100", end: "1500", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-cornerstone-cafe",
    alias: "cornerstone-cafe",
    name: "Cornerstone Cafe & Bakery",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 221,
    categories: [{ alias: "cafes", title: "Cafes" }, { alias: "bakeries", title: "Bakeries" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.4,
    coordinates: { latitude: 37.7735, longitude: -122.4170 },
    transactions: ["delivery", "pickup"],
    price: "$",
    location: {
      address1: "515 Main Street",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["515 Main Street", "Springfield, IL 62701"],
    },
    phone: "+12175556789",
    display_phone: "(217) 555-6789",
    distance: 400,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0600", end: "1800", day: 0 },
        { is_overnight: false, start: "0600", end: "1800", day: 1 },
        { is_overnight: false, start: "0600", end: "1800", day: 2 },
        { is_overnight: false, start: "0600", end: "1800", day: 3 },
        { is_overnight: false, start: "0600", end: "1900", day: 4 },
        { is_overnight: false, start: "0700", end: "1900", day: 5 },
        { is_overnight: false, start: "0700", end: "1600", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-smoky-joes-bbq",
    alias: "smoky-joes-bbq",
    name: "Smoky Joe's BBQ Pit",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 445,
    categories: [{ alias: "bbq", title: "Barbeque" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.5,
    coordinates: { latitude: 37.7780, longitude: -122.4220 },
    transactions: ["delivery", "pickup"],
    price: "$$",
    location: {
      address1: "1010 Hickory Lane",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62702",
      country: "US",
      state: "IL",
      display_address: ["1010 Hickory Lane", "Springfield, IL 62702"],
    },
    phone: "+12175557890",
    display_phone: "(217) 555-7890",
    distance: 1800,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1100", end: "2100", day: 0 },
        { is_overnight: false, start: "1100", end: "2100", day: 1 },
        { is_overnight: false, start: "1100", end: "2100", day: 2 },
        { is_overnight: false, start: "1100", end: "2100", day: 3 },
        { is_overnight: false, start: "1100", end: "2200", day: 4 },
        { is_overnight: false, start: "1100", end: "2200", day: 5 },
        { is_overnight: false, start: "1200", end: "2000", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-pho-saigon",
    alias: "pho-saigon",
    name: "Pho Saigon",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 167,
    categories: [{ alias: "vietnamese", title: "Vietnamese" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.2,
    coordinates: { latitude: 37.7745, longitude: -122.4195 },
    transactions: ["delivery", "pickup"],
    price: "$",
    location: {
      address1: "334 Birch Road",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62703",
      country: "US",
      state: "IL",
      display_address: ["334 Birch Road", "Springfield, IL 62703"],
    },
    phone: "+12175558901",
    display_phone: "(217) 555-8901",
    distance: 950,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1000", end: "2100", day: 0 },
        { is_overnight: false, start: "1000", end: "2100", day: 1 },
        { is_overnight: false, start: "1000", end: "2100", day: 2 },
        { is_overnight: false, start: "1000", end: "2100", day: 3 },
        { is_overnight: false, start: "1000", end: "2200", day: 4 },
        { is_overnight: false, start: "1000", end: "2200", day: 5 },
        { is_overnight: false, start: "1100", end: "2000", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },

  // ── Shopping ──
  {
    id: "local-vintage-finds",
    alias: "vintage-finds",
    name: "Vintage Finds Boutique",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 134,
    categories: [{ alias: "vintage", title: "Vintage & Consignment" }, { alias: "shopping", title: "Shopping" }],
    rating: 4.6,
    coordinates: { latitude: 37.7752, longitude: -122.4175 },
    transactions: [],
    price: "$$",
    location: {
      address1: "220 Market Street",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["220 Market Street", "Springfield, IL 62701"],
    },
    phone: "+12175559012",
    display_phone: "(217) 555-9012",
    distance: 700,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1000", end: "1800", day: 0 },
        { is_overnight: false, start: "1000", end: "1800", day: 1 },
        { is_overnight: false, start: "1000", end: "1800", day: 2 },
        { is_overnight: false, start: "1000", end: "1800", day: 3 },
        { is_overnight: false, start: "1000", end: "1900", day: 4 },
        { is_overnight: false, start: "1000", end: "1900", day: 5 },
        { is_overnight: false, start: "1100", end: "1700", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-page-turner-books",
    alias: "page-turner-books",
    name: "The Page Turner Bookshop",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 208,
    categories: [{ alias: "bookstores", title: "Bookstores" }, { alias: "shopping", title: "Shopping" }],
    rating: 4.8,
    coordinates: { latitude: 37.7758, longitude: -122.4168 },
    transactions: [],
    price: "$$",
    location: {
      address1: "607 College Avenue",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62704",
      country: "US",
      state: "IL",
      display_address: ["607 College Avenue", "Springfield, IL 62704"],
    },
    phone: "+12175550123",
    display_phone: "(217) 555-0123",
    distance: 1100,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0900", end: "2000", day: 0 },
        { is_overnight: false, start: "0900", end: "2000", day: 1 },
        { is_overnight: false, start: "0900", end: "2000", day: 2 },
        { is_overnight: false, start: "0900", end: "2000", day: 3 },
        { is_overnight: false, start: "0900", end: "2100", day: 4 },
        { is_overnight: false, start: "0900", end: "2100", day: 5 },
        { is_overnight: false, start: "1000", end: "1800", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-green-thumb-nursery",
    alias: "green-thumb-nursery",
    name: "Green Thumb Garden Nursery",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 96,
    categories: [{ alias: "gardening", title: "Nurseries & Gardening" }, { alias: "shopping", title: "Shopping" }],
    rating: 4.4,
    coordinates: { latitude: 37.7790, longitude: -122.4230 },
    transactions: [],
    price: "$$",
    location: {
      address1: "1825 Country Road",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62707",
      country: "US",
      state: "IL",
      display_address: ["1825 Country Road", "Springfield, IL 62707"],
    },
    phone: "+12175551345",
    display_phone: "(217) 555-1345",
    distance: 3200,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0800", end: "1800", day: 0 },
        { is_overnight: false, start: "0800", end: "1800", day: 1 },
        { is_overnight: false, start: "0800", end: "1800", day: 2 },
        { is_overnight: false, start: "0800", end: "1800", day: 3 },
        { is_overnight: false, start: "0800", end: "1800", day: 4 },
        { is_overnight: false, start: "0800", end: "1700", day: 5 },
        { is_overnight: false, start: "0900", end: "1500", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-pet-palace",
    alias: "pet-palace",
    name: "Pet Palace Supply",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 152,
    categories: [{ alias: "petstore", title: "Pet Stores" }, { alias: "shopping", title: "Shopping" }],
    rating: 4.3,
    coordinates: { latitude: 37.7762, longitude: -122.4205 },
    transactions: [],
    price: "$$",
    location: {
      address1: "445 Riverside Drive",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62702",
      country: "US",
      state: "IL",
      display_address: ["445 Riverside Drive", "Springfield, IL 62702"],
    },
    phone: "+12175552456",
    display_phone: "(217) 555-2456",
    distance: 1600,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0900", end: "1900", day: 0 },
        { is_overnight: false, start: "0900", end: "1900", day: 1 },
        { is_overnight: false, start: "0900", end: "1900", day: 2 },
        { is_overnight: false, start: "0900", end: "1900", day: 3 },
        { is_overnight: false, start: "0900", end: "2000", day: 4 },
        { is_overnight: false, start: "0900", end: "2000", day: 5 },
        { is_overnight: false, start: "1000", end: "1700", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-craft-corner",
    alias: "craft-corner",
    name: "The Craft Corner",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 78,
    categories: [{ alias: "artsandcrafts", title: "Arts & Crafts" }, { alias: "shopping", title: "Shopping" }],
    rating: 4.5,
    coordinates: { latitude: 37.7748, longitude: -122.4188 },
    transactions: [],
    price: "$",
    location: {
      address1: "123 Artisan Way",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["123 Artisan Way", "Springfield, IL 62701"],
    },
    phone: "+12175553567",
    display_phone: "(217) 555-3567",
    distance: 550,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1000", end: "1800", day: 0 },
        { is_overnight: false, start: "1000", end: "1800", day: 1 },
        { is_overnight: false, start: "1000", end: "1800", day: 2 },
        { is_overnight: false, start: "1000", end: "1800", day: 3 },
        { is_overnight: false, start: "1000", end: "1900", day: 4 },
        { is_overnight: false, start: "1000", end: "1900", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },

  // ── Home Services ──
  {
    id: "local-bright-home-electric",
    alias: "bright-home-electric",
    name: "Bright Home Electrical",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 89,
    categories: [{ alias: "electricians", title: "Electricians" }, { alias: "homeservices", title: "Home Services" }],
    rating: 4.7,
    coordinates: { latitude: 37.7782, longitude: -122.4215 },
    transactions: [],
    price: "$$",
    location: {
      address1: "901 Industrial Park Drive",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62703",
      country: "US",
      state: "IL",
      display_address: ["901 Industrial Park Drive", "Springfield, IL 62703"],
    },
    phone: "+12175554678",
    display_phone: "(217) 555-4678",
    distance: 2400,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0700", end: "1800", day: 0 },
        { is_overnight: false, start: "0700", end: "1800", day: 1 },
        { is_overnight: false, start: "0700", end: "1800", day: 2 },
        { is_overnight: false, start: "0700", end: "1800", day: 3 },
        { is_overnight: false, start: "0700", end: "1700", day: 4 },
        { is_overnight: false, start: "0800", end: "1400", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-evergreen-plumbing",
    alias: "evergreen-plumbing",
    name: "Evergreen Plumbing Co.",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 176,
    categories: [{ alias: "plumbing", title: "Plumbing" }, { alias: "homeservices", title: "Home Services" }],
    rating: 4.5,
    coordinates: { latitude: 37.7775, longitude: -122.4225 },
    transactions: [],
    price: "$$",
    location: {
      address1: "740 Commerce Boulevard",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62706",
      country: "US",
      state: "IL",
      display_address: ["740 Commerce Boulevard", "Springfield, IL 62706"],
    },
    phone: "+12175555789",
    display_phone: "(217) 555-5789",
    distance: 2800,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0700", end: "1900", day: 0 },
        { is_overnight: false, start: "0700", end: "1900", day: 1 },
        { is_overnight: false, start: "0700", end: "1900", day: 2 },
        { is_overnight: false, start: "0700", end: "1900", day: 3 },
        { is_overnight: false, start: "0700", end: "1900", day: 4 },
        { is_overnight: false, start: "0800", end: "1600", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-precision-hvac",
    alias: "precision-hvac",
    name: "Precision HVAC Services",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 112,
    categories: [{ alias: "heating", title: "Heating & Air Conditioning/HVAC" }, { alias: "homeservices", title: "Home Services" }],
    rating: 4.3,
    coordinates: { latitude: 37.7795, longitude: -122.4240 },
    transactions: [],
    price: "$$$",
    location: {
      address1: "1550 Service Road",
      address2: "Unit B",
      address3: null,
      city: "Springfield",
      zip_code: "62707",
      country: "US",
      state: "IL",
      display_address: ["1550 Service Road", "Unit B", "Springfield, IL 62707"],
    },
    phone: "+12175556890",
    display_phone: "(217) 555-6890",
    distance: 3500,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0800", end: "1700", day: 0 },
        { is_overnight: false, start: "0800", end: "1700", day: 1 },
        { is_overnight: false, start: "0800", end: "1700", day: 2 },
        { is_overnight: false, start: "0800", end: "1700", day: 3 },
        { is_overnight: false, start: "0800", end: "1700", day: 4 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-clean-sweep-maids",
    alias: "clean-sweep-maids",
    name: "Clean Sweep Cleaning Service",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 203,
    categories: [{ alias: "homecleaning", title: "Home Cleaning" }, { alias: "homeservices", title: "Home Services" }],
    rating: 4.6,
    coordinates: { latitude: 37.7768, longitude: -122.4198 },
    transactions: [],
    price: "$$",
    location: {
      address1: "322 Willow Street",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62704",
      country: "US",
      state: "IL",
      display_address: ["322 Willow Street", "Springfield, IL 62704"],
    },
    phone: "+12175557901",
    display_phone: "(217) 555-7901",
    distance: 1700,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0700", end: "1800", day: 0 },
        { is_overnight: false, start: "0700", end: "1800", day: 1 },
        { is_overnight: false, start: "0700", end: "1800", day: 2 },
        { is_overnight: false, start: "0700", end: "1800", day: 3 },
        { is_overnight: false, start: "0700", end: "1800", day: 4 },
        { is_overnight: false, start: "0800", end: "1500", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-greenfield-landscaping",
    alias: "greenfield-landscaping",
    name: "Greenfield Landscaping",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 67,
    categories: [{ alias: "landscaping", title: "Landscaping" }, { alias: "homeservices", title: "Home Services" }],
    rating: 4.4,
    coordinates: { latitude: 37.7800, longitude: -122.4245 },
    transactions: [],
    price: "$$",
    location: {
      address1: "2000 Garden Way",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62707",
      country: "US",
      state: "IL",
      display_address: ["2000 Garden Way", "Springfield, IL 62707"],
    },
    phone: "+12175558012",
    display_phone: "(217) 555-8012",
    distance: 3800,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0700", end: "1800", day: 0 },
        { is_overnight: false, start: "0700", end: "1800", day: 1 },
        { is_overnight: false, start: "0700", end: "1800", day: 2 },
        { is_overnight: false, start: "0700", end: "1800", day: 3 },
        { is_overnight: false, start: "0700", end: "1800", day: 4 },
        { is_overnight: false, start: "0800", end: "1400", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },

  // ── Beauty & Spas ──
  {
    id: "local-serenity-day-spa",
    alias: "serenity-day-spa",
    name: "Serenity Day Spa",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 289,
    categories: [{ alias: "spas", title: "Day Spas" }, { alias: "beautysvc", title: "Beauty & Spas" }],
    rating: 4.7,
    coordinates: { latitude: 37.7753, longitude: -122.4178 },
    transactions: [],
    price: "$$$",
    location: {
      address1: "411 Tranquil Lane",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["411 Tranquil Lane", "Springfield, IL 62701"],
    },
    phone: "+12175559123",
    display_phone: "(217) 555-9123",
    distance: 900,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0900", end: "2000", day: 0 },
        { is_overnight: false, start: "0900", end: "2000", day: 1 },
        { is_overnight: false, start: "0900", end: "2000", day: 2 },
        { is_overnight: false, start: "0900", end: "2000", day: 3 },
        { is_overnight: false, start: "0900", end: "2100", day: 4 },
        { is_overnight: false, start: "0900", end: "2100", day: 5 },
        { is_overnight: false, start: "1000", end: "1800", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-style-studio-salon",
    alias: "style-studio-salon",
    name: "Style Studio Hair Salon",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 342,
    categories: [{ alias: "hair", title: "Hair Salons" }, { alias: "beautysvc", title: "Beauty & Spas" }],
    rating: 4.5,
    coordinates: { latitude: 37.7746, longitude: -122.4182 },
    transactions: [],
    price: "$$",
    location: {
      address1: "818 Fashion Boulevard",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["818 Fashion Boulevard", "Springfield, IL 62701"],
    },
    phone: "+12175550234",
    display_phone: "(217) 555-0234",
    distance: 650,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0900", end: "1900", day: 0 },
        { is_overnight: false, start: "0900", end: "1900", day: 1 },
        { is_overnight: false, start: "0900", end: "1900", day: 2 },
        { is_overnight: false, start: "0900", end: "1900", day: 3 },
        { is_overnight: false, start: "0900", end: "2000", day: 4 },
        { is_overnight: false, start: "0900", end: "2000", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-polished-nails",
    alias: "polished-nails",
    name: "Polished Nail Bar",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 178,
    categories: [{ alias: "nailtechnicians", title: "Nail Technicians" }, { alias: "beautysvc", title: "Beauty & Spas" }],
    rating: 4.3,
    coordinates: { latitude: 37.7741, longitude: -122.4190 },
    transactions: [],
    price: "$$",
    location: {
      address1: "255 Blossom Street",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62702",
      country: "US",
      state: "IL",
      display_address: ["255 Blossom Street", "Springfield, IL 62702"],
    },
    phone: "+12175551456",
    display_phone: "(217) 555-1456",
    distance: 800,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0930", end: "1900", day: 0 },
        { is_overnight: false, start: "0930", end: "1900", day: 1 },
        { is_overnight: false, start: "0930", end: "1900", day: 2 },
        { is_overnight: false, start: "0930", end: "1900", day: 3 },
        { is_overnight: false, start: "0930", end: "2000", day: 4 },
        { is_overnight: false, start: "0930", end: "2000", day: 5 },
        { is_overnight: false, start: "1000", end: "1800", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-glow-skincare",
    alias: "glow-skincare",
    name: "Glow Skincare Studio",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 124,
    categories: [{ alias: "skincare", title: "Skin Care" }, { alias: "beautysvc", title: "Beauty & Spas" }],
    rating: 4.8,
    coordinates: { latitude: 37.7756, longitude: -122.4172 },
    transactions: [],
    price: "$$$",
    location: {
      address1: "500 Wellness Drive",
      address2: "Suite 3A",
      address3: null,
      city: "Springfield",
      zip_code: "62704",
      country: "US",
      state: "IL",
      display_address: ["500 Wellness Drive", "Suite 3A", "Springfield, IL 62704"],
    },
    phone: "+12175552567",
    display_phone: "(217) 555-2567",
    distance: 1050,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1000", end: "1900", day: 0 },
        { is_overnight: false, start: "1000", end: "1900", day: 1 },
        { is_overnight: false, start: "1000", end: "1900", day: 2 },
        { is_overnight: false, start: "1000", end: "1900", day: 3 },
        { is_overnight: false, start: "1000", end: "2000", day: 4 },
        { is_overnight: false, start: "0900", end: "1800", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-barber-brothers",
    alias: "barber-brothers",
    name: "Barber Brothers",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 215,
    categories: [{ alias: "barbers", title: "Barbers" }, { alias: "beautysvc", title: "Beauty & Spas" }],
    rating: 4.6,
    coordinates: { latitude: 37.7765, longitude: -122.4202 },
    transactions: [],
    price: "$",
    location: {
      address1: "144 Heritage Row",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62703",
      country: "US",
      state: "IL",
      display_address: ["144 Heritage Row", "Springfield, IL 62703"],
    },
    phone: "+12175553678",
    display_phone: "(217) 555-3678",
    distance: 1350,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0800", end: "1800", day: 0 },
        { is_overnight: false, start: "0800", end: "1800", day: 1 },
        { is_overnight: false, start: "0800", end: "1800", day: 2 },
        { is_overnight: false, start: "0800", end: "1800", day: 3 },
        { is_overnight: false, start: "0800", end: "1900", day: 4 },
        { is_overnight: false, start: "0800", end: "1700", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },

  // ── Automotive ──
  {
    id: "local-summit-auto-repair",
    alias: "summit-auto-repair",
    name: "Summit Auto Repair",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 231,
    categories: [{ alias: "autorepair", title: "Auto Repair" }, { alias: "auto", title: "Automotive" }],
    rating: 4.6,
    coordinates: { latitude: 37.7785, longitude: -122.4235 },
    transactions: [],
    price: "$$",
    location: {
      address1: "1200 Motor Lane",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62706",
      country: "US",
      state: "IL",
      display_address: ["1200 Motor Lane", "Springfield, IL 62706"],
    },
    phone: "+12175554789",
    display_phone: "(217) 555-4789",
    distance: 2900,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0730", end: "1800", day: 0 },
        { is_overnight: false, start: "0730", end: "1800", day: 1 },
        { is_overnight: false, start: "0730", end: "1800", day: 2 },
        { is_overnight: false, start: "0730", end: "1800", day: 3 },
        { is_overnight: false, start: "0730", end: "1700", day: 4 },
        { is_overnight: false, start: "0800", end: "1400", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-quick-lube-express",
    alias: "quick-lube-express",
    name: "Quick Lube Express",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 156,
    categories: [{ alias: "oilchange", title: "Oil Change Stations" }, { alias: "auto", title: "Automotive" }],
    rating: 4.2,
    coordinates: { latitude: 37.7792, longitude: -122.4242 },
    transactions: [],
    price: "$",
    location: {
      address1: "3300 Highway Boulevard",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62707",
      country: "US",
      state: "IL",
      display_address: ["3300 Highway Boulevard", "Springfield, IL 62707"],
    },
    phone: "+12175555890",
    display_phone: "(217) 555-5890",
    distance: 3600,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0800", end: "1800", day: 0 },
        { is_overnight: false, start: "0800", end: "1800", day: 1 },
        { is_overnight: false, start: "0800", end: "1800", day: 2 },
        { is_overnight: false, start: "0800", end: "1800", day: 3 },
        { is_overnight: false, start: "0800", end: "1800", day: 4 },
        { is_overnight: false, start: "0800", end: "1500", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-elite-auto-detail",
    alias: "elite-auto-detail",
    name: "Elite Auto Detailing",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 98,
    categories: [{ alias: "autodetailing", title: "Auto Detailing" }, { alias: "auto", title: "Automotive" }],
    rating: 4.8,
    coordinates: { latitude: 37.7788, longitude: -122.4238 },
    transactions: [],
    price: "$$$",
    location: {
      address1: "1450 Sparkle Drive",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62706",
      country: "US",
      state: "IL",
      display_address: ["1450 Sparkle Drive", "Springfield, IL 62706"],
    },
    phone: "+12175556901",
    display_phone: "(217) 555-6901",
    distance: 3100,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0800", end: "1700", day: 0 },
        { is_overnight: false, start: "0800", end: "1700", day: 1 },
        { is_overnight: false, start: "0800", end: "1700", day: 2 },
        { is_overnight: false, start: "0800", end: "1700", day: 3 },
        { is_overnight: false, start: "0800", end: "1700", day: 4 },
        { is_overnight: false, start: "0900", end: "1500", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-tire-town",
    alias: "tire-town",
    name: "Tire Town",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 187,
    categories: [{ alias: "tires", title: "Tires" }, { alias: "auto", title: "Automotive" }],
    rating: 4.4,
    coordinates: { latitude: 37.7798, longitude: -122.4248 },
    transactions: [],
    price: "$$",
    location: {
      address1: "2750 Auto Mall Drive",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62707",
      country: "US",
      state: "IL",
      display_address: ["2750 Auto Mall Drive", "Springfield, IL 62707"],
    },
    phone: "+12175557012",
    display_phone: "(217) 555-7012",
    distance: 4000,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0730", end: "1800", day: 0 },
        { is_overnight: false, start: "0730", end: "1800", day: 1 },
        { is_overnight: false, start: "0730", end: "1800", day: 2 },
        { is_overnight: false, start: "0730", end: "1800", day: 3 },
        { is_overnight: false, start: "0730", end: "1800", day: 4 },
        { is_overnight: false, start: "0800", end: "1500", day: 5 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-sparkle-car-wash",
    alias: "sparkle-car-wash",
    name: "Sparkle Car Wash",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 245,
    categories: [{ alias: "carwash", title: "Car Wash" }, { alias: "auto", title: "Automotive" }],
    rating: 4.1,
    coordinates: { latitude: 37.7802, longitude: -122.4250 },
    transactions: [],
    price: "$",
    location: {
      address1: "3100 Rinse Road",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62707",
      country: "US",
      state: "IL",
      display_address: ["3100 Rinse Road", "Springfield, IL 62707"],
    },
    phone: "+12175558123",
    display_phone: "(217) 555-8123",
    distance: 4200,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0700", end: "2000", day: 0 },
        { is_overnight: false, start: "0700", end: "2000", day: 1 },
        { is_overnight: false, start: "0700", end: "2000", day: 2 },
        { is_overnight: false, start: "0700", end: "2000", day: 3 },
        { is_overnight: false, start: "0700", end: "2000", day: 4 },
        { is_overnight: false, start: "0700", end: "2000", day: 5 },
        { is_overnight: false, start: "0800", end: "1800", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },

  // ── More Restaurants (pizza, brunch, coffee, desserts, bars) for challenge categories ──
  {
    id: "local-stone-oven-pizza",
    alias: "stone-oven-pizza",
    name: "Stone Oven Pizzeria",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 356,
    categories: [{ alias: "pizza", title: "Pizza" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.5,
    coordinates: { latitude: 37.7743, longitude: -122.4186 },
    transactions: ["delivery", "pickup"],
    price: "$$",
    location: {
      address1: "628 Flour Mill Road",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["628 Flour Mill Road", "Springfield, IL 62701"],
    },
    phone: "+12175559234",
    display_phone: "(217) 555-9234",
    distance: 500,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1100", end: "2200", day: 0 },
        { is_overnight: false, start: "1100", end: "2200", day: 1 },
        { is_overnight: false, start: "1100", end: "2200", day: 2 },
        { is_overnight: false, start: "1100", end: "2200", day: 3 },
        { is_overnight: false, start: "1100", end: "2300", day: 4 },
        { is_overnight: false, start: "1100", end: "2300", day: 5 },
        { is_overnight: false, start: "1200", end: "2100", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-morning-glory-brunch",
    alias: "morning-glory-brunch",
    name: "Morning Glory Brunch House",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 189,
    categories: [{ alias: "breakfast_brunch", title: "Breakfast & Brunch" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.6,
    coordinates: { latitude: 37.7751, longitude: -122.4176 },
    transactions: ["pickup"],
    price: "$$",
    location: {
      address1: "901 Sunrise Avenue",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["901 Sunrise Avenue", "Springfield, IL 62701"],
    },
    phone: "+12175550345",
    display_phone: "(217) 555-0345",
    distance: 750,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0700", end: "1500", day: 0 },
        { is_overnight: false, start: "0700", end: "1500", day: 1 },
        { is_overnight: false, start: "0700", end: "1500", day: 2 },
        { is_overnight: false, start: "0700", end: "1500", day: 3 },
        { is_overnight: false, start: "0700", end: "1500", day: 4 },
        { is_overnight: false, start: "0700", end: "1600", day: 5 },
        { is_overnight: false, start: "0700", end: "1600", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-bean-there-coffee",
    alias: "bean-there-coffee",
    name: "Bean There Coffee Roasters",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 278,
    categories: [{ alias: "coffee", title: "Coffee & Tea" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.7,
    coordinates: { latitude: 37.7747, longitude: -122.4173 },
    transactions: ["pickup"],
    price: "$",
    location: {
      address1: "310 Brew Lane",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62701",
      country: "US",
      state: "IL",
      display_address: ["310 Brew Lane", "Springfield, IL 62701"],
    },
    phone: "+12175551567",
    display_phone: "(217) 555-1567",
    distance: 350,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "0530", end: "1900", day: 0 },
        { is_overnight: false, start: "0530", end: "1900", day: 1 },
        { is_overnight: false, start: "0530", end: "1900", day: 2 },
        { is_overnight: false, start: "0530", end: "1900", day: 3 },
        { is_overnight: false, start: "0530", end: "2000", day: 4 },
        { is_overnight: false, start: "0600", end: "2000", day: 5 },
        { is_overnight: false, start: "0700", end: "1700", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-sweet-retreat-desserts",
    alias: "sweet-retreat-desserts",
    name: "Sweet Retreat Dessert Bar",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 145,
    categories: [{ alias: "desserts", title: "Desserts" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.4,
    coordinates: { latitude: 37.7757, longitude: -122.4183 },
    transactions: ["delivery", "pickup"],
    price: "$$",
    location: {
      address1: "777 Sugar Lane",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62702",
      country: "US",
      state: "IL",
      display_address: ["777 Sugar Lane", "Springfield, IL 62702"],
    },
    phone: "+12175552678",
    display_phone: "(217) 555-2678",
    distance: 1000,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1100", end: "2200", day: 0 },
        { is_overnight: false, start: "1100", end: "2200", day: 1 },
        { is_overnight: false, start: "1100", end: "2200", day: 2 },
        { is_overnight: false, start: "1100", end: "2200", day: 3 },
        { is_overnight: false, start: "1100", end: "2300", day: 4 },
        { is_overnight: false, start: "1100", end: "2300", day: 5 },
        { is_overnight: false, start: "1200", end: "2100", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
  {
    id: "local-the-brass-tap",
    alias: "the-brass-tap",
    name: "The Brass Tap Tavern",
    image_url: "",
    is_closed: false,
    url: "",
    review_count: 312,
    categories: [{ alias: "bars", title: "Bars" }, { alias: "restaurants", title: "Restaurants" }],
    rating: 4.2,
    coordinates: { latitude: 37.7763, longitude: -122.4197 },
    transactions: [],
    price: "$$",
    location: {
      address1: "550 Nightlife Avenue",
      address2: null,
      address3: null,
      city: "Springfield",
      zip_code: "62703",
      country: "US",
      state: "IL",
      display_address: ["550 Nightlife Avenue", "Springfield, IL 62703"],
    },
    phone: "+12175553789",
    display_phone: "(217) 555-3789",
    distance: 1400,
    photos: [],
    hours: [{
      open: [
        { is_overnight: false, start: "1600", end: "0100", day: 0 },
        { is_overnight: false, start: "1600", end: "0100", day: 1 },
        { is_overnight: false, start: "1600", end: "0100", day: 2 },
        { is_overnight: false, start: "1600", end: "0100", day: 3 },
        { is_overnight: false, start: "1500", end: "0200", day: 4 },
        { is_overnight: false, start: "1200", end: "0200", day: 5 },
        { is_overnight: false, start: "1200", end: "2300", day: 6 },
      ],
      hours_type: "REGULAR",
      is_open_now: true,
    }],
  },
];

// Assign unique placeholder images to every seed business
for (const biz of FALLBACK_BUSINESSES) {
  biz.image_url = generatePlaceholderImage(biz.name, biz.categories);
}

// ===== SEED REVIEWS (for each business, a few realistic reviews) =====

const REVIEW_NAMES = [
  "Alex M.", "Jordan K.", "Taylor S.", "Morgan R.", "Casey W.",
  "Riley P.", "Jamie L.", "Dakota F.", "Quinn H.", "Avery B.",
  "Skyler T.", "Reese N.", "Drew C.", "Parker J.", "Hayden G.",
];

function generateReviewsForBusiness(businessId: string, businessName: string): YelpReview[] {
  // Deterministic seeding based on business ID
  let seed = 0;
  for (let i = 0; i < businessId.length; i++) seed += businessId.charCodeAt(i);

  const reviewTemplates = [
    { rating: 5, text: `Absolutely love ${businessName}! The quality is outstanding and the staff is incredibly friendly. Will definitely be coming back.` },
    { rating: 4, text: `Great experience overall. The service was prompt and professional. Only minor thing was the wait time, but totally worth it.` },
    { rating: 5, text: `This place is a hidden gem in Springfield! I've been coming here for months and it never disappoints. Highly recommend to anyone in the area.` },
    { rating: 4, text: `Really solid option in the neighborhood. The atmosphere is welcoming and the prices are fair for the quality you get.` },
    { rating: 3, text: `Decent experience. Nothing extraordinary but nothing bad either. Would come back if I'm in the area.` },
  ];

  return reviewTemplates.slice(0, 3).map((template, i) => {
    const nameIdx = (seed + i) % REVIEW_NAMES.length;
    const daysAgo = ((seed + i * 7) % 60) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      id: `fallback-review-${businessId}-${i}`,
      rating: template.rating,
      user: {
        id: `fallback-user-${nameIdx}`,
        profile_url: "",
        image_url: null,
        name: REVIEW_NAMES[nameIdx],
      },
      text: template.text,
      time_created: date.toISOString().split("T")[0] + " " + "12:00:00",
      url: "",
    };
  });
}

// ===== FALLBACK FUNCTIONS =====

export function fallbackSearch(params: {
  term?: string;
  categories?: string;
  sort_by?: string;
  limit?: number;
  offset?: number;
}): YelpSearchResponse {
  let results = [...FALLBACK_BUSINESSES];

  // Filter by category
  if (params.categories) {
    const requestedCat = params.categories.toLowerCase();
    const allowedAliases = CATEGORY_MAP[requestedCat] || [requestedCat];

    results = results.filter(b =>
      b.categories.some(c => allowedAliases.includes(c.alias))
    );
  }

  // Filter by search term
  if (params.term) {
    const term = params.term.toLowerCase();
    results = results.filter(b =>
      b.name.toLowerCase().includes(term) ||
      b.categories.some(c => c.title.toLowerCase().includes(term) || c.alias.toLowerCase().includes(term))
    );
  }

  // Sort
  switch (params.sort_by) {
    case "rating":
      results.sort((a, b) => b.rating - a.rating);
      break;
    case "review_count":
      results.sort((a, b) => b.review_count - a.review_count);
      break;
    case "distance":
      results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
      break;
    default:
      // best_match — keep default order (a mix of rating and relevance)
      results.sort((a, b) => (b.rating * b.review_count) - (a.rating * a.review_count));
      break;
  }

  const offset = params.offset ?? 0;
  const limit = params.limit ?? 20;
  const sliced = results.slice(offset, offset + limit);

  return {
    businesses: sliced,
    total: results.length,
    region: {
      center: { longitude: -122.4194, latitude: 37.7749 },
    },
  };
}

export function fallbackGetDetails(yelpId: string): YelpBusinessDetails | null {
  return FALLBACK_BUSINESSES.find(b => b.id === yelpId) ?? null;
}

export function fallbackGetReviews(yelpId: string): YelpReviewsResponse {
  const biz = FALLBACK_BUSINESSES.find(b => b.id === yelpId);
  if (!biz) {
    return { reviews: [], total: 0, possible_languages: ["en"] };
  }
  const reviews = generateReviewsForBusiness(biz.id, biz.name);
  return {
    reviews,
    total: reviews.length,
    possible_languages: ["en"],
  };
}

export function fallbackAutocomplete(params: { text: string }): {
  terms: Array<{ text: string }>;
  businesses: Array<{ id: string; name: string }>;
  categories: Array<{ alias: string; title: string }>;
} {
  const text = params.text.toLowerCase();

  const matchedBusinesses = FALLBACK_BUSINESSES
    .filter(b => b.name.toLowerCase().includes(text))
    .slice(0, 5)
    .map(b => ({ id: b.id, name: b.name }));

  const allCategories = new Map<string, string>();
  FALLBACK_BUSINESSES.forEach(b => {
    b.categories.forEach(c => {
      if (c.title.toLowerCase().includes(text) || c.alias.toLowerCase().includes(text)) {
        allCategories.set(c.alias, c.title);
      }
    });
  });

  return {
    terms: matchedBusinesses.length > 0 ? [{ text: params.text }] : [],
    businesses: matchedBusinesses,
    categories: Array.from(allCategories.entries()).slice(0, 5).map(([alias, title]) => ({ alias, title })),
  };
}
