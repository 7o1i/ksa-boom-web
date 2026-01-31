import { eq, desc, and, gte, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  licenseKeys, InsertLicenseKey, LicenseKey,
  licenseActivations, InsertLicenseActivation,
  securityEvents, InsertSecurityEvent,
  downloads, InsertDownload,
  appStatusReports, InsertAppStatusReport,
  notifications, InsertNotification,
  appSettings
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ LICENSE KEY OPERATIONS ============

export function generateLicenseKey(): string {
  const segments = [
    nanoid(5).toUpperCase(),
    nanoid(5).toUpperCase(),
    nanoid(5).toUpperCase(),
    nanoid(5).toUpperCase()
  ];
  return segments.join('-');
}

export async function createLicenseKey(data: Partial<InsertLicenseKey> & { createdBy?: number; planId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const licenseKey = generateLicenseKey();
  
  // Calculate expiration date from plan if planId is provided
  let expiresAt = data.expiresAt || null;
  let planId = data.planId || null;
  
  if (planId && !expiresAt) {
    const plan = await getSubscriptionPlanById(planId);
    if (plan) {
      expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
    }
  }
  
  const values: InsertLicenseKey = {
    licenseKey,
    status: data.status || 'pending',
    planId: planId,
    assignedTo: data.assignedTo || null,
    assignedEmail: data.assignedEmail || null,
    maxActivations: data.maxActivations || 1,
    issuedAt: new Date(),
    expiresAt: expiresAt,
    notes: data.notes || null,
    createdBy: data.createdBy || null,
  };

  await db.insert(licenseKeys).values(values);
  return values;
}

export async function getLicenseKeys(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt)).limit(limit).offset(offset);
}

export async function getLicenseKeyById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
  return result[0] || null;
}

export async function getLicenseKeyByKey(key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.licenseKey, key)).limit(1);
  return result[0] || null;
}

export async function updateLicenseKey(id: number, data: Partial<LicenseKey>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id: _, createdAt, ...updateData } = data;
  await db.update(licenseKeys).set(updateData).where(eq(licenseKeys.id, id));
  return getLicenseKeyById(id);
}

export async function deleteLicenseKey(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(licenseKeys).where(eq(licenseKeys.id, id));
  return { success: true };
}

export async function getLicenseKeyStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [total] = await db.select({ count: count() }).from(licenseKeys);
  const [active] = await db.select({ count: count() }).from(licenseKeys).where(eq(licenseKeys.status, 'active'));
  const [pending] = await db.select({ count: count() }).from(licenseKeys).where(eq(licenseKeys.status, 'pending'));
  const [expired] = await db.select({ count: count() }).from(licenseKeys).where(eq(licenseKeys.status, 'expired'));
  const [revoked] = await db.select({ count: count() }).from(licenseKeys).where(eq(licenseKeys.status, 'revoked'));

  return {
    total: total?.count || 0,
    active: active?.count || 0,
    pending: pending?.count || 0,
    expired: expired?.count || 0,
    revoked: revoked?.count || 0,
  };
}

// ============ LICENSE ACTIVATION OPERATIONS ============

export async function recordActivation(data: InsertLicenseActivation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(licenseActivations).values(data);
}

export async function getActivationHistory(licenseKeyId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select()
    .from(licenseActivations)
    .where(eq(licenseActivations.licenseKeyId, licenseKeyId))
    .orderBy(desc(licenseActivations.createdAt))
    .limit(limit);
}

export async function getRecentActivations(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select()
    .from(licenseActivations)
    .orderBy(desc(licenseActivations.createdAt))
    .limit(limit);
}

// ============ SECURITY EVENT OPERATIONS ============

export async function createSecurityEvent(data: InsertSecurityEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(securityEvents).values(data);
  return result;
}

