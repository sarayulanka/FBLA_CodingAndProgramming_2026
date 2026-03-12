import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { badges, challenges, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

async function seedGamification() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const dbPath = process.env.DATABASE_URL;
  const isRemote = dbPath.startsWith("libsql://") || dbPath.startsWith("https://");
  if (!isRemote) {
    const dir = path.dirname(dbPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  const url = isRemote ? dbPath : `file:${dbPath}`;
  const client = createClient({
    url,
    authToken: isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined,
  });
  const db = drizzle(client);

  // Create demo user for localhost testing
  console.log("Creating demo user...");
  try {
    const existingUser = await db.select().from(users).where(eq(users.openId, 'demo-user-localhost')).limit(1);
    if (existingUser.length === 0) {
      await db.insert(users).values({
        openId: 'demo-user-localhost',
        name: 'Demo User',
        email: 'demo@localhost.com',
        loginMethod: 'demo',
        role: 'admin',
      });
      console.log("✓ Demo user created");
    } else {
      console.log("✓ Demo user already exists");
    }
  } catch (error) {
    console.log("Note: Demo user creation skipped (table may not exist yet)");
  }

  console.log("Seeding badges...");

  // Seed badges
  const badgeData = [
    {
      name: "First Review",
      description: "Write your first business review",
      icon: "✍️",
      category: "reviews",
      requirement: 1,
    },
    {
      name: "Review Master",
      description: "Write 5 business reviews",
      icon: "📝",
      category: "reviews",
      requirement: 5,
    },
    {
      name: "Critic",
      description: "Write 10 business reviews",
      icon: "⭐",
      category: "reviews",
      requirement: 10,
    },
    {
      name: "Local Hero",
      description: "Write 25 business reviews",
      icon: "🏆",
      category: "reviews",
      requirement: 25,
    },
    {
      name: "Explorer",
      description: "Visit 5 different local businesses",
      icon: "🗺️",
      category: "visits",
      requirement: 5,
    },
    {
      name: "Community Champion",
      description: "Visit 10 different local businesses",
      icon: "🌟",
      category: "visits",
      requirement: 10,
    },
    {
      name: "Supporter",
      description: "Support 3 minority or student-owned businesses",
      icon: "🤝",
      category: "support",
      requirement: 3,
    },
    {
      name: "Streak Master",
      description: "Maintain a 7-day activity streak",
      icon: "🔥",
      category: "challenges",
      requirement: 7,
    },
  ] as any;

  try {
    await db.insert(badges).values(badgeData);
    console.log("✓ Badges seeded");
  } catch (error) {
    console.log("Note: Badges may already exist");
  }

  console.log("Seeding challenges...");

  // Seed weekly challenges
  const challengeData = [
    {
      title: "Bakery Explorer",
      description: "Visit 3 different bakeries this week",
      type: "category",
      target: 3,
      category: "bakeries",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: "Coffee Connoisseur",
      description: "Try 3 different coffee shops",
      type: "category",
      target: 3,
      category: "coffee",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: "Foodie Adventure",
      description: "Try 5 different restaurants",
      type: "category",
      target: 5,
      category: "restaurants",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: "Review Streak",
      description: "Write 3 reviews this week",
      type: "review",
      target: 3,
      category: null,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: "Local Support",
      description: "Visit 2 minority or student-owned businesses",
      type: "visit",
      target: 2,
      category: "support",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ] as any;

  try {
    await db.insert(challenges).values(challengeData);
    console.log("✓ Challenges seeded");
  } catch (error) {
    console.log("Note: Challenges may already exist");
  }

  console.log("✅ Gamification data seeded successfully!");
  process.exit(0);
}

seedGamification().catch((error) => {
  console.error("Error seeding gamification data:", error);
  process.exit(1);
});
