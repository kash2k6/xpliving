'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import ProductImageGallery from '@/components/ProductImageGallery';

export default function BridgePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams.get('name') || 'there';
  const ageRange = searchParams.get('q1') || '';
  const email = searchParams.get('email') || '';

  // Determine recommended product based on age
  const getRecommendedProduct = () => {
    if (ageRange.includes('18') || ageRange.includes('25') || ageRange.includes('35')) {
      return 'youth';
    }
    return 'roman';
  };

  const recommendedProduct = getRecommendedProduct();

  const products = {
    youth: {
      id: 'youth',
      name: 'Xperience Youth',
      subtitle: 'Liquid Formula',
      price: '$44.95',
      planId: process.env.NEXT_PUBLIC_WHOP_PLAN_ID_YOUTH || 'plan_x3WmiSOReZ9yc',
    },
    roman: {
      id: 'roman',
      name: 'Roman Xperience',
      subtitle: 'Premium Formula',
      price: '$59.95',
      planId: process.env.NEXT_PUBLIC_WHOP_PLAN_ID_ROMAN || 'plan_yl6F67ovs2E19',
    },
  };

  const handleContinue = () => {
    const params = new URLSearchParams({
      name: name,
      email: email,
      product: recommendedProduct,
      ...Object.fromEntries(searchParams.entries()),
    }).toString();
    router.push(`/assessment/offer?${params}`);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What Many Men Choose Next
          </h1>
        </div>

        {/* Main Content */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            You've now seen how lifestyle, stress, circulation, and recovery work together to influence confidence and performance over time.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            At this point, most men reach a similar realization:
          </p>
          <div className="bg-[#1a1a1a] border-l-4 border-[#0D6B4D] p-6 rounded-r-lg mb-6">
            <p className="text-white text-lg leading-relaxed">
              <strong>Doing nothing usually leads to more inconsistency.</strong><br />
              <strong>Doing something extreme usually leads to disappointment.</strong>
            </p>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            So instead, many men choose a <strong className="text-white">simple, natural support approach</strong> they can actually stick to.
          </p>
        </div>

        {/* Why Support Works Better */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Why "Support" Works Better Than Pressure</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            One of the biggest mistakes men make is trying to <em>force</em> results.
          </p>
          <p className="text-gray-300 mb-4">That often creates:</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-[#0D6B4D]">•</span>
              <span className="text-gray-300">More pressure going into intimacy</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#0D6B4D]">•</span>
              <span className="text-gray-300">More overthinking</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#0D6B4D]">•</span>
              <span className="text-gray-300">Less consistency</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#0D6B4D]">•</span>
              <span className="text-gray-300">More frustration when results vary</span>
            </li>
          </ul>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            The men who see the best long-term improvement take a different route.
          </p>
          <p className="text-gray-300 mb-4">They focus on:</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Supporting circulation daily</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Supporting energy and recovery</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Reducing stress around performance</span>
            </li>
          </ul>
          <p className="text-gray-300 text-lg leading-relaxed">
            This shifts the body <em>and</em> the mindset — which is where real confidence comes from.
          </p>
        </div>

        {/* What This Looks Like */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">What This Looks Like in Real Life</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-400 mb-3">Instead of:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-red-400">×</span>
                  <span className="text-gray-300">Expensive clinics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">×</span>
                  <span className="text-gray-300">Awkward conversations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">×</span>
                  <span className="text-gray-300">Harsh prescriptions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400">×</span>
                  <span className="text-gray-300">One-time "quick fixes"</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-gray-400 mb-3">Many men choose:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0D6B4D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">A <strong className="text-white">daily routine</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0D6B4D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Built around <strong className="text-white">natural support</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0D6B4D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">That fits into normal life</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0D6B4D] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">And works quietly in the background</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
            <p className="text-white text-lg">
              No pressure.<br />
              No countdown timers.<br />
              No unrealistic promises.
            </p>
            <p className="text-[#0D6B4D] font-semibold text-lg mt-2">Just consistency.</p>
          </div>
        </div>

        {/* Why Natural Support */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Why Natural Support Is Often the First Step</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Natural support options are popular because they:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Work with the body instead of against it</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Support circulation and vitality over time</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Can be used privately and consistently</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Don't require major lifestyle disruption</span>
            </li>
          </ul>
          <p className="text-gray-300 text-lg leading-relaxed">
            For many men, this is the missing piece between <em>understanding the issue</em> and <em>actually doing something about it</em>.
          </p>
        </div>

        {/* Common Question */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">A Common Question Men Ask at This Point</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            <strong>"Does this really make a difference?"</strong>
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            The honest answer is:<br />
            Results vary — but men who see improvement usually have one thing in common:
          </p>
          <div className="bg-[#1a1a1a] border-l-4 border-[#0D6B4D] p-6 rounded-r-lg">
            <p className="text-white text-lg leading-relaxed">
              <strong>They stop waiting and start supporting their body daily.</strong>
            </p>
          </div>
          <p className="text-[#0D6B4D] font-semibold text-lg mt-4">
            Consistency beats intensity almost every time.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#0D6B4D] to-[#0b5940] rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">If You're Ready to Take the Next Step</h2>
          <p className="text-white text-lg leading-relaxed mb-4">
            Based on your results, a <strong>daily natural support option</strong> may be worth considering as part of your routine.
          </p>
          <p className="text-white text-lg mb-2">
            Not as a cure.<br />
            Not as a miracle.<br />
            But as a practical way to support confidence, circulation, and performance over time.
          </p>
          <div className="mt-6">
            <button
              onClick={handleContinue}
              className="bg-white text-[#0D6B4D] hover:bg-gray-100 font-bold py-4 px-12 rounded-xl transition-colors text-lg"
            >
              ➡️ See the Support Option Many Men Choose
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            This information is for educational purposes only and is not intended to diagnose, treat, cure, or prevent any disease. Individual results may vary.
          </p>
        </div>
      </div>
    </div>
  );
}
