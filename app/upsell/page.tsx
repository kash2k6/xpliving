'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { trackFacebookEvent } from '@/components/FacebookPixel';
import Link from 'next/link';

// Upsell offers - Subscription packages (recurring)
const UPSELL_OFFERS = {
  youth: {
    title: 'Never Run Out - Subscribe & Save!',
    description: 'Get Xperience Youth delivered monthly. Cancel anytime. Save 15% with subscription!',
    price: 38.21, // 15% off $44.95
    originalPrice: 44.95,
    savings: 6.74,
    planId: process.env.NEXT_PUBLIC_WHOP_SUBSCRIPTION_PLAN_ID_YOUTH || process.env.NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH || 'plan_x3WmiSOReZ9yc',
    isSubscription: true,
    billingFrequency: 'monthly',
  },
  roman: {
    title: 'Never Run Out - Subscribe & Save!',
    description: 'Get Roman Xperience delivered monthly. Cancel anytime. Save 15% with subscription!',
    price: 50.96, // 15% off $59.95
    originalPrice: 59.95,
    savings: 8.99,
    planId: process.env.NEXT_PUBLIC_WHOP_SUBSCRIPTION_PLAN_ID_ROMAN || process.env.NEXT_PUBLIC_WHOP_PLAN_ID_ROMAN || 'plan_yl6F67ovs2E19',
    isSubscription: true,
    billingFrequency: 'monthly',
  },
};

// Downsell offers - Cross-sell to other product at discounted price (one-time)
const DOWNSELL_OFFERS = {
  youth: {
    title: 'Try Our Other Premium Product!',
    description: 'Since you purchased Xperience Youth, get Roman Xperience at a special price!',
    price: 34.95, // Discounted price for existing customers
    originalPrice: 59.95,
    savings: 25.00,
    planId: process.env.NEXT_PUBLIC_WHOP_DISCOUNTED_PLAN_ID_ROMAN || process.env.NEXT_PUBLIC_WHOP_PLAN_ID_ROMAN || 'plan_yl6F67ovs2E19',
    isSubscription: false,
    productName: 'Roman Xperience',
  },
  roman: {
    title: 'Try Our Other Premium Product!',
    description: 'Since you purchased Roman Xperience, get Xperience Youth at a special price!',
    price: 34.95, // Discounted price for existing customers
    originalPrice: 44.95,
    savings: 10.00,
    planId: process.env.NEXT_PUBLIC_WHOP_DISCOUNTED_PLAN_ID_YOUTH || process.env.NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH || 'plan_x3WmiSOReZ9yc',
    isSubscription: false,
    productName: 'Xperience Youth',
  },
};

// Final subscription offer (shown after downsell decline)
const FINAL_SUBSCRIPTION_OFFERS = {
  youth: {
    title: 'Last Chance - Subscribe & Never Miss a Dose!',
    description: 'Get Xperience Youth delivered monthly. Cancel anytime. Save 15% with subscription!',
    price: 38.21,
    originalPrice: 44.95,
    savings: 6.74,
    planId: process.env.NEXT_PUBLIC_WHOP_SUBSCRIPTION_PLAN_ID_YOUTH || process.env.NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH || 'plan_x3WmiSOReZ9yc',
    isSubscription: true,
    billingFrequency: 'monthly',
  },
  roman: {
    title: 'Last Chance - Subscribe & Never Miss a Dose!',
    description: 'Get Roman Xperience delivered monthly. Cancel anytime. Save 15% with subscription!',
    price: 50.96,
    originalPrice: 59.95,
    savings: 8.99,
    planId: process.env.NEXT_PUBLIC_WHOP_SUBSCRIPTION_PLAN_ID_ROMAN || process.env.NEXT_PUBLIC_WHOP_PLAN_ID_ROMAN || 'plan_yl6F67ovs2E19',
    isSubscription: true,
    billingFrequency: 'monthly',
  },
};

function UpsellContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('planId');
  const [showDownsell, setShowDownsell] = useState(false);
  const [showFinalSubscription, setShowFinalSubscription] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine product type from planId
  const productType = planId?.includes('x3WmiSOReZ9yc') ? 'youth' : 'roman';
  const upsellOffer = UPSELL_OFFERS[productType];
  const downsellOffer = DOWNSELL_OFFERS[productType];
  const finalSubscriptionOffer = FINAL_SUBSCRIPTION_OFFERS[productType];

  useEffect(() => {
    // Track upsell page view
    trackFacebookEvent('PageView', {
      content_name: 'Upsell Page',
    });
  }, []);

  const handleUpsellAccept = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get payment method and member ID from session/localStorage
      const storedData = localStorage.getItem('whop_payment_data');
      if (!storedData) {
        // Fallback: redirect to checkout if no saved payment method
        router.push(`/checkout?planId=${upsellOffer.planId}&upsell=true`);
        return;
      }

      const { memberId, paymentMethodId } = JSON.parse(storedData);

      // Charge saved payment method (or create checkout for subscription)
      const response = await fetch('/api/whop/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          paymentMethodId,
          planId: upsellOffer.planId,
          amount: upsellOffer.price,
          currency: 'usd',
          isSubscription: upsellOffer.isSubscription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      // If subscription requires redirect to checkout
      if (data.requiresRedirect && data.purchaseUrl) {
        window.location.href = data.purchaseUrl;
        return;
      }

      // Track successful upsell
      trackFacebookEvent('Purchase', {
        content_name: upsellOffer.title,
        value: upsellOffer.price,
        currency: 'USD',
      });

      // Redirect to success page
      router.push('/?checkout=success&upsell=true');
    } catch (err) {
      console.error('Upsell error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process upsell');
      setIsProcessing(false);
    }
  };

  const handleUpsellDecline = () => {
    // Show downsell
    setShowDownsell(true);
    trackFacebookEvent('AddToCart', {
      content_name: 'Upsell Declined',
    });
  };

  const handleDownsellAccept = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const storedData = localStorage.getItem('whop_payment_data');
      if (!storedData) {
        router.push(`/checkout?planId=${downsellOffer.planId}&downsell=true`);
        return;
      }

      const { memberId, paymentMethodId } = JSON.parse(storedData);

      const response = await fetch('/api/whop/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          paymentMethodId,
          planId: downsellOffer.planId,
          amount: downsellOffer.price,
          currency: 'usd',
          isSubscription: downsellOffer.isSubscription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      // If subscription requires redirect to checkout
      if (data.requiresRedirect && data.purchaseUrl) {
        window.location.href = data.purchaseUrl;
        return;
      }

      trackFacebookEvent('Purchase', {
        content_name: downsellOffer.title,
        value: downsellOffer.price,
        currency: 'USD',
      });

      router.push('/?checkout=success&downsell=true');
    } catch (err) {
      console.error('Downsell error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process downsell');
      setIsProcessing(false);
    }
  };

  const handleDownsellDecline = () => {
    // Show final subscription offer
    setShowFinalSubscription(true);
    trackFacebookEvent('AddToCart', {
      content_name: 'Downsell Declined - Show Final Subscription',
    });
  };

  const handleFinalSubscriptionAccept = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const storedData = localStorage.getItem('whop_payment_data');
      if (!storedData) {
        router.push(`/checkout?planId=${finalSubscriptionOffer.planId}&subscription=true`);
        return;
      }

      const { memberId, paymentMethodId } = JSON.parse(storedData);

      const response = await fetch('/api/whop/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          paymentMethodId,
          planId: finalSubscriptionOffer.planId,
          amount: finalSubscriptionOffer.price,
          currency: 'usd',
          isSubscription: finalSubscriptionOffer.isSubscription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }

      if (data.requiresRedirect && data.purchaseUrl) {
        window.location.href = data.purchaseUrl;
        return;
      }

      trackFacebookEvent('Purchase', {
        content_name: finalSubscriptionOffer.title,
        value: finalSubscriptionOffer.price,
        currency: 'USD',
      });

      router.push('/?checkout=success&subscription=true');
    } catch (err) {
      console.error('Final subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process subscription');
      setIsProcessing(false);
    }
  };

  const handleFinalSubscriptionDecline = () => {
    // Redirect to home with thank you message
    router.push('/?checkout=success');
  };

  if (!planId) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">No Product Selected</h1>
          <Link
            href="/"
            className="inline-block bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-full px-6 py-3 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Determine which offer to show
  const currentOffer = showFinalSubscription 
    ? finalSubscriptionOffer 
    : showDownsell 
      ? downsellOffer 
      : upsellOffer;

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0D6B4D] to-[#0b5940] p-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {showFinalSubscription 
              ? '⏰ Last Chance!' 
              : showDownsell 
                ? '🎁 Special Offer Just For You!' 
                : '🎉 Thank You For Your Purchase!'}
          </h1>
          <p className="text-green-100 text-sm">
            {showFinalSubscription
              ? 'Don\'t miss out on this final opportunity...'
              : showDownsell 
                ? 'We have one more exclusive offer...' 
                : 'Wait! Before you go, we have an exclusive offer...'}
          </p>
        </div>

        {/* Offer Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-3">{currentOffer.title}</h2>
            <p className="text-gray-300 text-lg mb-4">{currentOffer.description}</p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#0D6B4D]">
                  ${currentOffer.price.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {currentOffer.isSubscription && 'billingFrequency' in currentOffer
                    ? `per ${currentOffer.billingFrequency}` 
                    : 'One-time Price'}
                </div>
              </div>
              {currentOffer.savings > 0 && (
                <>
                  <div className="text-gray-500">vs</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-500 line-through">
                      ${currentOffer.originalPrice.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Regular Price</div>
                  </div>
                </>
              )}
            </div>

            {currentOffer.savings > 0 && (
              <div className="bg-[#0D6B4D]/20 border border-[#0D6B4D]/40 rounded-lg p-4 mb-6">
                <p className="text-[#0D6B4D] font-semibold">
                  💰 You Save ${currentOffer.savings.toFixed(2)} {currentOffer.isSubscription ? 'every month' : ''}!
                </p>
              </div>
            )}

            {currentOffer.isSubscription && (
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3 mb-6">
                <p className="text-blue-300 text-sm">
                  🔄 Auto-delivered monthly • Cancel anytime • No commitment
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={
                showFinalSubscription 
                  ? handleFinalSubscriptionAccept 
                  : showDownsell 
                    ? handleDownsellAccept 
                    : handleUpsellAccept
              }
              disabled={isProcessing}
              className="flex-1 bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-bold py-4 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isProcessing 
                ? 'Processing...' 
                : currentOffer.isSubscription
                  ? `Yes! Subscribe - $${currentOffer.price.toFixed(2)}/month`
                  : `Yes! Add ${'productName' in currentOffer ? currentOffer.productName : 'to My Order'} - $${currentOffer.price.toFixed(2)}`}
            </button>
            <button
              onClick={
                showFinalSubscription 
                  ? handleFinalSubscriptionDecline 
                  : showDownsell 
                    ? handleDownsellDecline 
                    : handleUpsellDecline
              }
              disabled={isProcessing}
              className="flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white font-semibold py-4 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showFinalSubscription 
                ? 'No Thanks, I\'m Done' 
                : showDownsell 
                  ? 'No Thanks, I\'m Good' 
                  : 'No Thanks'}
            </button>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure one-click checkout • No need to enter payment details again
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpsellPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <UpsellContent />
    </Suspense>
  );
}