export async function getSecurityEvents(limit = 100, offset = 0, unresolvedOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (unresolvedOnly) {
    return db.select()
      .from(securityEvents)
      .where(eq(securityEvents.resolved, false))
      .orderBy(desc(securityEvents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db.select()
    .from(securityEvents)
    .orderBy(desc(securityEvents.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function resolveSecurityEvent(id: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(securityEvents).set({
    resolved: true,
    resolvedBy,
    resolvedAt: new Date(),
  }).where(eq(securityEvents.id, id));
}

export async function getSecurityEventStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [total] = await db.select({ count: count() }).from(securityEvents);
  const [unresolved] = await db.select({ count: count() }).from(securityEvents).where(eq(securityEvents.resolved, false));
  const [critical] = await db.select({ count: count() }).from(securityEvents).where(
    and(eq(securityEvents.severity, 'critical'), eq(securityEvents.resolved, false))
  );

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recent] = await db.select({ count: count() }).from(securityEvents).where(gte(securityEvents.createdAt, last24h));

  return {
    total: total?.count || 0,
    unresolved: unresolved?.count || 0,
    critical: critical?.count || 0,
    last24h: recent?.count || 0,
  };
}

export async function checkBruteForceAttempt(ipAddress: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const [result] = await db.select({ count: count() })
    .from(securityEvents)
    .where(
      and(
        eq(securityEvents.ipAddress, ipAddress),
        eq(securityEvents.eventType, 'failed_activation'),
        gte(securityEvents.createdAt, fiveMinutesAgo)
      )
    );

  return (result?.count || 0) >= 5;
}

// ============ DOWNLOAD OPERATIONS ============

export async function recordDownload(data: InsertDownload) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(downloads).values(data);
}

export async function getDownloadStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [total] = await db.select({ count: count() }).from(downloads);
  
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [today] = await db.select({ count: count() }).from(downloads).where(gte(downloads.createdAt, last24h));
  
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [week] = await db.select({ count: count() }).from(downloads).where(gte(downloads.createdAt, last7d));

  return {
    total: total?.count || 0,
    today: today?.count || 0,
    thisWeek: week?.count || 0,
  };
}

// ============ APP STATUS OPERATIONS ============

export async function recordAppStatus(data: InsertAppStatusReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(appStatusReports).values(data);
}

export async function getActiveApps() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return db.select()
    .from(appStatusReports)
    .where(gte(appStatusReports.createdAt, fiveMinutesAgo))
    .orderBy(desc(appStatusReports.createdAt));
}

// ============ NOTIFICATION OPERATIONS ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notifications).values(data);
}

export async function getNotifications(userId?: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (userId) {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  return db.select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function getUnreadNotificationCount(userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (userId) {
    const [result] = await db.select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result?.count || 0;
  }

  const [result] = await db.select({ count: count() })
    .from(notifications)
    .where(eq(notifications.read, false));
  return result?.count || 0;
}

// ============ SETTINGS OPERATIONS ============

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.select().from(appSettings).where(eq(appSettings.settingKey, key)).limit(1);
  return result?.settingValue || null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(appSettings).values({ settingKey: key, settingValue: value })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });
}

// ============ DASHBOARD STATS ============

export async function getDashboardStats() {
  const licenseStats = await getLicenseKeyStats();
  const downloadStats = await getDownloadStats();
  const securityStats = await getSecurityEventStats();

  return {
    licenses: licenseStats,
    downloads: downloadStats,
    security: securityStats,
  };
}


// ============ SUBSCRIPTION PLAN OPERATIONS ============

import { 
  subscriptionPlans, InsertSubscriptionPlan, SubscriptionPlan,
  orders, InsertOrder, Order,
  subscriptions, InsertSubscription, Subscription
} from "../drizzle/schema";

export async function getSubscriptionPlans(activeOnly = true) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (activeOnly) {
    return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }
  return db.select().from(subscriptionPlans);
}

export async function getSubscriptionPlanById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result || null;
}

export async function createSubscriptionPlan(data: InsertSubscriptionPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(subscriptionPlans).values(data);
}

export async function initializeDefaultPlans() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(subscriptionPlans).limit(1);
  if (existing.length > 0) return;

  const defaultPlans: InsertSubscriptionPlan[] = [
    {
      name: "Weekly Plan",
      duration: "weekly",
      durationDays: 7,
      price: 18,
      currency: "SAR",
      features: JSON.stringify(["Full access to all features", "Color detection", "Multi-monitor support", "Email support"]),
      isActive: true,
    },
    {
      name: "Monthly Plan",
      duration: "monthly",
      durationDays: 30,
      price: 55,
      currency: "SAR",
      features: JSON.stringify(["Full access to all features", "Color detection", "Multi-monitor support", "Priority email support", "Free updates"]),
      isActive: true,
    },
    {
      name: "Yearly Plan",
      duration: "yearly",
      durationDays: 365,
      price: 290,
      currency: "SAR",
      features: JSON.stringify(["Full access to all features", "Color detection", "Multi-monitor support", "Priority support", "Free updates", "2 months free"]),
      isActive: true,
    },
  ];

  for (const plan of defaultPlans) {
    await db.insert(subscriptionPlans).values(plan);
  }
}

// ============ ORDER OPERATIONS ============

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(6).toUpperCase();
  return `KSA-${timestamp}-${random}`;
}

