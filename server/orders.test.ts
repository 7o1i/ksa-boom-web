import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getSubscriptionPlans: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Weekly Plan",
      duration: "weekly",
      durationDays: 7,
      price: 18,
      currency: "SAR",
      features: JSON.stringify(["Full access"]),
      isActive: true,
    },
    {
      id: 2,
      name: "Monthly Plan",
      duration: "monthly",
      durationDays: 30,
      price: 55,
      currency: "SAR",
      features: JSON.stringify(["Full access", "Priority support"]),
      isActive: true,
    },
  ]),
  getSubscriptionPlanById: vi.fn().mockImplementation((id: number) => {
    const plans: Record<number, any> = {
      1: { id: 1, name: "Weekly Plan", duration: "weekly", durationDays: 7, price: 18, currency: "SAR" },
      2: { id: 2, name: "Monthly Plan", duration: "monthly", durationDays: 30, price: 55, currency: "SAR" },
    };
    return Promise.resolve(plans[id] || null);
  }),
  createOrder: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: "KSA-TEST-123456",
    customerEmail: "test@example.com",
    customerName: "Test User",
    planId: 1,
    amount: 18,
    currency: "SAR",
    status: "pending",
    createdAt: new Date(),
  }),
  getOrderByNumber: vi.fn().mockImplementation((orderNumber: string) => {
    if (orderNumber === "KSA-TEST-123456") {
      return Promise.resolve({
        id: 1,
        orderNumber: "KSA-TEST-123456",
        customerEmail: "test@example.com",
        status: "pending",
        createdAt: new Date(),
      });
    }
    return Promise.resolve(null);
  }),
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock the notification function
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("plans.list", () => {
  it("returns list of active subscription plans", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.plans.list();

    expect(plans).toHaveLength(2);
    expect(plans[0]).toHaveProperty("name", "Weekly Plan");
    expect(plans[0]).toHaveProperty("price", 18);
    expect(plans[1]).toHaveProperty("name", "Monthly Plan");
    expect(plans[1]).toHaveProperty("price", 55);
  });
});

describe("orders.create", () => {
  it("creates a new order with pending status", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.create({
      customerEmail: "test@example.com",
      customerName: "Test User",
      planId: 1,
    });

    expect(result).toHaveProperty("orderNumber");
    expect(result.orderNumber).toMatch(/^KSA-/);
    expect(result).toHaveProperty("amount", 18);
    expect(result).toHaveProperty("currency", "SAR");
    expect(result).toHaveProperty("status", "pending");
  });
});

describe("orders.status", () => {
  it("returns order status for valid order number", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.status({
      orderNumber: "KSA-TEST-123456",
    });

    expect(result).toHaveProperty("orderNumber", "KSA-TEST-123456");
    expect(result).toHaveProperty("status", "pending");
  });

  it("throws error for invalid order number", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.status({ orderNumber: "INVALID-ORDER" })
    ).rejects.toThrow("Order not found");
  });
});
