'use client';

import { useState } from 'react';
import { CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

interface VerificationBadgeProps {
  isVerified: boolean;
  githubUsername?: string;
  className?: string;
}

export function VerificationBadge({ isVerified, githubUsername, className = '' }: VerificationBadgeProps) {
  const [showModal, setShowModal] = useState(false);

  if (!isVerified) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowModal(true)}
          className="text-gray-500 hover:text-green-400 transition-colors duration-200"
          title="Click to learn about verification"
        >
          <QuestionMarkCircleIcon className="w-4 h-4" />
        </button>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black border border-green-900/50 rounded-xl p-6 max-w-md w-full matrix-glow">
              <div className="flex items-center gap-3 mb-4">
                <QuestionMarkCircleIcon className="w-6 h-6 text-gray-500" />
                <h3 className="text-lg font-bold text-green-400 font-mono">Profile Verification</h3>
              </div>
              
              <div className="space-y-4 text-sm text-green-600 font-mono">
                <p>This user hasn't completed GitHub verification yet.</p>
                
                <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-3">
                  <h4 className="text-green-400 font-semibold mb-2">To create a verified profile:</h4>
                  <ol className="space-y-1 text-xs">
                    <li>1. Pay 0.002 ETH membership fee</li>
                    <li>2. Link GitHub account in the ABC DAO mini-app</li>
                    <li>3. Complete verification process</li>
                    <li>4. Start earning rewards for commits!</li>
                  </ol>
                </div>
                
                <p className="text-xs text-green-700">
                  Verified developers can earn 50k-1M $ABC tokens per commit and have full profiles on the ABC DAO website.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-4 bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 text-sm"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowModal(true)}
        className="text-green-400 hover:text-green-300 transition-colors duration-200"
        title="Verified developer - click for info"
      >
        <CheckCircleIcon className="w-4 h-4 matrix-glow" />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-green-900/50 rounded-xl p-6 max-w-md w-full matrix-glow">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircleIcon className="w-6 h-6 text-green-400 matrix-glow" />
              <h3 className="text-lg font-bold text-green-400 font-mono">Verified Developer</h3>
            </div>
            
            <div className="space-y-4 text-sm text-green-600 font-mono">
              <p>This developer has completed the full ABC DAO verification process.</p>
              
              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-3">
                <h4 className="text-green-400 font-semibold mb-2">Verification includes:</h4>
                <ul className="space-y-1 text-xs">
                  <li>✓ Paid membership (0.002 ETH)</li>
                  <li>✓ GitHub account linked: @{githubUsername || 'linked'}</li>
                  <li>✓ Profile verified and active</li>
                  <li>✓ Eligible for commit rewards</li>
                </ul>
              </div>
              
              <p className="text-xs text-green-700">
                Verified developers earn 50k-1M $ABC tokens per commit and have full access to all ABC DAO features.
              </p>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 bg-green-900/50 hover:bg-green-800/60 text-green-400 font-mono px-4 py-2 rounded-lg border border-green-700/50 transition-all duration-300 text-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }
}