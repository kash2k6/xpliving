import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory store for member ID lookup by email
 * Note: In production, use a database (PostgreSQL, MongoDB, etc.)
 * Serverless functions don't share memory, so this is temporary
 */
const memberStore = new Map<string, {
  memberId: string;
  email: string;
  createdAt: Date;
}>();

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
      if (memberId && userEmail) {
        console.log('Member ID to store:', { email: userEmail, memberId });
        // Store in in-memory map (in production, use database)
        memberStore.set(userEmail.toLowerCase(), {
          memberId,
          email: userEmail,
          createdAt: new Date(),
        });
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
      if (memberId && userEmail) {
        console.log('Store member ID for future charges:', { email: userEmail, memberId });
        // Store in in-memory map (in production, use database)
        memberStore.set(userEmail.toLowerCase(), {
          memberId,
          email: userEmail,
          createdAt: new Date(),
        });
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

/**
 * GET endpoint to retrieve member ID by email
 * This is called from the client to get member ID for upsells
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email parameter' },
        { status: 400 }
      );
    }

    // Find member ID by email
    const memberData = memberStore.get(email.toLowerCase());

    if (!memberData) {
      return NextResponse.json(
        { error: 'Member not found. Payment may not have completed yet.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      memberId: memberData.memberId,
      email: memberData.email,
    });
  } catch (error) {
    console.error('Retrieve member data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve member data' },
      { status: 500 }
    );
  }
}

// Route segment config for App Router
export const runtime = 'nodejs';
export const maxDuration = 30;

