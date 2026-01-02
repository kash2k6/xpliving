'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WhopCheckoutEmbed } from '@whop/checkout/react';
import { trackFacebookEvent } from '@/components/FacebookPixel';
import ProductImageGallery from '@/components/ProductImageGallery';
import ShippingAddressForm from '@/components/ShippingAddressForm';
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
    subtitle: 'Liquid Formula',
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
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [pendingChargeData, setPendingChargeData] = useState<{
    memberId: string;
    setupIntentId: string | null;
    planId: string;
  } | null>(null);
  
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

  // Handle shipping address submission
  const handleShippingSubmit = async (address: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    if (!pendingChargeData) return;

    try {
      // Get user email from localStorage
      const userData = localStorage.getItem('xperience_user_data');
      const parsed = userData ? JSON.parse(userData) : {};
      const userEmail = parsed.email;

      if (!userEmail) {
        alert('Email not found. Please contact support.');
        return;
      }

      // Save shipping address
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          memberId: pendingChargeData.memberId,
          firstName: address.firstName,
          lastName: address.lastName,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to save shipping address: ${errorData.error || 'Unknown error'}`);
        return;
      }

      // Shipping address saved, now redirect to upsell
      const upsellUrl = `/upsell?planId=${pendingChargeData.planId}&memberId=${encodeURIComponent(pendingChargeData.memberId)}`;
      if (pendingChargeData.setupIntentId) {
        router.push(`${upsellUrl}&setupIntentId=${encodeURIComponent(pendingChargeData.setupIntentId)}`);
      } else {
        router.push(upsellUrl);
      }
    } catch (error) {
      console.error('Error saving shipping address:', error);
      alert('Failed to save shipping address. Please try again or contact support.');
    }
  };

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

        {/* Video Testimonials Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">Customer Testimonials</h2>
          <p className="text-gray-400 mb-6 text-center">
            See what other customers are saying about their experience
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Video 1 */}
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl overflow-hidden hover:border-[#0D6B4D] transition-colors">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/j6mlZ9LDUy4"
                  title="Customer Testimonial 1"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            
            {/* Video 2 */}
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl overflow-hidden hover:border-[#0D6B4D] transition-colors">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/GTjWzN3aEgs"
                  title="Customer Testimonial 2"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            
            {/* Video 3 */}
            <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl overflow-hidden hover:border-[#0D6B4D] transition-colors">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/vuAH9RsiiQA"
                  title="Customer Testimonial 3"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>

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
              // Try to get member ID with retry logic
              const userData = localStorage.getItem('xperience_user_data');
              if (!userData) {
                alert('Please ensure your email is saved. Please contact support.');
                return;
              }

              try {
                const parsed = JSON.parse(userData);
                if (!parsed.email) {
                  alert('Email not found. Please contact support.');
                  return;
                }

                // Get member ID and setup intent ID from API endpoint (server-side)
                // The webhook stores this data server-side, so we call our API to retrieve it
                let memberId: string | null = null;
                let setupIntentId: string | null = null;
                
                let attempts = 0;
                const maxAttempts = 8; // Try up to 8 times (about 8-9 seconds total)

                while (!memberId && attempts < maxAttempts) {
                  attempts++;
                  
                  // Wait before retrying (longer wait on first attempt to let webhook process)
                  const waitTime = attempts === 1 ? 2000 : 1000;
                  await new Promise(resolve => setTimeout(resolve, waitTime));

                  // Call API endpoint to get member ID and setup intent ID by email
                  // This endpoint checks server-side storage (from webhook) and Whop API
                  try {
                    const response = await fetch(
                      `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}&checkoutConfigId=${checkoutConfigId}`
                    );
                    
                    if (response.ok) {
                      const data = await response.json();
                      memberId = data.memberId || null;
                      setupIntentId = data.setupIntentId || null;
                      console.log(`Got member ID from API (attempt ${attempts}):`, memberId);
                      
                      // Store in localStorage for future use
                      if (memberId) {
                        localStorage.setItem('whop_member_id', memberId);
                      }
                      if (setupIntentId) {
                        localStorage.setItem('whop_setup_intent_id', setupIntentId);
                      }
                      
                      if (memberId) {
                        break; // Success, exit retry loop
                      }
                    } else if (response.status === 404 && attempts < maxAttempts) {
                      // Not found yet, will retry
                      console.log(`Attempt ${attempts}: Member ID not found yet, retrying...`);
                      continue;
                    } else {
                      const errorData = await response.json();
                      console.log('API error:', errorData);
                    }
                  } catch (apiError) {
                    console.error(`Error calling API (attempt ${attempts}):`, apiError);
                    if (attempts < maxAttempts) continue; // Retry on error
                  }
                }

                if (memberId) {
                  // Store both member ID and setup intent ID for future use
                  localStorage.setItem('whop_member_id', memberId);
                  if (setupIntentId) {
                    localStorage.setItem('whop_setup_intent_id', setupIntentId);
                  }
                  
                  // Charge the initial product using saved payment method
                  // Wait a moment for webhook to process and store payment method in Supabase
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  console.log('Charging initial product:', { memberId, planId, email: parsed.email });
                  const chargeResponse = await fetch('/api/whop/charge-initial', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      memberId,
                      planId,
                      userEmail: parsed.email, // Pass email to retrieve payment method from Supabase
                    }),
                  });
                  
                  const chargeData = await chargeResponse.json();
                  
                  if (chargeResponse.ok) {
                    console.log('Initial charge successful:', chargeData);
                    
                    // Track Purchase event for initial product
                    if (product) {
                      const productPrice = parseFloat(product.price.replace('$', ''));
                      trackFacebookEvent('Purchase', {
                        content_name: product.name,
                        content_category: product.subtitle,
                        content_ids: [planId],
                        value: productPrice,
                        currency: 'USD',
                      });
                    }
                    
                    // Store charge data and show shipping form instead of redirecting
                    setPendingChargeData({
                      memberId,
                      setupIntentId,
                      planId,
                    });
                    setShowShippingForm(true);
                  } else {
                    console.error('Error charging initial product:', chargeData);
                    // Show detailed error to user
                    const errorMessage = chargeData.error || 'Unknown error occurred';
                    alert(`Payment setup completed, but there was an issue processing your order: ${errorMessage}. Please contact support.`);
                    // Still redirect to upsell so they can see the page, but log the error
                    const upsellUrl = `/upsell?planId=${planId}&memberId=${encodeURIComponent(memberId)}`;
                    if (setupIntentId) {
                      router.push(`${upsellUrl}&setupIntentId=${encodeURIComponent(setupIntentId)}`);
                    } else {
                      router.push(upsellUrl);
                    }
                  }
                } else {
                  console.error('Member ID not found after retries');
                  // Even if we don't have member ID, try to get it from webhook endpoint one more time
                  if (parsed.email) {
                    try {
                      const finalWebhookResponse = await fetch(
                        `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}`
                      );
                      if (finalWebhookResponse.ok) {
                        const finalWebhookData = await finalWebhookResponse.json();
                        if (finalWebhookData.memberId) {
                          localStorage.setItem('whop_member_id', finalWebhookData.memberId);
                          if (finalWebhookData.setupIntentId) {
                            localStorage.setItem('whop_setup_intent_id', finalWebhookData.setupIntentId);
                          }
                          // Try to charge with the member ID we just got
                          const chargeResponse = await fetch('/api/whop/charge-initial', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              memberId: finalWebhookData.memberId,
                              planId,
                            }),
                          });
                          
                          if (chargeResponse.ok) {
                            // Track Purchase event for initial product
                            if (product) {
                              const productPrice = parseFloat(product.price.replace('$', ''));
                              trackFacebookEvent('Purchase', {
                                content_name: product.name,
                                content_category: product.subtitle,
                                content_ids: [planId],
                                value: productPrice,
                                currency: 'USD',
                              });
                            }
                            
                            // Store charge data and show shipping form
                            setPendingChargeData({
                              memberId: finalWebhookData.memberId,
                              setupIntentId: finalWebhookData.setupIntentId,
                              planId,
                            });
                            setShowShippingForm(true);
                            return;
                          } else {
                            const chargeError = await chargeResponse.json();
                            console.error('Error charging initial product:', chargeError);
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Final attempt to get member ID failed:', error);
                    }
                  }
                  // Show error message and wait a bit longer for webhook to process
                  alert('Payment method saved! Processing your order. Please wait...');
                  
                  // Wait a bit longer and try one more time
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  
                  if (parsed.email) {
                    try {
                      const lastAttempt = await fetch(
                        `/api/whop/webhook?email=${encodeURIComponent(parsed.email)}`
                      );
                      if (lastAttempt.ok) {
                        const lastData = await lastAttempt.json();
                        if (lastData.memberId) {
                          // Charge the initial product
                          const chargeResponse = await fetch('/api/whop/charge-initial', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              memberId: lastData.memberId,
                              planId,
                              userEmail: parsed.email, // Pass email to retrieve payment method from Supabase
                            }),
                          });
                          
                          if (chargeResponse.ok) {
                            // Track Purchase event for initial product
                            if (product) {
                              const productPrice = parseFloat(product.price.replace('$', ''));
                              trackFacebookEvent('Purchase', {
                                content_name: product.name,
                                content_category: product.subtitle,
                                content_ids: [planId],
                                value: productPrice,
                                currency: 'USD',
                              });
                            }
                            
                            // Store charge data and show shipping form
                            setPendingChargeData({
                              memberId: lastData.memberId,
                              setupIntentId: lastData.setupIntentId,
                              planId,
                            });
                            setShowShippingForm(true);
                            return;
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Last attempt failed:', error);
                    }
                  }
                  
                  // If still no member ID, show error and redirect to home
                  alert('Payment method saved successfully! However, we encountered an issue processing your order. Please contact support with your email address.');
                  router.push('/');
                }
              } catch (error) {
                console.error('Error processing checkout completion:', error);
                alert('Payment method saved! However, we encountered an issue. Please contact support or try again in a moment.');
                // Don't redirect to upsell without member ID - redirect to home instead
                router.push('/');
              }
            }}
            />
          ) : null}
        </div>
      </div>

      {/* Shipping Address Form */}
      {showShippingForm && pendingChargeData && (
        <ShippingAddressForm
          isOpen={showShippingForm}
          onSubmit={handleShippingSubmit}
          initialData={(() => {
            // Pre-fill with user data from localStorage if available
            const userData = localStorage.getItem('xperience_user_data');
            if (userData) {
              const parsed = JSON.parse(userData);
              return {
                firstName: parsed.firstName || '',
                lastName: parsed.lastName || '',
              };
            }
            return {};
          })()}
        />
      )}
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

