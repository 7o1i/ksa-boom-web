import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from './stripe';
import { confirmOrder, getOrderByNumber } from '../db';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe) {
    console.error('[Webhook] Stripe not configured');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    console.error('[Webhook] Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event: Stripe.Event;

  try {
    // If webhook secret is configured, verify the signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body.toString());
      console.warn('[Webhook] Running without signature verification (development mode)');
    }
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Webhook] Test event detected, returning verification response');
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);
        break;
      }
      
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Processing checkout.session.completed');
  
  const metadata = session.metadata || {};
  const orderId = metadata.order_id;
  const planDuration = metadata.plan_duration;
  const customerEmail = metadata.customer_email || session.customer_email;
  
  console.log('[Webhook] Session metadata:', {
    orderId,
    planDuration,
    customerEmail,
    paymentStatus: session.payment_status,
  });

  if (session.payment_status !== 'paid') {
    console.log('[Webhook] Payment not completed, skipping order confirmation');
    return;
  }

  // If we have an order ID, confirm it
  if (orderId) {
    try {
      // Use 0 as confirmedBy for automated Stripe confirmations
      const result = await confirmOrder(parseInt(orderId, 10), 0);
      if (result) {
        console.log(`[Webhook] Order ${orderId} confirmed, license key: ${result.license.licenseKey}`);
        
        // TODO: Send email with license key to customer
        // For now, just log it
        console.log(`[Webhook] License key for ${customerEmail}: ${result.license.licenseKey}`);
      }
    } catch (error) {
      console.error('[Webhook] Error confirming order:', error);
    }
  } else {
    console.log('[Webhook] No order_id in metadata, payment recorded but no order to confirm');
  }
}
