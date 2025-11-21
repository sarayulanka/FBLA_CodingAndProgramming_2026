import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Star, Heart, MapPin, Trash2, ArrowLeft } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);

  const { data: favorites, isLoading } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>
              You need to be signed in to view your favorite businesses.
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
            <Heart className="w-10 h-10" />
            <h1 className="text-4xl font-bold">My Favorites</h1>
          </div>
          <p className="text-gray-300">
            Businesses you've saved for later
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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

        {!isLoading && favorites && favorites.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start exploring and save your favorite businesses!
            </p>
            <Button asChild>
              <Link href="/">
                <a>Discover Businesses</a>
              </Link>
            </Button>
          </div>
        )}

        {!isLoading && favorites && favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((business) => (
              <FavoriteBusinessCard
                key={business.id}
                business={business}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FavoriteBusinessCard({ business }: { business: any }) {
  const utils = trpc.useUtils();

  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from favorites");
      utils.favorites.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRemove = () => {
    removeFavorite.mutate({ yelpId: business.yelpId });
  };

  const categories = business.categories ? JSON.parse(business.categories) : [];
  const rating = business.rating / 10; // Convert from integer storage

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative">
        <img
          src={business.imageUrl || "/placeholder-business.jpg"}
          alt={business.name}
          className="w-full h-48 object-cover"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleRemove}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

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
