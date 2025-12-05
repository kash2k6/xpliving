'use client';

import { useEffect, Suspense } from 'react';
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
  
  // Get product info from planId
  const product = planId ? PRODUCTS[planId as keyof typeof PRODUCTS] : null;

  // Track InitiateCheckout event when page loads
  useEffect(() => {
    if (planId) {
      trackFacebookEvent('InitiateCheckout', {
        content_ids: [planId],
        content_type: 'product',
      });
    }
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
          <WhopCheckoutEmbed
            planId={planId}
            setupFutureUsage="off_session"
            theme="dark"
            onComplete={async () => {
              // According to Whop: Payment method is saved by Whop when setupFutureUsage="off_session"
              // Member ID will be stored via payment.succeeded webhook
              // We'll retrieve member ID by email when needed for upsells
              
              // Small delay to allow webhook to process
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Try to get member ID from user's email (stored by webhook)
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
                      // Store member ID (payment methods will be retrieved from Whop API)
                      localStorage.setItem('whop_member_id', memberData.memberId);
                    }
                  }
                } catch (error) {
                  console.error('Error retrieving member ID:', error);
                }
              }
              
              // Redirect to upsell page after successful checkout
              router.push(`/upsell?planId=${planId}`);
            }}
          />
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

