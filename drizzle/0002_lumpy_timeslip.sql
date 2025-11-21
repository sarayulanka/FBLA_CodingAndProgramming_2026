CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(100) NOT NULL,
	`category` enum('reviews','visits','support','challenges') NOT NULL,
	`requirement` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`type` enum('visit','review','category','streak') NOT NULL,
	`target` int NOT NULL,
	`category` varchar(100),
	`rewardBadgeId` int,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalReviews` int NOT NULL DEFAULT 0,
	`totalVisits` int NOT NULL DEFAULT 0,
	`totalFavorites` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActivityDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_stats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `active_idx` ON `challenges` (`isActive`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_badges` (`userId`);--> statement-breakpoint
CREATE INDEX `user_badge_idx` ON `user_badges` (`userId`,`badgeId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_challenges` (`userId`);--> statement-breakpoint
CREATE INDEX `challenge_idx` ON `user_challenges` (`challengeId`);--> statement-breakpoint
CREATE INDEX `user_challenge_idx` ON `user_challenges` (`userId`,`challengeId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_stats` (`userId`);