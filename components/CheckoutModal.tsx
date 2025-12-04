'use client';

import { useEffect } from 'react';
import { WhopCheckoutEmbed } from '@whop/checkout/react';
import { trackFacebookEvent } from './FacebookPixel';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  planId,
}: CheckoutModalProps) {
  // Track InitiateCheckout event when modal opens
  useEffect(() => {
    if (isOpen) {
      trackFacebookEvent('InitiateCheckout', {
        content_ids: [planId],
        content_type: 'product',
      });
    }
  }, [isOpen, planId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E4EEE7]">
          <h2 className="text-lg font-semibold text-[#0D6B4D]">
            Complete Your Purchase
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Checkout Embed */}
        <div className="flex-1 overflow-auto p-4">
          <WhopCheckoutEmbed
            planId={planId}
            onComplete={() => {
              onClose();
              // You can add success notification here
            }}
          />
        </div>
      </div>
    </div>
  );
}

