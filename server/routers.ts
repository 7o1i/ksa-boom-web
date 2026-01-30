import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

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
      return db.getDashboardStats();
    }),

    downloadStats: adminProcedure.query(async () => {
      return db.getDownloadStats();
    }),

    activeApps: adminProcedure.query(async () => {
      return db.getActiveApps();
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
  }),
});

export type AppRouter = typeof appRouter;
