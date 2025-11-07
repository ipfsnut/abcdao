/**
 * Simplified Layout Content
 * 
 * This component runs inside the Providers context and can safely use
 * wallet hooks like useWalletFirstAuth
 */

'use client';

import { SimplifiedNavigation } from "@/components/simplified-navigation";
import { UpgradeBanner } from "@/components/upgrade-banner";
import { useAccount } from 'wagmi';

interface SimplifiedLayoutContentProps {
  children: React.ReactNode;
}


export function SimplifiedLayoutContent({ children }: SimplifiedLayoutContentProps) {
  // Only check wallet connection status, don't handle full authentication here
  // Let individual pages handle their own authentication with useWalletFirstAuth
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Upgrade Banner */}
      <UpgradeBanner />
      
      {/* Simplified Navigation Header - pass minimal data */}
      <SimplifiedNavigation user={undefined} isAuthenticated={isConnected} />
      
      {/* Main Content Area - let pages handle their own auth */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
}