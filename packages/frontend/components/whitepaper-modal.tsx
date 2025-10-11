'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhitepaperModal({ isOpen, onClose }: WhitepaperModalProps) {
  const [whitepaperContent, setWhitepaperContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && !whitepaperContent) {
      // Load whitepaper content
      fetch('/api/whitepaper')
        .then(res => res.text())
        .then(content => {
          setWhitepaperContent(content);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load whitepaper:', err);
          setWhitepaperContent('# Error\nFailed to load whitepaper content.');
          setLoading(false);
        });
    }
  }, [isOpen, whitepaperContent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-black border border-green-900/50 rounded-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-900/30">
          <h2 className="text-2xl font-bold text-green-400 matrix-glow font-mono">
            {'>'} ABC_DAO_WHITEPAPER.md
          </h2>
          <button
            onClick={onClose}
            className="text-green-600 hover:text-green-400 transition-colors font-mono text-xl"
          >
            [X]
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-green-400 font-mono animate-pulse">
                Loading whitepaper...
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-green max-w-none">
              <ReactMarkdown 
                className="text-green-100 font-mono text-sm leading-relaxed"
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-green-400 matrix-glow mb-6 font-mono">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-green-400 matrix-glow mb-4 mt-8 font-mono">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-bold text-green-500 mb-3 mt-6 font-mono">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-green-100 mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-green-100 mb-4 pl-6 space-y-2">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-green-100 relative">
                      <span className="text-green-400 mr-2">{'>'}</span>
                      {children}
                    </li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-green-950/30 text-green-300 px-2 py-1 rounded font-mono text-sm">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-green-950/30 border border-green-900/50 rounded-lg p-4 overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-green-400 font-bold">
                      {children}
                    </strong>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full border-collapse border border-green-900/50">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-green-900/50 bg-green-950/30 px-4 py-2 text-green-400 font-bold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-green-900/50 px-4 py-2 text-green-100">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-green-600 pl-4 italic text-green-300 mb-4">
                      {children}
                    </blockquote>
                  ),
                  hr: () => (
                    <hr className="border-green-900/50 my-8" />
                  ),
                }}
              >
                {whitepaperContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-green-900/30 p-4 text-center">
          <p className="text-green-600 font-mono text-sm">
            {'>'} Close with [ESC] or click outside modal
          </p>
        </div>
      </div>
    </div>
  );
}

export function WhitepaperButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isModalOpen]);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-950/20 hover:bg-green-900/30 border border-green-900/50 hover:border-green-700/50 
                   text-green-400 hover:text-green-300 px-4 py-2 rounded-lg font-mono text-sm 
                   transition-all duration-300 matrix-button"
      >
        ./whitepaper
      </button>
      
      <WhitepaperModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}