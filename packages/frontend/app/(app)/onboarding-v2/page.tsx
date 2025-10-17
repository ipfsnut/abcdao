'use client';

import { Suspense } from 'react';
import { ImprovedOnboarding } from '@/components/improved-onboarding';

function OnboardingV2Content() {
  return <ImprovedOnboarding />;
}

export default function OnboardingV2Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">🔍</div>
          <p className="text-green-400">Loading improved onboarding...</p>
        </div>
      </div>
    }>
      <OnboardingV2Content />
    </Suspense>
  );
}