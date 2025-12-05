import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to charge a saved payment method for upsell/downsell
 * This charges the customer's saved payment method without requiring them to enter details again
 */
export async function POST(request: NextRequest) {
  try {
    const { memberId, paymentMethodId, planId, amount, currency = 'usd', isSubscription = false } = await request.json();

    if (!memberId || !planId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, planId, amount' },
        { status: 400 }
      );
    }

    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json(
        { error: 'Whop API key not configured' },
        { status: 500 }
      );
    }

    // For subscriptions, we need to create a checkout configuration
    // For one-time payments, we can charge directly
    if (isSubscription) {
      // Create checkout configuration for subscription
      // The user will be redirected to complete the subscription setup
      const checkoutResponse = await fetch('https://api.whop.com/api/v2/checkout_configurations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          metadata: {
            memberId,
            type: 'subscription_upsell',
          },
        }),
      });

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json();
        console.error('Whop checkout API error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to create subscription checkout' },
          { status: checkoutResponse.status }
        );
      }

      const checkout = await checkoutResponse.json();

      return NextResponse.json({
        success: true,
        checkoutConfigId: checkout.id,
        purchaseUrl: checkout.purchase_url,
        requiresRedirect: true,
      });
    } else {
      // One-time payment - charge saved payment method directly
      // According to Whop: Get payment methods from Whop API using member ID
      let finalPaymentMethodId = paymentMethodId;

      // If no payment method ID provided, get it from member's saved payment methods via Whop API
      if (!finalPaymentMethodId && memberId) {
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
              // Use the first available payment method (Whop stores them)
              finalPaymentMethodId = paymentMethods.data[0].id;
              console.log('Retrieved payment method from Whop API:', finalPaymentMethodId);
            }
          } else {
            const error = await paymentMethodsResponse.json();
            console.error('Whop API error fetching payment methods:', error);
          }
        } catch (error) {
          console.error('Error fetching payment methods from Whop:', error);
        }
      }

      if (!finalPaymentMethodId) {
        return NextResponse.json(
          { error: 'No payment method found. Payment method should be saved by Whop after checkout.' },
          { status: 400 }
        );
      }

      const response = await fetch('https://api.whop.com/api/v2/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: {
            initial_price: parseFloat(amount),
            currency: currency.toLowerCase(),
            plan_type: 'one_time',
          },
          member_id: memberId,
          payment_method_id: finalPaymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Whop API error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to charge payment method' },
          { status: response.status }
        );
      }

      const payment = await response.json();

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        status: payment.status,
        requiresRedirect: false,
      });
    }
  } catch (error) {
    console.error('Charge payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to charge payment' },
      { status: 500 }
    );
  }
}

