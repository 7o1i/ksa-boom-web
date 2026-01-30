CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(64) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `app_status_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licenseKeyId` int NOT NULL,
	`ipAddress` varchar(45),
	`hwid` varchar(128),
	`appVersion` varchar(32),
	`osVersion` varchar(128),
	`status` enum('running','idle','error') NOT NULL DEFAULT 'running',
	`errorMessage` text,
	`uptimeSeconds` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_status_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`referrer` text,
	`appVersion` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `license_activations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licenseKeyId` int NOT NULL,
	`ipAddress` varchar(45),
	`hwid` varchar(128),
	`machineName` varchar(255),
	`osVersion` varchar(128),
	`appVersion` varchar(32),
	`success` boolean NOT NULL DEFAULT true,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `license_activations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `license_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licenseKey` varchar(64) NOT NULL,
	`status` enum('active','expired','revoked','pending') NOT NULL DEFAULT 'pending',
	`assignedTo` varchar(255),
	`assignedEmail` varchar(320),
	`maxActivations` int NOT NULL DEFAULT 1,
	`currentActivations` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`lastActivatedAt` timestamp,
	`lastActivatedIp` varchar(45),
	`lastActivatedHwid` varchar(128),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `license_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `license_keys_licenseKey_unique` UNIQUE(`licenseKey`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`type` enum('security','license','system','info') NOT NULL DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`relatedEventId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('failed_activation','brute_force_attempt','invalid_key','expired_key_attempt','revoked_key_attempt','suspicious_activity','multiple_ip_activation','hwid_mismatch') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`ipAddress` varchar(45),
	`licenseKeyId` int,
	`attemptedKey` varchar(64),
	`details` text,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_events_id` PRIMARY KEY(`id`)
);
