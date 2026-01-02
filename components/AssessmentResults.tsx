'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AssessmentResults() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get answers from URL params
  const ageRange = searchParams.get('q1') || '';
  const name = searchParams.get('name') || 'there';
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';

  const getPersonalizedInsights = () => {
    const insights = [];
    
    const confidence = searchParams.get('q3');
    if (confidence?.includes('dropped') || confidence?.includes('worry')) {
      insights.push('Changes in **confidence before intimacy**');
    }

    const consistency = searchParams.get('q4');
    if (consistency?.includes('Inconsistent') || consistency?.includes('unpredictable')) {
      insights.push('Inconsistency that leads to overthinking');
    }

    const stress = searchParams.get('q7');
    if (stress?.includes('Often') || stress?.includes('daily')) {
      insights.push('Stress or mental pressure affecting physical response');
    }

    const sleep = searchParams.get('q8');
    if (sleep?.includes('Restless') || sleep?.includes('Poor')) {
      insights.push('Recovery and circulation not working as efficiently as before');
    }

    // Default insights if none match
    if (insights.length === 0) {
      insights.push('Changes in **confidence before intimacy**');
      insights.push('Inconsistency that leads to overthinking');
    }

    return insights;
  };

  const insights = getPersonalizedInsights();

  const handleViewProducts = () => {
    // Navigate to bridge page
    const params = new URLSearchParams({
      name: name,
      email: email,
      phone: phone || '',
      ...Object.fromEntries(searchParams.entries()),
    }).toString();
    router.push(`/assessment/bridge?${params}`);
  };

  // Determine recommended product based on age
  const getRecommendedProduct = () => {
    if (ageRange.includes('18') || ageRange.includes('25') || ageRange.includes('35')) {
      return 'youth';
    }
    return 'roman';
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Personalized Results
          </h1>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6 mb-6">
            <p className="text-gray-300 text-lg leading-relaxed">
              Based on your responses, several lifestyle and wellness factors may be influencing your confidence, consistency, and overall male vitality.
            </p>
            <p className="text-gray-400 text-sm mt-3 italic">
              This is educational information — not medical advice.
            </p>
          </div>
        </div>

        {/* What Your Answers Suggest */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">What Your Answers Suggest</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Your results indicate that <strong className="text-white">performance changes are likely not caused by a single issue</strong>, but rather a combination of factors that tend to build up over time.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Many men experience this quietly — especially as responsibilities, stress, and age increase.
          </p>
          
          <p className="text-gray-300 mb-4">Common patterns from your responses include:</p>
          <ul className="space-y-3 mb-6">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }}></span>
              </li>
            ))}
          </ul>

          <div className="bg-[#1a1a1a] border-l-4 border-[#0D6B4D] p-4 rounded-r-lg">
            <p className="text-white text-lg leading-relaxed">
              <strong>The important thing to understand is this:</strong>
            </p>
            <p className="text-gray-300 text-lg leading-relaxed mt-2">
              <strong className="text-[#0D6B4D]">These patterns are common — and they are often reversible with the right approach.</strong>
            </p>
          </div>
        </div>

        {/* Why This Happens */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Why This Happens (In Plain English)</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Male performance isn't just about desire.<br />
            It's heavily influenced by:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300"><strong className="text-white">Circulation</strong> (blood flow & vascular support)</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300"><strong className="text-white">Stress & nervous system balance</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300"><strong className="text-white">Sleep & recovery</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300"><strong className="text-white">Daily habits over time</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300"><strong className="text-white">Age-related changes</strong></span>
            </li>
          </ul>
          <p className="text-gray-300 text-lg leading-relaxed mb-2">
            When even one of these is slightly off, confidence drops.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-2">
            When several stack together, inconsistency appears — and frustration follows.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-2">
            Most men assume this means "something is wrong."
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            In reality, it usually means the body needs <strong className="text-white">better daily support</strong>, not extreme solutions.
          </p>
        </div>

        {/* Why Quick Fixes Often Disappoint */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Why Quick Fixes Often Disappoint</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            Many men try random solutions hoping for instant results.
          </p>
          <p className="text-gray-300 mb-4">What usually happens:</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-[#0D6B4D]">•</span>
              <span className="text-gray-300">Short-term effects</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#0D6B4D]">•</span>
              <span className="text-gray-300">Inconsistent outcomes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#0D6B4D]">•</span>
              <span className="text-gray-300">Increased pressure to "perform"</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#0D6B4D]">•</span>
              <span className="text-gray-300">Even more overthinking</span>
            </li>
          </ul>
          <p className="text-gray-300 text-lg leading-relaxed">
            This cycle makes the issue feel bigger than it actually is.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mt-2">
            The better approach focuses on <strong className="text-white">supporting the system</strong>, not forcing results.
          </p>
        </div>

        {/* The Good News */}
        <div className="bg-gradient-to-r from-[#0D6B4D] to-[#0b5940] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">The Good News</h2>
          <p className="text-white text-lg leading-relaxed mb-4">
            Based on your answers, there's a <strong>clear opportunity to improve</strong>:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-white">Confidence</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-white">Consistency</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-white">Energy</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-white">Mental calm going into intimate moments</span>
            </div>
          </div>
          <p className="text-white text-lg leading-relaxed mb-4">
            Most men who see improvement follow a <strong>simple, natural framework</strong>:
          </p>
          <ol className="space-y-2 mb-6 text-white">
            <li className="flex items-start gap-3">
              <span className="font-bold">1.</span>
              <span>Understand what's really affecting performance</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold">2.</span>
              <span>Reduce stress & pressure around it</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold">3.</span>
              <span>Support circulation and recovery daily</span>
            </li>
          </ol>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-white text-lg">
              No clinics.<br />
              No awkward conversations.<br />
              No expensive procedures.
            </p>
          </div>
        </div>

        {/* Before You Decide */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Before You Decide Anything — Read This First</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            We've put together a short, free guide that explains:
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">What erectile dysfunction actually is (and what it isn't)</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Why many men experience changes without realizing why</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">Why natural support often works better than expected</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#0D6B4D] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-300">What most men overlook when trying to fix this</span>
            </li>
          </ul>
          <p className="text-gray-300 text-lg leading-relaxed">
            This guide is purely educational — but for many men, it's the turning point.
          </p>
        </div>

        {/* Free Guide PDF Embed */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Free Men's Performance Guide</h2>
          <p className="text-gray-300 text-center mb-6">
            Read this comprehensive guide to understand men's sexual health and natural support options.
          </p>
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden" style={{ height: '800px' }}>
            <object
              data="/PDF/UnderstandingMensSexualHealth.pdf"
              type="application/pdf"
              className="w-full h-full"
              aria-label="Men's Sexual Health Guide"
            >
              <iframe
                src="/PDF/UnderstandingMensSexualHealth.pdf"
                className="w-full h-full border-0"
                title="Men's Sexual Health Guide"
              />
            </object>
          </div>
          <p className="text-gray-400 text-sm text-center mt-4">
            Takes about 5 minutes to read • Private • Educational • No pressure
          </p>
        </div>

        {/* CTA to View Products */}
        <div className="bg-gradient-to-r from-[#0D6B4D] to-[#0b5940] rounded-xl p-8 text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Take Action?</h2>
          <p className="text-white text-lg mb-6">
            Now that you've read the guide, see the natural support options many men choose.
          </p>
          <button
            onClick={handleViewProducts}
            className="bg-white text-[#0D6B4D] hover:bg-gray-100 font-bold py-4 px-12 rounded-xl transition-colors text-lg"
          >
            ➡️ View Product Options
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6">
          <p className="text-sm text-gray-400 text-center leading-relaxed">
            This content is for educational purposes only and is not intended to diagnose, treat, cure, or prevent any disease. Individual experiences vary.
          </p>
        </div>
      </div>
    </div>
  );
}
