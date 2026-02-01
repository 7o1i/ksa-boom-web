import { stripe, getOrCreateProduct, createOneTimePrice } from './stripe';
import { getProductByDuration, SUBSCRIPTION_PRODUCTS } from './products';

interface CheckoutSessionParams {
  planDuration: string;
  customerEmail: string;
  customerName?: string;
  userId?: number;
  orderId?: number;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutResult {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe Checkout Session for a subscription plan
 */
export async function createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutResult | null> {
  if (!stripe) {
    console.error('[Stripe] Stripe not configured');
    return null;
  }

  const { planDuration, customerEmail, customerName, userId, orderId, successUrl, cancelUrl } = params;
  
  const product = getProductByDuration(planDuration);
  if (!product) {
    console.error('[Stripe] Invalid plan duration:', planDuration);
    return null;
  }

  try {
    // Create or get the Stripe product
    const stripeProductId = await getOrCreateProduct(
      `KSA,Boom ${product.name}`,
      product.description
    );
    
    if (!stripeProductId) {
      console.error('[Stripe] Failed to create product');
      return null;
    }

    // Create a one-time price for this checkout
    // Using one-time payment instead of subscription for manual license management
    const priceId = await createOneTimePrice(
      stripeProductId,
      product.amount,
      product.currency
    );
    
    if (!priceId) {
      console.error('[Stripe] Failed to create price');
      return null;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      client_reference_id: userId?.toString(),
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId?.toString() || '',
        customer_email: customerEmail,
        customer_name: customerName || '',
        plan_duration: planDuration,
        order_id: orderId?.toString() || '',
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);
    return null;
  }
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string) {
  if (!stripe) return null;
  
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });
    return session;
  } catch (error) {
    console.error('[Stripe] Error retrieving session:', error);
    return null;
  }
}

/**
 * Get payment status from a checkout session
 */
export async function getPaymentStatus(sessionId: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  paymentIntentId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
} | null> {
  const session = await getCheckoutSession(sessionId);
  if (!session) return null;

  let status: 'pending' | 'completed' | 'failed' = 'pending';
  
  if (session.payment_status === 'paid') {
    status = 'completed';
  } else if (session.payment_status === 'unpaid' && session.status === 'expired') {
    status = 'failed';
  }

  return {
    status,
    paymentIntentId: typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id,
    customerEmail: session.customer_email || undefined,
    metadata: session.metadata as Record<string, string>,
  };
}
