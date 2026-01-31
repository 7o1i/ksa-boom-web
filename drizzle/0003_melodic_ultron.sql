ALTER TABLE `license_keys` ADD `planId` int;--> statement-breakpoint
ALTER TABLE `license_keys` ADD `issuedAt` timestamp DEFAULT (now());