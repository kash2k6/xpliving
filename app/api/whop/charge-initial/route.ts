import { NextRequest, NextResponse } from 'next/server';

/**
 * Charge the initial product after setup intent succeeds
 * This charges the customer for the product they selected using their saved payment method
 */
export async function POST(request: NextRequest) {
  try {
    const { memberId, planId } = await request.json();

    if (!memberId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, planId' },
        { status: 400 }
      );
    }

    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json(
        { error: 'Whop API key not configured' },
        { status: 500 }
      );
    }

    // Get payment method from member's saved payment methods
    let paymentMethodId: string | null = null;
    
    try {
      const paymentMethodsResponse = await fetch(
        `https://api.whop.com/api/v2/payment_methods?member_id=${memberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (paymentMethodsResponse.ok) {
        const paymentMethods = await paymentMethodsResponse.json();
        if (paymentMethods.data && paymentMethods.data.length > 0) {
          // Use the first available payment method (the one just saved)
          paymentMethodId = paymentMethods.data[0].id;
          console.log('Using payment method from member:', paymentMethodId);
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'No payment method found. Please ensure payment method was saved during checkout.' },
        { status: 400 }
      );
    }

    // Get plan details to get the price
    const planResponse = await fetch(
      `https://api.whop.com/api/v2/plans/${planId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!planResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to retrieve plan details' },
        { status: 500 }
      );
    }

    const plan = await planResponse.json();
    const amount = parseFloat(plan.initial_price || '0');
    const currency = plan.base_currency || 'usd';

    // Charge the initial product using saved payment method
    const chargeResponse = await fetch('https://api.whop.com/api/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan: {
          initial_price: amount,
          currency: currency.toLowerCase(),
          plan_type: 'one_time',
        },
        member_id: memberId,
        payment_method_id: paymentMethodId,
      }),
    });

    if (!chargeResponse.ok) {
      const error = await chargeResponse.json();
      console.error('Whop API error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to charge payment method' },
        { status: chargeResponse.status }
      );
    }

    const payment = await chargeResponse.json();

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      status: payment.status,
    });
  } catch (error) {
    console.error('Charge initial product error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to charge initial product' },
      { status: 500 }
    );
  }
}

// Route segment config for App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

