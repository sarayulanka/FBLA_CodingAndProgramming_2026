/**
 * Deals.tsx — Special offers and promotional deals page.
 *
 * Displays active deals posted by admins, each showing:
 *  - Deal title and description
 *  - Optional promo code in a highlighted box
 *  - Expiration date
 *  - Associated business info with address and categories
 */

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Tag, MapPin, Calendar, Sparkles } from "lucide-react";

export default function Deals() {
  const { data: deals, isLoading } = trpc.deals.list.useQuery({});

  return (
    <div>
      {/* Header */}
      <div className="page-header-purple text-white py-14">
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Special Deals</h1>
              <p className="text-violet-200 mt-1">Exclusive offers from local businesses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
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
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <Tag className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No deals available yet</h3>
            <p className="text-white/55">Check back soon for exclusive offers from local businesses!</p>
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

/** Individual deal card with promo code display and business info */
function DealCard({ deal }: { deal: any }) {
  const categories = deal.business?.categories ? JSON.parse(deal.business.categories) : [];

  return (
    <div className="glass-card overflow-hidden rounded-2xl p-6">
      <div className="flex items-start justify-between mb-3">
        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white rounded-lg px-3 py-1 font-semibold shadow-lg shadow-emerald-500/25">
          Special Offer
        </Badge>
        {deal.expiresAt && (
          <div className="flex items-center text-xs text-white/45 bg-white/8 px-2.5 py-1 rounded-lg">
            <Calendar className="w-3 h-3 mr-1" />
            Expires {(() => { const raw = new Date(deal.expiresAt); const d = raw.getFullYear() > 3000 ? new Date(raw.getTime() / 1000) : raw; return d.toLocaleDateString(); })()}
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{deal.title}</h3>

      {deal.description && (
        <p className="text-white/60 text-base leading-relaxed mb-3">{deal.description}</p>
      )}

      {deal.code && (
        <div className="mt-4 p-4 bg-emerald-500/15 border-2 border-dashed border-emerald-500/40 rounded-xl">
          <p className="text-xs text-white/45 mb-1 font-medium uppercase tracking-wider">Promo Code</p>
          <p className="text-xl font-extrabold text-emerald-400 font-mono tracking-wider">{deal.code}</p>
        </div>
      )}

      {deal.business && (
        <div className="mt-5 pt-5 border-t border-white/8 space-y-2">
          <p className="font-bold text-white">{deal.business.name}</p>
          <div className="flex items-start gap-1.5 text-sm text-white/45">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-violet-400" />
            <span>
              {deal.business.address}, {deal.business.city}, {deal.business.state}
            </span>
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 2).map((cat: any) => (
                <Badge key={cat.alias} variant="secondary" className="text-xs rounded-lg bg-violet-500/20 text-violet-300 border-violet-500/20">
                  {cat.title}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
