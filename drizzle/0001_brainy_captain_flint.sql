CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`yelpId` varchar(255) NOT NULL,
	`name` text NOT NULL,
	`imageUrl` text,
	`url` text,
	`rating` int NOT NULL,
	`reviewCount` int NOT NULL DEFAULT 0,
	`price` varchar(10),
	`phone` varchar(50),
	`categories` text,
	`address` text,
	`city` varchar(255),
	`state` varchar(50),
	`zipCode` varchar(20),
	`country` varchar(50),
	`latitude` int,
	`longitude` int,
	`isClosed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_yelpId_unique` UNIQUE(`yelpId`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`code` varchar(100),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `yelpId_idx` ON `businesses` (`yelpId`);--> statement-breakpoint
CREATE INDEX `business_idx` ON `deals` (`businessId`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `deals` (`isActive`);--> statement-breakpoint
CREATE INDEX `user_business_idx` ON `favorites` (`userId`,`businessId`);--> statement-breakpoint
CREATE INDEX `business_idx` ON `reviews` (`businessId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `reviews` (`userId`);