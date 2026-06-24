/**
 * Home.tsx — Main landing page with hero section and business search.
 *
 * Features:
 *  - Hero section with search bar, location input, category/sort filters
 *  - Browser geolocation for automatic location detection
 *  - Business result cards with ratings, distance, favorites, and categories
 *  - Business details dialog with reviews, hours, and "Write a Review" flow
 *  - Feature showcase section for first-time visitors
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Search, MapPin, Star, Heart, Phone, ExternalLink, TrendingUp, Users, Award, ArrowRight, Zap, Globe, Shield, List, Map, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { MapView } from "@/components/Map";
import { useSearchContext } from "@/contexts/SearchContext";

/** Shape of a business object returned from the Yelp search API */
interface Business {
  id: string;
  name: string;
  image_url?: string;
  rating: number;
  review_count: number;
  price?: string;
  categories: Array<{ alias: string; title: string }>;
  location: {
    address1?: string;
    city?: string;
    state?: string;
    display_address?: string[];
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Available business categories for the search filter dropdown
const CATEGORIES = [
  { value: "restaurants", label: "Restaurants" },
  { value: "shopping", label: "Shopping" },
  { value: "homeservices", label: "Home Services" },
  { value: "beautysvc", label: "Beauty & Spas" },
  { value: "auto", label: "Automotive" },
];

/**
 * Calculates the distance between two geographic coordinates using the
 * Haversine formula. Returns the distance in miles.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Category → marker colour mapping for color-coded map pins */
const CATEGORY_COLORS: Record<string, string> = {
  restaurants: "#ef4444",
  coffee: "#b45309",
  bakeries: "#d97706",
  desserts: "#ec4899",
  bars: "#7c3aed",
  shopping: "#0891b2",
  beautysvc: "#db2777",
  auto: "#374151",
  homeservices: "#065f46",
};

function getCategoryColor(categories: Array<{ alias: string; title: string }> = []) {
  for (const cat of categories) {
    if (CATEGORY_COLORS[cat.alias]) return CATEGORY_COLORS[cat.alias];
  }
  return "#6d28d9"; // default violet
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { setNearbyBusinesses } = useSearchContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"best_match" | "rating" | "review_count" | "distance">("best_match");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [pendingSearch, setPendingSearch] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  const searchParams = useMemo(() => {
    return {
      // Typed location always wins over auto-detected GPS coords
      ...(locationName
        ? { location: locationName }
        : location
        ? { latitude: location.lat, longitude: location.lng }
        : {}),
      ...(searchTerm ? { term: searchTerm } : {}),
      ...(category && category !== "all" ? { categories: category } : {}),
      sort_by: sortBy,
      limit: 20,
    };
  }, [location, locationName, searchTerm, category, sortBy]);

  const { data: businesses, isLoading, error } = trpc.business.search.useQuery(searchParams, {
    enabled: showSearch && (!!searchTerm || !!location || !!locationName),
  });

  // Push search results to context so HelpPanel AI can reference them
  useEffect(() => {
    if (businesses?.businesses) {
      setNearbyBusinesses(
        businesses.businesses.slice(0, 8).map((b: any) => ({
          name: b.name,
          categories: JSON.stringify(b.categories ?? []),
          rating: b.rating ?? 0,
          distance: b.distance ? b.distance / 1609.34 : undefined, // metres → miles
          hasDeals: false,
        }))
      );
    }
  }, [businesses, setNearbyBusinesses]);

  /** Drop color-coded pins on the map whenever businesses update */
  const placeMapPins = useCallback(() => {
    const map = mapRef.current;
    if (!map || !businesses?.businesses) return;

    // Clear old markers
    for (const m of markersRef.current) (m as any).map = null;
    markersRef.current = [];

    for (const biz of businesses.businesses) {
      if (!biz.coordinates?.latitude || !biz.coordinates?.longitude) continue;
      const color = getCategoryColor(biz.categories ?? []);

      const pin = document.createElement("div");
      pin.style.cssText = `width:32px;height:32px;border-radius:50% 50% 50% 0;background:${color};border:2px solid white;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;`;
      const inner = document.createElement("div");
      inner.style.cssText = "transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%;";
      inner.textContent = "★";
      inner.style.fontSize = "12px";
      inner.style.color = "white";
      pin.appendChild(inner);

      const marker = new (window as any).google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: biz.coordinates.latitude, lng: biz.coordinates.longitude },
        title: biz.name,
        content: pin,
      });

      marker.addListener("click", () => setSelectedBusiness(biz));
      markersRef.current.push(marker);
    }

    // Fit bounds to show all pins
    if (markersRef.current.length > 0 && (window as any).google) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      for (const biz of businesses.businesses) {
        if (biz.coordinates?.latitude && biz.coordinates?.longitude) {
          bounds.extend({ lat: biz.coordinates.latitude, lng: biz.coordinates.longitude });
        }
      }
      map.fitBounds(bounds, 60);
    }
  }, [businesses]);

  useEffect(() => {
    if (pendingSearch && location) {
      setShowSearch(true);
      setPendingSearch(false);
    }
  }, [location, pendingSearch]);

  const handleSearch = () => {
    if (!location && !locationName) {
      if ("geolocation" in navigator) {
        toast.info("Using your current location...");
        setPendingSearch(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            setPendingSearch(false);
            toast.error("Could not get your location. Please enter a location manually.");
            console.log("Geolocation error:", error);
          }
        );
      } else {
        toast.error("Geolocation is not supported. Please enter a location manually.");
      }
    } else {
      setShowSearch(true);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-gradient text-white relative">
        {/* Floating decorative blobs */}
        <div className="blob w-72 h-72 bg-violet-500 top-10 -left-20 animate-float" />
        <div className="blob w-96 h-96 bg-indigo-500 -bottom-20 right-10 animate-float-delayed" />
        <div className="blob w-48 h-48 bg-pink-500 top-1/2 left-1/3 opacity-20 animate-float" />

        <div className="container py-24 relative z-10">
          {!isAuthenticated && (
            <div className="text-center mb-8 animate-slide-up">
              <Badge className="bg-white/10 text-violet-200 border-violet-400/30 px-5 py-2.5 text-sm font-medium backdrop-blur-sm hover:bg-white/15 transition">
                Create an account to save favorites and get personalized recommendations
              </Badge>
            </div>
          )}

          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight animate-slide-up tracking-tight">
              Discover & Support<br />
              <span className="text-gradient">Local Businesses</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300/90 mb-10 leading-relaxed max-w-2xl mx-auto animate-slide-up-delayed">
              Connect with amazing small businesses in your community.
              Find local gems, read reviews, and help your neighborhood thrive.
            </p>

            {/* Search Box - Glassmorphism */}
            <div className="glass-dark rounded-2xl p-6 md:p-8 mt-4 animate-slide-up-delayed-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="search-term" className="sr-only">Search term</label>
                  <Input
                    id="search-term"
                    placeholder="What are you looking for?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12 rounded-xl focus:ring-violet-400 focus:border-violet-400"
                    aria-label="Search for businesses"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="search-location" className="sr-only">Location</label>
                  <Input
                    id="search-location"
                    placeholder="Location (or use current)"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12 pr-12 rounded-xl focus:ring-violet-400 focus:border-violet-400"
                    aria-label="Enter location"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setLocation({
                              lat: position.coords.latitude,
                              lng: position.coords.longitude,
                            });
                            setLocationName("");
                            toast.success("Location detected!");
                          },
                          () => {
                            toast.error("Could not get your location.");
                          }
                        );
                      }
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 items-center">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_match">Best Match</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="review_count">Most Reviewed</SelectItem>
                    <SelectItem value="distance">Nearest</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleSearch}
                  className="w-full md:w-auto h-11 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30 btn-shimmer font-semibold"
                  size="lg"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      {!showSearch && (
        <div className="py-24 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

          <div className="container relative z-10">
            <div className="text-center mb-16">
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 mb-4 px-4 py-1.5">
                Why Choose BizBloom?
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
                The platform for<br />
                <span className="text-gradient">community discovery</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Everything you need to discover, support, and connect with the businesses that make your neighborhood special.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-hover text-center p-8 border-0 shadow-lg shadow-violet-100/50 bg-gradient-to-br from-white to-violet-50/50 rounded-2xl group">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <CardHeader className="p-0">
                  <CardTitle className="text-xl mb-3 font-bold">Find Local Communities</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Discover hidden gems and connect with businesses that make your neighborhood unique. Support local entrepreneurs.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover text-center p-8 border-0 shadow-lg shadow-indigo-100/50 bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl group">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardHeader className="p-0">
                  <CardTitle className="text-xl mb-3 font-bold">Trending Insights</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Stay ahead with real-time trending businesses and personalized recommendations based on community activity.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover text-center p-8 border-0 shadow-lg shadow-purple-100/50 bg-gradient-to-br from-white to-purple-50/50 rounded-2xl group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardHeader className="p-0">
                  <CardTitle className="text-xl mb-3 font-bold">Trusted Reviews</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Read authentic reviews from real community members. Share your experiences and help others.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="text-center mt-14">
              <Button
                size="lg"
                className="px-10 py-6 text-lg rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-xl shadow-violet-500/25 btn-shimmer font-semibold"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Start Exploring Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showSearch && (
        <div className="container py-12">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="rounded-2xl overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Error: {error.message}</p>
            </div>
          )}

          {!isLoading && businesses && businesses.businesses && businesses.businesses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-500">Try adjusting your search or location</p>
            </div>
          )}

          {!isLoading && businesses && businesses.businesses && businesses.businesses.length > 0 && (
            <>
              {/* Results Header with map/list toggle */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Found {businesses.businesses.length} {businesses.businesses.length === 1 ? "business" : "businesses"}
                  </h2>
                </div>

                {/* Map / List toggle */}
                <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === "list"
                        ? "bg-violet-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                    List
                  </button>
                  <button
                    onClick={() => { setViewMode("map"); setTimeout(placeMapPins, 100); }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === "map"
                        ? "bg-violet-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                    aria-label="Map view"
                  >
                    <Map className="w-4 h-4" />
                    Map
                  </button>
                </div>
              </div>

              {/* List View */}
              {viewMode === "list" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businesses.businesses.map((business: any) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      onClick={() => setSelectedBusiness(business)}
                      isAuthenticated={isAuthenticated}
                      userLocation={location}
                    />
                  ))}
                </div>
              )}

              {/* Map View */}
              {viewMode === "map" && (
                <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100" style={{ height: 560 }}>
                  <MapView
                    initialCenter={location ?? { lat: 37.7749, lng: -122.4194 }}
                    initialZoom={13}
                    className="w-full h-full"
                    onMapReady={(map) => {
                      mapRef.current = map;
                      placeMapPins();
                    }}
                  />
                </div>
              )}

              {/* Category legend for map */}
              {viewMode === "map" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([alias, color]) => (
                    <span key={alias} className="flex items-center gap-1.5 text-xs text-gray-600 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-100">
                      <span style={{ background: color, width: 10, height: 10, borderRadius: "50%", display: "inline-block" }} />
                      {alias.charAt(0).toUpperCase() + alias.slice(1)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Business Details Dialog */}
      {selectedBusiness && (
        <BusinessDetailsDialog
          business={selectedBusiness}
          open={!!selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}

/**
 * BusinessCard — Displays a single business result with image, rating,
 * price, categories, distance, and a favorite heart button.
 */
function BusinessCard({
  business,
  onClick,
  isAuthenticated,
  userLocation,
}: {
  business: Business;
  onClick: () => void;
  isAuthenticated: boolean;
  userLocation: { lat: number; lng: number } | null;
}) {
  const utils = trpc.useUtils();

  const { data: favoriteData } = trpc.favorites.check.useQuery(
    { yelpId: business.id },
    { enabled: isAuthenticated }
  );

  const isFavorited = favoriteData?.isFavorite || false;

  const addFavorite = trpc.favorites.add.useMutation({
    onSuccess: () => {
      toast.success("Added to favorites!");
      utils.favorites.check.invalidate({ yelpId: business.id });
      utils.favorites.list.invalidate();
      utils.gamification.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from favorites");
      utils.favorites.check.invalidate({ yelpId: business.id });
      utils.favorites.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please sign in to save favorites");
      return;
    }

    if (isFavorited) {
      removeFavorite.mutate({ yelpId: business.id });
    } else {
      addFavorite.mutate({ yelpId: business.id });
    }
  };

  return (
    <Card className="card-hover cursor-pointer overflow-hidden rounded-2xl border-0 shadow-md group" onClick={onClick}>
      <div className="relative overflow-hidden">
        <img
          src={business.image_url || "/placeholder-business.jpg"}
          alt={business.name}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isAuthenticated && (
          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-3 right-3 rounded-full shadow-lg transition-all ${
              isFavorited
                ? "bg-gradient-to-br from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 border-0"
                : "bg-white/90 hover:bg-white backdrop-blur-sm"
            }`}
            onClick={handleFavoriteClick}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? "fill-white text-white" : "text-gray-700"}`} />
          </Button>
        )}
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1 text-lg">{business.name}</CardTitle>
        <CardDescription className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-amber-50 px-2 py-0.5 rounded-lg">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-bold text-amber-700 text-sm">{business.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-400 text-sm">({business.review_count})</span>
            {business.price && <span className="font-semibold text-emerald-600 text-sm">{business.price}</span>}
          </div>
          {userLocation && business.coordinates && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{calculateDistance(userLocation.lat, userLocation.lng, business.coordinates.latitude, business.coordinates.longitude).toFixed(1)} mi away</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {business.categories.slice(0, 2).map((cat) => (
              <Badge key={cat.alias} variant="secondary" className="text-xs rounded-lg bg-violet-50 text-violet-700 border-violet-100">
                {cat.title}
              </Badge>
            ))}
          </div>
        </CardDescription>
      </CardHeader>

      <CardFooter className="text-sm text-gray-500 pt-0">
        <MapPin className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
        <span className="line-clamp-1">
          {business.location.address1}, {business.location.city}, {business.location.state}
        </span>
      </CardFooter>
    </Card>
  );
}

/**
 * BusinessDetailsDialog — Modal dialog showing full business details
 * including photos, hours, contact info, Yelp reviews, community reviews,
 * and a form to write your own review.
 */
function BusinessDetailsDialog({
  business,
  open,
  onClose,
  isAuthenticated,
}: {
  business: Business;
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();

  const { data: details, isLoading, error } = trpc.business.details.useQuery(
    { yelpId: business.id },
    { enabled: open }
  );

  const { data: myReview } = trpc.reviews.myReview.useQuery(
    { yelpId: business.id },
    { enabled: open && isAuthenticated }
  );

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setShowReviewDialog(false);
      setComment("");
      setRating(5);
      utils.reviews.list.invalidate({ yelpId: business.id });
      utils.reviews.myReview.invalidate({ yelpId: business.id });
      utils.gamification.stats.invalidate();
      utils.gamification.myBadges.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmitReview = () => {
    createReview.mutate({
      yelpId: business.id,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const { data: yelpReviews } = trpc.business.yelpReviews.useQuery(
    { yelpId: business.id },
    { enabled: open }
  );

  const { data: userReviews } = trpc.reviews.list.useQuery(
    { yelpId: business.id },
    { enabled: open }
  );

  // Community Pulse — AI-generated "what locals say" summary
  const { data: pulse } = trpc.business.summarizeReviews.useQuery(
    { yelpId: business.id },
    { enabled: open, staleTime: 5 * 60 * 1000 }
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
        {isLoading ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Loading Business Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </>
        ) : error ? (
          <>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <p className="text-red-600">Unable to load business details. This business may no longer be available.</p>
              <Button onClick={onClose} className="mt-4 rounded-xl">Close</Button>
            </div>
          </>
        ) : details ? (
          <>
            <DialogHeader>
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={details.image_url || "/placeholder-business.jpg"}
                  alt={details.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <DialogTitle className="text-3xl mt-4 font-bold">{details.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-amber-50 px-3 py-1 rounded-xl">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="ml-1.5 text-lg font-bold text-amber-700">
                      {details.rating.toFixed(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const reviewsSection = document.getElementById("reviews-section");
                      reviewsSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-violet-600 hover:text-violet-800 hover:underline cursor-pointer font-medium"
                  >
                    ({details.review_count} reviews)
                  </button>
                  {details.price && <span className="text-lg font-semibold text-emerald-600">{details.price}</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {details.categories.map((cat: any) => (
                    <Badge key={cat.alias} className="bg-violet-100 text-violet-700 rounded-lg border-violet-200">
                      {cat.title}
                    </Badge>
                  ))}
                </div>

                {/* Community Pulse — AI review summary */}
                {pulse && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 ${
                    pulse.sentiment === "positive" ? "bg-emerald-50 border border-emerald-100" :
                    pulse.sentiment === "mixed" ? "bg-amber-50 border border-amber-100" :
                    "bg-gray-50 border border-gray-100"
                  }`}>
                    <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${
                      pulse.sentiment === "positive" ? "text-emerald-500" :
                      pulse.sentiment === "mixed" ? "text-amber-500" : "text-gray-400"
                    }`} />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                        Community Pulse · {pulse.reviewCount} local reviews
                      </p>
                      <p className="text-sm font-medium text-gray-800">{pulse.summary}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 mt-0.5 text-violet-400" />
                    <span>{details.location.display_address?.join(", ")}</span>
                  </div>
                  {details.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-violet-400" />
                      <span>{details.phone}</span>
                    </div>
                  )}
                </div>

                {details.hours && details.hours[0] && (
                  <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100">
                    <h4 className="font-bold text-gray-900 mb-2">Hours</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {details.hours[0].open.map((hour: any, index: number) => (
                        <div key={index}>
                          <span className="font-medium text-violet-700">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][hour.day]}:
                          </span>{" "}
                          {hour.start.slice(0, 2)}:{hour.start.slice(2)} - {hour.end.slice(0, 2)}:
                          {hour.end.slice(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {details.url && (
                    <Button asChild className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500">
                      <a href={details.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Yelp
                      </a>
                    </Button>
                  )}
                  {isAuthenticated && !myReview && (
                    <Button onClick={() => setShowReviewDialog(true)} className="flex-1 rounded-xl" variant="outline">
                      Write a Review
                    </Button>
                  )}
                </div>

                {/* Review Dialog */}
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Write a Review</DialogTitle>
                      <DialogDescription>Share your experience at {details.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRating(star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                              aria-label={`Rate ${star} out of 5 stars`}
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Your Review (Optional)</label>
                        <textarea
                          placeholder="Tell us about your experience..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value.slice(0, 5000))}
                          rows={5}
                          maxLength={5000}
                          className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none"
                        />
                        <p className="text-xs text-gray-500 text-right">{comment.length}/5000</p>
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={createReview.isPending}
                        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600"
                      >
                        {createReview.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Community Reviews */}
                {userReviews && userReviews.length > 0 && (
                  <div id="reviews-section" className="mt-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Community Reviews</h4>
                    <div className="space-y-3">
                      {userReviews.map((review: any) => (
                        <div key={review.id} className="bg-violet-50/50 p-4 rounded-xl border border-violet-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-semibold text-gray-900">{review.userName}</span>
                          </div>
                          {review.comment && <p className="text-gray-600">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
