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
    const memberIdFromUrl = searchParams.get('memberId');
    const setupIntentIdFromUrl = searchParams.get('setupIntentId');
  const [showDownsell, setShowDownsell] = useState(false);
  const [showFinalSubscription, setShowFinalSubscription] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchasedProducts, setPurchasedProducts] = useState<Array<{
    name: string;
    price: number;
    type: 'one_time' | 'subscription';
  }>>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

    // Store member ID and setup intent ID from URL params in localStorage for future use
    if (memberIdFromUrl) {
      localStorage.setItem('whop_member_id', memberIdFromUrl);
    }
    if (setupIntentIdFromUrl) {
      localStorage.setItem('whop_setup_intent_id', setupIntentIdFromUrl);
    }

    // Add initial product to purchased products (they already purchased it)
    if (planId) {
      const initialProductName = productType === 'youth' 
        ? 'Xperience Youth' 
        : 'Roman Xperience';
      const initialProductPrice = productType === 'youth' 
        ? 44.95 
        : 59.95;
      
      setPurchasedProducts([{
        name: initialProductName,
        price: initialProductPrice,
        type: 'one_time',
      }]);
    }
  }, [memberIdFromUrl, setupIntentIdFromUrl, planId, productType]);

  const handleUpsellAccept = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get member ID from URL param first, then localStorage, then fetch
      let memberId = memberIdFromUrl || localStorage.getItem('whop_member_id');
      
      // If not found, try to fetch by setup intent ID or email
      if (!memberId) {
        const setupIntentId = setupIntentIdFromUrl || localStorage.getItem('whop_setup_intent_id');
        
        // Try setup intent ID first
        if (setupIntentId) {
          try {
            const response = await fetch(
              `/api/whop/webhook?setupIntentId=${setupIntentId}`
            );
            if (response.ok) {
              const setupData = await response.json();
              if (setupData.memberId && typeof setupData.memberId === 'string') {
                memberId = setupData.memberId;
                localStorage.setItem('whop_member_id', setupData.memberId);
              }
            }
          } catch (error) {
            console.error('Error fetching member ID from setup intent:', error);
          }
        }
        
        // Fallback: try to fetch by email
        if (!memberId) {
          const userData = localStorage.getItem('xperience_user_data');
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              if (parsed.email) {
                const response = await fetch(
                  `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}`
                );
                if (response.ok) {
                  const memberData = await response.json();
                  if (memberData.memberId && typeof memberData.memberId === 'string') {
                    memberId = memberData.memberId;
                    localStorage.setItem('whop_member_id', memberData.memberId);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching member ID:', error);
            }
          }
        }
      }

      if (!memberId) {
        // Fallback: show error and redirect to home
        setError('Member ID not found. Please contact support or try the checkout again.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
        return;
      }

      // Get payment method ID from Supabase or localStorage
      let paymentMethodId: string | null = null;
      
      // Try to get from Supabase using email
      const userData = localStorage.getItem('xperience_user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed.email) {
            const paymentMethodResponse = await fetch(
              `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}`
            );
            if (paymentMethodResponse.ok) {
              const paymentData = await paymentMethodResponse.json();
              if (paymentData.paymentMethodId) {
                paymentMethodId = paymentData.paymentMethodId;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching payment method from Supabase:', error);
        }
      }

      // Charge saved payment method
      console.log('Charging upsell:', { memberId, planId: upsellOffer.planId, amount: upsellOffer.price, isSubscription: upsellOffer.isSubscription });
      
      const response = await fetch('/api/whop/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          paymentMethodId, // Pass payment method ID if available
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

      // Add to purchased products and show downsell (don't redirect)
      setPurchasedProducts(prev => [...prev, {
        name: upsellOffer.title,
        price: upsellOffer.price,
        type: upsellOffer.isSubscription ? 'subscription' : 'one_time',
      }]);
      
      // Show downsell offer
      setShowDownsell(true);
      setIsProcessing(false);
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
      // Get member ID from URL param first, then localStorage, then fetch
      let memberId = memberIdFromUrl || localStorage.getItem('whop_member_id');
      
      if (!memberId) {
        const setupIntentId = setupIntentIdFromUrl || localStorage.getItem('whop_setup_intent_id');
        
        if (setupIntentId) {
          try {
            const response = await fetch(
              `/api/whop/webhook?setupIntentId=${setupIntentId}`
            );
            if (response.ok) {
              const setupData = await response.json();
              if (setupData.memberId && typeof setupData.memberId === 'string') {
                memberId = setupData.memberId;
                localStorage.setItem('whop_member_id', setupData.memberId);
              }
            }
          } catch (error) {
            console.error('Error fetching member ID from setup intent:', error);
          }
        }
        
        if (!memberId) {
          const userData = localStorage.getItem('xperience_user_data');
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              if (parsed.email) {
                const response = await fetch(
                  `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}`
                );
                if (response.ok) {
                  const memberData = await response.json();
                  if (memberData.memberId && typeof memberData.memberId === 'string') {
                    memberId = memberData.memberId;
                    localStorage.setItem('whop_member_id', memberData.memberId);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching member ID:', error);
            }
          }
        }
      }

      if (!memberId) {
        router.push(`/checkout?planId=${downsellOffer.planId}&downsell=true`);
        return;
      }

      // Get payment method ID from Supabase using email
      let paymentMethodId: string | null = null;
      const userData = localStorage.getItem('xperience_user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed.email) {
            const paymentMethodResponse = await fetch(
              `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}`
            );
            if (paymentMethodResponse.ok) {
              const paymentData = await paymentMethodResponse.json();
              if (paymentData.paymentMethodId) {
                paymentMethodId = paymentData.paymentMethodId;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching payment method from Supabase:', error);
        }
      }

      const response = await fetch('/api/whop/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          paymentMethodId, // Pass payment method ID if available
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

      // Add to purchased products and show final subscription (don't redirect)
      setPurchasedProducts(prev => [...prev, {
        name: downsellOffer.title,
        price: downsellOffer.price,
        type: downsellOffer.isSubscription ? 'subscription' : 'one_time',
      }]);
      
      // Show final subscription offer
      setShowFinalSubscription(true);
      setIsProcessing(false);
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
      // Get member ID from URL param first, then localStorage, then fetch
      let memberId = memberIdFromUrl || localStorage.getItem('whop_member_id');
      
      if (!memberId) {
        const setupIntentId = setupIntentIdFromUrl || localStorage.getItem('whop_setup_intent_id');
        
        if (setupIntentId) {
          try {
            const response = await fetch(
              `/api/whop/webhook?setupIntentId=${setupIntentId}`
            );
            if (response.ok) {
              const setupData = await response.json();
              if (setupData.memberId && typeof setupData.memberId === 'string') {
                memberId = setupData.memberId;
                localStorage.setItem('whop_member_id', setupData.memberId);
              }
            }
          } catch (error) {
            console.error('Error fetching member ID from setup intent:', error);
          }
        }
        
        if (!memberId) {
          const userData = localStorage.getItem('xperience_user_data');
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              if (parsed.email) {
                const response = await fetch(
                  `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}`
                );
                if (response.ok) {
                  const memberData = await response.json();
                  if (memberData.memberId && typeof memberData.memberId === 'string') {
                    memberId = memberData.memberId;
                    localStorage.setItem('whop_member_id', memberData.memberId);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching member ID:', error);
            }
          }
        }
      }

      if (!memberId) {
        router.push(`/checkout?planId=${finalSubscriptionOffer.planId}&subscription=true`);
        return;
      }

      // Get payment method ID from Supabase using email
      let paymentMethodId: string | null = null;
      const userData = localStorage.getItem('xperience_user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed.email) {
            const paymentMethodResponse = await fetch(
              `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}`
            );
            if (paymentMethodResponse.ok) {
              const paymentData = await paymentMethodResponse.json();
              if (paymentData.paymentMethodId) {
                paymentMethodId = paymentData.paymentMethodId;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching payment method from Supabase:', error);
        }
      }

      console.log('Charging final subscription:', { memberId, planId: finalSubscriptionOffer.planId, amount: finalSubscriptionOffer.price, isSubscription: finalSubscriptionOffer.isSubscription });
      
      const response = await fetch('/api/whop/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          paymentMethodId, // Pass payment method ID if available
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

      // Add to purchased products and show confirmation page
      setPurchasedProducts(prev => [...prev, {
        name: finalSubscriptionOffer.title,
        price: finalSubscriptionOffer.price,
        type: 'subscription',
      }]);
      
      // Show confirmation page with all purchases
      setShowConfirmation(true);
      setIsProcessing(false);
    } catch (err) {
      console.error('Final subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process subscription');
      setIsProcessing(false);
    }
  };

  const handleFinalSubscriptionDecline = () => {
    // Show confirmation page with purchases so far
    setShowConfirmation(true);
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

  // Show confirmation page if all offers are complete or declined
  if (showConfirmation) {
    const total = purchasedProducts.reduce((sum, product) => sum + product.price, 0);
    const oneTimeProducts = purchasedProducts.filter(p => p.type === 'one_time');
    const subscriptionProducts = purchasedProducts.filter(p => p.type === 'subscription');

    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0D6B4D] to-[#0b5940] p-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">✅ Order Complete!</h1>
            <p className="text-green-100 text-sm">Thank you for your purchase</p>
          </div>

          {/* Confirmation Content */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Your Purchases:</h2>
            
            <div className="space-y-4 mb-6">
              {purchasedProducts.map((product, index) => (
                <div key={index} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold">{product.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {product.type === 'subscription' ? 'Subscription (Monthly)' : 'One-time Purchase'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#3a3a3a] pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Total:</span>
                <span className="text-2xl font-bold text-[#0D6B4D]">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#0D6B4D]/20 border border-[#0D6B4D]/40 rounded-lg p-4 mb-6">
              <p className="text-[#0D6B4D] text-sm">
                {subscriptionProducts.length > 0 && (
                  <>You have {subscriptionProducts.length} active subscription{subscriptionProducts.length > 1 ? 's' : ''}. </>
                )}
                All products have been added to your account. Check your email for confirmation details.
              </p>
            </div>

            <Link
              href="/"
              className="block w-full bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-full px-6 py-4 text-center transition-colors"
            >
              Return to Home
            </Link>
          </div>
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
          <p className="text-sm text-green-100">
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

