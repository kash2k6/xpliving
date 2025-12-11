'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductData, Ingredient } from '@/lib/productData';
import ProductImageGallery from './ProductImageGallery';

interface ProductDetailContentProps {
  product: ProductData;
  onBuyNow: () => void;
}

export default function ProductDetailContent({ product, onBuyNow }: ProductDetailContentProps) {
  const router = useRouter();
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());

  const toggleIngredient = (ingredientName: string) => {
    setExpandedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientName)) {
        newSet.delete(ingredientName);
      } else {
        newSet.add(ingredientName);
      }
      return newSet;
    });
  };

  const renderIngredientSection = (ingredient: Ingredient) => {
    const isExpanded = expandedIngredients.has(ingredient.name);

    return (
      <div
        key={ingredient.name}
        className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-5 md:p-6 transition-all hover:border-[#4a4a4a]"
      >
        <button
          onClick={() => toggleIngredient(ingredient.name)}
          className="w-full flex items-center justify-between text-left group"
        >
          <h3 className="text-lg md:text-xl font-semibold text-white pr-4 group-hover:text-[#0D6B4D] transition-colors">
            {ingredient.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden md:block">Click to expand</span>
            <svg
              className={`w-6 h-6 text-gray-400 transition-transform flex-shrink-0 group-hover:text-white ${
                isExpanded ? 'rotate-45' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        </button>

        {isExpanded && (
          <div className="mt-6 space-y-6 pt-6 border-t border-[#3a3a3a] animate-fade-in">
            <div>
              <h4 className="font-semibold text-[#0D6B4D] mb-3 text-base">Traditional Uses</h4>
              <p className="leading-7 text-gray-300 text-sm md:text-base">{ingredient.traditionalUses}</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#0D6B4D] mb-3 text-base">Scientific Benefits</h4>
              <p className="leading-7 text-gray-300 text-sm md:text-base">{ingredient.scientificBenefits}</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#0D6B4D] mb-3 text-base">Mechanisms of Action</h4>
              <p className="leading-7 text-gray-300 text-sm md:text-base">{ingredient.mechanismsOfAction}</p>
            </div>
            <div>
              <h4 className="font-semibold text-[#0D6B4D] mb-3 text-base">Safety Profile</h4>
              <p className="leading-7 text-gray-300 text-sm md:text-base">{ingredient.safetyProfile}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-32 md:pb-24">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
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
      </button>

      {/* Product Header Section - Centered Image */}
      <div className="mb-16">
        {/* Product Image - Centered */}
        <div className="flex justify-center mb-8">
          <ProductImageGallery
            productId={product.id}
            className="h-96 w-72 md:h-[500px] md:w-80 rounded-2xl shadow-2xl"
            fallbackGradient={
              product.id === 'youth'
                ? 'linear-gradient(to bottom, #0D6B4D, #093F2E)'
                : 'linear-gradient(to bottom, #8B4513, #5D2F0A)'
            }
          />
        </div>

        {/* Product Title and Info - Centered */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {product.name}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-6">
            {product.subtitle}
          </p>
          
          {/* Price */}
          <div className="mb-8">
            <p className="text-4xl md:text-5xl font-bold text-[#0D6B4D] mb-2">
              {product.price}
            </p>
            <p className="text-gray-400">One-time purchase</p>
          </div>

          {/* Buy Now Button */}
          <button
            onClick={onBuyNow}
            className="bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-bold py-4 px-12 rounded-xl transition-colors text-lg mb-4"
          >
            BUY NOW
          </button>

          {/* Call Customer Support Button */}
          <a
            href="tel:+12027967881"
            className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-[#0D6B4D] hover:bg-[#0D6B4D]/10 text-[#0D6B4D] hover:text-white font-semibold py-3 px-8 rounded-xl transition-colors text-base mb-8"
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
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>Call Customer Support: (202) 796-7881</span>
          </a>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>60-Day Risk-Free Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Free Shipping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#3a3a3a] mb-16"></div>

      {/* Key Benefits Section */}
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">What You Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-[#0D6B4D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">All Natural</h3>
            <p className="text-gray-400 text-sm">100% natural ingredients backed by science</p>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-[#0D6B4D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Research-Backed</h3>
            <p className="text-gray-400 text-sm">Clinical studies support each ingredient</p>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-[#0D6B4D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Safe & Effective</h3>
            <p className="text-gray-400 text-sm">Excellent safety profiles at recommended doses</p>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-[#0D6B4D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">30-Day Supply</h3>
            <p className="text-gray-400 text-sm">One bottle provides a full month supply</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#3a3a3a] mb-16"></div>

      {/* Product Overview */}
      {product.summary && (
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Product Overview</h2>
          <div className="max-w-4xl mx-auto text-gray-300 leading-relaxed space-y-6 text-base md:text-lg">
            {product.summary
              .split(/\n\n+/)
              .filter(p => p.trim() && p.length > 20)
              .slice(0, 2)
              .map((paragraph, index) => (
                <p key={index} className="text-gray-300 leading-7">
                  {paragraph.trim()}
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-[#3a3a3a] mb-16"></div>

      {/* How It Works Section */}
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">How It Works</h2>
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-8">
            <p className="text-gray-300 leading-7 text-lg mb-4">
              {product.id === 'youth' 
                ? 'Xperience Youth combines powerful natural ingredients that work through multiple pathways to support male sexual health. The formula enhances nitric oxide production, supports hormonal balance, and provides adaptogenic benefits for improved stamina and performance.'
                : 'Roman Xperience leverages time-tested natural ingredients that enhance blood flow, boost libido, and support overall male vitality. The synergistic blend works through nitric oxide pathways, hormonal support, and stress reduction to improve sexual function naturally.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0D6B4D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Blood Flow</h3>
                <p className="text-gray-400 text-sm">Enhances nitric oxide production for improved circulation</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0D6B4D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Hormonal Balance</h3>
                <p className="text-gray-400 text-sm">Supports healthy testosterone and hormone levels</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0D6B4D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#0D6B4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Stress Reduction</h3>
                <p className="text-gray-400 text-sm">Adaptogenic effects help reduce fatigue and stress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#3a3a3a] mb-16"></div>

      {/* Ingredients */}
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">Key Ingredients</h2>
        <p className="text-gray-400 mb-10 text-lg text-center max-w-3xl mx-auto">
          Each ingredient is carefully selected and backed by traditional use and modern scientific research.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {product.ingredients.map(renderIngredientSection)}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#3a3a3a] mb-16"></div>

      {/* Disclaimer */}
      <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-400 text-center leading-relaxed">
          These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.
        </p>
      </div>
    </div>
  );
}

