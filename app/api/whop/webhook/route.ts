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
      const userEmail = setupIntent.member?.user?.email || setupIntent.member?.email;
      
      // Try to get email from checkout configuration metadata
      const checkoutConfig = setupIntent.checkout_configuration;
      const metadataEmail = checkoutConfig?.metadata?.userEmail;

      console.log('Setup intent succeeded:', {
        setupIntentId: setupIntent.id,
        paymentMethodId,
        memberId,
        userEmail: userEmail || metadataEmail || 'not found',
        metadataEmail,
        checkoutConfigId: checkoutConfig?.id,
        fullData: JSON.stringify(setupIntent, null, 2),
      });

      // Use email from member, metadata, or both
      const emailToUse = userEmail || metadataEmail;

      // Payment method is stored by Whop - we just need to store member ID
      // In production, store memberId in your database associated with user email
      if (memberId && emailToUse) {
        console.log('Member ID to store from setup_intent:', { email: emailToUse, memberId });
        // Store in in-memory map (in production, use database)
        memberStore.set(emailToUse.toLowerCase(), {
          memberId,
          email: emailToUse,
          createdAt: new Date(),
        });
      } else if (memberId) {
        console.log('Setup intent succeeded with member ID but no email:', { memberId });
      }
    }

    // Handle payment succeeded - we have member ID, try to get email from Whop API
    if (type === 'payment.succeeded') {
      const payment = data;
      const memberId = payment.member?.id;
      const userEmail = payment.member?.user?.email || payment.member?.email;
      
      // Try to get email from checkout configuration metadata
      const checkoutConfig = payment.checkout_configuration;
      const metadataEmail = checkoutConfig?.metadata?.userEmail;

      console.log('Payment succeeded:', {
        paymentId: payment.id,
        amount: payment.total,
        currency: payment.currency,
        memberId,
        userEmail: userEmail || metadataEmail || 'not provided',
        metadataEmail,
        checkoutConfigId: checkoutConfig?.id,
      });

      // If we have member ID, try to get email from Whop API
      if (memberId && !userEmail && !metadataEmail && process.env.WHOP_API_KEY) {
        try {
          const memberResponse = await fetch(
            `https://api.whop.com/api/v2/members/${memberId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (memberResponse.ok) {
            const memberData = await memberResponse.json();
            const apiEmail = memberData.user?.email || memberData.email;
            if (apiEmail) {
              console.log('Retrieved email from Whop API for member:', { memberId, email: apiEmail });
              memberStore.set(apiEmail.toLowerCase(), {
                memberId,
                email: apiEmail,
                createdAt: new Date(),
              });
            }
          }
        } catch (error) {
          console.error('Error fetching member from Whop API:', error);
        }
      }

      // Use email from member, metadata, or API
      const emailToUse = userEmail || metadataEmail;

      // Store member ID by email if we have both
      if (memberId && emailToUse) {
        console.log('Store member ID from payment.succeeded:', { email: emailToUse, memberId });
        memberStore.set(emailToUse.toLowerCase(), {
          memberId,
          email: emailToUse,
          createdAt: new Date(),
        });
      } else if (memberId) {
        // Store member ID by payment ID as fallback (client can retrieve it)
        console.log('Payment succeeded with member ID but no email - storing by payment ID:', { 
          memberId, 
          paymentId: payment.id 
        });
        // Store by payment ID as fallback
        memberStore.set(`payment_${payment.id}`, {
          memberId,
          email: 'unknown',
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
 * GET endpoint to retrieve member ID by email or payment ID
 * This is called from the client to get member ID for upsells
 * 
 * Since in-memory storage doesn't persist across serverless invocations,
 * we try to get member ID from Whop API using recent payments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');
    const memberId = searchParams.get('memberId'); // Alternative: direct member ID lookup
    const paymentId = searchParams.get('paymentId'); // Alternative: lookup by payment ID

    // If memberId is provided directly, return it
    if (memberId) {
      return NextResponse.json({
        memberId,
        email: email || 'unknown',
        source: 'direct',
      });
    }

    // Try to get by payment ID (stored as fallback when no email)
    if (paymentId) {
      const memberData = memberStore.get(`payment_${paymentId}`);
      if (memberData) {
        return NextResponse.json({
          memberId: memberData.memberId,
          email: memberData.email,
          source: 'payment_id',
        });
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email or paymentId parameter' },
        { status: 400 }
      );
    }

    // First, try in-memory store (might work if same serverless instance)
    const memberData = memberStore.get(email.toLowerCase());
    if (memberData) {
      return NextResponse.json({
        memberId: memberData.memberId,
        email: memberData.email,
        source: 'memory',
      });
    }

    // If not in memory, try to get from Whop API by listing recent payments
    // and finding one with matching email
    if (process.env.WHOP_API_KEY) {
      try {
        // List recent payments and find one with matching member email
        const paymentsResponse = await fetch(
          'https://api.whop.com/api/v2/payments?limit=20',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (paymentsResponse.ok) {
          const payments = await paymentsResponse.json();
          // Find payment with matching email
          for (const payment of payments.data || []) {
            const paymentMemberEmail = payment.member?.user?.email || payment.member?.email;
            if (paymentMemberEmail && paymentMemberEmail.toLowerCase() === email.toLowerCase()) {
              const foundMemberId = payment.member?.id;
              if (foundMemberId) {
                // Store it for future use
                memberStore.set(email.toLowerCase(), {
                  memberId: foundMemberId,
                  email: email,
                  createdAt: new Date(),
                });
                return NextResponse.json({
                  memberId: foundMemberId,
                  email: email,
                  source: 'api_payments',
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching from Whop API:', error);
      }
    }

    return NextResponse.json(
      { 
        error: 'Member not found. The payment may not have completed yet, or the member ID was not stored.',
        hint: 'Member ID should be stored when payment.succeeded webhook fires. Check webhook logs.'
      },
      { status: 404 }
    );
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

