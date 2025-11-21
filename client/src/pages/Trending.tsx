import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Star, MapPin, Sparkles, Trophy, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Trending() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: trending, isLoading: trendingLoading } = trpc.business.trending.useQuery();
  const { data: recommendations, isLoading: recommendationsLoading } = trpc.business.recommendations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: leaderboard, isLoading: leaderboardLoading } = trpc.business.leaderboard.useQuery({});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12">
        <div className="container">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Trending & Recommendations</h1>
          </div>
          <p className="text-gray-300">
            Discover what's hot and get personalized suggestions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recommendations" disabled={!isAuthenticated}>
              <Sparkles className="w-4 h-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Top Rated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Trending Now</h2>
              <p className="text-gray-600">
                Most popular businesses based on recent community activity
              </p>
            </div>

            {trendingLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full rounded-md" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {!trendingLoading && trending && trending.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No trending businesses yet
                </h3>
                <p className="text-gray-600">
                  Start exploring and favoriting businesses to see trends!
                </p>
              </div>
            )}

            {!trendingLoading && trending && trending.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trending.map((business, index) => (
                  <BusinessCard key={business.id} business={business} rank={index + 1} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended For You</h2>
              <p className="text-gray-600">
                Personalized suggestions based on your favorites
              </p>
            </div>

            {recommendationsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full rounded-md" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {!recommendationsLoading && recommendations && recommendations.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Start Building Your Recommendations
                </h3>
                <p className="text-gray-600 mb-4">
                  Favorite 3-5 businesses you love to get personalized recommendations based on your preferences!
                </p>
                <Button onClick={() => setLocation("/")} className="mt-4">
                  Explore Businesses
                </Button>
              </div>
            )}

            {!recommendationsLoading && recommendations && recommendations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Top Rated Businesses</h2>
              <p className="text-gray-600">
                Highest-rated businesses in the community
              </p>
            </div>

            {leaderboardLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full rounded-md" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {!leaderboardLoading && leaderboard && leaderboard.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No businesses yet
                </h3>
                <p className="text-gray-600">
                  Search for businesses to see the leaderboard!
                </p>
              </div>
            )}

            {!leaderboardLoading && leaderboard && leaderboard.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaderboard.map((business, index) => (
                  <BusinessCard key={business.id} business={business} rank={index + 1} showTrophy />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BusinessCard({ business, rank, showTrophy }: { business: any; rank?: number; showTrophy?: boolean }) {
  const categories = business.categories ? JSON.parse(business.categories) : [];
  const rating = business.rating / 10;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow relative">
      {rank && (
        <div className={`absolute top-2 left-2 z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
          rank === 1 ? "bg-yellow-500" :
          rank === 2 ? "bg-gray-400" :
          rank === 3 ? "bg-amber-600" :
          "bg-purple-600"
        }`}>
          {showTrophy && rank <= 3 ? <Trophy className="w-5 h-5" /> : `#${rank}`}
        </div>
      )}

      <img
        src={business.imageUrl || "/placeholder-business.jpg"}
        alt={business.name}
        className="w-full h-48 object-cover"
      />

      <CardHeader>
        <CardTitle className="line-clamp-1">{business.name}</CardTitle>
        <CardDescription className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 font-semibold text-gray-900">{rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-500">({business.reviewCount} reviews)</span>
            {business.price && (
              <span className="font-semibold text-green-600">{business.price}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((cat: any) => (
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
          {business.address}, {business.city}, {business.state}
        </span>
      </CardFooter>
    </Card>
  );
}
