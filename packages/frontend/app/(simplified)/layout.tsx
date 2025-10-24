/**
 * Simplified App Layout
 * 
 * New layout for consolidated page structure (10 pages vs 23)
 * Features wallet-first authentication and streamlined navigation
 */

'use client';

import { Providers } from "@/components/providers";
import { SimplifiedLayoutContent } from "@/components/simplified-layout-content";

export default function SimplifiedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <SimplifiedLayoutContent>
        {children}
      </SimplifiedLayoutContent>
    </Providers>
  );
}