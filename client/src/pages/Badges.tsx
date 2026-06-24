/**
 * Badges.tsx — Gamification page showing badges, challenges, and stats.
 *
 * Sections:
 *  1. Stats Overview   — Total reviews, visits, favorites, streak, badges earned
 *  2. Active Challenges — Weekly challenges with progress bars and check-in buttons
 *  3. Earned Badges    — Badges the user has unlocked with earn dates
 *  4. Locked Badges    — Remaining badges shown in grayscale with requirements
 *
 * Requires authentication — shows a sign-in prompt if not logged in.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Award, CheckCircle2, Clock, Target, Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Badges() {
  const { user, loading: authLoading } = useAuth();

  const { data: stats } = trpc.gamification.stats.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: myBadges } = trpc.gamification.myBadges.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: allBadges } = trpc.gamification.allBadges.useQuery();

  const { data: challengeProgress } = trpc.gamification.myProgress.useQuery(undefined, {
    enabled: !!user,
  });

  const checkInMutation = trpc.gamification.checkIn.useMutation({
    onSuccess: (data) => {
      if (data.completed) {
        toast.success("Challenge completed!", {
          description: data.badge ? `You earned the "${data.badge.name}" badge!` : "Great job!",
        });
      } else {
        toast.success("Check-in recorded!");
      }
    },
    onError: (error) => {
      toast.error("Failed to check in", { description: error.message });
    },
  });

  const utils = trpc.useUtils();

  const handleCheckIn = async (challengeId: number) => {
    await checkInMutation.mutateAsync({ challengeId });
    utils.gamification.myProgress.invalidate();
    utils.gamification.stats.invalidate();
    utils.gamification.myBadges.invalidate();
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/25 rotate-3">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Sign In Required</h1>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          Sign in to earn badges, complete challenges, and track your progress!
        </p>
        <Button asChild size="lg" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }

  const earnedBadgeIds = new Set(myBadges?.map(b => b.id) || []);
  const lockedBadges = allBadges?.filter(b => !earnedBadgeIds.has(b.id)) || [];

  const STAT_ITEMS = [
    { label: "Total Reviews", value: stats?.totalReviews || 0, gradient: "from-violet-500 to-indigo-500" },
    { label: "Businesses Visited", value: stats?.totalVisits || 0, gradient: "from-indigo-500 to-purple-500" },
    { label: "Total Favorites", value: stats?.totalFavorites || 0, gradient: "from-rose-500 to-pink-500" },
    { label: "Current Streak", value: `${stats?.currentStreak || 0}d`, gradient: "from-amber-500 to-orange-500" },
    { label: "Badges Earned", value: myBadges?.length || 0, gradient: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header-purple text-white py-14">
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Badges & Challenges</h1>
              <p className="text-violet-200 mt-1">Track your achievements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-6xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {STAT_ITEMS.map((stat) => (
            <Card key={stat.label} className="card-hover rounded-2xl border-0 shadow-md text-center overflow-hidden">
              <CardContent className="pt-6 pb-5">
                <div className={`text-3xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Challenges */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Active Challenges</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {challengeProgress?.map((cp) => {
              const progress = (cp.progress / cp.challenge.target) * 100;
              const isCompleted = cp.completed;

              return (
                <Card key={cp.id} className={`rounded-2xl border-0 shadow-md transition-all ${isCompleted ? "ring-2 ring-emerald-400 bg-gradient-to-br from-emerald-50 to-white" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {cp.challenge.title}
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                        </CardTitle>
                        <CardDescription className="mt-1">{cp.challenge.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-bold text-gray-900">
                            {cp.progress} / {cp.challenge.target}
                          </span>
                        </div>
                        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                              isCompleted
                                ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                                : "bg-gradient-to-r from-violet-500 to-indigo-500"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>
                            Ends {new Date(cp.challenge.endsAt).toLocaleDateString()}
                          </span>
                        </div>

                        {isCompleted ? (
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white rounded-lg">
                            Completed
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(cp.challenge.id)}
                            disabled={checkInMutation.isPending}
                            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 btn-shimmer"
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {(!challengeProgress || challengeProgress.length === 0) && (
            <Card className="rounded-2xl border-0 shadow-md">
              <CardContent className="py-14 text-center">
                <div className="w-16 h-16 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-violet-400" />
                </div>
                <p className="text-gray-600 font-medium">No active challenges at the moment.</p>
                <p className="text-sm text-gray-400 mt-1">Check back soon for new challenges!</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Earned Badges */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Earned Badges</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {myBadges?.map((badge) => (
              <Card key={badge.id} className="card-hover text-center rounded-2xl border-0 shadow-md overflow-hidden">
                <CardContent className="pt-6">
                  <div className="text-5xl mb-3">{badge.icon}</div>
                  <h3 className="font-bold text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                  <p className="text-xs text-violet-500 font-medium">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!myBadges || myBadges.length === 0) && (
            <Card className="rounded-2xl border-0 shadow-md">
              <CardContent className="py-14 text-center">
                <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-amber-400" />
                </div>
                <p className="text-gray-600 font-medium">No badges earned yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Complete challenges and engage with businesses to earn badges!
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                <Award className="h-5 w-5 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-400">Locked Badges</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {lockedBadges.map((badge) => (
                <Card key={badge.id} className="text-center rounded-2xl border-0 shadow-sm opacity-50 hover:opacity-70 transition">
                  <CardContent className="pt-6">
                    <div className="text-5xl mb-3 grayscale">{badge.icon}</div>
                    <h3 className="font-bold text-sm mb-1">{badge.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                    <p className="text-xs text-gray-400">
                      Requirement: {badge.requirement}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
