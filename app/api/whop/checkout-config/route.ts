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

    // Get company ID from environment variable (required for checkout configurations)
    const companyId = process.env.WHOP_COMPANY_ID;
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'WHOP_COMPANY_ID not configured. Add it to your .env.local file.' },
        { status: 500 }
      );
    }

    // According to Whop docs, we can use plan_id with company_id, or create inline plan
    // Using plan_id is simpler since plans are already created
    const checkoutConfigResponse = await fetch(
      'https://api.whop.com/api/v2/checkout_configurations',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          company_id: companyId, // Required: company ID
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

