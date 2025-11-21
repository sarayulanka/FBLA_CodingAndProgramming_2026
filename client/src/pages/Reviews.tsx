import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Star, MessageSquare, Search } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Reviews() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = trpc.useUtils();

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setIsDialogOpen(false);
      setComment("");
      setRating(5);
      setSelectedBusiness(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmitReview = () => {
    if (!selectedBusiness) {
      toast.error("Please select a business first");
      return;
    }

    createReview.mutate({
      yelpId: selectedBusiness.id,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>
              You need to be signed in to write reviews.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">Write a Review</h1>
          <p className="text-purple-100">
            Share your experience with the community
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Submit a Review</CardTitle>
            <CardDescription>
              Search for a business and share your thoughts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Search for a Business</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter business name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedBusiness && (
                <div className="mt-2 p-3 bg-purple-50 rounded-md">
                  <p className="font-semibold">{selectedBusiness.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedBusiness.location?.display_address?.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your Review (Optional)</Label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmitReview}
              disabled={!selectedBusiness || createReview.isPending}
              className="w-full"
            >
              {createReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-purple-600 mb-3" />
          <p className="text-gray-600">
            Note: To write a review, search for a business on the home page and click on it to open the details dialog.
            <br />
            You can submit your review from there.
          </p>
        </div>
      </div>
    </div>
  );
}
