/**
 * Simplified Layout Content
 *
 * Minimal wrapper - just renders children.
 * Navigation handled by individual pages if needed.
 */

'use client';

interface SimplifiedLayoutContentProps {
  children: React.ReactNode;
}

export function SimplifiedLayoutContent({ children }: SimplifiedLayoutContentProps) {
  return (
    <main className="min-h-screen bg-black text-green-400 font-mono">
      {children}
    </main>
  );
}