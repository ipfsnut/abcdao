'use client';

import { useState, useEffect } from 'react';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useUniversalAuth } from '@/contexts/universal-auth-context';
import { BackNavigation } from '@/components/back-navigation';
import Link from 'next/link';

interface Repository {
  id: number;
  repository_name: string;
  repository_url: string;
  registration_type: 'member' | 'partner';
  webhook_configured: boolean;
  reward_multiplier: number;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  expires_at?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  private: boolean;
  updated_at: string;
  language: string;
  stargazers_count: number;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

interface RepositoryData {
  repositories: Repository[];
  member_slots_used: number;
  member_slots_remaining: number;
  member_slots_max: number;
  premium_staker: boolean;
  premium_benefits?: string[];
}

export default function RepositoriesPage() {
  const { user: farcasterProfile } = useFarcaster();
  const { user: universalUser } = useUniversalAuth();
  
  const [registeredRepos, setRegisteredRepos] = useState<RepositoryData | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userFid = farcasterProfile?.fid || universalUser?.farcaster_fid;

  // Fetch user's registered repositories
  useEffect(() => {
    if (!userFid) return;

    const fetchRegisteredRepos = async () => {
      try {
        const response = await fetch(`https://abcdao-production.up.railway.app/api/repositories/${userFid}/repositories`);
        if (response.ok) {
          const data = await response.json();
          setRegisteredRepos(data);
        } else {
          console.error('Failed to fetch registered repositories');
        }
      } catch (error) {
        console.error('Error fetching registered repositories:', error);
      }
    };

    fetchRegisteredRepos();
  }, [userFid]);

  // Fetch user's GitHub repositories (if they have admin access)
  useEffect(() => {
    if (!userFid || !universalUser?.has_github) return;

    const fetchGitHubRepos = async () => {
      try {
        // This would require a new API endpoint to fetch user's GitHub repos
        // For now, we'll show the registered repos only
        setLoading(false);
      } catch (error) {
        console.error('Error fetching GitHub repositories:', error);
        setLoading(false);
      }
    };

    fetchGitHubRepos();
  }, [userFid, universalUser?.has_github]);

  // Register a new repository
  const registerRepository = async (repoName: string, repoUrl: string) => {
    if (!userFid) return;

    setRegistering(repoName);
    setError(null);

    try {
      const response = await fetch(`https://abcdao-production.up.railway.app/api/repositories/${userFid}/repositories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository_name: repoName,
          repository_url: repoUrl,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Repository registered:', result);
        
        // Refresh the registered repositories list
        const refreshResponse = await fetch(`https://abcdao-production.up.railway.app/api/repositories/${userFid}/repositories`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setRegisteredRepos(data);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to register repository');
      }
    } catch (error) {
      console.error('Error registering repository:', error);
      setError('Network error. Please try again.');
    } finally {
      setRegistering(null);
    }
  };

  // Fix webhook for a repository
  const fixWebhook = async (repoId: number, repoName: string) => {
    if (!userFid) return;

    setRegistering(repoName);
    setError(null);

    try {
      const response = await fetch(`https://abcdao-production.up.railway.app/api/repositories/${userFid}/repositories/${repoId}/fix-webhook`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Webhook fixed:', result);
        
        // Refresh the registered repositories list
        const refreshResponse = await fetch(`https://abcdao-production.up.railway.app/api/repositories/${userFid}/repositories`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setRegisteredRepos(data);
        }
        
        // Show success message
        alert('✅ Webhook configured successfully! Repository is now active for rewards.');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to fix webhook';
        const errorCode = errorData.code;
        
        setError(errorMessage);
        
        // Show specific error messages based on error code
        switch (errorCode) {
          case 'GITHUB_NOT_LINKED':
            alert('🔗 Please link your GitHub account first to enable automated webhook setup.');
            break;
          case 'GITHUB_TOKEN_EXPIRED':
            alert('🔄 Your GitHub access has expired. Please re-link your GitHub account and try again.');
            break;
          case 'INSUFFICIENT_PERMISSIONS':
            alert('🔑 You need admin access to this repository to create webhooks. Please check your repository permissions or try manual setup.');
            break;
          case 'REPOSITORY_NOT_FOUND':
            alert('🔍 Repository not found or you no longer have access to it. Please verify the repository still exists.');
            break;
          case 'GITHUB_VALIDATION_ERROR':
            alert('⚠️ GitHub rejected the webhook configuration. This might be due to existing webhooks or repository settings. Please try manual setup.');
            break;
          default:
            alert(`⚠️ Automated setup failed: ${errorMessage}\n\nPlease try the manual setup option below.`);
        }
      }
    } catch (error) {
      console.error('Error fixing webhook:', error);
      setError('Network error. Please try again.');
    } finally {
      setRegistering(null);
    }
  };

  if (!universalUser) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation 
          title="repositories()" 
          subtitle="Manage your reward-enabled repositories" 
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-6 text-center">
            <p className="text-yellow-400 font-mono">Authentication required to manage repositories</p>
          </div>
        </div>
      </div>
    );
  }

  if (!universalUser.has_github) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <BackNavigation 
          title="repositories()" 
          subtitle="Manage your reward-enabled repositories" 
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-6 text-center">
            <h3 className="text-blue-400 font-mono font-bold mb-3">GitHub Account Required</h3>
            <p className="text-blue-300 font-mono mb-4">
              Link your GitHub account to register repositories for $ABC rewards.
            </p>
            <Link 
              href="/onboarding"
              className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 px-4 py-2 rounded-lg font-mono transition-all duration-300"
            >
              Link GitHub Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <BackNavigation 
        title="repositories()" 
        subtitle="Manage your reward-enabled repositories" 
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Repository Slots Status */}
        {registeredRepos && (
          <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-green-400">Repository Slots</h2>
              {registeredRepos.premium_staker && (
                <span className="bg-purple-900/50 text-purple-400 border border-purple-700/50 px-3 py-1 rounded-lg text-sm">
                  ⭐ Premium Staker
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-300">{registeredRepos.member_slots_used}</div>
                <div className="text-green-600 text-sm">Repositories Used</div>
              </div>
              <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-300">{registeredRepos.member_slots_remaining}</div>
                <div className="text-blue-600 text-sm">Slots Remaining</div>
              </div>
              <div className="bg-purple-950/20 border border-purple-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-300">
                  {registeredRepos.premium_staker ? '∞' : registeredRepos.member_slots_max}
                </div>
                <div className="text-purple-600 text-sm">Total Limit</div>
              </div>
            </div>
            
            {registeredRepos.premium_staker && registeredRepos.premium_benefits && (
              <div className="mt-4 p-3 bg-purple-950/10 border border-purple-800/30 rounded-lg">
                <p className="text-purple-400 text-sm font-mono">
                  <strong>Premium Benefits:</strong> {registeredRepos.premium_benefits.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-950/20 border border-red-700/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Registered Repositories */}
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-xl font-bold text-green-400 mb-6">Your Registered Repositories</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-mono">Loading repositories...</p>
            </div>
          ) : registeredRepos?.repositories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 font-mono mb-4">No repositories registered yet</p>
              <p className="text-gray-600 font-mono text-sm">Add your first repository to start earning $ABC rewards</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registeredRepos?.repositories.map((repo) => (
                <div 
                  key={repo.id}
                  className="bg-gray-950/20 border border-gray-700/30 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-green-300 font-mono font-bold">{repo.repository_name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-mono ${
                          repo.status === 'active' 
                            ? 'bg-green-900/50 text-green-400 border border-green-700/50' 
                            : repo.status === 'pending'
                            ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
                            : 'bg-red-900/50 text-red-400 border border-red-700/50'
                        }`}>
                          {repo.status.toUpperCase()}
                        </span>
                        <span className="text-purple-400 font-mono text-xs">
                          {repo.reward_multiplier}x multiplier
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <a 
                          href={repo.repository_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono"
                        >
                          🔗 View on GitHub
                        </a>
                        <span className="text-gray-500">
                          Registered: {new Date(repo.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      {repo.webhook_configured ? (
                        <div className="text-green-400 font-mono text-sm">
                          ✅ Webhook Active
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => fixWebhook(repo.id, repo.repository_name)}
                            disabled={registering === repo.repository_name}
                            className="w-full bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 px-3 py-1 rounded text-sm font-mono transition-all duration-300 disabled:opacity-50"
                          >
                            {registering === repo.repository_name ? '🔄 Auto-setting up...' : '⚡ Auto Setup'}
                          </button>
                          <button
                            onClick={() => {
                              const webhookUrl = `https://abcdao-production.up.railway.app/api/webhooks/github`;
                              const instructions = `🔧 MANUAL WEBHOOK SETUP FOR: ${repo.repository_name}

📋 Step-by-step instructions:

1. Go to: https://github.com/${repo.repository_name}/settings/hooks
2. Click "Add webhook"
3. Paste this URL: ${webhookUrl}
4. Content type: application/json
5. Events: Select "Just the push event"
6. Active: ✅ (checked)
7. Click "Add webhook"

✅ Once added, your commits will earn $ABC rewards!`;
                              
                              navigator.clipboard.writeText(webhookUrl);
                              alert(instructions);
                            }}
                            className="w-full bg-yellow-900/50 hover:bg-yellow-900/70 text-yellow-400 border border-yellow-700/50 px-3 py-1 rounded text-sm font-mono transition-all duration-300"
                          >
                            🔧 Manual Setup
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Repository Registration */}
        <div className="bg-black/40 border border-blue-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-blue-400 mb-6">Add New Repository</h2>
          
          {registeredRepos && registeredRepos.member_slots_remaining > 0 ? (
            <RepositoryRegistrationForm 
              onRegister={registerRepository}
              registering={registering}
            />
          ) : (
            <div className="text-center py-6">
              <p className="text-yellow-400 font-mono mb-3">Repository limit reached</p>
              <p className="text-yellow-600 font-mono text-sm mb-4">
                Stake 5M+ $ABC tokens to unlock unlimited repositories
              </p>
              <Link 
                href="/staking"
                className="bg-yellow-900/50 hover:bg-yellow-900/70 text-yellow-400 border border-yellow-700/50 px-4 py-2 rounded-lg font-mono transition-all duration-300"
              >
                View Staking Options
              </Link>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-black/40 border border-purple-900/50 rounded-xl p-6 backdrop-blur-sm mt-8">
          <h2 className="text-xl font-bold text-purple-400 mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/repository-guide"
              className="bg-purple-950/20 hover:bg-purple-950/30 border border-purple-700/50 p-4 rounded-lg transition-all duration-300"
            >
              <h3 className="text-purple-300 font-mono font-bold mb-2">📖 Setup Guide</h3>
              <p className="text-purple-400 text-sm">Complete guide for repository integration</p>
            </Link>
            <a 
              href="https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-950/20 hover:bg-purple-950/30 border border-purple-700/50 p-4 rounded-lg transition-all duration-300"
            >
              <h3 className="text-purple-300 font-mono font-bold mb-2">💬 Get Support</h3>
              <p className="text-purple-400 text-sm">Contact ABC DAO team for help</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple form component for repository registration
function RepositoryRegistrationForm({ 
  onRegister, 
  registering 
}: { 
  onRegister: (name: string, url: string) => void;
  registering: string | null;
}) {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName || !repoUrl) return;
    
    onRegister(repoName, repoUrl);
    setRepoName('');
    setRepoUrl('');
  };

  const handleUrlChange = (url: string) => {
    setRepoUrl(url);
    
    // Auto-extract repository name from GitHub URL
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (match) {
      setRepoName(match[1]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-blue-300 font-mono text-sm mb-2">
          GitHub Repository URL
        </label>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://github.com/username/repository"
          className="w-full bg-blue-950/20 border border-blue-700/50 rounded-lg px-3 py-2 text-blue-300 font-mono text-sm placeholder-blue-600 focus:border-blue-500/70 focus:outline-none"
          required
        />
      </div>
      
      <div>
        <label className="block text-blue-300 font-mono text-sm mb-2">
          Repository Name (auto-detected)
        </label>
        <input
          type="text"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          placeholder="username/repository"
          className="w-full bg-blue-950/20 border border-blue-700/50 rounded-lg px-3 py-2 text-blue-300 font-mono text-sm placeholder-blue-600 focus:border-blue-500/70 focus:outline-none"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={!repoName || !repoUrl || !!registering}
        className="w-full bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 py-3 rounded-lg font-mono transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {registering ? '🔄 Registering...' : '➕ Register Repository'}
      </button>
      
      <p className="text-blue-600 font-mono text-xs text-center">
        You must have admin access to the repository to register it
      </p>
    </form>
  );
}