/**
 * Stripe Products Configuration
 * Define your subscription plans and their Stripe price IDs here
 */

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string; // Stripe Price ID - will be created dynamically or set manually
  amount: number; // Amount in smallest currency unit (e.g., cents for USD, halalas for SAR)
  currency: string;
  interval: 'week' | 'month' | 'year';
  intervalCount: number;
  features: string[];
}

// Subscription plans matching your database plans
export const SUBSCRIPTION_PRODUCTS: Record<string, StripeProduct> = {
  weekly: {
    id: 'weekly',
    name: 'Weekly Plan',
    description: 'Weekly subscription to KSA,Boom',
    priceId: '', // Will be set from Stripe Dashboard or created dynamically
    amount: 1800, // 18 SAR in halalas
    currency: 'sar',
    interval: 'week',
    intervalCount: 1,
    features: [
      'Full access to all features',
      'Advanced color detection',
      'Multi-monitor support',
      'Email support',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    description: 'Monthly subscription to KSA,Boom',
    priceId: '', // Will be set from Stripe Dashboard or created dynamically
    amount: 5500, // 55 SAR in halalas
    currency: 'sar',
    interval: 'month',
    intervalCount: 1,
    features: [
      'Full access to all features',
      'Advanced color detection',
      'Multi-monitor support',
      'Custom hotkeys',
      'Priority support',
    ],
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    description: 'Yearly subscription to KSA,Boom',
    priceId: '', // Will be set from Stripe Dashboard or created dynamically
    amount: 29000, // 290 SAR in halalas
    currency: 'sar',
    interval: 'year',
    intervalCount: 1,
    features: [
      'Full access to all features',
      'Advanced color detection',
      'Multi-monitor support',
      'Custom hotkeys',
      'Dedicated support',
      'Free updates',
      'Best value',
    ],
  },
};

// Get product by plan duration
export function getProductByDuration(duration: string): StripeProduct | undefined {
  return SUBSCRIPTION_PRODUCTS[duration];
}
