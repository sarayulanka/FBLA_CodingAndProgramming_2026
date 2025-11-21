import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Star, MessageSquare, Search, TrendingUp, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function CommunityReviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  // Get all reviews with business info
  const { data: allReviews, isLoading } = trpc.reviews.getAllReviews.useQuery();

  const filteredReviews = allReviews?.filter((review: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      review.businessName?.toLowerCase().includes(search) ||
      review.userName?.toLowerCase().includes(search) ||
      review.comment?.toLowerCase().includes(search)
    );
  });

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
            <MessageSquare className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Community Reviews</h1>
          </div>
          <p className="text-gray-300">
            See what the community is saying about local businesses
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="container py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search reviews by business, user, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Reviews List */}
        {isLoading && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                  <Skeleton className="h-20 w-full mt-4" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredReviews && filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? "No reviews found" : "No reviews yet"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Be the first to write a review!"}
            </p>
          </div>
        )}

        {!isLoading && filteredReviews && filteredReviews.length > 0 && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredReviews.length} {filteredReviews.length === 1 ? "Review" : "Reviews"}
              </h2>
            </div>

            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  const categories = review.businessCategories ? JSON.parse(review.businessCategories) : [];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{review.businessName}</CardTitle>
            <div className="flex flex-wrap gap-1 mb-3">
              {categories.slice(0, 2).map((cat: any) => (
                <Badge key={cat.alias} variant="secondary" className="text-xs">
                  {cat.title}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-gray-900">{review.rating}</span>
          </div>
        </div>

        <CardDescription>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
              {review.userName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{review.userName || "Anonymous"}</p>
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {review.comment && (
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
