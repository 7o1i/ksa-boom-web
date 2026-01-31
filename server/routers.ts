import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Subscription Plans (Public)
  plans: router({
    list: publicProcedure.query(async () => {
      return db.getSubscriptionPlans(true);
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSubscriptionPlanById(input.id);
      }),
  }),

  // Orders (Public for creating, Admin for managing)
  orders: router({
    // Public: Create a new order
    create: publicProcedure
      .input(z.object({
        customerEmail: z.string().email(),
        customerName: z.string().optional(),
        planId: z.number(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const order = await db.createOrder(input);
        
        // Get plan details
        const plan = await db.getSubscriptionPlanById(input.planId);
        
        // Send notification to admin
        await notifyOwner({
          title: `New Order: ${order.orderNumber}`,
          content: `New subscription order received!\n\nOrder: ${order.orderNumber}\nCustomer: ${input.customerName || 'N/A'}\nEmail: ${input.customerEmail}\nPlan: ${plan?.name || 'Unknown'}\nAmount: ${order.amount} ${order.currency}\n\nPlease verify payment and confirm the order in the admin dashboard.`,
        });

        // Create notification for admin dashboard
        await db.createNotification({
          type: 'license',
          title: 'New Order Received',
          message: `Order ${order.orderNumber} from ${input.customerEmail} for ${plan?.name || 'Unknown Plan'}`,
        });

        return {
          orderNumber: order.orderNumber,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
        };
      }),

    // Public: Check order status
    status: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }
        return {
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
        };
      }),

    // Admin: List all orders
    list: adminProcedure
      .input(z.object({ 
        limit: z.number().optional(), 
        offset: z.number().optional(),
        status: z.string().optional()
      }).optional())
      .query(async ({ input }) => {
        return db.getOrders(input?.limit || 100, input?.offset || 0, input?.status);
      }),

    // Admin: Get order details
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOrderById(input.id);
      }),

    // Admin: Confirm order and generate license
    confirm: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.confirmOrder(input.id, ctx.user.id);
        
        // Send license key to customer via notification
        await notifyOwner({
          title: `Order Confirmed: ${result.order?.orderNumber}`,
          content: `Order has been confirmed!\n\nLicense Key: ${result.license.licenseKey}\nCustomer Email: ${result.order?.customerEmail}\n\nPlease send the license key to the customer.`,
        });

        return result;
      }),

    // Admin: Cancel order
    cancel: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.cancelOrder(input.id);
        return { success: true };
      }),

    // Admin: Order statistics
    stats: adminProcedure.query(async () => {
      return db.getOrderStats();
    }),
  }),

  // Subscriptions (Admin only)
  subscriptions: router({
    list: adminProcedure
      .input(z.object({ 
        limit: z.number().optional(), 
        offset: z.number().optional(),
        status: z.string().optional()
      }).optional())
      .query(async ({ input }) => {
        return db.getSubscriptions(input?.limit || 100, input?.offset || 0, input?.status);
      }),

    extend: adminProcedure
      .input(z.object({ 
        id: z.number(),
        additionalDays: z.number().min(1)
      }))
      .mutation(async ({ input }) => {
        await db.extendSubscription(input.id, input.additionalDays);
        return { success: true };
      }),

    expire: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.expireSubscription(input.id);
        return { success: true };
      }),

    checkExpired: adminProcedure.mutation(async () => {
      const count = await db.checkAndExpireSubscriptions();
      return { expiredCount: count };
    }),
  }),

  // License Key Management (Admin only)
  license: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getLicenseKeys(input?.limit || 100, input?.offset || 0);
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getLicenseKeyById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        assignedTo: z.string().optional(),
        assignedEmail: z.string().email().optional(),
        maxActivations: z.number().min(1).default(1),
        expiresAt: z.date().optional(),
        notes: z.string().optional(),
        status: z.enum(['active', 'pending', 'expired', 'revoked']).default('pending'),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createLicenseKey({
          ...input,
          createdBy: ctx.user.id,
        });
        return result;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        assignedTo: z.string().optional().nullable(),
        assignedEmail: z.string().email().optional().nullable(),
        maxActivations: z.number().min(1).optional(),
        expiresAt: z.date().optional().nullable(),
        notes: z.string().optional().nullable(),
        status: z.enum(['active', 'pending', 'expired', 'revoked']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateLicenseKey(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteLicenseKey(input.id);
      }),

    stats: adminProcedure.query(async () => {
      return db.getLicenseKeyStats();
    }),

    activationHistory: adminProcedure
      .input(z.object({ licenseKeyId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getActivationHistory(input.licenseKeyId, input.limit || 50);
      }),

    recentActivations: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getRecentActivations(input?.limit || 50);
      }),
  }),

  // Security Events (Admin only)
  security: router({
    events: adminProcedure
      .input(z.object({ 
        limit: z.number().optional(), 
        offset: z.number().optional(),
        unresolvedOnly: z.boolean().optional()
      }).optional())
      .query(async ({ input }) => {
        return db.getSecurityEvents(
          input?.limit || 100, 
          input?.offset || 0,
          input?.unresolvedOnly || false
        );
      }),

    resolve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.resolveSecurityEvent(input.id, ctx.user.id);
        return { success: true };
      }),

    stats: adminProcedure.query(async () => {
      return db.getSecurityEventStats();
    }),
  }),

  // Notifications (Admin only)
  notifications: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        return db.getNotifications(ctx.user.id, input?.limit || 50);
      }),

    markRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),

    unreadCount: adminProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
  }),

  // Dashboard Stats (Admin only)
  dashboard: router({
    stats: adminProcedure.query(async () => {
      const baseStats = await db.getDashboardStats();
      const orderStats = await db.getOrderStats();
      return {
        ...baseStats,
        orders: orderStats,
      };
    }),

    downloadStats: adminProcedure.query(async () => {
      return db.getDownloadStats();
    }),

    activeApps: adminProcedure.query(async () => {
      return db.getActiveApps();
    }),
  }),

  // Settings (Admin only)
  settings: router({
    get: adminProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getSetting(input.key);
      }),

    set: adminProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        await db.setSetting(input.key, input.value);
        return { success: true };
      }),

    initPlans: adminProcedure.mutation(async () => {
      await db.initializeDefaultPlans();
      return { success: true };
    }),
  }),

  // Public API for Windows Application
  api: router({
    // Validate license key
    validateLicense: publicProcedure
      .input(z.object({
        licenseKey: z.string(),
        hwid: z.string().optional(),
        machineName: z.string().optional(),
        osVersion: z.string().optional(),
        appVersion: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ipAddress = ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
        
        // Check for brute force
        const isBruteForce = await db.checkBruteForceAttempt(ipAddress);
        if (isBruteForce) {
          await db.createSecurityEvent({
            eventType: 'brute_force_attempt',
            severity: 'critical',
            ipAddress,
            attemptedKey: input.licenseKey.substring(0, 10) + '...',
            details: 'Too many failed activation attempts from this IP',
          });
          await db.createNotification({
            type: 'security',
            title: 'Brute Force Attempt Detected',
            message: `Multiple failed activation attempts from IP: ${ipAddress}`,
          });
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please try again later.' });
        }

        const license = await db.getLicenseKeyByKey(input.licenseKey);
        
        if (!license) {
          await db.createSecurityEvent({
            eventType: 'invalid_key',
            severity: 'medium',
            ipAddress,
            attemptedKey: input.licenseKey,
            details: 'Attempted activation with invalid license key',
          });
          await db.recordActivation({
            licenseKeyId: 0,
            ipAddress,
            hwid: input.hwid,
            machineName: input.machineName,
            osVersion: input.osVersion,
            appVersion: input.appVersion,
            success: false,
            failureReason: 'Invalid license key',
          });
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid license key' });
        }

        // Check license status
        if (license.status === 'revoked') {
          await db.createSecurityEvent({
            eventType: 'revoked_key_attempt',
            severity: 'high',
            ipAddress,
            licenseKeyId: license.id,
            details: 'Attempted activation with revoked license key',
          });
          throw new TRPCError({ code: 'FORBIDDEN', message: 'This license has been revoked' });
        }

        if (license.status === 'expired' || (license.expiresAt && license.expiresAt < new Date())) {
          await db.createSecurityEvent({
            eventType: 'expired_key_attempt',
            severity: 'low',
            ipAddress,
            licenseKeyId: license.id,
            details: 'Attempted activation with expired license key',
          });
          throw new TRPCError({ code: 'FORBIDDEN', message: 'This license has expired' });
        }

        if (license.status === 'pending') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'This license is not yet activated' });
        }

        // Check HWID mismatch (if previously activated)
        if (license.lastActivatedHwid && input.hwid && license.lastActivatedHwid !== input.hwid) {
          await db.createSecurityEvent({
            eventType: 'hwid_mismatch',
            severity: 'high',
            ipAddress,
            licenseKeyId: license.id,
            details: `HWID mismatch. Expected: ${license.lastActivatedHwid}, Got: ${input.hwid}`,
          });
          await db.createNotification({
            type: 'security',
            title: 'HWID Mismatch Detected',
            message: `License ${license.licenseKey} attempted activation from different hardware`,
          });
        }

        // Check max activations
        if (license.currentActivations >= license.maxActivations) {
          // Allow if same HWID
          if (license.lastActivatedHwid !== input.hwid) {
            await db.createSecurityEvent({
              eventType: 'multiple_ip_activation',
              severity: 'medium',
              ipAddress,
              licenseKeyId: license.id,
              details: 'Max activations reached',
            });
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Maximum activations reached for this license' });
          }
        }

        // Successful activation
        const isNewActivation = !license.lastActivatedHwid || license.lastActivatedHwid !== input.hwid;
        
        await db.updateLicenseKey(license.id, {
          lastActivatedAt: new Date(),
          lastActivatedIp: ipAddress,
          lastActivatedHwid: input.hwid || license.lastActivatedHwid,
          currentActivations: isNewActivation ? license.currentActivations + 1 : license.currentActivations,
        });

        await db.recordActivation({
          licenseKeyId: license.id,
          ipAddress,
          hwid: input.hwid,
          machineName: input.machineName,
          osVersion: input.osVersion,
          appVersion: input.appVersion,
          success: true,
        });

        return {
          valid: true,
          expiresAt: license.expiresAt,
          assignedTo: license.assignedTo,
        };
      }),

    // Report app status
    reportStatus: publicProcedure
      .input(z.object({
        licenseKey: z.string(),
        hwid: z.string().optional(),
        appVersion: z.string().optional(),
        osVersion: z.string().optional(),
        status: z.enum(['running', 'idle', 'error']),
        errorMessage: z.string().optional(),
        uptimeSeconds: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ipAddress = ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
        
        const license = await db.getLicenseKeyByKey(input.licenseKey);
        if (!license) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid license key' });
        }

        await db.recordAppStatus({
          licenseKeyId: license.id,
          ipAddress,
          hwid: input.hwid,
          appVersion: input.appVersion,
          osVersion: input.osVersion,
          status: input.status,
          errorMessage: input.errorMessage,
          uptimeSeconds: input.uptimeSeconds,
        });

        return { success: true };
      }),

    // Track download
    trackDownload: publicProcedure
      .input(z.object({
        appVersion: z.string().optional(),
      }).optional())
      .mutation(async ({ input, ctx }) => {
        const ipAddress = ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
        const userAgent = ctx.req.headers['user-agent'] || '';
        const referrer = ctx.req.headers['referer'] || '';

        await db.recordDownload({
          ipAddress,
          userAgent,
          referrer,
          appVersion: input?.appVersion || '1.0.0',
        });

        return { success: true };
      }),

    // Enhanced license validation for Windows app (returns more details)
    checkLicense: publicProcedure
      .input(z.object({
        licenseKey: z.string(),
        hwid: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const ipAddress = ctx.req.ip || ctx.req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
        const result = await db.validateLicenseForApp(input.licenseKey, input.hwid, ipAddress);
        return result;
      }),

    // Get licenses expiring soon (for admin notifications)
    expiringLicenses: adminProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(7) }).optional())
      .query(async ({ input }) => {
        return db.getLicensesExpiringWithin(input?.days || 7);
      }),
  }),

  // Cron/Maintenance endpoints (Admin only)
  maintenance: router({
    // Manually trigger license expiration check
    expireLicenses: adminProcedure.mutation(async () => {
      const { triggerExpirationCheck } = await import('./cron');
      const result = await triggerExpirationCheck();
      return result;
    }),

    // Manually trigger cleanup of old expired licenses
    cleanupExpired: adminProcedure
      .input(z.object({ daysOld: z.number().min(1).default(30) }).optional())
      .mutation(async ({ input }) => {
        const { triggerCleanup } = await import('./cron');
        const result = await triggerCleanup(input?.daysOld || 30);
        return result;
      }),

    // Get licenses that will expire soon
    expiringLicenses: adminProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(7) }).optional())
      .query(async ({ input }) => {
        const { getExpiringLicenses } = await import('./cron');
        return getExpiringLicenses(input?.days || 7);
      }),
  }),
});

export type AppRouter = typeof appRouter;
