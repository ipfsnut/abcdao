'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { CONTRACTS } from '@/lib/contracts';

export default function WhitepaperPage() {
  const [whitepaperContent, setWhitepaperContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load whitepaper content from static file and inject dynamic addresses
    fetch('/whitepaper.md')
      .then(res => res.text())
      .then(content => {
        // Get addresses from environment variables with fallbacks
        const abcTokenAddress = process.env.NEXT_PUBLIC_ABC_TOKEN_ADDRESS || CONTRACTS.ABC_TOKEN?.address;
        const stakingAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS || CONTRACTS.ABC_STAKING?.address;
        const botWalletAddress = process.env.NEXT_PUBLIC_BOT_WALLET_ADDRESS;
        
        // Replace static addresses with dynamic ones
        let updatedContent = content;
        if (abcTokenAddress) {
          updatedContent = updatedContent.replace(
            /\*\*Token\*\*: \$ABC \(`[^`]+`\)/g,
            `**Token**: $ABC (\`${abcTokenAddress}\`)`
          );
        }
        if (stakingAddress) {
          updatedContent = updatedContent.replace(
            /\*\*Staking\*\*: \(`[^`]+`\)/g,
            `**Staking**: (\`${stakingAddress}\`)`
          );
        }
        if (botWalletAddress) {
          updatedContent = updatedContent.replace(
            /- \*\*Bot Wallet\*\*: `[^`]+`/g,
            `- **Bot Wallet**: \`${botWalletAddress}\``
          );
        }
        
        setWhitepaperContent(updatedContent);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load whitepaper:', err);
        setWhitepaperContent('# Error\nFailed to load whitepaper content.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          {/* Logo left, Title centered */}
          <div className="relative flex items-center justify-center mb-3">
            <Link href="/" className="absolute left-0">
              <img 
                src="/abc-logo.png" 
                alt="ABC Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="text-center">
              <h1 className="text-2xl sm:text-4xl font-bold matrix-glow">
                {'>'} ABC_DAO
              </h1>
              <p className="text-xs text-green-600 font-mono mt-1">
                Whitepaper & Documentation
              </p>
            </div>
            <Link 
              href="/"
              className="absolute right-0 bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                         text-green-400 hover:text-green-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-mono text-xs sm:text-sm 
                         transition-all duration-300 matrix-button"
            >
              {'<'} Back
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-green-400 font-mono animate-pulse text-xl">
              Loading whitepaper...
            </div>
          </div>
        ) : (
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-8 backdrop-blur-sm">
            <div className="prose prose-invert prose-green max-w-none text-green-100 font-mono text-sm leading-relaxed">
              <ReactMarkdown 
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-4xl font-bold text-green-400 matrix-glow mb-8 font-mono border-b border-green-900/30 pb-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-3xl font-bold text-green-400 matrix-glow mb-6 mt-12 font-mono">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-2xl font-bold text-green-500 mb-4 mt-8 font-mono">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-xl font-bold text-green-500 mb-3 mt-6 font-mono">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-green-100 mb-6 leading-relaxed text-base">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-green-100 mb-6 pl-6 space-y-3">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-green-100 mb-6 pl-6 space-y-3 list-decimal">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-green-100 relative">
                      <span className="text-green-400 mr-3">{'>'}</span>
                      {children}
                    </li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-green-950/40 text-green-300 px-3 py-1 rounded font-mono text-sm border border-green-900/30">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-green-950/40 border border-green-900/50 rounded-lg p-6 overflow-x-auto mb-6 text-green-300">
                      {children}
                    </pre>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-green-400 font-bold">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-green-300 italic">
                      {children}
                    </em>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border-collapse border border-green-900/50">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-green-900/50 bg-green-950/30 px-4 py-3 text-green-400 font-bold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-green-900/50 px-4 py-3 text-green-100">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-green-600 pl-6 italic text-green-300 mb-6 bg-green-950/20 py-4 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  hr: () => (
                    <hr className="border-green-900/50 my-12 border-t-2" />
                  ),
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      className="text-green-400 hover:text-green-300 underline decoration-green-600 hover:decoration-green-400 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {whitepaperContent}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}