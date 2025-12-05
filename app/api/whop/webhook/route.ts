import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook handler for Whop events
 * Follows Whop's recommended approach:
 * - Store member ID from payment.succeeded (after checkout completes)
 * - Payment methods are stored by Whop and can be retrieved via API
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature using WHOP_WEBHOOK_SECRET
    // For now, we'll trust the webhook (in production, always verify!)
    
    const body = await request.json();
    const { type, data } = body;

    // Handle setup intent succeeded - payment method is now saved by Whop
    // According to Whop docs, we can retrieve payment methods via API using member ID
    if (type === 'setup_intent.succeeded') {
      const setupIntent = data;
      const paymentMethodId = setupIntent.payment_method?.id;
      const memberId = setupIntent.member?.id;
      const userEmail = setupIntent.member?.user?.email;

      console.log('Setup intent succeeded:', {
        setupIntentId: setupIntent.id,
        paymentMethodId,
        memberId,
        userEmail,
      });

      // Payment method is stored by Whop - we just need to store member ID
      // In production, store memberId in your database associated with user email
      // For now, we'll store it in a simple in-memory store (replace with database)
      if (memberId && userEmail) {
        // Store member ID by email for lookup
        // In production: await db.members.upsert({ where: { email: userEmail }, update: { memberId }, create: { email: userEmail, memberId } })
        console.log('Member ID to store:', { email: userEmail, memberId });
      }
    }

    // Handle payment succeeded - store member ID for future one-click charges
    // According to Whop: Payment methods are stored by Whop, we retrieve them via API using member ID
    if (type === 'payment.succeeded') {
      const payment = data;
      const memberId = payment.member?.id;
      const userEmail = payment.member?.user?.email;

      console.log('Payment succeeded:', {
        paymentId: payment.id,
        amount: payment.total,
        currency: payment.currency,
        memberId,
        userEmail,
      });

      // Store member ID by email for lookup during upsells
      // In production: Store in your database (e.g., PostgreSQL, MongoDB)
      // await db.members.upsert({ 
      //   where: { email: userEmail }, 
      //   update: { memberId, lastPaymentAt: new Date() }, 
      //   create: { email: userEmail, memberId, createdAt: new Date() } 
      // })
      
      // For now, store in simple in-memory store (replace with database)
      if (memberId && userEmail) {
        console.log('Store member ID for future charges:', { email: userEmail, memberId });
        // Store via API endpoint
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whop/payment-data`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ memberId, email: userEmail }),
            }
          );
        } catch (error) {
          console.error('Error storing member ID:', error);
        }
      }
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

