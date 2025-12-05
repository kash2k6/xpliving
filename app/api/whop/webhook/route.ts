import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook handler for Whop events
 * Handles setup_intent.succeeded to store payment method for one-click upsells
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Handle setup intent succeeded - payment method saved
    if (type === 'setup_intent.succeeded') {
      const setupIntent = data;
      const paymentMethodId = setupIntent.payment_method?.id;
      const memberId = setupIntent.member?.id;
      const userEmail = setupIntent.member?.user?.email;
      const metadata = setupIntent.metadata || {};

      console.log('Setup intent succeeded:', {
        setupIntentId: setupIntent.id,
        paymentMethodId,
        memberId,
        userEmail,
        metadata,
      });

      // Store payment method and member ID for future one-click charges
      // In production, you'd store this in a database (e.g., PostgreSQL, MongoDB)
      // associated with the user's email or member ID
      // 
      // Example database storage:
      // await db.paymentMethods.upsert({
      //   where: { memberId },
      //   update: { paymentMethodId, updatedAt: new Date() },
      //   create: { memberId, paymentMethodId, userEmail, createdAt: new Date() }
      // });
      
      // For now, this data will be retrieved via the checkout completion
      // The client-side will need to store it in localStorage or sessionStorage
      // after receiving it from the checkout embed's completion callback
    }

    // Handle payment succeeded
    if (type === 'payment.succeeded') {
      console.log('Payment succeeded:', {
        paymentId: data.id,
        amount: data.total,
        currency: data.currency,
        memberId: data.member?.id,
      });
    }

    // Handle payment failed
    if (type === 'payment.failed') {
      console.log('Payment failed:', {
        paymentId: data.id,
        failureMessage: data.failure_message,
        memberId: data.member?.id,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Route segment config for App Router
export const runtime = 'nodejs';
export const maxDuration = 30;

