'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface TagInfo {
  [key: string]: string;
}

interface TagExample {
  commit: string;
  description: string;
}

interface TagDocsData {
  status: string;
  tags: TagInfo;
  help: string;
  examples: TagExample[];
}

export function CommitTagsDocs() {
  const [isOpen, setIsOpen] = useState(false);
  const [tagDocs, setTagDocs] = useState<TagDocsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch tag documentation from API
  const fetchTagDocs = async () => {
    if (tagDocs) return; // Already loaded
    
    try {
      setLoading(true);
      const response = await fetch(`${config.backendUrl}/api/commits/tags`);
      if (response.ok) {
        const data = await response.json();
        setTagDocs(data);
      }
    } catch (error) {
      console.error('Error fetching tag docs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load docs when opened
  useEffect(() => {
    if (isOpen) {
      fetchTagDocs();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-blue-950/20 hover:bg-blue-900/30 border border-blue-700/50 hover:border-blue-600/70 
                   text-blue-400 hover:text-blue-300 py-2.5 sm:py-3 rounded-lg font-mono font-medium 
                   transition-all duration-300 matrix-button text-sm sm:text-base"
      >
        {'>'} commit_tags_guide()
      </button>
    );
  }

  return (
    <div className="bg-black/60 border border-blue-700/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-blue-400 matrix-glow font-mono">
          {'>'} commit_tags_guide()
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-blue-600 hover:text-blue-400 transition-colors duration-200 text-sm"
        >
          ✕ close
        </button>
      </div>

      {loading ? (
        <div className="bg-blue-950/20 border border-blue-700/30 rounded-lg p-4 text-center">
          <p className="text-blue-600 font-mono text-sm">Loading tag documentation...</p>
        </div>
      ) : tagDocs ? (
        <div className="space-y-4">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-blue-700/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-mono text-sm font-bold mb-2">OVERVIEW</h3>
            <p className="text-blue-300 font-mono text-xs mb-3">
              Control your commit behavior with hashtags! Add these tags to your commit messages to customize how ABC DAO handles your contributions.
            </p>
            <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-2">
              <p className="text-green-400 font-mono text-xs">
                💡 <strong>Pro Tip:</strong> Tags are case-insensitive and automatically removed from public cast messages!
              </p>
            </div>
          </div>

          {/* Available Tags */}
          <div className="bg-black/40 border border-blue-700/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-mono text-sm font-bold mb-3">AVAILABLE TAGS</h3>
            <div className="space-y-2">
              {Object.entries(tagDocs.tags).map(([tag, description]) => (
                <div key={tag} className="flex items-start gap-3">
                  <code className="text-blue-300 font-mono text-xs bg-blue-950/30 px-2 py-1 rounded border border-blue-800/50 whitespace-nowrap">
                    #{tag}
                  </code>
                  <p className="text-blue-400 font-mono text-xs flex-1">{description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div className="bg-black/40 border border-blue-700/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-mono text-sm font-bold mb-3">EXAMPLES</h3>
            <div className="space-y-3">
              {tagDocs.examples.map((example, index) => (
                <div key={index} className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-3">
                  <code className="text-green-400 font-mono text-xs block mb-1">
                    git commit -m &quot;{example.commit}&quot;
                  </code>
                  <p className="text-blue-300 font-mono text-xs">
                    {example.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Special Features */}
          <div className="bg-gradient-to-r from-purple-950/20 to-blue-950/20 border border-purple-700/30 rounded-lg p-4">
            <h3 className="text-purple-400 font-mono text-sm font-bold mb-3">SPECIAL FEATURES</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-green-400">⭐</span>
                <span className="text-purple-300">Priority commits get 1.5x reward multiplier (#priority, #milestone)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">🔒</span>
                <span className="text-purple-300">Private commits won&apos;t appear in leaderboards (#private)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">🤐</span>
                <span className="text-purple-300">Silent commits skip public announcements (#silent)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">🟡</span>
                <span className="text-purple-300">Dev status toggles affect your availability (#devon, #devoff)</span>
              </div>
            </div>
          </div>

          {/* Tag Combinations */}
          <div className="bg-black/40 border border-green-700/30 rounded-lg p-4">
            <h3 className="text-green-400 font-mono text-sm font-bold mb-3">COMBINATIONS</h3>
            <p className="text-green-300 font-mono text-xs mb-2">You can combine multiple tags:</p>
            <div className="space-y-2">
              <code className="block text-green-400 font-mono text-xs bg-green-950/20 px-2 py-1 rounded">
                git commit -m &quot;feat: secret feature #priority #private&quot;
              </code>
              <code className="block text-green-400 font-mono text-xs bg-green-950/20 px-2 py-1 rounded">
                git commit -m &quot;docs: fix typos #silent #norew&quot;
              </code>
              <code className="block text-green-400 font-mono text-xs bg-green-950/20 px-2 py-1 rounded">
                git commit -m &quot;going offline #devoff #silent&quot;
              </code>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-gradient-to-r from-green-950/20 to-blue-950/20 border border-green-700/30 rounded-lg p-4">
            <h3 className="text-green-400 font-mono text-sm font-bold mb-3">BEST PRACTICES</h3>
            <div className="space-y-1 text-xs font-mono text-green-300">
              <p>• Use #silent for maintenance, refactoring, or minor fixes</p>
              <p>• Use #private for experimental or sensitive development</p>
              <p>• Use #priority or #milestone for important releases</p>
              <p>• Use #devoff/#devon to manage your availability status</p>
              <p>• Use #norew for documentation or non-development commits</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-blue-950/20 hover:bg-blue-900/30 border border-blue-700/50 hover:border-blue-600/70 
                       text-blue-400 hover:text-blue-300 py-2 sm:py-2.5 rounded-lg font-mono font-medium 
                       transition-all duration-300 matrix-button text-sm"
          >
            {'>'} close_guide()
          </button>
        </div>
      ) : (
        <div className="bg-red-950/20 border border-red-700/30 rounded-lg p-4 text-center">
          <p className="text-red-400 font-mono text-sm">
            Failed to load tag documentation
          </p>
          <button
            onClick={fetchTagDocs}
            className="text-red-300 font-mono text-xs mt-2 underline hover:text-red-200"
          >
            retry
          </button>
        </div>
      )}
    </div>
  );
}