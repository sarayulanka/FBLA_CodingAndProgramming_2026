import { drizzle } from "drizzle-orm/mysql2";
import { badges, challenges } from "../drizzle/schema";

async function seedGamification() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Seeding badges...");
  
  // Seed badges
  const badgeData = [
    {
      name: "First Review",
      description: "Write your first business review",
      icon: "✍️",
      category: "reviews" as const,
      requirement: 1,
    },
    {
      name: "Review Master",
      description: "Write 5 business reviews",
      icon: "📝",
      category: "reviews" as const,
      requirement: 5,
    },
    {
      name: "Review Legend",
      description: "Write 25 business reviews",
      icon: "🏆",
      category: "reviews" as const,
      requirement: 25,
    },
    {
      name: "Explorer",
      description: "Visit your first business",
      icon: "🗺️",
      category: "visits" as const,
      requirement: 1,
    },
    {
      name: "Local Hero",
      description: "Visit 10 different businesses",
      icon: "⭐",
      category: "visits" as const,
      requirement: 10,
    },
    {
      name: "Community Champion",
      description: "Visit 50 different businesses",
      icon: "👑",
      category: "visits" as const,
      requirement: 50,
    },
    {
      name: "Supporter",
      description: "Support a minority or student-owned business",
      icon: "💪",
      category: "support" as const,
      requirement: 1,
    },
    {
      name: "Ally",
      description: "Support 5 minority or student-owned businesses",
      icon: "🤝",
      category: "support" as const,
      requirement: 5,
    },
    {
      name: "Challenge Accepted",
      description: "Complete your first challenge",
      icon: "🎯",
      category: "challenges" as const,
      requirement: 1,
    },
    {
      name: "Challenge Master",
      description: "Complete 5 challenges",
      icon: "🏅",
      category: "challenges" as const,
      requirement: 5,
    },
  ];

  for (const badge of badgeData) {
    await db.insert(badges).values(badge).onDuplicateKeyUpdate({ set: { name: badge.name } });
  }

  console.log("Seeding challenges...");

  // Seed weekly challenges
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const challengeData = [
    {
      title: "Bakery Explorer",
      description: "Visit 3 bakeries this week",
      type: "category" as const,
      target: 3,
      category: "bakeries",
      rewardBadgeId: null,
      startsAt: weekStart,
      endsAt: weekEnd,
      isActive: true,
    },
    {
      title: "Coffee Connoisseur",
      description: "Visit 3 coffee shops this week",
      type: "category" as const,
      target: 3,
      category: "coffee",
      rewardBadgeId: null,
      startsAt: weekStart,
      endsAt: weekEnd,
      isActive: true,
    },
    {
      title: "Foodie Adventure",
      description: "Try 5 different restaurants this week",
      type: "category" as const,
      target: 5,
      category: "restaurants",
      rewardBadgeId: null,
      startsAt: weekStart,
      endsAt: weekEnd,
      isActive: true,
    },
    {
      title: "Review Streak",
      description: "Write 3 reviews this week",
      type: "review" as const,
      target: 3,
      category: null,
      rewardBadgeId: null,
      startsAt: weekStart,
      endsAt: weekEnd,
      isActive: true,
    },
    {
      title: "Local Support",
      description: "Visit 2 minority or student-owned businesses this week",
      type: "visit" as const,
      target: 2,
      category: "support",
      rewardBadgeId: null,
      startsAt: weekStart,
      endsAt: weekEnd,
      isActive: true,
    },
  ];

  for (const challenge of challengeData) {
    await db.insert(challenges).values(challenge);
  }

  console.log("✅ Gamification seeding complete!");
  process.exit(0);
}

seedGamification().catch((error) => {
  console.error("Error seeding gamification:", error);
  process.exit(1);
});
