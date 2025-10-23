'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useMembership } from '@/hooks/useMembership';
import { FarcasterAuth } from '@/components/farcaster-auth';
import { MembershipNFTPayment } from '@/components/membership-nft-payment';
import { config } from '@/lib/config';
import { BackNavigation } from '@/components/back-navigation';

interface GitHubVerification {
  verified: boolean;
  user?: any;
  activity?: {
    last_30_days?: {
      commits?: number;
    };
    last_90_days?: {
      commits?: number;
    };
  };
  repositories?: any;
  estimatedEarnings?: any;
  score?: any;
  error?: string;
}

interface Repository {
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  earning_potential: {
    tier: 'high' | 'medium' | 'low';
    score: number;
    factors: string[];
  };
}

export function ImprovedOnboarding() {
  const { isConnected } = useAccount();
  const { user: farcasterUser } = useFarcaster();
  const membership = useMembership();
  
  // Onboarding state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // GitHub verification state
  const [githubUsername, setGithubUsername] = useState('');
  const [githubVerification, setGithubVerification] = useState<GitHubVerification | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  
  // Auto-advance logic (simplified)
  useEffect(() => {
    if (githubVerification?.verified && currentStep === 1) {
      setCurrentStep(2);
    }
    if (farcasterUser && currentStep === 2) {
      setCurrentStep(3);
    }
    if (isConnected && currentStep === 3) {
      setCurrentStep(4);
    }
    if (membership.isMember && currentStep === 4) {
      setCurrentStep(5);
    }
  }, [githubVerification, farcasterUser, isConnected, membership.isMember, currentStep]);

  const steps = [
    { id: 1, title: 'Verify GitHub', completed: githubVerification?.verified || false },
    { id: 2, title: 'Connect Farcaster', completed: !!farcasterUser },
    { id: 3, title: 'Connect Wallet', completed: isConnected },
    { id: 4, title: 'Review & Pay', completed: membership.isMember },
    { id: 5, title: 'Start Earning', completed: membership.isMember }
  ];

  const verifyGitHubUser = async () => {
    if (!githubUsername.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.backendUrl}/api/github/verify-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: githubUsername.trim() })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      setGithubVerification(result);

      if (result.verified && result.repositories?.qualifying?.length > 0) {
        // Auto-select all qualifying repositories
        setSelectedRepos(result.repositories.qualifying.map((repo: Repository) => repo.full_name));
      }

    } catch (err: any) {
      setError(err.message);
      setGithubVerification(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRepositoryToggle = (repoFullName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoFullName)
        ? prev.filter(name => name !== repoFullName)
        : [...prev, repoFullName]
    );
  };

  const handlePaymentComplete = async () => {
    // Auto-register selected repositories after payment
    if (farcasterUser && githubVerification?.verified && selectedRepos.length > 0) {
      try {
        await fetch(`${config.backendUrl}/api/github/auto-register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farcasterFid: farcasterUser.fid,
            githubUsername: githubVerification.user.login,
            selectedRepositories: selectedRepos
          })
        });
      } catch (error) {
        console.error('Repository registration failed:', error);
      }
    }
    
    membership.refreshStatus();
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="improved_onboarding()" 
        subtitle="GitHub-first developer verification & rewards setup" 
      />

      <div className="px-4 py-8 max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-green-400 matrix-glow mb-4 font-mono">
            Join ABC DAO! 🚀
          </h2>
          <p className="text-green-300 font-mono text-sm mb-2">
            Earn $ABC tokens for your code contributions
          </p>
          <p className="text-green-600 font-mono text-xs">
            New improved flow: verify GitHub first, see earning potential, then join
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">Setup Progress</h3>
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold
                  ${step.completed 
                    ? 'bg-green-900/50 border-green-600 text-green-400 matrix-glow' 
                    : currentStep === step.id
                      ? 'bg-yellow-900/50 border-yellow-600 text-yellow-400'
                      : 'bg-gray-900/50 border-gray-600 text-gray-400'
                  }`}>
                  {step.completed ? '✓' : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${step.completed ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className={`font-mono text-sm ${
              currentStep === 5 ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {steps.find(s => s.id === currentStep)?.title}
              {currentStep < 5 && ' - Current Step'}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-8">
          
          {/* Step 1: GitHub Verification */}
          {currentStep === 1 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">
                Step 1: Verify Your GitHub Account
              </h3>
              <p className="text-green-300 font-mono text-sm mb-6">
                Enter your GitHub username to verify you're an active developer and see your earning potential.
              </p>

              {/* Repository Qualification Guide */}
              <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4 mb-6">
                <h4 className="text-blue-400 font-mono font-semibold mb-3">💡 What Makes a Good Repository?</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="bg-green-900/20 border border-green-700/30 rounded p-3">
                    <span className="text-green-400 font-semibold">🔥 High Tier (80+ points)</span>
                    <ul className="text-green-600 mt-2 space-y-1">
                      <li>• Recent commits (last 30 days)</li>
                      <li>• 5+ stars or community interest</li>
                      <li>• Popular languages (JS, TS, Python, Rust)</li>
                      <li>• Substantial codebase (100+ files)</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
                    <span className="text-yellow-400 font-semibold">⚡ Medium Tier (50-79 points)</span>
                    <ul className="text-yellow-600 mt-2 space-y-1">
                      <li>• Updated in last 90 days</li>
                      <li>• Active development</li>
                      <li>• Clear project purpose</li>
                      <li>• Some community engagement</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900/20 border border-gray-700/30 rounded p-3">
                    <span className="text-gray-400 font-semibold">📝 Examples</span>
                    <ul className="text-gray-600 mt-2 space-y-1">
                      <li>• Web apps & APIs</li>
                      <li>• Tools & libraries</li>
                      <li>• Blockchain projects</li>
                      <li>• Open source contributions</li>
                    </ul>
                  </div>
                </div>
                <p className="text-blue-600 font-mono text-xs mt-3">
                  💰 Higher tier repositories = better earning potential! Minimum 50 points required.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-green-600 font-mono text-sm mb-2">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="Enter your GitHub username"
                    className="w-full bg-black/60 border border-green-900/50 rounded-lg px-4 py-3 
                             text-green-400 font-mono text-sm focus:border-green-600 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && verifyGitHubUser()}
                  />
                </div>

                <button
                  onClick={verifyGitHubUser}
                  disabled={loading || !githubUsername.trim()}
                  className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-3 rounded-lg 
                           border border-green-700/50 transition-all duration-300 hover:matrix-glow
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '🔍 Verifying...' : '🔍 Verify GitHub Account'}
                </button>
              </div>

              {error && (
                <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 mb-4">
                  <p className="text-red-400 font-mono text-sm">❌ {error}</p>
                </div>
              )}

              {githubVerification && !githubVerification.verified && (
                <div className="bg-yellow-950/20 border border-yellow-900/50 rounded-lg p-4 mb-4">
                  <p className="text-yellow-400 font-mono text-sm mb-2">⚠️ Account Not Qualified</p>
                  <p className="text-yellow-600 font-mono text-xs">
                    {githubVerification.error || 'Your GitHub account doesn\'t meet the requirements for ABC DAO.'}
                  </p>
                  {githubVerification.score && (
                    <div className="mt-2">
                      <p className="text-yellow-600 font-mono text-xs">
                        Score: {githubVerification.score.score}/60 (need 60+)
                      </p>
                      <ul className="text-yellow-600 font-mono text-xs mt-1">
                        {githubVerification.score.factors?.map((factor: string, i: number) => (
                          <li key={i}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {githubVerification?.verified && (
                <div className="space-y-4">
                  <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={`https://github.com/${githubVerification.user.login}.png`}
                        alt="GitHub Avatar"
                        className="w-12 h-12 rounded-full border border-green-700/50"
                      />
                      <div>
                        <p className="text-green-400 font-mono font-semibold">
                          ✅ {githubVerification.user.login} Verified!
                        </p>
                        <p className="text-green-600 font-mono text-xs">
                          Score: {githubVerification.score?.score}/100 • {githubVerification.repositories?.qualifying?.length || 0} qualifying repos
                        </p>
                      </div>
                    </div>
                    
                    {githubVerification.user.bio && (
                      <p className="text-green-600 font-mono text-xs mb-2">
                        {githubVerification.user.bio}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                      <div className="bg-black/40 border border-green-900/30 rounded p-2 text-center">
                        <span className="text-green-600">Repos:</span>
                        <span className="text-green-400 ml-1">{githubVerification.user.public_repos}</span>
                      </div>
                      <div className="bg-black/40 border border-green-900/30 rounded p-2 text-center">
                        <span className="text-green-600">Commits (30d):</span>
                        <span className="text-green-400 ml-1">{githubVerification.activity?.last_30_days?.commits || 0}</span>
                      </div>
                      <div className="bg-black/40 border border-green-900/30 rounded p-2 text-center">
                        <span className="text-green-600">Languages:</span>
                        <span className="text-green-400 ml-1">{Object.keys(githubVerification.repositories?.languages || {}).length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Earning Potential Preview */}
                  {githubVerification.estimatedEarnings && (
                    <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
                      <h4 className="text-blue-400 font-mono font-semibold mb-3">💰 Earning Potential Analysis</h4>
                      
                      {/* Main estimate */}
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
                        <div className="bg-black/40 border border-blue-900/30 rounded p-2">
                          <span className="text-blue-600">Monthly Estimate:</span>
                          <div className="text-blue-400 font-bold text-lg">
                            {githubVerification.estimatedEarnings.monthly_earnings_estimate?.toLocaleString() || 0} $ABC
                          </div>
                          <div className="text-blue-600 text-xs">
                            (~${((githubVerification.estimatedEarnings.monthly_earnings_estimate || 0) * 0.000001).toFixed(2)} USD)
                          </div>
                        </div>
                        <div className="bg-black/40 border border-blue-900/30 rounded p-2">
                          <span className="text-blue-600">Activity Level:</span>
                          <div className="text-blue-400 font-bold">
                            {githubVerification.estimatedEarnings.monthly_commits_estimate || 0} commits/month
                          </div>
                          <div className="text-blue-600 text-xs">
                            {githubVerification.estimatedEarnings.monthly_commits_estimate > 50 ? 'High Activity' : 
                             githubVerification.estimatedEarnings.monthly_commits_estimate > 20 ? 'Moderate Activity' : 'Light Activity'}
                          </div>
                        </div>
                      </div>

                      {/* Repository breakdown */}
                      <div className="bg-black/40 border border-blue-900/20 rounded p-3 mb-3">
                        <div className="flex justify-between text-xs font-mono mb-2">
                          <span className="text-blue-600">Repository Tiers:</span>
                          <span className="text-blue-400">{githubVerification.repositories?.qualifying?.length || 0} qualifying</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-green-400 font-bold">
                              {githubVerification.repositories?.qualifying?.filter((r: any) => r.earning_potential.tier === 'high').length || 0}
                            </div>
                            <div className="text-green-600">High (1M $ABC)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 font-bold">
                              {githubVerification.repositories?.qualifying?.filter((r: any) => r.earning_potential.tier === 'medium').length || 0}
                            </div>
                            <div className="text-yellow-600">Medium (525k $ABC)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400 font-bold">
                              {githubVerification.repositories?.qualifying?.filter((r: any) => r.earning_potential.tier === 'low').length || 0}
                            </div>
                            <div className="text-gray-600">Low (50k $ABC)</div>
                          </div>
                        </div>
                      </div>

                      {/* ROI calculation */}
                      <div className="bg-purple-950/20 border border-purple-700/30 rounded p-3">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-purple-600">Membership ROI:</span>
                          <span className="text-purple-400 font-bold">
                            {githubVerification.estimatedEarnings.monthly_earnings_estimate > 1000000 
                              ? `~${Math.ceil(1000000 / (githubVerification.estimatedEarnings.monthly_earnings_estimate / 30))} days`
                              : 'High activity needed'
                            }
                          </span>
                        </div>
                        <p className="text-purple-600 text-xs mt-1">
                          0.002 ETH fee (~$5) vs estimated monthly earnings
                        </p>
                      </div>

                      <p className="text-blue-600 font-mono text-xs mt-3">
                        📊 Based on: {githubVerification.estimatedEarnings.explanation}
                      </p>
                    </div>
                  )}

                  {/* Repository Selection */}
                  {githubVerification.repositories?.qualifying?.length > 0 && (
                    <div className="bg-purple-950/20 border border-purple-700/50 rounded-lg p-4">
                      <h4 className="text-purple-400 font-mono font-semibold mb-3">
                        📁 Select Repositories to Register ({selectedRepos.length} selected)
                      </h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {githubVerification.repositories.qualifying.map((repo: Repository) => (
                          <div 
                            key={repo.full_name}
                            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                              selectedRepos.includes(repo.full_name)
                                ? 'border-purple-600 bg-purple-950/30'
                                : 'border-purple-900/30 bg-black/20 hover:border-purple-700/50'
                            }`}
                            onClick={() => handleRepositoryToggle(repo.full_name)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedRepos.includes(repo.full_name)}
                                  onChange={() => handleRepositoryToggle(repo.full_name)}
                                  className="text-purple-400"
                                />
                                <span className="text-purple-400 font-mono font-semibold text-sm">
                                  {repo.name}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-mono ${
                                  repo.earning_potential.tier === 'high' 
                                    ? 'bg-green-900/30 text-green-400'
                                    : repo.earning_potential.tier === 'medium'
                                    ? 'bg-yellow-900/30 text-yellow-400'
                                    : 'bg-gray-900/30 text-gray-400'
                                }`}>
                                  {repo.earning_potential.tier}
                                </span>
                              </div>
                              <div className="text-purple-600 font-mono text-xs">
                                ⭐ {repo.stars} | {repo.language}
                              </div>
                            </div>
                            {repo.description && (
                              <p className="text-purple-600 font-mono text-xs">
                                {repo.description.length > 80 
                                  ? repo.description.substring(0, 80) + '...'
                                  : repo.description
                                }
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-purple-600 font-mono text-xs mt-3">
                        💡 All selected repositories will be automatically registered after payment
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-3 rounded-lg 
                             border border-green-700/50 transition-all duration-300 hover:matrix-glow"
                  >
                    ✅ Continue to Farcaster Connection
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Connect Farcaster */}
          {currentStep === 2 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">
                Step 2: Connect Your Farcaster Account (Recommended)
              </h3>
              <p className="text-green-300 font-mono text-sm mb-6">
                Connect Farcaster to get reward announcements and join the ABC DAO community. This step is recommended but optional.
              </p>

              <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 mb-6">
                <p className="text-green-600 font-mono text-xs mb-2">✅ GitHub Verified:</p>
                <p className="text-green-400 font-mono text-sm">@{githubVerification?.user?.login}</p>
              </div>

              {/* Farcaster signup option */}
              <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-4 mb-6">
                <h4 className="text-purple-400 font-mono text-sm font-semibold mb-2">Don't have Farcaster yet?</h4>
                <p className="text-purple-300 font-mono text-xs mb-3">
                  Farcaster is a decentralized social network. Sign up to get the full ABC DAO experience with reward announcements and community access.
                </p>
                <a
                  href="https://farcaster.xyz/~/code/PB4OR7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-purple-900/50 hover:bg-purple-800/40 border border-purple-700/50 hover:border-purple-600/70 
                           text-purple-400 hover:text-purple-300 px-4 py-2 rounded-lg font-mono text-xs
                           transition-all duration-200 matrix-button mr-3"
                >
                  🆕 Sign Up for Farcaster
                </a>
                <span className="text-purple-600 font-mono text-xs">
                  Then come back and connect your account
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <FarcasterAuth />
                </div>
                
                <div className="text-center">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-green-600 hover:text-green-400 font-mono text-sm transition-colors underline"
                  >
                    Skip for now (you can connect Farcaster later)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Connect Wallet */}
          {currentStep === 3 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">
                Step 3: Connect Your Wallet
              </h3>
              <p className="text-green-300 font-mono text-sm mb-6">
                Connect your wallet to receive $ABC token rewards and pay the membership fee.
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
                  <p className="text-green-600 font-mono text-xs mb-1">✅ GitHub: @{githubVerification?.user?.login}</p>
                  <p className="text-green-600 font-mono text-xs">✅ Farcaster: @{farcasterUser?.username}</p>
                </div>
              </div>

              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          )}

          {/* Step 4: Review & Pay */}
          {currentStep === 4 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 font-mono">
                Step 4: Review & Pay Membership Fee
              </h3>
              
              {/* Summary */}
              <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4 mb-6">
                <h4 className="text-green-400 font-mono font-semibold mb-3">📋 Membership Summary</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-green-600">GitHub Account:</span>
                    <span className="text-green-400">@{githubVerification?.user?.login}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Farcaster Account:</span>
                    <span className="text-green-400">@{farcasterUser?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Repositories Selected:</span>
                    <span className="text-green-400">{selectedRepos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Estimated Monthly Earnings:</span>
                    <span className="text-green-400">
                      {githubVerification?.estimatedEarnings?.monthly_earnings_estimate?.toLocaleString() || 0} $ABC
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-green-900/50 pt-2 mt-2">
                    <span className="text-green-600 font-semibold">Membership Fee:</span>
                    <span className="text-green-400 font-semibold">0.002 ETH</span>
                  </div>
                </div>
              </div>

              {/* ROI Calculation */}
              {githubVerification?.estimatedEarnings?.monthly_earnings_estimate > 0 && (
                <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4 mb-6">
                  <h4 className="text-blue-400 font-mono font-semibold mb-2">💡 Return on Investment</h4>
                  <p className="text-blue-600 font-mono text-xs">
                    Based on your activity, you could earn back the 0.002 ETH fee in approximately{' '}
                    <span className="text-blue-400 font-semibold">
                      {Math.ceil((0.002 * 2000000) / (githubVerification?.estimatedEarnings?.monthly_earnings_estimate / 30))} days
                    </span>
                    {' '}of normal coding activity.
                  </p>
                </div>
              )}

              <MembershipNFTPayment onPaymentComplete={handlePaymentComplete} />
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-semibold text-green-400 mb-4 font-mono matrix-glow">
                Welcome to ABC DAO!
              </h3>
              <p className="text-green-300 font-mono text-sm mb-6">
                Your setup is complete! You're now earning $ABC tokens for commits to your registered repositories.
              </p>
              
              <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4 mb-6">
                <h4 className="text-green-400 font-mono font-semibold mb-3">🎯 What's Next</h4>
                <ul className="text-green-600 font-mono text-xs text-left space-y-1">
                  <li>• Start coding and committing to your registered repositories</li>
                  <li>• Use #high or #milestone tags for 1.5x reward multiplier</li>
                  <li>• Daily limit: 10 rewarded commits per day</li>
                  <li>• Rewards: 50k-1M $ABC per commit (randomized)</li>
                  <li>• Check your earnings dashboard in the main app</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/"
                  className="bg-green-900/30 hover:bg-green-800/40 border border-green-700/50 hover:border-green-600/70 
                           text-green-400 hover:text-green-300 px-6 py-3 rounded-lg font-mono text-sm
                           transition-all duration-200 matrix-button"
                >
                  🚀 Go to Dashboard
                </a>
                <a
                  href="/docs"
                  className="bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/50 hover:border-blue-600/70 
                           text-blue-400 hover:text-blue-300 px-6 py-3 rounded-lg font-mono text-sm
                           transition-all duration-200 matrix-button"
                >
                  📚 Read Documentation
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}