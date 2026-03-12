import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Star, MessageSquare, Search } from "lucide-react";

export default function CommunityReviews() {
  const [searchTerm, setSearchTerm] = useState("");

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
    <div>
      {/* Header */}
      <div className="page-header-purple text-white py-14">
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Community Reviews</h1>
              <p className="text-violet-200 mt-1">See what the community is saying about local businesses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <label htmlFor="review-search" className="sr-only">Search reviews</label>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <Input
              id="review-search"
              placeholder="Search reviews by business, user, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 rounded-xl border-gray-200 focus:ring-violet-400 focus:border-violet-400"
              aria-label="Search reviews by business, user, or content"
            />
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
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
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? "No reviews found" : "No reviews yet"}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search terms" : "Be the first to write a review!"}
            </p>
          </div>
        )}

        {!isLoading && filteredReviews && filteredReviews.length > 0 && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
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
    <Card className="card-hover rounded-2xl border-0 shadow-md overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{review.businessName}</CardTitle>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {categories.slice(0, 2).map((cat: any) => (
                <Badge key={cat.alias} variant="secondary" className="text-xs rounded-lg bg-violet-50 text-violet-700 border-violet-100">
                  {cat.title}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-amber-700">{review.rating}</span>
          </div>
        </div>

        <CardDescription>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              {review.userName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{review.userName || "Anonymous"}</p>
              <p className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {review.comment && (
            <p className="text-gray-600 leading-relaxed">{review.comment}</p>
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
