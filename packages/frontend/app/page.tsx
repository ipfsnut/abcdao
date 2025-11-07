/**
 * Root Page - Client-side redirect to simplified home (compatible with static export)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-green-400 text-4xl mb-4">🚀</div>
        <h2 className="text-xl font-bold matrix-glow mb-2">
          ABC DAO
        </h2>
        <p className="text-green-600">
          Redirecting...
        </p>
      </div>
    </div>
  );
}