export async function createOrder(data: { customerEmail: string; customerName?: string; planId: number; paymentMethod?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const plan = await getSubscriptionPlanById(data.planId);
  if (!plan) throw new Error("Invalid subscription plan");

  const orderNumber = generateOrderNumber();
  const values: InsertOrder = {
    orderNumber,
    customerEmail: data.customerEmail,
    customerName: data.customerName || null,
    planId: data.planId,
    amount: plan.price,
    currency: plan.currency,
    status: "pending",
    paymentMethod: data.paymentMethod || null,
  };

  await db.insert(orders).values(values);
  
  // Return the created order
  const [created] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return created;
}

export async function getOrders(limit = 100, offset = 0, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status) {
    return db.select()
      .from(orders)
      .where(eq(orders.status, status as any))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result || null;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result || null;
}

export async function confirmOrder(orderId: number, confirmedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending") throw new Error("Order is not pending");

  const plan = await getSubscriptionPlanById(order.planId);
  if (!plan) throw new Error("Plan not found");

  // Generate license key with plan-based expiration
  const license = await createLicenseKey({
    assignedTo: order.customerName,
    assignedEmail: order.customerEmail,
    status: "active",
    planId: plan.id,
    maxActivations: 1,
    expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
    notes: `Order: ${order.orderNumber} | Plan: ${plan.name}`,
    createdBy: confirmedBy,
  });

  // Get the license ID
  const licenseRecord = await getLicenseKeyByKey(license.licenseKey);
  if (!licenseRecord) throw new Error("Failed to create license");

  // Update order status
  await db.update(orders).set({
    status: "confirmed",
    confirmedBy,
    confirmedAt: new Date(),
    licenseKeyId: licenseRecord.id,
  }).where(eq(orders.id, orderId));

  // Create subscription record
  const startDate = new Date();
  const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
  
  await db.insert(subscriptions).values({
    orderId: order.id,
    licenseKeyId: licenseRecord.id,
    planId: plan.id,
    customerEmail: order.customerEmail,
    status: "active",
    startDate,
    endDate,
    autoRenew: false,
  });

  return {
    order: await getOrderById(orderId),
    license: licenseRecord,
  };
}

export async function cancelOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
}

export async function getOrderStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [total] = await db.select({ count: count() }).from(orders);
  const [pending] = await db.select({ count: count() }).from(orders).where(eq(orders.status, "pending"));
  const [confirmed] = await db.select({ count: count() }).from(orders).where(eq(orders.status, "confirmed"));
  
  // Calculate revenue from confirmed orders
  const confirmedOrders = await db.select().from(orders).where(eq(orders.status, "confirmed"));
  const totalRevenue = confirmedOrders.reduce((sum, order) => sum + order.amount, 0);

  return {
    total: total?.count || 0,
    pending: pending?.count || 0,
    confirmed: confirmed?.count || 0,
    totalRevenue,
  };
}

// ============ SUBSCRIPTION OPERATIONS ============

export async function getSubscriptions(limit = 100, offset = 0, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status) {
    return db.select()
      .from(subscriptions)
      .where(eq(subscriptions.status, status as any))
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)).limit(limit).offset(offset);
}

export async function getSubscriptionByLicenseId(licenseKeyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.select().from(subscriptions).where(eq(subscriptions.licenseKeyId, licenseKeyId)).limit(1);
  return result || null;
}

export async function expireSubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub) throw new Error("Subscription not found");

  // Update subscription status
  await db.update(subscriptions).set({ status: "expired" }).where(eq(subscriptions.id, subscriptionId));

  // Update license status
  await db.update(licenseKeys).set({ status: "expired" }).where(eq(licenseKeys.id, sub.licenseKeyId));
}

export async function extendSubscription(subscriptionId: number, additionalDays: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub) throw new Error("Subscription not found");

  const newEndDate = new Date(sub.endDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
  
  // Update subscription
  await db.update(subscriptions).set({ 
    endDate: newEndDate,
    status: "active" 
  }).where(eq(subscriptions.id, subscriptionId));

  // Update license expiration
  await db.update(licenseKeys).set({ 
    expiresAt: newEndDate,
    status: "active"
  }).where(eq(licenseKeys.id, sub.licenseKeyId));
}

export async function checkAndExpireSubscriptions() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  
  // Find active subscriptions that have expired
  const expiredSubs = await db.select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.status, "active"),
      sql`${subscriptions.endDate} < ${now}`
    ));

  for (const sub of expiredSubs) {
    await expireSubscription(sub.id);
  }

  return expiredSubs.length;
}


