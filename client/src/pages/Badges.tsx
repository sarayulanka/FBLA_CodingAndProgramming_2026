import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Award, CheckCircle2, Clock, Target, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Badges() {
  const [, setLocation] = useLocation();
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
        toast.success("🎉 Challenge completed!", {
          description: data.badge ? `You earned the "${data.badge.name}" badge!` : "Great job!",
        });
      } else {
        toast.success("✅ Check-in recorded!");
      }
    },
    onError: (error) => {
      toast.error("Failed to check in", {
        description: error.message,
      });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Trophy className="h-16 w-16 text-blue-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Sign In Required</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Sign in to earn badges, complete challenges, and track your progress!
        </p>
        <Button asChild size="lg">
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }

  const earnedBadgeIds = new Set(myBadges?.map(b => b.id) || []);
  const lockedBadges = allBadges?.filter(b => !earnedBadgeIds.has(b.id)) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Badges & Challenges</h1>
              <p className="text-sm text-gray-600">Track your achievements</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalReviews || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Businesses Visited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalVisits || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Favorites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalFavorites || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.currentStreak || 0} days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Badges Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{myBadges?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Challenges */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Active Challenges</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challengeProgress?.map((cp) => {
              const progress = (cp.progress / cp.challenge.target) * 100;
              const isCompleted = cp.completed;

              return (
                <Card key={cp.id} className={isCompleted ? "border-green-500 bg-green-50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {cp.challenge.title}
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        </CardTitle>
                        <CardDescription>{cp.challenge.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            {cp.progress} / {cp.challenge.target}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            Ends {new Date(cp.challenge.endsAt).toLocaleDateString()}
                          </span>
                        </div>

                        {isCompleted ? (
                          <Badge className="bg-green-600 hover:bg-green-600">
                            ✓ COMPLETED
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(cp.challenge.id)}
                            disabled={checkInMutation.isPending}
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
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active challenges at the moment.</p>
                <p className="text-sm text-gray-500 mt-2">Check back soon for new challenges!</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Earned Badges */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <h2 className="text-2xl font-bold">Earned Badges</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {myBadges?.map((badge) => (
              <Card key={badge.id} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-5xl mb-3">{badge.icon}</div>
                  <h3 className="font-bold mb-1">{badge.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                  <p className="text-xs text-gray-500">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!myBadges || myBadges.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No badges earned yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Complete challenges and engage with businesses to earn badges!
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-6 w-6 text-gray-400" />
              <h2 className="text-2xl font-bold">Locked Badges</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {lockedBadges.map((badge) => (
                <Card key={badge.id} className="text-center opacity-60">
                  <CardContent className="pt-6">
                    <div className="text-5xl mb-3 grayscale">{badge.icon}</div>
                    <h3 className="font-bold mb-1">{badge.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                    <p className="text-xs text-gray-500">
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
