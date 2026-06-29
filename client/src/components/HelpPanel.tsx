/**
 * HelpPanel.tsx — AI-powered help sidebar.
 *
 * Slides in from the right when the user clicks "Help" in the nav bar.
 * Uses the help.chat tRPC mutation to send messages to an AI assistant
 * (powered by AWS Bedrock / Claude) for contextual, personalized help.
 *
 * Personalization features:
 *  - Passes the user's location, nearby businesses, badges, and active challenges
 *  - AI can recommend specific local businesses the user hasn't tried yet
 *  - AI knows the user's challenge progress and can give tailored advice
 *  - Suggested quick-start topics
 *  - Real-time chat with typing indicator
 *  - Keyboard support (Enter to send, Shift+Enter for newline)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { X, Send, Sparkles, Loader2, User, Search, Star, Heart, Trophy, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
  /** Optional nearby businesses from the current search to give the AI real local context */
  nearbyBusinesses?: Array<{
    name: string;
    categories: string;
    rating: number;
    distance?: number;
    hasDeals?: boolean;
  }>;
}

// Pre-defined suggested topics shown when the chat is empty
const SUGGESTED_TOPICS = [
  { icon: Search, label: "How to search", prompt: "How do I search for businesses?" },
  { icon: Star, label: "Write a review", prompt: "How do I write a review?" },
  { icon: Heart, label: "Save favorites", prompt: "How do I save favorites?" },
  { icon: Trophy, label: "Earn badges", prompt: "How do I earn badges?" },
  { icon: MapPin, label: "Find nearby", prompt: "What's good near me right now?" },
  { icon: Sparkles, label: "My challenges", prompt: "What challenges am I working on and how close am I?" },
];

export function HelpPanel({ open, onClose, nearbyBusinesses }: HelpPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "You are BizBloom's helpful assistant." },
  ]);
  const [input, setInput] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch personalization data when panel opens and user is logged in
  const { data: userStats } = trpc.gamification.stats.useQuery(undefined, { enabled: !!user && open });
  const { data: myBadges } = trpc.gamification.myBadges.useQuery(undefined, { enabled: !!user && open });
  const { data: challengeProgress } = trpc.gamification.myProgress.useQuery(undefined, { enabled: !!user && open });
  const { data: userFavorites } = trpc.favorites.list.useQuery(undefined, { enabled: !!user && open });

  // Grab geolocation when panel opens
  useEffect(() => {
    if (open && !userLocation && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {});
    }
  }, [open]);

  const displayMessages = messages.filter((m) => m.role !== "system");

  /** Build rich user context to pass with each message */
  const buildUserContext = useCallback(() => {
    const ctx: any = {};
    if (userLocation) ctx.userLocation = userLocation;
    if (nearbyBusinesses && nearbyBusinesses.length > 0) ctx.nearbyBusinesses = nearbyBusinesses.slice(0, 8);
    if (user && userStats) {
      // Extract recent favorite categories from the user's favorites list
      const recentCats: string[] = [];
      if (userFavorites) {
        for (const fav of userFavorites.slice(0, 10)) {
          try {
            const cats = JSON.parse((fav as any).categories || "[]");
            for (const c of cats) if (c.title && !recentCats.includes(c.title)) recentCats.push(c.title);
          } catch {}
        }
      }
      ctx.userProfile = {
        name: user.name ?? undefined,
        totalReviews: userStats.totalReviews ?? 0,
        totalFavorites: userStats.totalFavorites ?? 0,
        badgesEarned: (myBadges ?? []).map((b: any) => `${b.icon} ${b.name}`),
        activeChallenges: (challengeProgress ?? []).map((cp: any) => ({
          title: cp.challenge?.title ?? "",
          description: cp.challenge?.description ?? "",
          progress: cp.progress ?? 0,
          target: cp.challenge?.target ?? 1,
          category: cp.challenge?.category ?? null,
        })),
        recentFavoriteCategories: recentCats.slice(0, 5),
      };
    }
    return Object.keys(ctx).length > 0 ? ctx : undefined;
  }, [user, userStats, myBadges, challengeProgress, userFavorites, userLocation, nearbyBusinesses]);

  const chatMutation = trpc.help.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't respond. Please try again." },
      ]);
    },
  });

  const handleSend = (content: string) => {
    if (!content.trim() || chatMutation.isPending) return;
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({ messages: newMessages, userContext: buildUserContext() });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Header — matching homepage gradient */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-5 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">BizBloom AI</h2>
                <p className="text-xs text-blue-300/80">Your smart assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
              aria-label="Close help panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-y-auto bg-slate-900/95">
          {displayMessages.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full px-6 py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mb-4 border border-blue-500/20">
                <MessageSquare className="w-8 h-8 text-blue-400/70" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">How can I help?</h3>
              <p className="text-sm text-white/45 mb-6 text-center">
                Ask me anything about BizBloom or pick a topic below.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {SUGGESTED_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(topic.prompt)}
                    disabled={chatMutation.isPending}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-left text-sm font-medium text-white/70 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white transition-all disabled:opacity-50"
                  >
                    <topic.icon className="w-4 h-4 text-blue-400 shrink-0" />
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="px-4 py-4 space-y-4">
              {displayMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md"
                        : "bg-white/8 text-white/85 border border-white/10 rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-white/60" />
                    </div>
                  )}
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-slate-900/95 border-t border-white/10 px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-white/8 text-white placeholder:text-white/35 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 transition max-h-24 min-h-[40px]"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || chatMutation.isPending}
              className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-white/30 text-center mt-2">Powered by AI — responses may not be perfect</p>
        </div>
      </div>
    </>
  );
}
