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

export async function createLicenseKey(data: Partial<InsertLicenseKey> & { createdBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const licenseKey = generateLicenseKey();
  const values: InsertLicenseKey = {
    licenseKey,
    status: data.status || 'pending',
    assignedTo: data.assignedTo || null,
    assignedEmail: data.assignedEmail || null,
    maxActivations: data.maxActivations || 1,
    expiresAt: data.expiresAt || null,
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
