import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Search, MapPin, Star, Heart, Phone, ExternalLink, TrendingUp, Building2, Users, Award, ArrowRight, User, ChevronDown, LogOut, Trophy } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE, getLoginUrl } from "@/const";

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

const CATEGORIES = [
  { value: "restaurants", label: "Restaurants" },
  { value: "shopping", label: "Shopping" },
  { value: "homeservices", label: "Home Services" },
  { value: "beautysvc", label: "Beauty & Spas" },
  { value: "auto", label: "Automotive" },
];

// Calculate distance between two coordinates using Haversine formula
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

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"best_match" | "rating" | "review_count" | "distance">("best_match");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [pendingSearch, setPendingSearch] = useState(false);

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
      ...(location ? { latitude: location.lat, longitude: location.lng } : {}),
      ...(locationName && !location ? { location: locationName } : {}),
      ...(searchTerm ? { term: searchTerm } : {}),
      ...(category && category !== "all" ? { categories: category } : {}),
      sort_by: sortBy,
      limit: 20,
    };
  }, [location, locationName, searchTerm, category, sortBy]);

  const { data: businesses, isLoading, error } = trpc.business.search.useQuery(searchParams, {
    enabled: showSearch && (!!searchTerm || !!location || !!locationName),
  });

  // Trigger search when location is set after pending search
  useEffect(() => {
    if (pendingSearch && location) {
      setShowSearch(true);
      setPendingSearch(false);
    }
  }, [location, pendingSearch]);

  const handleSearch = () => {
    // If no location is provided, automatically use geolocation
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Building2 className="w-6 h-6 text-primary" />
              {APP_TITLE}
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/trending" className="text-gray-600 hover:text-gray-900 font-medium transition">
                Trending
              </Link>
              <Link href="/deals" className="text-gray-600 hover:text-gray-900 font-medium transition">
                Deals
              </Link>
              <Link href="/community-reviews" className="text-gray-600 hover:text-gray-900 font-medium transition">
                Reviews
              </Link>
              <Link href="/favorites" className="text-gray-600 hover:text-gray-900 font-medium transition">
                Favorites
              </Link>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <User className="w-4 h-4" />
                      {user?.name || "User"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/badges" className="flex items-center cursor-pointer">
                        <Trophy className="w-4 h-4 mr-2" />
                        View Badges
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout.mutate()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="default" asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="container py-20">
            {!isAuthenticated && (
              <div className="text-center mb-8">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400/30 px-4 py-2 text-sm font-medium">
                  ✨ Create an account to save favorites and get personalized recommendations
                </Badge>
              </div>
            )}
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Discover and Support<br />
              <span className="text-blue-400">Local Businesses</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Connect with amazing small businesses in your community.<br />
              Find local gems, read reviews, and help your neighborhood thrive.
            </p>

            {/* Search Box */}
            <div className="bg-white rounded-lg shadow-2xl p-6 mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  placeholder="What are you looking for?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="text-gray-900 h-12"
                />
                <div className="relative">
                  <Input
                    placeholder="Location (or use current location)"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="text-gray-900 h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
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
                          (error) => {
                            toast.error("Could not get your location. Please enter manually.");
                          }
                        );
                      } else {
                        toast.error("Geolocation is not supported by your browser.");
                      }
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                <Select value={category || undefined} onValueChange={setCategory}>
                  <SelectTrigger className="w-full md:w-48 text-gray-900">
                    <SelectValue placeholder="All Categories" />
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
                  <SelectTrigger className="w-full md:w-48 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best_match">Best Match</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="review_count">Most Reviewed</SelectItem>
                    <SelectItem value="distance">Nearest</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleSearch} className="w-full md:w-auto h-12 px-8" size="lg">
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
        <div className="py-20 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose BizBloom?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The premier platform for discovering and supporting local businesses in your community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center p-8 border-2 hover:border-primary transition-colors">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl mb-3">FIND LOCAL COMMUNITIES</CardTitle>
                  <CardDescription className="text-base">
                    Discover hidden gems and connect with businesses that make your neighborhood unique. Support local entrepreneurs and build stronger communities.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center p-8 border-2 hover:border-primary transition-colors">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl mb-3">TRENDING INSIGHTS</CardTitle>
                  <CardDescription className="text-base">
                    Stay ahead with real-time trending businesses and personalized recommendations based on your preferences and community activity.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center p-8 border-2 hover:border-primary transition-colors">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl mb-3">TRUSTED REVIEWS</CardTitle>
                  <CardDescription className="text-base">
                    Read authentic reviews from real community members. Share your experiences and help others make informed decisions.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button size="lg" className="px-8 py-6 text-lg" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
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
                <Card key={i}>
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
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-600">Try adjusting your search or location</p>
            </div>
          )}

          {!isLoading && businesses && businesses.businesses && businesses.businesses.length > 0 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Found {businesses.businesses.length} {businesses.businesses.length === 1 ? "business" : "businesses"}
              </h2>
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
    <Card className="cursor-pointer hover:shadow-xl transition-shadow overflow-hidden" onClick={onClick}>
      <div className="relative">
        <img
          src={business.image_url || "/placeholder-business.jpg"}
          alt={business.name}
          className="w-full h-48 object-cover"
        />
        {isAuthenticated && (
          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-2 right-2 ${isFavorited ? "bg-red-500 hover:bg-red-600" : "bg-white"}`}
            onClick={handleFavoriteClick}
          >
            <Heart className={`h-5 w-5 ${isFavorited ? "fill-white text-white" : "text-gray-700"}`} />
          </Button>
        )}
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1">{business.name}</CardTitle>
        <CardDescription className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 font-semibold text-gray-900">{business.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-500">({business.review_count} reviews)</span>
            {business.price && <span className="font-semibold text-green-600">{business.price}</span>}
          </div>
          {userLocation && business.coordinates && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-3 h-3" />
              <span>{calculateDistance(userLocation.lat, userLocation.lng, business.coordinates.latitude, business.coordinates.longitude).toFixed(1)} mi away</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {business.categories.slice(0, 2).map((cat) => (
              <Badge key={cat.alias} variant="secondary" className="text-xs">
                {cat.title}
              </Badge>
            ))}
          </div>
        </CardDescription>
      </CardHeader>

      <CardFooter className="text-sm text-gray-600">
        <MapPin className="w-4 h-4 mr-1" />
        <span className="line-clamp-1">
          {business.location.address1}, {business.location.city}, {business.location.state}
        </span>
      </CardFooter>
    </Card>
  );
}

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Loading Business Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
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
              <Button onClick={onClose} className="mt-4">Close</Button>
            </div>
          </>
        ) : details ? (
          <>
            <DialogHeader>
              <img
                src={details.image_url || "/placeholder-business.jpg"}
                alt={details.name}
                className="w-full h-64 object-cover rounded-md mb-4"
              />
              <DialogTitle className="text-3xl">{details.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-lg font-semibold text-gray-900">
                      {details.rating.toFixed(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const reviewsSection = document.getElementById("reviews-section");
                      reviewsSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    ({details.review_count} reviews)
                  </button>
                  {details.price && <span className="text-lg font-semibold text-green-600">{details.price}</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {details.categories.map((cat: any) => (
                    <Badge key={cat.alias} variant="secondary">
                      {cat.title}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2 text-gray-700">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 mt-0.5" />
                    <span>{details.location.display_address?.join(", ")}</span>
                  </div>
                  {details.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      <span>{details.phone}</span>
                    </div>
                  )}
                </div>

                {details.hours && details.hours[0] && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-semibold text-gray-900 mb-2">Hours</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {details.hours[0].open.map((hour: any, index: number) => (
                        <div key={index}>
                          <span className="font-medium">
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
                  <Button asChild className="flex-1">
                    <a href={details.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Yelp
                    </a>
                  </Button>
                  {isAuthenticated && !myReview && (
                    <Button onClick={() => setShowReviewDialog(true)} className="flex-1">
                      Write a Review
                    </Button>
                  )}
                </div>

                {/* Review Dialog */}
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                  <DialogContent>
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
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
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
                          onChange={(e) => setComment(e.target.value)}
                          rows={5}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={createReview.isPending}
                        className="w-full"
                      >
                        {createReview.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Community Reviews */}
                {userReviews && userReviews.length > 0 && (
                  <div id="reviews-section" className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Community Reviews</h4>
                    <div className="space-y-3">
                      {userReviews.map((review: any) => (
                        <div key={review.id} className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium text-gray-900">{review.userName}</span>
                          </div>
                          {review.comment && <p className="text-gray-700">{review.comment}</p>}
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