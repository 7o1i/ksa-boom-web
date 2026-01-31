import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * License keys for the Windows application
 */
export const licenseKeys = mysqlTable("license_keys", {
  id: int("id").autoincrement().primaryKey(),
  licenseKey: varchar("licenseKey", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "expired", "revoked", "pending"]).default("pending").notNull(),
  assignedTo: varchar("assignedTo", { length: 255 }),
  assignedEmail: varchar("assignedEmail", { length: 320 }),
  maxActivations: int("maxActivations").default(1).notNull(),
  currentActivations: int("currentActivations").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  lastActivatedAt: timestamp("lastActivatedAt"),
  lastActivatedIp: varchar("lastActivatedIp", { length: 45 }),
  lastActivatedHwid: varchar("lastActivatedHwid", { length: 128 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type InsertLicenseKey = typeof licenseKeys.$inferInsert;

/**
 * License activation history
 */
export const licenseActivations = mysqlTable("license_activations", {
  id: int("id").autoincrement().primaryKey(),
  licenseKeyId: int("licenseKeyId").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  hwid: varchar("hwid", { length: 128 }),
  machineName: varchar("machineName", { length: 255 }),
  osVersion: varchar("osVersion", { length: 128 }),
  appVersion: varchar("appVersion", { length: 32 }),
  success: boolean("success").default(true).notNull(),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LicenseActivation = typeof licenseActivations.$inferSelect;
export type InsertLicenseActivation = typeof licenseActivations.$inferInsert;

/**
 * Security events for monitoring suspicious activity
 */
export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", [
    "failed_activation",
    "brute_force_attempt",
    "invalid_key",
    "expired_key_attempt",
    "revoked_key_attempt",
    "suspicious_activity",
    "multiple_ip_activation",
    "hwid_mismatch"
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  licenseKeyId: int("licenseKeyId"),
  attemptedKey: varchar("attemptedKey", { length: 64 }),
  details: text("details"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;

/**
 * Application downloads tracking
 */
export const downloads = mysqlTable("downloads", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  referrer: text("referrer"),
  appVersion: varchar("appVersion", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Download = typeof downloads.$inferSelect;
export type InsertDownload = typeof downloads.$inferInsert;

/**
 * Application status reports from Windows clients
 */
export const appStatusReports = mysqlTable("app_status_reports", {
  id: int("id").autoincrement().primaryKey(),
  licenseKeyId: int("licenseKeyId").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  hwid: varchar("hwid", { length: 128 }),
  appVersion: varchar("appVersion", { length: 32 }),
  osVersion: varchar("osVersion", { length: 128 }),
  status: mysqlEnum("status", ["running", "idle", "error"]).default("running").notNull(),
  errorMessage: text("errorMessage"),
  uptimeSeconds: bigint("uptimeSeconds", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppStatusReport = typeof appStatusReports.$inferSelect;
export type InsertAppStatusReport = typeof appStatusReports.$inferInsert;

/**
 * Admin notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  type: mysqlEnum("type", ["security", "license", "system", "info"]).default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  relatedEventId: int("relatedEventId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * App settings/configuration
 */
export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 64 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;


/**
 * Subscription plans configuration
 */
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  duration: mysqlEnum("duration", ["weekly", "monthly", "yearly"]).notNull(),
  durationDays: int("durationDays").notNull(),
  price: int("price").notNull(), // Price in SAR (smallest unit)
  currency: varchar("currency", { length: 3 }).default("SAR").notNull(),
  features: text("features"), // JSON array of features
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * Customer orders/purchases
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  planId: int("planId").notNull(),
  amount: int("amount").notNull(), // Amount in SAR
  currency: varchar("currency", { length: 3 }).default("SAR").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  paymentReference: varchar("paymentReference", { length: 255 }),
  notes: text("notes"),
  confirmedBy: int("confirmedBy"),
  confirmedAt: timestamp("confirmedAt"),
  licenseKeyId: int("licenseKeyId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Customer subscriptions (active subscriptions linked to licenses)
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  licenseKeyId: int("licenseKeyId").notNull(),
  planId: int("planId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  autoRenew: boolean("autoRenew").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
