'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WhopCheckoutEmbed } from '@whop/checkout/react';
import { trackFacebookEvent } from '@/components/FacebookPixel';
import ProductImageGallery from '@/components/ProductImageGallery';
import Link from 'next/link';

const PRODUCTS: Record<string, {
  id: 'youth' | 'roman';
  name: string;
  subtitle: string;
  price: string;
}> = {
  'plan_x3WmiSOReZ9yc': {
    id: 'youth' as const,
    name: 'Xperience Youth',
    subtitle: 'Volumex Liquid',
    price: '$44.95',
  },
  'plan_yl6F67ovs2E19': {
    id: 'roman' as const,
    name: 'Roman Xperience',
    subtitle: 'Premium Formula',
    price: '$59.95',
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('planId');
  const promoCode = searchParams.get('promo'); // Optional promo code from URL
  const [checkoutConfigId, setCheckoutConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get product info from planId
  const product = planId ? PRODUCTS[planId as keyof typeof PRODUCTS] : null;

  // Create checkout configuration with metadata when page loads
  useEffect(() => {
    const createCheckoutConfig = async () => {
      if (!planId) {
        setIsLoading(false);
        return;
      }

      try {
        // Get user email from localStorage
        const userData = localStorage.getItem('xperience_user_data');
        const userEmail = userData ? JSON.parse(userData).email : null;

        // Create checkout configuration with metadata (using API v1)
        const response = await fetch('/api/whop/checkout-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            userEmail,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout configuration');
        }

        const data = await response.json();
        setCheckoutConfigId(data.checkoutConfigId);

        // Track InitiateCheckout event
        trackFacebookEvent('InitiateCheckout', {
          content_ids: [planId],
          content_type: 'product',
        });
      } catch (err) {
        console.error('Error creating checkout config:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize checkout');
      } finally {
        setIsLoading(false);
      }
    };

    createCheckoutConfig();
  }, [planId]);

  if (!planId) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">No Product Selected</h1>
          <p className="text-gray-400 mb-6">Please select a product to continue.</p>
          <Link
            href="/"
            className="inline-block bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-full px-6 py-3 transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="w-full border-b border-[#3a3a3a] bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">Complete Your Purchase</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Product Info & Checkout Content */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {/* Product Information */}
        {product && (
          <div className="mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <ProductImageGallery
              productId={product.id}
              className="h-32 w-24 md:h-40 md:w-28 rounded-xl shadow-lg flex-shrink-0"
              fallbackGradient={
                product.id === 'youth'
                  ? 'linear-gradient(to bottom, #0D6B4D, #093F2E)'
                  : 'linear-gradient(to bottom, #8B4513, #5D2F0A)'
              }
            />
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {product.name}
              </h2>
              <p className="text-lg text-gray-300 mb-3">
                {product.subtitle}
              </p>
              <p className="text-xl font-semibold text-[#0D6B4D]">
                {product.price}
              </p>
            </div>
          </div>
        )}

        {/* Checkout Embed - No Container */}
        <div className="w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white">Loading checkout...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Link
                href="/"
                className="inline-block bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-full px-6 py-3 transition-colors"
              >
                Go Back
              </Link>
            </div>
          ) : checkoutConfigId ? (
            <WhopCheckoutEmbed
              sessionId={checkoutConfigId}
              theme="dark"
              onComplete={async () => {
              // Setup mode checkout completed - payment method is now saved
              // Wait for setup_intent.succeeded webhook to process
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Get member ID from webhook (stored by setup_intent.succeeded)
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
                      const memberId = memberData.memberId;
                      
                      if (memberId) {
                        // Store member ID
                        localStorage.setItem('whop_member_id', memberId);
                        
                        // Charge the initial product using saved payment method
                        const chargeResponse = await fetch('/api/whop/charge-initial', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            memberId,
                            planId,
                          }),
                        });
                        
                        if (chargeResponse.ok) {
                          // Initial charge successful, redirect to upsell
                          router.push(`/upsell?planId=${planId}`);
                        } else {
                          const errorData = await chargeResponse.json();
                          console.error('Error charging initial product:', errorData);
                          alert('Payment setup completed, but there was an issue processing your order. Please contact support.');
                        }
                      } else {
                        console.error('Member ID not found');
                        alert('Payment method saved, but member ID not found. Please contact support.');
                      }
                    } else {
                      console.error('Failed to retrieve member ID');
                      alert('Payment method saved, but we could not retrieve your account. Please contact support.');
                    }
                  }
                } catch (error) {
                  console.error('Error processing checkout completion:', error);
                  alert('An error occurred. Please contact support.');
                }
              } else {
                alert('Please ensure your email is saved. Please contact support.');
              }
            }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

