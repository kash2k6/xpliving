import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a checkout configuration with metadata (including user email)
 * This allows us to retrieve the email from webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const { planId, userEmail } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing planId' },
        { status: 400 }
      );
    }

    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json(
        { error: 'Whop API key not configured' },
        { status: 500 }
      );
    }

    // According to Whop docs, use API v1 for checkout configurations
    // We can use plan_id directly with metadata (no company_id needed when using plan_id)
    const checkoutConfigResponse = await fetch(
      'https://api.whop.com/api/v1/checkout_configurations',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          metadata: {
            userEmail: userEmail || '', // Store email in metadata for webhook retrieval
            source: 'xperience_living',
          },
        }),
      }
    );

    if (!checkoutConfigResponse.ok) {
      const error = await checkoutConfigResponse.json();
      console.error('Whop checkout config API error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create checkout configuration' },
        { status: checkoutConfigResponse.status }
      );
    }

    const checkoutConfig = await checkoutConfigResponse.json();

    return NextResponse.json({
      checkoutConfigId: checkoutConfig.id,
      planId: checkoutConfig.plan?.id || planId,
      purchaseUrl: checkoutConfig.purchase_url,
    });
  } catch (error) {
    console.error('Create checkout config error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout configuration' },
      { status: 500 }
    );
  }
}

// Route segment config for App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

