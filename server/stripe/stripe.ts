import Stripe from 'stripe';

// Initialize Stripe with secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('[Stripe] STRIPE_SECRET_KEY not configured. Stripe payments will not work.');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
    })
  : null;

// Helper to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!stripe;
}

// Create or get a Stripe product
export async function getOrCreateProduct(name: string, description: string): Promise<string | null> {
  if (!stripe) return null;
  
  try {
    // Search for existing product
    const products = await stripe.products.search({
      query: `name:'${name}'`,
    });
    
    if (products.data.length > 0) {
      return products.data[0].id;
    }
    
    // Create new product
    const product = await stripe.products.create({
      name,
      description,
    });
    
    return product.id;
  } catch (error) {
    console.error('[Stripe] Error creating product:', error);
    return null;
  }
}

// Create a price for a product
export async function createPrice(
  productId: string,
  amount: number,
  currency: string,
  interval: 'week' | 'month' | 'year',
  intervalCount: number = 1
): Promise<string | null> {
  if (!stripe) return null;
  
  try {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency,
      recurring: {
        interval,
        interval_count: intervalCount,
      },
    });
    
    return price.id;
  } catch (error) {
    console.error('[Stripe] Error creating price:', error);
    return null;
  }
}

// Create a one-time price for a product
export async function createOneTimePrice(
  productId: string,
  amount: number,
  currency: string
): Promise<string | null> {
  if (!stripe) return null;
  
  try {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency,
    });
    
    return price.id;
  } catch (error) {
    console.error('[Stripe] Error creating one-time price:', error);
    return null;
  }
}
