/**
 * Trending.tsx — Trending businesses, recommendations, and leaderboard.
 *
 * Three tabs:
 *  1. Trending   — Businesses with the most community activity (favorites) in 30 days
 *  2. For You    — Personalized recommendations based on user's favorite categories
 *  3. Top Rated  — Leaderboard of highest-rated businesses with trophy badges
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Star, MapPin, Sparkles, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Trending() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: recommendations, isLoading: recommendationsLoading } = trpc.business.recommendations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: leaderboard, isLoading: leaderboardLoading } = trpc.business.leaderboard.useQuery({});

  return (
    <div>
      {/* Header */}
      <div className="page-header-purple text-white py-14">
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Trending & Recommendations</h1>
              <p className="text-violet-200 mt-1">Discover what's hot and get personalized suggestions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 mb-10 p-1.5 bg-violet-50 rounded-2xl h-auto">
            <TabsTrigger value="recommendations" disabled={!isAuthenticated} className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-violet-700 font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-xl py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-violet-700 font-medium">
              <Trophy className="w-4 h-4 mr-2" />
              Top Rated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended For You</h2>
              <p className="text-gray-500">Personalized suggestions based on your favorites</p>
            </div>

            {recommendationsLoading && <GridSkeleton />}

            {!recommendationsLoading && recommendations && recommendations.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-violet-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Building Your Recommendations</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Favorite 3-5 businesses you love to get personalized recommendations!
                </p>
                <Button onClick={() => setLocation("/")} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600">
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
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Top Rated Businesses</h2>
              <p className="text-gray-500">Highest-rated businesses in the community</p>
            </div>

            {leaderboardLoading && <GridSkeleton />}

            {!leaderboardLoading && leaderboard && leaderboard.length === 0 && (
              <EmptyState icon={Trophy} title="No businesses yet" description="Search for businesses to see the leaderboard!" />
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

/** Loading skeleton placeholder grid (reusable across all three tabs) */
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="rounded-2xl overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

/** Reusable empty state component with icon, title, and description */
function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-violet-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}

/** Business card with optional rank badge and trophy icon for leaderboard */
function BusinessCard({ business, rank, showTrophy }: { business: any; rank?: number; showTrophy?: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const categories = business.categories ? JSON.parse(business.categories) : [];
  const rating = business.rating / 10;

  if (!business.imageUrl || imgFailed) return null;

  return (
    <Card className="card-hover overflow-hidden relative rounded-2xl border-0 shadow-md group">
      {rank && (
        <div className={`absolute top-3 left-3 z-10 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
          rank === 1 ? "bg-gradient-to-br from-amber-400 to-amber-500" :
          rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-400" :
          rank === 3 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
          "bg-gradient-to-br from-violet-500 to-indigo-500"
        }`}>
          {showTrophy && rank <= 3 ? <Trophy className="w-5 h-5" /> : `#${rank}`}
        </div>
      )}

      <div className="overflow-hidden">
        <img
          src={business.imageUrl}
            onError={() => setImgFailed(true)}
          alt={business.name}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1 text-lg">{business.name}</CardTitle>
        <CardDescription className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-amber-50 px-2 py-0.5 rounded-lg">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-bold text-amber-700 text-sm">{rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-400 text-sm">({business.reviewCount} reviews)</span>
            {business.price && (
              <span className="font-semibold text-emerald-600 text-sm">{business.price}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 2).map((cat: any) => (
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
          {business.address}, {business.city}, {business.state}
        </span>
      </CardFooter>
    </Card>
  );
}
