import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Tag, MapPin, Calendar, Sparkles, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Deals() {
  const [, setLocation] = useLocation();
  const { data: deals, isLoading } = trpc.deals.list.useQuery({});

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
            <Sparkles className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Special Deals</h1>
          </div>
          <p className="text-gray-300">
            Exclusive offers from local businesses
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && deals && deals.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No deals available yet
            </h3>
            <p className="text-gray-600">
              Check back soon for exclusive offers from local businesses!
            </p>
          </div>
        )}

        {!isLoading && deals && deals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: any }) {
  const categories = deal.business?.categories ? JSON.parse(deal.business.categories) : [];

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className="bg-green-600">Special Offer</Badge>
          {deal.expiresAt && (
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="w-3 h-3 mr-1" />
              Expires {new Date(deal.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <CardTitle className="text-xl">{deal.title}</CardTitle>

        {deal.description && (
          <CardDescription className="text-base">
            {deal.description}
          </CardDescription>
        )}

        {deal.code && (
          <div className="mt-3 p-3 bg-white border-2 border-dashed border-green-400 rounded-md">
            <p className="text-xs text-gray-600 mb-1">Promo Code:</p>
            <p className="text-lg font-bold text-green-700 font-mono">{deal.code}</p>
          </div>
        )}

        {deal.business && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="font-semibold text-gray-900">{deal.business.name}</p>
            <div className="flex items-start gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {deal.business.address}, {deal.business.city}, {deal.business.state}
              </span>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categories.slice(0, 2).map((cat: any) => (
                  <Badge key={cat.alias} variant="secondary" className="text-xs">
                    {cat.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
