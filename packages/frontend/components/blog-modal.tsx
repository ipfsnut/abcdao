'use client';

import { useState, useEffect } from 'react';
// Using simple text instead of lucide-react icon

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  markdownPath: string;
}

export function BlogModal({ isOpen, onClose, title, markdownPath }: BlogModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && markdownPath) {
      setLoading(true);
      fetch(markdownPath)
        .then(response => response.text())
        .then(text => {
          // Convert basic markdown to HTML for display
          const htmlContent = text
            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-green-400 mb-4">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-green-400 mb-3 mt-6">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-green-300 mb-2 mt-4">$3</h3>')
            .replace(/^\*\*(.*?)\*\*/gm, '<strong class="text-green-300">$1</strong>')
            .replace(/^\* (.*$)/gm, '<li class="text-green-600 text-sm mb-1">• $1</li>')
            .replace(/^- (.*$)/gm, '<li class="text-green-600 text-sm mb-1">• $1</li>')
            .replace(/\n\n/g, '</p><p class="text-green-600 text-sm mb-4">')
            .replace(/^(?!<[h|l])/gm, '<p class="text-green-600 text-sm mb-4">')
            .replace(/---/g, '<hr class="border-green-900/50 my-6" />');
          
          setContent(htmlContent);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading content:', error);
          setContent('<p class="text-red-400">Error loading content</p>');
          setLoading(false);
        });
    }
  }, [isOpen, markdownPath]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-auto">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-green-900/30 mb-6 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-green-400 matrix-glow font-mono">
              {title}
            </h1>
            <button
              onClick={onClose}
              className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                         text-green-400 hover:text-green-300 p-2 rounded-lg transition-all duration-200 matrix-button"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-green-400 font-mono">Loading...</div>
            </div>
          ) : (
            <div 
              className="prose prose-green max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-green-900/30 text-center">
          <button
            onClick={onClose}
            className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                       text-green-400 hover:text-green-300 px-6 py-3 rounded-lg font-mono text-sm
                       transition-all duration-200 matrix-button"
          >
            ← Back to Documentation
          </button>
        </div>
      </div>
    </div>
  );
}