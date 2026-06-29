/**
 * Favorites.tsx — User's saved businesses page.
 *
 * Displays a grid of businesses the user has favorited.
 * Requires authentication — shows a sign-in prompt if not logged in.
 * Each card includes a remove button to unfavorite the business.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Star, Heart, MapPin, Trash2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: favorites, isLoading } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full rounded-2xl text-center p-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-rose-500/25">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-white/55 text-base mb-6">
            You need to be signed in to view your favorite businesses.
          </p>
          <Button asChild className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header-purple text-white py-14">
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">My Favorites</h1>
              <p className="text-violet-200 mt-1">Businesses you've saved for later</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-2xl overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && favorites && favorites.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-rose-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No favorites yet</h3>
            <p className="text-white/55 mb-6">Start exploring and save your favorite businesses!</p>
            <Button asChild className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600">
              <Link href="/">Discover Businesses</Link>
            </Button>
          </div>
        )}

        {!isLoading && favorites && favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((business) => (
              <FavoriteBusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Individual favorite business card with remove (trash) button */
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
  const rating = business.rating / 10;

  return (
    <div className="glass-card overflow-hidden rounded-2xl group">
      <div className="relative overflow-hidden">
        <img
          src={business.imageUrl || "/placeholder-business.jpg"}
          alt={business.name}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-3 right-3 rounded-full shadow-lg bg-gradient-to-br from-rose-500 to-red-500 border-0 opacity-80 hover:opacity-100 transition"
          onClick={handleRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-lg font-semibold text-white mb-2">{business.name}</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-amber-500/20 px-2 py-0.5 rounded-lg">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-bold text-amber-300 text-sm">{rating.toFixed(1)}</span>
            </div>
            <span className="text-white/45 text-sm">({business.reviewCount} reviews)</span>
            {business.price && (
              <span className="font-semibold text-emerald-400 text-sm">{business.price}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 2).map((cat: any) => (
              <Badge key={cat.alias} variant="secondary" className="text-xs rounded-lg bg-violet-500/20 text-violet-300 border-violet-500/20">
                {cat.title}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 text-sm text-white/40 flex items-center">
        <MapPin className="w-3.5 h-3.5 mr-1.5 text-violet-400 shrink-0" />
        <span className="line-clamp-1">
          {business.address}, {business.city}, {business.state}
        </span>
      </div>
    </div>
  );
}
