import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  createLicenseKey: vi.fn().mockResolvedValue({
    licenseKey: "TEST-1234-5678-ABCD",
    status: "pending",
    assignedTo: null,
    assignedEmail: null,
    maxActivations: 1,
    currentActivations: 0,
    expiresAt: null,
    notes: null,
    createdBy: 1,
  }),
  getLicenseKeys: vi.fn().mockResolvedValue([
    {
      id: 1,
      licenseKey: "TEST-1234-5678-ABCD",
      status: "active",
      assignedTo: "Test User",
      assignedEmail: "test@example.com",
      maxActivations: 1,
      currentActivations: 0,
      expiresAt: null,
      lastActivatedAt: null,
      lastActivatedIp: null,
      lastActivatedHwid: null,
      notes: null,
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getLicenseKeyById: vi.fn().mockResolvedValue({
    id: 1,
    licenseKey: "TEST-1234-5678-ABCD",
    status: "active",
    assignedTo: "Test User",
    assignedEmail: "test@example.com",
    maxActivations: 1,
    currentActivations: 0,
    expiresAt: null,
    lastActivatedAt: null,
    lastActivatedIp: null,
    lastActivatedHwid: null,
    notes: null,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getLicenseKeyByKey: vi.fn(),
  updateLicenseKey: vi.fn().mockResolvedValue({
    id: 1,
    licenseKey: "TEST-1234-5678-ABCD",
    status: "active",
    assignedTo: "Updated User",
    assignedEmail: "updated@example.com",
    maxActivations: 2,
    currentActivations: 0,
    expiresAt: null,
    lastActivatedAt: null,
    lastActivatedIp: null,
    lastActivatedHwid: null,
    notes: "Updated notes",
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  deleteLicenseKey: vi.fn().mockResolvedValue({ success: true }),
  getLicenseKeyStats: vi.fn().mockResolvedValue({
    total: 10,
    active: 5,
    pending: 3,
    expired: 1,
    revoked: 1,
  }),
  getActivationHistory: vi.fn().mockResolvedValue([]),
  getRecentActivations: vi.fn().mockResolvedValue([]),
  checkBruteForceAttempt: vi.fn().mockResolvedValue(false),
  createSecurityEvent: vi.fn().mockResolvedValue({}),
  recordActivation: vi.fn().mockResolvedValue({}),
  createNotification: vi.fn().mockResolvedValue({}),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Mozilla/5.0",
      },
      ip: "192.168.1.1",
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("license.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to create a license key", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.create({
      maxActivations: 1,
      status: "pending",
    });

    expect(result).toBeDefined();
    expect(result.licenseKey).toBe("TEST-1234-5678-ABCD");
    expect(result.status).toBe("pending");
  });

  it("denies non-admin users from creating licenses", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.license.create({
        maxActivations: 1,
        status: "pending",
      })
    ).rejects.toThrow("Admin access required");
  });
});

describe("license.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to list licenses", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("denies non-admin users from listing licenses", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.license.list()).rejects.toThrow("Admin access required");
  });
});

describe("license.stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns license statistics for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.stats();

    expect(result).toBeDefined();
    expect(result.total).toBe(10);
    expect(result.active).toBe(5);
    expect(result.pending).toBe(3);
    expect(result.expired).toBe(1);
    expect(result.revoked).toBe(1);
  });
});

describe("license.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to update a license", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.update({
      id: 1,
      assignedTo: "Updated User",
      maxActivations: 2,
      status: "active",
    });

    expect(result).toBeDefined();
    expect(result?.assignedTo).toBe("Updated User");
  });
});

describe("license.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to delete a license", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.license.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("api.validateLicense", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid license key", async () => {
    const db = await import("./db");
    (db.getLicenseKeyByKey as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.api.validateLicense({
        licenseKey: "INVALID-KEY",
      })
    ).rejects.toThrow("Invalid license key");
  });

  it("accepts valid active license key", async () => {
    const db = await import("./db");
    (db.getLicenseKeyByKey as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      licenseKey: "VALID-1234-5678-ABCD",
      status: "active",
      maxActivations: 1,
      currentActivations: 0,
      expiresAt: null,
      lastActivatedHwid: null,
      assignedTo: "Test User",
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.api.validateLicense({
      licenseKey: "VALID-1234-5678-ABCD",
      hwid: "test-hwid-123",
    });

    expect(result.valid).toBe(true);
    expect(result.assignedTo).toBe("Test User");
  });

  it("rejects revoked license key", async () => {
    const db = await import("./db");
    (db.getLicenseKeyByKey as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      licenseKey: "REVOKED-KEY",
      status: "revoked",
      maxActivations: 1,
      currentActivations: 0,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.api.validateLicense({
        licenseKey: "REVOKED-KEY",
      })
    ).rejects.toThrow("This license has been revoked");
  });

  it("rejects expired license key", async () => {
    const db = await import("./db");
    (db.getLicenseKeyByKey as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      licenseKey: "EXPIRED-KEY",
      status: "expired",
      maxActivations: 1,
      currentActivations: 0,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.api.validateLicense({
        licenseKey: "EXPIRED-KEY",
      })
    ).rejects.toThrow("This license has expired");
  });

  it("blocks brute force attempts", async () => {
    const db = await import("./db");
    (db.checkBruteForceAttempt as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.api.validateLicense({
        licenseKey: "ANY-KEY",
      })
    ).rejects.toThrow("Too many attempts");
  });
});

describe("api.trackDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks download successfully", async () => {
    const db = await import("./db");
    const recordDownloadMock = vi.fn().mockResolvedValue({});
    (db as any).recordDownload = recordDownloadMock;

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.api.trackDownload({
      appVersion: "1.0.0",
    });

    expect(result.success).toBe(true);
  });
});
