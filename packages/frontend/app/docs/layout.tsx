'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
      {/* Mobile Header */}
      <header className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-700/50 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Logo and Title */}
            <div className="flex items-center gap-3 flex-1 lg:flex-none justify-center lg:justify-start">
              <Image 
                src="/abc-logo.png" 
                alt="ABC Logo" 
                className="w-8 h-8 object-contain"
                width={32}
                height={32}
              />
              <div className="text-center lg:text-left">
                <h1 className="text-lg font-bold text-green-400">
                  ABC DAO Docs
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  Developer guides and API reference
                </p>
              </div>
            </div>

            {/* Back to App Button */}
            <Link
              href="/"
              className="bg-green-900/20 hover:bg-green-800/30 border border-green-700/50 hover:border-green-600/70 
                         text-green-400 hover:text-green-300 px-3 py-2 rounded-lg text-sm font-medium
                         transition-all duration-200 hidden sm:flex items-center"
            >
              ← Back
            </Link>
            <Link
              href="/"
              className="sm:hidden p-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-colors"
              aria-label="Back to app"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex relative min-h-screen bg-gray-900">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <nav className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:min-h-screen pt-4 lg:pt-0
        `}>
          <div className="p-4 space-y-1 overflow-y-auto h-full">
            {/* Mobile Header in Sidebar */}
            <div className="lg:hidden mb-6 pb-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Image 
                  src="/abc-logo.png" 
                  alt="ABC Logo" 
                  className="w-6 h-6 object-contain"
                  width={24}
                  height={24}
                />
                <span className="text-lg font-bold text-green-400">ABC DAO</span>
              </div>
            </div>

            {/* Navigation Items */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`block px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                    : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700/50'
                }`}
              >
                <span className="mr-3 text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Quick Links */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Quick Links
              </h3>
              <div className="space-y-2">
                <a
                  href="https://app.uniswap.org/#/swap?outputCurrency=0x5c0872b790bb73e2b3a9778db6e7704095624b07&chain=base"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-700/30 rounded-lg transition-colors"
                >
                  📊 Get $ABC on Uniswap
                </a>
                <a
                  href="https://github.com/ABC-DAO/abc-dao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-700/30 rounded-lg transition-colors"
                >
                  💻 GitHub Repository
                </a>
                <a
                  href="https://warpcast.com/abc-dao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-700/30 rounded-lg transition-colors"
                >
                  🐦 Follow on Farcaster
                </a>
              </div>
            </div>

            {/* Mobile Back to App */}
            <div className="lg:hidden mt-8 pt-6 border-t border-gray-700">
              <Link
                href="/"
                className="block w-full bg-green-900/20 hover:bg-green-800/30 border border-green-700/50 hover:border-green-600/70 
                           text-green-400 hover:text-green-300 px-4 py-3 rounded-lg text-sm font-medium text-center
                           transition-all duration-200"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-screen bg-gray-900">
          <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}