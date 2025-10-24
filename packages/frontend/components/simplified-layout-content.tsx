/**
 * Simplified Layout Content
 * 
 * This component runs inside the Providers context and can safely use
 * wallet hooks like useWalletFirstAuth
 */

'use client';

import { WalletFirstAuth } from "@/components/wallet-first-auth";
import { SimplifiedNavigation } from "@/components/simplified-navigation";
import { useWalletFirstAuth } from "@/hooks/useWalletFirstAuth";

interface SimplifiedLayoutContentProps {
  children: React.ReactNode;
}

export function SimplifiedLayoutContent({ children }: SimplifiedLayoutContentProps) {
  const { user, isLoading, isAuthenticated } = useWalletFirstAuth();

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Simplified Navigation Header */}
      <SimplifiedNavigation user={user as any} isAuthenticated={isAuthenticated} />
      
      {/* Main Content Area */}
      <main className="relative">
        {!isAuthenticated && !isLoading ? (
          /* Show wallet connection prompt for unauthenticated users */
          <div className="container mx-auto px-4 py-8">
            <WalletFirstAuth />
          </div>
        ) : (
          /* Show app content for authenticated users */
          children
        )}
      </main>
    </div>
  );
}