CREATE TABLE `badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`category` text NOT NULL,
	`requirement` integer NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`yelpId` text NOT NULL,
	`name` text NOT NULL,
	`imageUrl` text,
	`url` text,
	`rating` integer NOT NULL,
	`reviewCount` integer DEFAULT 0 NOT NULL,
	`price` text,
	`phone` text,
	`categories` text,
	`address` text,
	`city` text,
	`state` text,
	`zipCode` text,
	`country` text,
	`latitude` integer,
	`longitude` integer,
	`isClosed` integer DEFAULT false,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `businesses_yelpId_unique` ON `businesses` (`yelpId`);--> statement-breakpoint
CREATE INDEX `yelpId_idx` ON `businesses` (`yelpId`);--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`target` integer NOT NULL,
	`category` text,
	`rewardBadgeId` integer,
	`startsAt` integer NOT NULL,
	`endsAt` integer NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `challenges_active_idx` ON `challenges` (`isActive`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`businessId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`code` text,
	`expiresAt` integer,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `deals_business_idx` ON `deals` (`businessId`);--> statement-breakpoint
CREATE INDEX `deals_active_idx` ON `deals` (`isActive`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`businessId` integer NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_business_idx` ON `favorites` (`userId`,`businessId`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`businessId` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `business_idx` ON `reviews` (`businessId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `reviews` (`userId`);--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`badgeId` integer NOT NULL,
	`earnedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ub_user_idx` ON `user_badges` (`userId`);--> statement-breakpoint
CREATE INDEX `user_badge_idx` ON `user_badges` (`userId`,`badgeId`);--> statement-breakpoint
CREATE TABLE `user_challenges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`challengeId` integer NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completedAt` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `uc_user_idx` ON `user_challenges` (`userId`);--> statement-breakpoint
CREATE INDEX `challenge_idx` ON `user_challenges` (`challengeId`);--> statement-breakpoint
CREATE INDEX `user_challenge_idx` ON `user_challenges` (`userId`,`challengeId`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`totalReviews` integer DEFAULT 0 NOT NULL,
	`totalVisits` integer DEFAULT 0 NOT NULL,
	`totalFavorites` integer DEFAULT 0 NOT NULL,
	`currentStreak` integer DEFAULT 0 NOT NULL,
	`longestStreak` integer DEFAULT 0 NOT NULL,
	`lastActivityDate` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_stats_userId_unique` ON `user_stats` (`userId`);--> statement-breakpoint
CREATE INDEX `us_user_idx` ON `user_stats` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`lastSignedIn` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);