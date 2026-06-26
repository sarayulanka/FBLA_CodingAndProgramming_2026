/**
 * Impact.tsx — Local Impact Dashboard
 *
 * Shows the aggregate community impact of BizBloom users — total businesses
 * supported, reviews written, community sentiment, and a live activity feed.
 * This is the "mission dashboard" that makes the app feel like a movement,
 * not just a product.
 *
 * Sections:
 *  1. Hero stats — big numbers at the top (businesses supported, reviews, favorites)
 *  2. This Week spotlight — recent momentum
 *  3. Community sentiment gauge — avg positivity score from review analysis
 *  4. Live activity feed — real-time stream of reviews and favorites
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Heart, Building2, Users, TrendingUp, MessageSquare, Zap, Globe, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/** Maps a sentiment percentage (0–100) to a colour and label */
function sentimentLabel(score: number) {
  if (score >= 70) return { label: "Thriving", color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500" };
  if (score >= 50) return { label: "Positive", color: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-500" };
  if (score >= 35) return { label: "Mixed", color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-500" };
  return { label: "Needs Love", color: "text-red-500", bg: "bg-red-50", bar: "bg-red-400" };
}

/** Renders a single activity feed item (review or favorite) */
function FeedItem({ item }: { item: any }) {
  const isReview = item.type === "review";
  // SQLite stores timestamps as seconds; Drizzle multiplies by 1000 on read.
  // If the stored value was already in ms, we end up 1000x too large — detect
  // and correct by checking if the resulting year is absurd (> year 3000).
  const rawDate = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
  const createdAt = rawDate.getFullYear() > 3000 ? new Date(rawDate.getTime() / 1000) : rawDate;
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  let categories: string[] = [];
  try {
    categories = item.businessCategories
      ? JSON.parse(item.businessCategories).slice(0, 2).map((c: any) => c.title)
      : [];
  } catch {}

  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isReview ? "bg-indigo-100" : "bg-rose-100"}`}>
        {isReview
          ? <MessageSquare className="w-4 h-4 text-indigo-600" />
          : <Heart className="w-4 h-4 text-rose-500" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-tight">
          <span className="text-indigo-700">{item.userName ?? "A neighbor"}</span>
          {isReview
            ? <> reviewed <span className="font-semibold text-gray-900">{item.businessName}</span></>
            : <> saved <span className="font-semibold text-gray-900">{item.businessName}</span></>
          }
        </p>

        {isReview && item.rating && (
          <div className="flex items-center gap-1 mt-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-3 h-3 ${i <= item.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
            ))}
            {item.comment && (
              <span className="ml-1 text-xs text-gray-500 truncate max-w-[200px]">"{item.comment}"</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-0.5">
          {item.businessCity && (
            <span className="text-xs text-gray-400">{item.businessCity}</span>
          )}
          {categories.map(cat => (
            <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md bg-gray-100 text-gray-600">
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <span className="text-[10px] text-gray-400 shrink-0 pt-0.5">{timeAgo}</span>
    </div>
  );
}

export default function Impact() {
  const { data: impact, isLoading: impactLoading } = trpc.analytics.communityImpact.useQuery(undefined, { refetchInterval: 10000 });
  const { data: feed, isLoading: feedLoading } = trpc.analytics.communityFeed.useQuery({ limit: 30 }, { refetchInterval: 10000 });

  const sentiment = impact ? sentimentLabel(impact.avgSentiment) : null;

  return (
    <div>
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-10 w-48 h-48 rounded-full bg-emerald-200 blur-2xl" />
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Local Impact</h1>
              <p className="text-emerald-100 mt-1 text-lg">Every review, every favorite — it adds up.</p>
            </div>
          </div>
          <p className="text-emerald-200 max-w-xl mt-2">
            BizBloom users are making a real difference for small businesses in their communities.
            Here's the story in numbers.
          </p>
        </div>
      </div>

      <div className="container py-10 space-y-8">

        {/* Big Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Building2,
              label: "Businesses Supported",
              value: impact?.totalBusinessesSupported ?? 0,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              loading: impactLoading,
            },
            {
              icon: MessageSquare,
              label: "Community Reviews",
              value: impact?.totalReviews ?? 0,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              loading: impactLoading,
            },
            {
              icon: Heart,
              label: "Businesses Saved",
              value: impact?.totalFavorites ?? 0,
              color: "text-rose-500",
              bg: "bg-rose-50",
              loading: impactLoading,
            },
            {
              icon: Users,
              label: "Community Members",
              value: impact?.totalUsers ?? 0,
              color: "text-violet-600",
              bg: "bg-violet-50",
              loading: impactLoading,
            },
          ].map(({ icon: Icon, label, value, color, bg, loading }) => (
            <Card key={label} className="rounded-2xl border-0 shadow-sm text-center">
              <CardContent className="pt-6 pb-5">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-16 mx-auto mb-2" />
                ) : (
                  <p className={`text-4xl font-extrabold ${color}`}>{value.toLocaleString()}</p>
                )}
                <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* This Week Spotlight */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-amber-500" />
                This Week's Momentum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {impactLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="font-semibold text-gray-800">Reviews Written</p>
                        <p className="text-xs text-gray-500">In the last 7 days</p>
                      </div>
                    </div>
                    <span className="text-3xl font-extrabold text-indigo-600">{impact?.thisWeekReviews ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <div>
                        <p className="font-semibold text-gray-800">Businesses Saved</p>
                        <p className="text-xs text-gray-500">In the last 7 days</p>
                      </div>
                    </div>
                    <span className="text-3xl font-extrabold text-rose-500">{impact?.thisWeekFavorites ?? 0}</span>
                  </div>
                  {impact?.topSupportedCity && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <Award className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-800 font-medium">
                        Most active community: <span className="font-bold">{impact.topSupportedCity}</span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Community Sentiment */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Community Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {impactLoading || !sentiment ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-5 rounded-xl ${sentiment.bg} text-center`}>
                    <p className={`text-5xl font-extrabold ${sentiment.color}`}>{impact!.avgSentiment}%</p>
                    <p className={`text-lg font-semibold mt-1 ${sentiment.color}`}>{sentiment.label}</p>
                    <p className="text-xs text-gray-500 mt-1">Based on {impact!.totalReviews} community reviews</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Critical</span><span>Positive</span><span>Thriving</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${sentiment.bar}`}
                        style={{ width: `${impact!.avgSentiment}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Our AI analyzes every review for sentiment. A score above 65% means the
                    community genuinely loves the local businesses they're discovering.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                Live Community Feed
              </CardTitle>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                Real-time
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {feedLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !feed || feed.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">The feed will populate as the community grows.</p>
                <p className="text-sm mt-1">Write a review or save a business to appear here!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {feed.map((item: any, i: number) => (
                  <FeedItem key={`${item.type}-${item.id}-${i}`} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
