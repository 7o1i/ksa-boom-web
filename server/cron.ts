/**
 * Cron Job Scheduler for License Expiration
 * 
 * This module handles automatic license expiration and cleanup.
 * It runs periodically to:
 * 1. Mark expired licenses as "expired"
 * 2. Remove old expired licenses from the system
 * 3. Check and expire subscriptions
 */

import { 
  checkAndExpireLicenses, 
  removeOldExpiredLicenses, 
  checkAndExpireSubscriptions,
  getLicensesExpiringWithin
} from './db';

// Store interval IDs for cleanup
let expirationIntervalId: NodeJS.Timeout | null = null;
let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Run the license expiration check
 * This marks active licenses as expired if their expiresAt date has passed
 */
export async function runExpirationCheck() {
  try {
    console.log('[Cron] Running license expiration check...');
    
    // Check and expire licenses
    const licenseResult = await checkAndExpireLicenses();
    console.log(`[Cron] Expired ${licenseResult.expired} licenses`);
    
    // Check and expire subscriptions
    const subCount = await checkAndExpireSubscriptions();
    console.log(`[Cron] Expired ${subCount || 0} subscriptions`);
    
    return {
      licensesExpired: licenseResult.expired,
      subscriptionsExpired: subCount || 0,
    };
  } catch (error) {
    console.error('[Cron] Error during expiration check:', error);
    throw error;
  }
}

/**
 * Run the cleanup job to remove old expired licenses
 * @param daysOld - Number of days after expiration before removal (default: 30)
 */
export async function runCleanupJob(daysOld: number = 30) {
  try {
    console.log(`[Cron] Running cleanup job (removing licenses expired > ${daysOld} days)...`);
    
    const result = await removeOldExpiredLicenses(daysOld);
    console.log(`[Cron] Removed ${result.removed} old expired licenses`);
    
    return result;
  } catch (error) {
    console.error('[Cron] Error during cleanup:', error);
    throw error;
  }
}

/**
 * Get licenses expiring soon for notification purposes
 * @param days - Number of days to look ahead (default: 7)
 */
export async function getExpiringLicenses(days: number = 7) {
  try {
    const licenses = await getLicensesExpiringWithin(days);
    return licenses;
  } catch (error) {
    console.error('[Cron] Error getting expiring licenses:', error);
    return [];
  }
}

/**
 * Start the cron scheduler
 * - Expiration check runs every hour
 * - Cleanup runs once per day
 */
export function startCronScheduler() {
  console.log('[Cron] Starting cron scheduler...');
  
  // Run expiration check every hour (3600000 ms)
  expirationIntervalId = setInterval(async () => {
    await runExpirationCheck();
  }, 60 * 60 * 1000); // Every hour
  
  // Run cleanup once per day (86400000 ms)
  cleanupIntervalId = setInterval(async () => {
    await runCleanupJob(30); // Remove licenses expired > 30 days
  }, 24 * 60 * 60 * 1000); // Every 24 hours
  
  // Run initial check on startup (after 10 seconds to let DB connect)
  setTimeout(async () => {
    console.log('[Cron] Running initial expiration check...');
    await runExpirationCheck();
  }, 10000);
  
  console.log('[Cron] Scheduler started:');
  console.log('  - Expiration check: every hour');
  console.log('  - Cleanup job: every 24 hours');
}

/**
 * Stop the cron scheduler
 */
export function stopCronScheduler() {
  console.log('[Cron] Stopping cron scheduler...');
  
  if (expirationIntervalId) {
    clearInterval(expirationIntervalId);
    expirationIntervalId = null;
  }
  
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
  
  console.log('[Cron] Scheduler stopped');
}

/**
 * Manual trigger for expiration check (for admin use)
 */
export async function triggerExpirationCheck() {
  return runExpirationCheck();
}

/**
 * Manual trigger for cleanup (for admin use)
 */
export async function triggerCleanup(daysOld: number = 30) {
  return runCleanupJob(daysOld);
}
