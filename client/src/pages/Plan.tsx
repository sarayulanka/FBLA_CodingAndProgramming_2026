/**
 * Plan.tsx — "Plan My Day" AI itinerary generator.
 *
 * User describes their ideal day in plain English.
 * BizBloom AI parses intent, searches Yelp for real local businesses,
 * and composes a full timed itinerary with curated picks and personal notes.
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Sparkles, MapPin, Star, Clock, Phone, ChevronRight,
  Heart, Calendar, RotateCcw, Send
} from "lucide-react";

// Cycling placeholder examples
const EXAMPLES = [
  "Relaxing Saturday in San Antonio with brunch and shopping...",
  "Romantic date night in Austin — dinner and drinks...",
  "Family-friendly Sunday exploring local spots...",
  "Solo coffee shop and bookstore crawl downtown...",
  "Quick lunch and afternoon activity near me...",
];

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: "from-amber-400 to-orange-400",
  coffee:    "from-yellow-500 to-amber-500",
  lunch:     "from-green-400 to-emerald-500",
  shopping:  "from-purple-400 to-violet-500",
  activity:  "from-blue-400 to-indigo-500",
  dinner:    "from-rose-400 to-pink-500",
  drinks:    "from-violet-500 to-purple-600",
  dessert:   "from-pink-400 to-rose-400",
};

const LOADING_STEPS = [
  "Understanding your vibe...",
  "Discovering local gems...",
  "Crafting your perfect day...",
];

type Stop = {
  time: string;
  duration: string;
  category: string;
  emoji: string;
  note: string;
  business: {
    name: string;
    yelpId: string;
    rating: number;
    reviewCount: number;
    price: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    imageUrl: string | null;
    categories: string;
    latitude: number | null;
    longitude: number | null;
  };
};

type Itinerary = {
  title: string;
  location: string;
  stops: Stop[];
};

export default function Plan() {
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [savedStops, setSavedStops] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cycle placeholder text
  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % EXAMPLES.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const planMutation = trpc.ai.planDay.useMutation({
    onSuccess: (data) => {
      setItinerary(data as Itinerary);
      setSavedStops(new Set());
    },
    onError: (e) => toast.error(e.message),
  });

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: (_, vars) => {
      setSavedStops(prev => new Set([...prev, vars.yelpId]));
      toast.success("Saved to favorites!");
    },
    onError: () => toast.error("Sign in to save favorites"),
  });

  // Cycle loading step text while generating
  useEffect(() => {
    if (!planMutation.isPending) { setLoadingStep(0); return; }
    const id = setInterval(() => setLoadingStep(s => (s + 1) % LOADING_STEPS.length), 1800);
    return () => clearInterval(id);
  }, [planMutation.isPending]);

  const handleGenerate = () => {
    if (!prompt.trim()) { toast.error("Tell me what kind of day you're looking for!"); return; }
    planMutation.mutate({
      prompt: prompt.trim(),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(gpsCoords && !location.trim() ? { latitude: gpsCoords.lat, longitude: gpsCoords.lng } : {}),
    });
  };

  const handleSaveAll = () => {
    if (!isAuthenticated) { toast.error("Sign in to save favorites"); return; }
    if (!itinerary) return;
    itinerary.stops.forEach(stop => {
      if (!savedStops.has(stop.business.yelpId)) {
        addFavoriteMutation.mutate({ yelpId: stop.business.yelpId });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-900 py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob w-96 h-96 bg-violet-500 -top-20 -left-20 opacity-20 animate-float" />
          <div className="blob w-64 h-64 bg-pink-500 top-10 right-1/4 opacity-15 animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-violet-200 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Day Planner
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Plan Your <span className="text-gradient bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">Perfect Day</span>
          </h1>
          <p className="text-violet-200 text-lg mb-10 max-w-xl mx-auto">
            Describe what you're in the mood for — BizBloom finds the best local spots and builds your day.
          </p>

          {/* Input card */}
          <div className="glass-dark rounded-2xl p-6 text-left">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder={EXAMPLES[placeholderIdx]}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 text-base leading-relaxed"
            />
            <div className="flex gap-3 mt-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder={gpsCoords ? "Using your location" : "City, State (or allow location)"}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={planMutation.isPending}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 font-semibold text-white shadow-lg shadow-violet-500/30 gap-2"
              >
                {planMutation.isPending ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Planning...</>
                ) : (
                  <><Send className="w-4 h-4" /> Generate</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {planMutation.isPending && (
        <div className="container max-w-3xl mx-auto py-20 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-800">{LOADING_STEPS[loadingStep]}</p>
              <p className="text-gray-400 text-sm mt-1">This takes about 10–15 seconds</p>
            </div>
            <div className="flex gap-2">
              {LOADING_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === loadingStep ? "w-8 bg-violet-500" : "w-2 bg-gray-200"}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Itinerary */}
      {itinerary && !planMutation.isPending && (
        <div className="container max-w-3xl mx-auto py-12 px-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{itinerary.title}</h2>
              <p className="text-gray-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />{itinerary.location}
                <span className="mx-2">·</span>
                <Calendar className="w-4 h-4" />{itinerary.stops.length} stops
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                className="gap-2 rounded-xl"
              >
                <RotateCcw className="w-4 h-4" /> Regenerate
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                <Heart className="w-4 h-4" /> Save All
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-violet-200 via-indigo-200 to-pink-200" />

            <div className="space-y-6">
              {itinerary.stops.map((stop, idx) => {
                const colorClass = CATEGORY_COLORS[stop.category] ?? "from-violet-400 to-indigo-400";
                const isSaved = savedStops.has(stop.business.yelpId);

                return (
                  <div key={idx} className="relative flex gap-5">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
                      {stop.emoji}
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Business image */}
                      {stop.business.imageUrl && (
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={stop.business.imageUrl}
                            alt={stop.business.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          {/* Time badge overlaid on image */}
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${colorClass} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
                              <Clock className="w-3 h-3" />
                              {stop.time} · {stop.duration}
                            </span>
                          </div>
                          {/* Save button on image */}
                          <button
                            onClick={() => {
                              if (!isAuthenticated) { toast.error("Sign in to save"); return; }
                              if (!isSaved) addFavoriteMutation.mutate({ yelpId: stop.business.yelpId });
                            }}
                            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSaved ? "bg-rose-500 text-white" : "bg-white/90 text-gray-600 hover:bg-white"}`}
                          >
                            <Heart className={`w-4 h-4 ${isSaved ? "fill-white" : ""}`} />
                          </button>
                        </div>
                      )}

                      <div className="p-4">
                        {/* Time badge (if no image) */}
                        {!stop.business.imageUrl && (
                          <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${colorClass} text-white text-xs font-bold px-3 py-1 rounded-full mb-3`}>
                            <Clock className="w-3 h-3" />
                            {stop.time} · {stop.duration}
                          </span>
                        )}

                        {/* Business name + meta */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{stop.business.name}</h3>
                            <p className="text-sm text-gray-400 mt-0.5">{stop.business.categories}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 flex-shrink-0">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-semibold text-amber-700">{stop.business.rating}</span>
                            {stop.business.price && <span className="text-xs text-gray-400 ml-1">{stop.business.price}</span>}
                          </div>
                        </div>

                        {/* AI note */}
                        <p className="mt-3 text-gray-600 text-sm leading-relaxed italic border-l-2 border-violet-200 pl-3">
                          "{stop.note}"
                        </p>

                        {/* Address + phone */}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                          {stop.business.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {stop.business.address}{stop.business.city ? `, ${stop.business.city}` : ""}
                            </span>
                          )}
                          {stop.business.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {stop.business.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
            <Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-1">Love your day plan?</h3>
            <p className="text-gray-500 text-sm mb-4">Save all these spots to your favorites so you can find them later.</p>
            <Button onClick={handleSaveAll} className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              <Heart className="w-4 h-4" /> Save All to Favorites
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!itinerary && !planMutation.isPending && (
        <div className="container max-w-3xl mx-auto py-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: "🍳", title: "Brunch & Coffee", example: "Lazy Sunday brunch and coffee crawl in San Antonio" },
              { emoji: "🌆", title: "Date Night", example: "Romantic dinner and drinks for two in Austin" },
              { emoji: "👨‍👩‍👧", title: "Family Day", example: "Kid-friendly Saturday with lunch and activities" },
            ].map(card => (
              <button
                key={card.title}
                onClick={() => { setPrompt(card.example); textareaRef.current?.focus(); }}
                className="text-left p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all group"
              >
                <div className="text-3xl mb-3">{card.emoji}</div>
                <div className="font-semibold text-gray-800 group-hover:text-violet-700 mb-1">{card.title}</div>
                <div className="text-xs text-gray-400 leading-relaxed">"{card.example}"</div>
                <div className="flex items-center gap-1 text-violet-500 text-xs font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Try this <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
