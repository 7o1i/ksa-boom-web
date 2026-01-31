CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`planId` int NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'SAR',
	`status` enum('pending','confirmed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(64),
	`paymentReference` varchar(255),
	`notes` text,
	`confirmedBy` int,
	`confirmedAt` timestamp,
	`licenseKeyId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`duration` enum('weekly','monthly','yearly') NOT NULL,
	`durationDays` int NOT NULL,
	`price` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'SAR',
	`features` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`licenseKeyId` int NOT NULL,
	`planId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`autoRenew` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
