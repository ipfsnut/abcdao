/**
 * ABC DAO Landing Page
 * Styled to match ArbMe aesthetic
 */

'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

// Token contract addresses on Base
const TOKENS = {
  ABC: '0x5c0872b790bb73e2b3a9778db6e7704095624b07',
  ARBME: '0xC647421C5Dc78D1c3960faA7A33f9aEFDF4B7B07',
  RATCHET: '0x392bc5DeEa227043d69Af0e67BadCbBAeD511B07',
};

interface TokenPrice {
  price: string;
  priceChange24h: number;
  loading: boolean;
}

export default function HomePage() {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({
    ABC: { price: '-', priceChange24h: 0, loading: true },
    ARBME: { price: '-', priceChange24h: 0, loading: true },
    RATCHET: { price: '-', priceChange24h: 0, loading: true },
  });

  useEffect(() => {
    async function fetchPrices() {
      for (const [symbol, address] of Object.entries(TOKENS)) {
        try {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
          const data = await res.json();

          // Get the pair with highest liquidity on Base
          const basePairs = data.pairs?.filter((p: any) => p.chainId === 'base') || [];
          const bestPair = basePairs.sort((a: any, b: any) =>
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
          )[0];

          if (bestPair) {
            const price = parseFloat(bestPair.priceUsd);
            // Always use decimal format, never scientific notation
            let formattedPrice: string;
            if (price < 0.00000001) {
              formattedPrice = `$${price.toFixed(12)}`;
            } else if (price < 0.000001) {
              formattedPrice = `$${price.toFixed(10)}`;
            } else if (price < 0.0001) {
              formattedPrice = `$${price.toFixed(8)}`;
            } else if (price < 0.01) {
              formattedPrice = `$${price.toFixed(6)}`;
            } else if (price < 1) {
              formattedPrice = `$${price.toFixed(4)}`;
            } else {
              formattedPrice = `$${price.toFixed(2)}`;
            }

            setPrices(prev => ({
              ...prev,
              [symbol]: {
                price: formattedPrice,
                priceChange24h: bestPair.priceChange?.h24 || 0,
                loading: false,
              }
            }));
          } else {
            setPrices(prev => ({
              ...prev,
              [symbol]: { price: '-', priceChange24h: 0, loading: false }
            }));
          }
        } catch (err) {
          setPrices(prev => ({
            ...prev,
            [symbol]: { price: '-', priceChange24h: 0, loading: false }
          }));
        }
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#e8e8f2' }}>
      {/* Background glow effects */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(245,158,11,0.05) 0%, transparent 50%)'
        }}
      />

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 relative">
        <div className="relative z-10 text-center max-w-[900px] mx-auto">
          <Image
            src="/ABC_DAO_LOGO.png"
            alt="ABC DAO"
            width={80}
            height={80}
            className="mx-auto mb-8 opacity-90"
          />

          <h1
            className="font-semibold tracking-tight mb-6"
            style={{
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              fontSize: 'clamp(3rem, 10vw, 5rem)',
              background: 'linear-gradient(135deg, #10b981 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ABC DAO
          </h1>

          <p
            className="text-xl md:text-2xl mb-4"
            style={{
              fontFamily: 'var(--font-mono), monospace',
              color: '#10b981',
              letterSpacing: '0.05em'
            }}
          >
            Always. Be. Coding.
          </p>

          <p
            className="max-w-xl mx-auto mb-12"
            style={{
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              color: '#7a7a8f',
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}
          >
            A developer collective building DeFi infrastructure for Farcaster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://arbme.epicdylan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 font-semibold rounded-lg transition-all duration-200"
              style={{
                fontFamily: 'var(--font-sans), system-ui, sans-serif',
                background: '#10b981',
                color: '#0a0a0f',
                boxShadow: '0 0 30px rgba(16,185,129,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(16,185,129,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(16,185,129,0.3)';
              }}
            >
              Launch ArbMe
            </a>
            <a
              href="https://discord.gg/km7RysdTeq"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 font-semibold rounded-lg transition-all duration-200"
              style={{
                fontFamily: 'var(--font-sans), system-ui, sans-serif',
                background: 'transparent',
                color: '#10b981',
                border: '1px solid #1f1f2f'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1f1f2f';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>

      {/* Product */}
      <section className="py-20 px-6 sm:px-8" style={{ borderTop: '1px solid #1f1f2f' }}>
        <div className="max-w-[900px] mx-auto text-center">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-mono), monospace', color: '#7a7a8f' }}
          >
            Product
          </p>
          <h2
            className="font-semibold mb-6"
            style={{
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: '#e8e8f2'
            }}
          >
            ArbMe
          </h2>
          <p
            className="mb-10 max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              color: '#7a7a8f',
              fontSize: '1.05rem',
              lineHeight: '1.6'
            }}
          >
            A Farcaster miniapp for liquidity pool arbitrage. Simple interface, real yields, built for the Farcaster ecosystem.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {['One-click arbitrage', 'Farcaster native', 'Real-time yields'].map((item) => (
              <div
                key={item}
                className="rounded-lg p-4 transition-all duration-200 text-center"
                style={{
                  background: '#0f0f18',
                  border: '1px solid #1f1f2f'
                }}
              >
                <span style={{ color: '#10b981', fontFamily: 'var(--font-mono), monospace' }}>→</span>
                <span
                  className="ml-2"
                  style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif', color: '#e8e8f2' }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          <a
            href="https://arbme.epicdylan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-mono), monospace',
              color: '#10b981',
              fontSize: '0.9rem'
            }}
          >
            Launch app <span>→</span>
          </a>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 sm:px-8" style={{ borderTop: '1px solid #1f1f2f' }}>
        <div className="max-w-[900px] mx-auto text-center">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-mono), monospace', color: '#7a7a8f' }}
          >
            Mission
          </p>
          <h2
            className="font-semibold mb-10"
            style={{
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: '#e8e8f2'
            }}
          >
            The liquidity layer Farcaster needs.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="rounded-lg p-6 text-center"
              style={{ background: '#0f0f18', border: '1px solid #1f1f2f' }}
            >
              <h3
                className="font-semibold mb-3"
                style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif', color: '#10b981' }}
              >
                The Problem
              </h3>
              <p style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif', color: '#7a7a8f', lineHeight: '1.6' }}>
                DeFi tools are powerful but fragmented. Liquidity management requires juggling multiple interfaces and protocols.
              </p>
            </div>
            <div
              className="rounded-lg p-6 text-center"
              style={{ background: '#0f0f18', border: '1px solid #1f1f2f' }}
            >
              <h3
                className="font-semibold mb-3"
                style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif', color: '#f59e0b' }}
              >
                Our Approach
              </h3>
              <p style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif', color: '#7a7a8f', lineHeight: '1.6' }}>
                Native Farcaster apps that unify LP management. One interface, all the yields.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join */}
      <section className="py-20 px-6 sm:px-8" style={{ borderTop: '1px solid #1f1f2f' }}>
        <div className="max-w-[900px] mx-auto text-center">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-mono), monospace', color: '#7a7a8f' }}
          >
            Join
          </p>
          <h2
            className="font-semibold mb-6"
            style={{
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: '#e8e8f2'
            }}
          >
            Looking for builders.
          </h2>
          <p
            className="mb-10 max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              color: '#7a7a8f',
              fontSize: '1.05rem',
              lineHeight: '1.6'
            }}
          >
            Small team. High standards. If you ship your own projects and want to build DeFi for Farcaster, reach out.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {[
              { label: 'Discord', href: 'https://discord.gg/km7RysdTeq' },
              { label: 'GitHub', href: 'https://github.com/ABC-DAO' },
              { label: 'Farcaster', href: 'https://warpcast.com/abc-dao' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 rounded-lg transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  background: 'transparent',
                  color: '#10b981',
                  border: '1px solid #1f1f2f'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1f1f2f';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Tokens */}
      <section className="py-20 px-6 sm:px-8" style={{ borderTop: '1px solid #1f1f2f' }}>
        <div className="max-w-[900px] mx-auto text-center">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-mono), monospace', color: '#7a7a8f' }}
          >
            Tokens
          </p>
          <h2
            className="font-semibold mb-10"
            style={{
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: '#e8e8f2'
            }}
          >
            Our Ecosystem
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { symbol: 'ABC', desc: 'Ecosystem Governance Token', address: TOKENS.ABC },
              { symbol: 'ARBME', desc: 'Ecosystem Value Token', address: TOKENS.ARBME },
              { symbol: 'RATCHET', desc: 'Ecosystem Utility Token', address: TOKENS.RATCHET },
            ].map(({ symbol, desc, address }) => (
              <a
                key={symbol}
                href={`https://app.uniswap.org/swap?outputCurrency=${address}&chain=base`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-5 transition-all duration-200 block"
                style={{ background: '#0f0f18', border: '1px solid #1f1f2f' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1f1f2f';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  className="font-semibold mb-1"
                  style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif', color: '#10b981', fontSize: '1.25rem' }}
                >
                  ${symbol}
                </div>
                <div
                  className="mb-3"
                  style={{ fontFamily: 'var(--font-mono), monospace', color: '#7a7a8f', fontSize: '0.75rem' }}
                >
                  {desc}
                </div>
                <div
                  className="font-semibold"
                  style={{ fontFamily: 'var(--font-mono), monospace', color: '#e8e8f2', fontSize: '1.1rem' }}
                >
                  {prices[symbol].loading ? (
                    <span style={{ color: '#7a7a8f' }}>...</span>
                  ) : (
                    prices[symbol].price
                  )}
                </div>
                {!prices[symbol].loading && prices[symbol].priceChange24h !== 0 && (
                  <div
                    className="text-sm mt-1"
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      color: prices[symbol].priceChange24h > 0 ? '#10b981' : '#ef4444',
                      fontSize: '0.8rem'
                    }}
                  >
                    {prices[symbol].priceChange24h > 0 ? '+' : ''}{prices[symbol].priceChange24h.toFixed(2)}% 24h
                  </div>
                )}
              </a>
            ))}
          </div>

          <p
            className="mb-6"
            style={{ fontFamily: 'var(--font-mono), monospace', color: '#7a7a8f', fontSize: '0.85rem' }}
          >
            All tokens on Base Network
          </p>

          <a
            href={`https://basescan.org/token/${TOKENS.ABC}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-mono), monospace',
              color: '#10b981',
              fontSize: '0.9rem'
            }}
          >
            View contracts on Basescan <span>→</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 sm:px-8" style={{ borderTop: '1px solid #1f1f2f' }}>
        <div className="max-w-[900px] mx-auto flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-3">
            <Image src="/ABC_DAO_LOGO.png" alt="ABC DAO" width={24} height={24} />
            <span style={{ fontFamily: 'var(--font-mono), monospace', color: '#7a7a8f', fontSize: '0.85rem' }}>
              ABC DAO © 2025
            </span>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'Discord', href: 'https://discord.gg/km7RysdTeq' },
              { label: 'GitHub', href: 'https://github.com/ABC-DAO' },
              { label: 'Farcaster', href: 'https://warpcast.com/abc-dao' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200"
                style={{ fontFamily: 'var(--font-mono), monospace', color: '#7a7a8f', fontSize: '0.85rem' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7a7a8f'}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
