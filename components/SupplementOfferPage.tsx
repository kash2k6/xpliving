'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductImageGallery from '@/components/ProductImageGallery';
import { trackFacebookEvent } from '@/components/FacebookPixel';

export default function SupplementOfferPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams.get('name') || 'there';
  const initialProductId = (searchParams.get('product') as 'youth' | 'roman') || 'youth';
  const [productId, setProductId] = useState<'youth' | 'roman'>(initialProductId);
  const email = searchParams.get('email') || '';

  const products = {
    youth: {
      id: 'youth',
      name: 'Xperience Youth',
      subtitle: 'Liquid Formula',
      price: '$44.95',
      planId: process.env.NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH || 'plan_x3WmiSOReZ9yc',
      keyIngredients: [
        'Deer Antler Velvet Extract',
        'L-Arginine',
        'Epimedium (Horny Goat Weed)',
        'Tribulus terrestris',
        'Eurycoma longifolia (Tongkat Ali)',
        'Niacin (Vitamin B3)',
      ],
    },
    roman: {
      id: 'roman',
      name: 'Roman Xperience',
      subtitle: 'Premium Formula',
      price: '$59.95',
      planId: process.env.NEXT_PUBLIC_WHOP_PLAN_ID_ROMAN || 'plan_yl6F67ovs2E19',
      keyIngredients: [
        'L-Citrulline',
        'Maca Root',
        'Korean Red Ginseng',
      ],
    },
  };

  const product = products[productId];

  const handleBuyNow = () => {
    // Track AddToCart event for Facebook Pixel
    trackFacebookEvent('AddToCart', {
      content_name: product.name,
      content_category: product.subtitle,
      value: parseFloat(product.price.replace('$', '')),
      currency: 'USD',
    });
    router.push(`/checkout?planId=${product.planId}`);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            A Simple Way to Support Male Vitality — Daily
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            You've seen how performance, confidence, circulation, and stress work together over time.
          </p>
        </div>

        {/* Opening Section */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            This page introduces a <strong className="text-white">natural daily support option</strong> many men choose once they understand what's really happening.
          </p>
          <p className="text-white text-lg">
            Not as a quick fix.<br />
            Not as a cure.<br />
            But as a consistent way to support the body where it matters most.
          </p>
        </div>

        {/* Introducing Product */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Introducing: {product.name}</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            {product.name} was created for men who want to:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Feel more confident going into intimate moments</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Support healthy circulation</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Maintain energy and vitality as they age</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Reduce pressure and overthinking around performance</span>
            </li>
          </ul>
          <p className="text-gray-300 text-lg leading-relaxed">
            It's designed to fit into real life — quietly supporting your routine in the background.
          </p>
        </div>

        {/* What Formula Supports */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">What This Formula Is Designed to Support</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            This daily formula focuses on <strong className="text-white">key systems involved in male vitality</strong>, including:
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Circulation support</h3>
              <p className="text-gray-300">Healthy blood flow plays a major role in performance and confidence.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Energy & stamina support</h3>
              <p className="text-gray-300">Supporting daily energy helps consistency feel natural, not forced.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Recovery & balance</h3>
              <p className="text-gray-300">Better recovery often leads to better performance over time.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Mental calm & confidence</h3>
              <p className="text-gray-300">When the body feels supported, the mind tends to follow.</p>
            </div>
          </div>
        </div>

        {/* What Makes This Different */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">What Makes This Approach Different</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Most men don't need extreme solutions.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            They need something that is:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#0D6B4D]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Simple</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#0D6B4D]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Consistent</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#0D6B4D]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Private</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#0D6B4D]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-300">Sustainable</span>
            </div>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            {product.name} is built around <strong className="text-white">daily support</strong>, not pressure or promises.
          </p>
          <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-white text-lg">
              No countdown timers.<br />
              No unrealistic claims.<br />
              No dependency on "perfect timing."
            </p>
            <p className="text-[#0D6B4D] font-semibold text-lg mt-2">Just a routine you can stick to.</p>
          </div>
        </div>

        {/* Why Natural Support */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Why Many Men Prefer a Natural Support Option</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Men often choose natural support because it:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Works with the body instead of overriding it</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Can be used consistently over time</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Fits alongside normal lifestyle habits</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Avoids unnecessary complexity</span>
            </li>
          </ul>
          <p className="text-gray-300 text-lg leading-relaxed">
            For many, this becomes the foundation — not the last resort.
          </p>
        </div>

        {/* Product Choice Section */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Choose Your Formula</h2>
          <p className="text-gray-300 text-center mb-8">
            Select the option that best fits your preference and lifestyle
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Xperience Youth - Liquid Formula */}
            <div className={`bg-[#1a1a1a] border-2 rounded-xl p-6 transition-all ${
              productId === 'youth' 
                ? 'border-[#0D6B4D] bg-[#0D6B4D]/10' 
                : 'border-[#3a3a3a] hover:border-[#0D6B4D]/50'
            }`}>
              <div className="flex flex-col items-center text-center">
                <ProductImageGallery
                  productId="youth"
                  className="h-48 w-36 rounded-xl mb-4"
                  fallbackGradient="linear-gradient(to bottom, #0D6B4D, #093F2E)"
                />
                <h3 className="text-xl font-bold text-white mb-2">Xperience Youth</h3>
                <p className="text-[#0D6B4D] font-semibold mb-3">Liquid Formula</p>
                <div className="bg-[#0D6B4D]/20 rounded-lg px-3 py-1 mb-3">
                  <p className="text-[#0D6B4D] font-semibold text-sm">⚡ Fast Absorbing</p>
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Fast-acting liquid formula for immediate support. Perfect for on-the-go lifestyle.
                </p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Key Ingredients:</h4>
                  <ul className="space-y-1 text-left">
                    {products.youth.keyIngredients.slice(0, 3).map((ingredient, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3 h-3 text-[#0D6B4D] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                    <li className="text-xs text-gray-500 pl-5">+ 3 more</li>
                  </ul>
                </div>
                <div className="text-2xl font-bold text-[#0D6B4D] mb-4">{products.youth.price}</div>
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => setProductId('youth')}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                      productId === 'youth'
                        ? 'bg-[#0D6B4D] text-white'
                        : 'bg-transparent border-2 border-[#0D6B4D] text-[#0D6B4D] hover:bg-[#0D6B4D]/10'
                    }`}
                  >
                    {productId === 'youth' ? 'Selected' : 'Select This Option'}
                  </button>
                  <a
                    href="/product/youth"
                    target="_blank"
                    className="w-full py-2 px-6 rounded-xl font-semibold transition-colors bg-transparent border border-[#3a3a3a] text-gray-300 hover:border-[#0D6B4D] hover:text-[#0D6B4D] text-sm"
                  >
                    View More Details
                  </a>
                </div>
              </div>
            </div>

            {/* Roman Xperience - Premium Formula */}
            <div className={`bg-[#1a1a1a] border-2 rounded-xl p-6 transition-all ${
              productId === 'roman' 
                ? 'border-[#8B4513] bg-[#8B4513]/10' 
                : 'border-[#3a3a3a] hover:border-[#8B4513]/50'
            }`}>
              <div className="flex flex-col items-center text-center">
                <ProductImageGallery
                  productId="roman"
                  className="h-48 w-36 rounded-xl mb-4"
                  fallbackGradient="linear-gradient(to bottom, #8B4513, #5D2F0A)"
                />
                <h3 className="text-xl font-bold text-white mb-2">Roman Xperience</h3>
                <p className="text-[#8B4513] font-semibold mb-3">Premium Formula</p>
                <div className="bg-[#8B4513]/20 rounded-lg px-3 py-1 mb-3">
                  <p className="text-[#8B4513] font-semibold text-sm">💊 Premium Capsules</p>
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Premium capsule formula with time-tested ingredients for comprehensive daily support.
                </p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Key Ingredients:</h4>
                  <ul className="space-y-1 text-left">
                    {products.roman.keyIngredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3 h-3 text-[#8B4513] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-2xl font-bold text-[#8B4513] mb-4">{products.roman.price}</div>
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => setProductId('roman')}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                      productId === 'roman'
                        ? 'bg-[#8B4513] text-white'
                        : 'bg-transparent border-2 border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513]/10'
                    }`}
                  >
                    {productId === 'roman' ? 'Selected' : 'Select This Option'}
                  </button>
                  <a
                    href="/product/roman"
                    target="_blank"
                    className="w-full py-2 px-6 rounded-xl font-semibold transition-colors bg-transparent border border-[#3a3a3a] text-gray-300 hover:border-[#8B4513] hover:text-[#8B4513] text-sm"
                  >
                    View More Details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use It */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">How to Use It</h2>
          <ul className="space-y-3 mb-4">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Take daily as part of your routine</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">No special timing required</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">No lifestyle overhaul needed</span>
            </li>
          </ul>
          <p className="text-[#0D6B4D] font-semibold text-lg">
            Consistency is more important than intensity.
          </p>
        </div>

        {/* Who This Is For */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Who This Is For</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            This option is commonly chosen by men who:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Want to feel more reliable and confident</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Have noticed changes over time</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Prefer a natural approach</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Want privacy and simplicity</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Are ready to stop overthinking and start supporting</span>
            </li>
          </ul>
        </div>

        {/* What to Expect */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">What to Expect</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Every man is different.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Some notice subtle changes first — like calmer confidence or better consistency.<br />
            Others notice improvements gradually over weeks as daily support adds up.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            There are no guarantees — but many men find this approach far more realistic than extremes.
          </p>
        </div>

        {/* Main CTA */}
        <div className="bg-gradient-to-r from-[#0D6B4D] to-[#0b5940] rounded-xl p-8 text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-white text-lg mb-6">
            If you're ready to add a simple daily support option to your routine:
          </p>
          <div className="mb-6">
            <div className="text-4xl font-bold text-white mb-2">{product.price}</div>
            <p className="text-white/80">One-time purchase • 30-day supply</p>
          </div>
          <button
            onClick={handleBuyNow}
            className={`bg-white hover:bg-gray-100 font-bold py-4 px-12 rounded-xl transition-colors text-lg mb-4 ${
              productId === 'youth' ? 'text-[#0D6B4D]' : 'text-[#8B4513]'
            }`}
          >
            ➡️ Add {product.name} to Cart
          </button>
          <div className="flex flex-wrap justify-center gap-4 text-white/80 text-sm">
            <span>✓ 60-Day Money-Back Guarantee</span>
            <span>✓ Free Shipping</span>
            <span>✓ Secure Checkout</span>
          </div>
        </div>

        {/* Call Support */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6 mb-8 text-center">
          <p className="text-gray-300 mb-4">Need help or have questions?</p>
          <a
            href="tel:+12027967881"
            className="inline-flex items-center gap-2 bg-transparent border-2 border-[#0D6B4D] hover:bg-[#0D6B4D]/10 text-[#0D6B4D] hover:text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call (202) 796-7881</span>
          </a>
        </div>

        {/* Disclaimer */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6">
          <p className="text-sm text-gray-400 text-center leading-relaxed">
            These statements have not been evaluated by the Food and Drug Administration.<br />
            This product is not intended to diagnose, treat, cure, or prevent any disease.<br />
            Individual results may vary.
          </p>
        </div>
      </div>
    </div>
  );
}
