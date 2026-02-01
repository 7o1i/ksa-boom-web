import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startCronScheduler } from "../cron";
import { handleStripeWebhook } from "../stripe/webhook";
import * as db from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook must be registered BEFORE body parsers with raw body
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  
  // Dedicated REST API endpoints for Windows application (bypasses tRPC complexity)
  app.get('/api/license/check', async (req, res) => {
    try {
      const licenseKey = req.query.licenseKey as string;
      const hwid = req.query.hwid as string | undefined;
      
      if (!licenseKey) {
        return res.status(400).json({ valid: false, error: 'License key is required' });
      }
      
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
      const result = await db.validateLicenseForApp(licenseKey, hwid, ipAddress);
      return res.json(result);
    } catch (error: any) {
      console.error('License check error:', error);
      return res.status(500).json({ valid: false, error: error.message || 'Internal server error' });
    }
  });
  
  app.post('/api/license/validate', express.json(), async (req, res) => {
    try {
      const { licenseKey, hwid, machineName, osVersion, appVersion } = req.body;
      
      if (!licenseKey) {
        return res.status(400).json({ valid: false, error: 'License key is required' });
      }
      
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
      
      // Check for brute force
      const isBruteForce = await db.checkBruteForceAttempt(ipAddress);
      if (isBruteForce) {
        await db.createSecurityEvent({
          eventType: 'brute_force_attempt',
          severity: 'critical',
          ipAddress,
          attemptedKey: licenseKey.substring(0, 10) + '...',
          details: 'Too many failed activation attempts from this IP',
        });
        return res.status(429).json({ valid: false, error: 'Too many attempts. Please try again later.' });
      }
      
      const license = await db.getLicenseKeyByKey(licenseKey);
      
      if (!license) {
        await db.createSecurityEvent({
          eventType: 'invalid_key',
          severity: 'medium',
          ipAddress,
          attemptedKey: licenseKey,
          details: 'Attempted activation with invalid license key',
        });
        await db.recordActivation({
          licenseKeyId: 0,
          ipAddress,
          hwid,
          machineName,
          osVersion,
          appVersion,
          success: false,
          failureReason: 'Invalid license key',
        });
        return res.status(404).json({ valid: false, error: 'Invalid license key' });
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
        return res.status(403).json({ valid: false, error: 'This license has been revoked' });
      }
      
      if (license.status === 'expired' || (license.expiresAt && license.expiresAt < new Date())) {
        await db.createSecurityEvent({
          eventType: 'expired_key_attempt',
          severity: 'low',
          ipAddress,
          licenseKeyId: license.id,
          details: 'Attempted activation with expired license key',
        });
        return res.status(403).json({ valid: false, error: 'This license has expired' });
      }
      
      if (license.status === 'pending') {
        return res.status(403).json({ valid: false, error: 'This license is not yet activated' });
      }
      
      // Check max activations
      if (license.currentActivations >= license.maxActivations) {
        if (license.lastActivatedHwid !== hwid) {
          await db.createSecurityEvent({
            eventType: 'multiple_ip_activation',
            severity: 'medium',
            ipAddress,
            licenseKeyId: license.id,
            details: 'Max activations reached',
          });
          return res.status(403).json({ valid: false, error: 'Maximum activations reached for this license' });
        }
      }
      
      // Successful activation
      const isNewActivation = !license.lastActivatedHwid || license.lastActivatedHwid !== hwid;
      
      await db.updateLicenseKey(license.id, {
        lastActivatedAt: new Date(),
        lastActivatedIp: ipAddress,
        lastActivatedHwid: hwid || license.lastActivatedHwid,
        currentActivations: isNewActivation ? license.currentActivations + 1 : license.currentActivations,
      });
      
      await db.recordActivation({
        licenseKeyId: license.id,
        ipAddress,
        hwid,
        machineName,
        osVersion,
        appVersion,
        success: true,
      });
      
      return res.json({
        valid: true,
        expiresAt: license.expiresAt,
        assignedTo: license.assignedTo,
      });
    } catch (error: any) {
      console.error('License validation error:', error);
      return res.status(500).json({ valid: false, error: error.message || 'Internal server error' });
    }
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start the cron scheduler for automatic license expiration
    startCronScheduler();
  });
}

startServer().catch(console.error);
