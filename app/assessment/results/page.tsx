import { Suspense } from 'react';
import AssessmentResults from '@/components/AssessmentResults';

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AssessmentResults />
    </Suspense>
  );
}
