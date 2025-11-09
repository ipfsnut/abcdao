'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🚀</div>
        <h2 className="text-2xl font-bold mb-2">ABC DAO</h2>
        <p className="text-green-600">Redirecting to dashboard...</p>
        <p className="text-sm mt-4 text-green-700">
          If you are not redirected automatically,{' '}
          <a href="/home" className="text-green-400 underline">
            click here
          </a>
        </p>
      </div>
    </div>
  );
}