/**
 * Simplified Navigation Component
 * 
 * Consolidated navigation for 10 essential pages:
 * 1. Home (dashboard)
 * 2. Join (onboarding) 
 * 3. Staking (unified with leaderboard)
 * 4. Developers (dev hub)
 * 5. Community (roster + profiles)
 * 6. Treasury (treasury + analytics)
 * 7. Docs (all documentation)
 * 8. Profile (dynamic)
 * 9. Legal
 * 10. Support
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface User {
  wallet_address: string;
  display_name?: string;
  github_connected: boolean;
  discord_connected: boolean;
  farcaster_connected: boolean;
  is_member: boolean;
  can_earn_rewards: boolean;
}

interface SimplifiedNavigationProps {
  user?: User;
  isAuthenticated: boolean;
}

export function SimplifiedNavigation({ user, isAuthenticated }: SimplifiedNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    {
      href: '/home',
      label: 'Home',
      icon: '🏠',
      description: 'Dashboard and overview'
    },
    {
      href: '/join',
      label: 'Join',
      icon: '🚀',
      description: 'Onboarding and setup',
      show: !isAuthenticated || !user?.is_member
    },
    {
      href: '/staking',
      label: 'Staking',
      icon: '🏦',
      description: 'Stake tokens and leaderboard'
    },
    {
      href: '/developers',
      label: 'Developers',
      icon: '💻',
      description: 'Dev tools and repositories',
      show: isAuthenticated
    },
    {
      href: '/community',
      label: 'Community',
      icon: '👥',
      description: 'Member directory and social'
    },
    {
      href: '/treasury',
      label: 'Treasury',
      icon: '💰',
      description: 'Finances and analytics'
    },
    {
      href: '/docs',
      label: 'Docs',
      icon: '📚',
      description: 'Documentation and guides'
    }
  ];

  const userMenuItems = [
    {
      href: '/home',
      label: 'Profile',
      icon: '👤',
      show: isAuthenticated
    },
    {
      href: '/support',
      label: 'Support',
      icon: '🆘',
      description: 'Help and troubleshooting'
    },
    {
      href: '/legal',
      label: 'Legal',
      icon: '📜',
      description: 'Privacy and terms'
    }
  ];

  const isActivePage = (href: string) => {
    if (href === '/home' && pathname === '/') return true;
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/ABC_DAO_LOGO.png" alt="ABC DAO" className="w-8 h-8" />
            <span className="text-xl font-bold matrix-glow">ABC_DAO</span>
          </Link>

          {/* Main Navigation */}
          <nav className="flex items-center gap-1">
            {navigationItems.map((item) => {
              if (item.show === false) return null;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg font-mono text-sm transition-all duration-200 ${
                    isActivePage(item.href)
                      ? 'bg-green-900/50 text-green-400 border border-green-700/50 matrix-glow'
                      : 'text-green-600 hover:text-green-400 hover:bg-green-950/30'
                  }`}
                  title={item.description}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* User Status Indicators */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.github_connected ? 'bg-green-400' : 'bg-yellow-400'}`} 
                       title={`GitHub: ${user.github_connected ? 'Connected' : 'Not connected'}`} />
                  <div className={`w-2 h-2 rounded-full ${user.is_member ? 'bg-green-400' : 'bg-yellow-400'}`}
                       title={`Membership: ${user.is_member ? 'Active' : 'Free tier'}`} />
                </div>

                {/* User Menu */}
                <div className="relative">
                  <Link
                    href={`/profile?address=${user.wallet_address}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-900/30 hover:border-green-700/50 transition-all"
                  >
                    <span className="text-xs text-green-600">
                      {user.display_name || `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`}
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <ConnectButton />
            )}

            {/* Utility Menu */}
            <div className="flex items-center gap-1">
              {userMenuItems.map((item) => {
                if (item.show === false) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                      isActivePage(item.href)
                        ? 'bg-green-900/50 text-green-400'
                        : 'text-green-600 hover:text-green-400 hover:bg-green-950/30'
                    }`}
                    title={item.description || item.label}
                  >
                    {item.icon}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Logo */}
            <Link href="/home" className="flex items-center gap-2">
              <img src="/ABC_DAO_LOGO.png" alt="ABC DAO" className="w-6 h-6" />
              <span className="text-lg font-bold matrix-glow">ABC_DAO</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-green-400 hover:text-green-300 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="border-t border-green-900/30 py-4 space-y-2">
              {/* Authentication Status */}
              {isAuthenticated && user && (
                <div className="px-4 py-2 border-b border-green-900/30 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.github_connected ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <div className={`w-2 h-2 rounded-full ${user.is_member ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    </div>
                    <span className="text-xs text-green-600">
                      {user.display_name || `${user.wallet_address.slice(0, 6)}...`}
                    </span>
                  </div>
                </div>
              )}

              {/* Main Navigation */}
              {navigationItems.map((item) => {
                if (item.show === false) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 rounded-lg font-mono text-sm transition-all duration-200 ${
                      isActivePage(item.href)
                        ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                        : 'text-green-600 hover:text-green-400 hover:bg-green-950/30'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                    {item.description && (
                      <span className="block text-xs text-green-700 mt-1 ml-7">
                        {item.description}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* User Menu */}
              <div className="border-t border-green-900/30 pt-4 mt-4">
                {userMenuItems.map((item) => {
                  if (item.show === false) return null;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActivePage(item.href)
                          ? 'bg-green-900/50 text-green-400'
                          : 'text-green-600 hover:text-green-400 hover:bg-green-950/30'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Connect Button */}
              {!isAuthenticated && (
                <div className="border-t border-green-900/30 pt-4 mt-4 px-4">
                  <ConnectButton />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}