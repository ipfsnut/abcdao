'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
});

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/docs', label: 'Overview', icon: '🏠' },
    { href: '/docs/mission', label: 'Mission Statement', icon: '🎯' },
    { href: '/docs/getting-started', label: 'Getting Started', icon: '🚀' },
    { href: '/docs/repository-setup', label: 'Repository Setup', icon: '📁' },
    { href: '/docs/rewards-system', label: 'Rewards & Tags', icon: '💰' },
    { href: '/docs/api-reference', label: 'API Reference', icon: '⚙️' },
    { href: '/docs/troubleshooting', label: 'Troubleshooting', icon: '🛠️' },
  ];

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gray-900 text-gray-100 font-sans antialiased`}>
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Image 
                src="/abc-logo.png" 
                alt="ABC Logo" 
                className="w-8 h-8 object-contain"
                width={32}
                height={32}
              />
              <div>
                <h1 className="text-lg font-bold text-green-400">
                  ABC DAO Documentation
                </h1>
                <p className="text-xs text-gray-400">
                  Developer guides and API reference
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="bg-green-900/20 hover:bg-green-800/30 border border-green-700/50 hover:border-green-600/70 
                         text-green-400 hover:text-green-300 px-4 py-2 rounded-lg text-sm font-medium
                         transition-all duration-200"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 p-4 border-r border-gray-700 bg-gray-800/50 min-h-screen sticky top-16">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                    : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700/50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Links
            </h3>
            <div className="space-y-2">
              <a
                href="https://app.uniswap.org/#/swap?outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07&chain=base"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                📊 Get $ABC on Uniswap
              </a>
              <a
                href="https://github.com/ABC-DAO/abc-dao"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                💻 GitHub Repository
              </a>
              <a
                href="https://warpcast.com/abc-dao"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                🐦 Follow on Farcaster
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}