// ============ LICENSE EXPIRATION OPERATIONS ============

/**
 * Check and expire all licenses that have passed their expiration date
 * This should be called periodically (e.g., via cron job)
 */
export async function checkAndExpireLicenses() {
  const db = await getDb();
  if (!db) return { expired: 0, removed: 0 };

  const now = new Date();
  
  // Find active licenses that have expired
  const expiredLicenses = await db.select()
    .from(licenseKeys)
    .where(and(
      eq(licenseKeys.status, "active"),
      sql`${licenseKeys.expiresAt} IS NOT NULL AND ${licenseKeys.expiresAt} < ${now}`
    ));

  // Mark them as expired
  for (const license of expiredLicenses) {
    await db.update(licenseKeys).set({ status: "expired" }).where(eq(licenseKeys.id, license.id));
  }

  return { expired: expiredLicenses.length, removed: 0 };
}

/**
 * Remove expired licenses that have been expired for more than X days
 * @param daysOld - Number of days after expiration before removal (default: 30)
 */
export async function removeOldExpiredLicenses(daysOld: number = 30) {
  const db = await getDb();
  if (!db) return { removed: 0 };

  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  // Find expired licenses older than cutoff
  const oldLicenses = await db.select()
    .from(licenseKeys)
    .where(and(
      eq(licenseKeys.status, "expired"),
      sql`${licenseKeys.expiresAt} IS NOT NULL AND ${licenseKeys.expiresAt} < ${cutoffDate}`
    ));

  // Delete them
  for (const license of oldLicenses) {
    // First delete related records
    await db.delete(licenseActivations).where(eq(licenseActivations.licenseKeyId, license.id));
    await db.delete(appStatusReports).where(eq(appStatusReports.licenseKeyId, license.id));
    // Then delete the license
    await db.delete(licenseKeys).where(eq(licenseKeys.id, license.id));
  }

  return { removed: oldLicenses.length };
}

/**
 * Get licenses that are about to expire (within X days)
 * @param days - Number of days until expiration (default: 7)
 */
export async function getLicensesExpiringWithin(days: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  return db.select()
    .from(licenseKeys)
    .where(and(
      eq(licenseKeys.status, "active"),
      sql`${licenseKeys.expiresAt} IS NOT NULL AND ${licenseKeys.expiresAt} > ${now} AND ${licenseKeys.expiresAt} < ${futureDate}`
    ))
    .orderBy(licenseKeys.expiresAt);
}

/**
 * Validate a license key for the Windows application
 * Returns detailed validation result
 */
export async function validateLicenseForApp(key: string, hwid?: string, ipAddress?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const license = await getLicenseKeyByKey(key);
  
  if (!license) {
    return {
      valid: false,
      error: "INVALID_KEY",
      message: "License key not found",
    };
  }

  // Check if expired
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    // Auto-expire the license
    await db.update(licenseKeys).set({ status: "expired" }).where(eq(licenseKeys.id, license.id));
    return {
      valid: false,
      error: "EXPIRED",
      message: "License has expired",
      expiresAt: license.expiresAt,
    };
  }

  // Check status
  if (license.status === "expired") {
    return {
      valid: false,
      error: "EXPIRED",
      message: "License has expired",
      expiresAt: license.expiresAt,
    };
  }

  if (license.status === "revoked") {
    return {
      valid: false,
      error: "REVOKED",
      message: "License has been revoked",
    };
  }

  if (license.status === "pending") {
    return {
      valid: false,
      error: "PENDING",
      message: "License is pending activation",
    };
  }

  // Check activation limit
  if (license.currentActivations >= license.maxActivations) {
    // If HWID matches, allow
    if (hwid && license.lastActivatedHwid === hwid) {
      // Same machine, allow
    } else {
      return {
        valid: false,
        error: "MAX_ACTIVATIONS",
        message: "Maximum activations reached",
        currentActivations: license.currentActivations,
        maxActivations: license.maxActivations,
      };
    }
  }

  // Get plan info if available
  let planName = null;
  if (license.planId) {
    const plan = await getSubscriptionPlanById(license.planId);
    planName = plan?.name || null;
  }

  // License is valid
  return {
    valid: true,
    licenseKey: license.licenseKey,
    status: license.status,
    expiresAt: license.expiresAt,
    daysRemaining: license.expiresAt 
      ? Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null,
    plan: planName,
    assignedTo: license.assignedTo,
    assignedEmail: license.assignedEmail,
    currentActivations: license.currentActivations,
    maxActivations: license.maxActivations,
  };
}
