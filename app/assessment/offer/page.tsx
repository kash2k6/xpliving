import { Suspense } from 'react';
import SupplementOfferPage from '@/components/SupplementOfferPage';

export default function Offer() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SupplementOfferPage />
    </Suspense>
  );
}
