import { Suspense } from 'react';
import BridgePage from '@/components/BridgePage';

export default function Bridge() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <BridgePage />
    </Suspense>
  );
}
