'use client';

import { useState, useEffect } from 'react';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useUniversalAuth } from '@/contexts/universal-auth-context';
import { config } from '@/lib/config';

interface Repository {
  id: number;
  repository_name: string;
  repository_url: string;
  registration_type: string;
  webhook_configured: boolean;
  reward_multiplier: number;
  status: string;
  created_at: string;
}

interface RepositoryData {
  repositories: Repository[];
  member_slots_used: number;
  member_slots_remaining: number;
  member_slots_max: number;
  premium_staker: boolean;
  premium_benefits: string[] | null;
}

export function RepositoryManager() {
  const { user: farcasterProfile } = useFarcaster();
  const { user: universalUser } = useUniversalAuth();
  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingRepo, setAddingRepo] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [fixingWebhook, setFixingWebhook] = useState<number | null>(null);
  const [relinkingGitHub, setRelinkingGitHub] = useState(false);
  const [showingInstructions, setShowingInstructions] = useState<number | null>(null);

  // Determine user identifier based on authentication method
  const userIdentifier = universalUser?.farcaster_fid || universalUser?.github_username;
  const hasGithub = universalUser?.has_github || false;

  useEffect(() => {
    if (userIdentifier && hasGithub) {
      fetchRepositories();
    }
  }, [userIdentifier, hasGithub]);

  const fetchRepositories = async () => {
    if (!userIdentifier || !hasGithub) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${userIdentifier}/repositories`);
      if (response.ok) {
        const data = await response.json();
        setRepositoryData(data);
      } else {
        setError('Failed to fetch repositories');
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setError('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const addRepository = async () => {
    if (!userIdentifier || !hasGithub || !newRepoUrl.trim()) return;
    
    // Extract repository name from URL
    const urlMatch = newRepoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!urlMatch) {
      setError('Invalid GitHub URL format');
      return;
    }
    
    const repositoryName = urlMatch[1];
    
    setAddingRepo(true);
    setError('');
    
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${userIdentifier}/repositories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository_url: newRepoUrl.trim(),
          repository_name: repositoryName
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setNewRepoUrl('');
        await fetchRepositories(); // Refresh list
        
        if (result.premium_staker) {
          alert('✅ Repository added! Premium staker benefits applied.');
        } else {
          alert('✅ Repository added! Configure webhook to activate rewards.');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add repository');
      }
    } catch (error) {
      console.error('Error adding repository:', error);
      setError('Error connecting to backend');
    } finally {
      setAddingRepo(false);
    }
  };

  const relinkGitHub = async () => {
    if (!userIdentifier) return;
    
    setRelinkingGitHub(true);
    setError('');
    
    try {
      // First clear GitHub token for re-linking (allows paid members)
      const relinkResponse = await fetch(`${config.backendUrl}/api/auth/github/relink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farcasterFid: userIdentifier,
        }),
      });

      if (!relinkResponse.ok) {
        throw new Error('Failed to prepare GitHub re-linking');
      }

      // Then initiate re-linking
      const linkResponse = await fetch(`${config.backendUrl}/api/auth/github/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farcasterFid: userIdentifier,
          farcasterUsername: farcasterProfile?.username || 'user',
          callbackUrl: `${window.location.origin}/repositories?relink=success`,
        }),
      });

      if (linkResponse.ok) {
        const { authUrl } = await linkResponse.json();
        window.location.href = authUrl;
      } else {
        throw new Error('Failed to initialize GitHub re-linking');
      }
    } catch (error) {
      console.error('Error re-linking GitHub:', error);
      setError('Failed to re-link GitHub. Please try again.');
      alert('❌ Failed to re-link GitHub account. Please try again or contact support.');
    } finally {
      setRelinkingGitHub(false);
    }
  };

  const showWebhookInstructions = async (repoId: number, repoName: string) => {
    if (!userIdentifier) return;
    
    setShowingInstructions(repoId);
    
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${userIdentifier}/repositories/${repoId}/webhook-instructions`);
      
      if (response.ok) {
        const instructions = await response.json();
        
        // Create modal-style instructions
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
          background: rgba(0,0,0,0.8); z-index: 1000; 
          display: flex; align-items: center; justify-content: center;
          font-family: monospace; color: #00ff41;
        `;
        
        modal.innerHTML = `
          <div style="background: #0a0a0a; border: 1px solid #00ff41; border-radius: 8px; padding: 2rem; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h2 style="color: #00ff41; margin-bottom: 1rem;">🔧 Webhook Setup for ${repoName}</h2>
            
            <div style="background: #001100; border: 1px solid #003300; border-radius: 4px; padding: 1rem; margin-bottom: 1rem;">
              <h3 style="color: #00ff41; margin-bottom: 0.5rem;">📋 Step-by-step instructions:</h3>
              <ol style="margin-left: 1rem; line-height: 1.6;">
                ${instructions.instructions.steps.map((step: string, i: number) => `<li style="margin-bottom: 0.5rem;">${step}</li>`).join('')}
              </ol>
            </div>
            
            <div style="background: #001100; border: 1px solid #003300; border-radius: 4px; padding: 1rem; margin-bottom: 1rem;">
              <h3 style="color: #00ff41; margin-bottom: 0.5rem;">🔑 Your Webhook Secret:</h3>
              <code style="background: #000; padding: 0.5rem; border-radius: 4px; display: block; font-size: 0.8rem; word-break: break-all;">${instructions.webhook_setup.secret}</code>
              <button onclick="navigator.clipboard.writeText('${instructions.webhook_setup.secret}'); this.innerText='✅ Copied!';" style="background: #003300; border: 1px solid #00ff41; color: #00ff41; padding: 0.25rem 0.5rem; border-radius: 4px; margin-top: 0.5rem; cursor: pointer;">📋 Copy Secret</button>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: space-between;">
              <a href="${instructions.webhook_setup.github_url}" target="_blank" style="background: #003300; border: 1px solid #00ff41; color: #00ff41; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none;">🔗 Open GitHub Settings</a>
              <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #330000; border: 1px solid #ff4141; color: #ff4141; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">❌ Close</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove modal when clicking outside
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });
        
      } else {
        throw new Error('Failed to get webhook instructions');
      }
    } catch (error) {
      console.error('Error getting webhook instructions:', error);
      alert('❌ Failed to get webhook instructions. Please try again.');
    } finally {
      setShowingInstructions(null);
    }
  };

  const fixWebhook = async (repoId: number) => {
    if (!userIdentifier || !hasGithub) return;
    
    setFixingWebhook(repoId);
    setError('');
    
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${userIdentifier}/repositories/${repoId}/fix-webhook`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        await fetchRepositories(); // Refresh list
        alert('✅ Webhook configured successfully! Repository is now active for rewards.');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to configure webhook automatically';
        const errorCode = errorData.code;
        
        setError(errorMessage);
        
        // Show specific error messages with re-link option for token issues
        switch (errorCode) {
          case 'GITHUB_NOT_LINKED':
            if (confirm('🔗 GitHub account not linked. Would you like to link it now?')) {
              relinkGitHub();
            }
            break;
          case 'GITHUB_TOKEN_EXPIRED':
            if (confirm('🔄 Your GitHub access has expired. Would you like to re-link your GitHub account now?')) {
              relinkGitHub();
            }
            break;
          case 'INSUFFICIENT_PERMISSIONS':
            if (confirm('🔑 You need admin access to this repository. This might be due to expired GitHub permissions. Would you like to re-link your GitHub account to refresh permissions?')) {
              relinkGitHub();
            } else {
              alert('Please check your repository permissions or try manual setup.');
            }
            break;
          case 'REPOSITORY_NOT_FOUND':
            if (confirm('🔍 Repository not found or access denied. This might be due to expired GitHub permissions. Would you like to re-link your GitHub account?')) {
              relinkGitHub();
            } else {
              alert('Please verify the repository still exists and you have access to it.');
            }
            break;
          case 'GITHUB_VALIDATION_ERROR':
            alert('⚠️ GitHub rejected the webhook configuration. This might be due to existing webhooks or repository settings. Please try manual setup.');
            break;
          default:
            if (confirm(`⚠️ Automated setup failed: ${errorMessage}\n\nThis might be due to GitHub authentication issues. Would you like to re-link your GitHub account?`)) {
              relinkGitHub();
            }
        }
      }
    } catch (error) {
      console.error('Error fixing webhook:', error);
      setError('Error connecting to backend. Please try manual setup.');
    } finally {
      setFixingWebhook(null);
    }
  };

  if (!universalUser || !hasGithub) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} repository_manager()
        </h2>
        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 text-center">
          <p className="text-red-400 font-mono text-sm">
            {!universalUser ? 'Authentication required' : 'GitHub account not connected'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-green-400 matrix-glow font-mono">
          {'>'} repository_manager()
        </h2>
        <a
          href="/repositories"
          className="bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-700/50 px-3 py-1 rounded text-xs font-mono transition-all duration-300"
        >
          View All →
        </a>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-green-600 font-mono text-sm">Loading repositories...</p>
        </div>
      ) : repositoryData ? (
        <div className="space-y-4">
          {/* Status Summary */}
          <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-green-400 font-mono text-sm">Repository Status</h3>
              {repositoryData.premium_staker && (
                <span className="text-purple-400 font-mono text-xs bg-purple-900/30 px-2 py-1 rounded">
                  ⭐ Premium Staker
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-black/40 border border-green-900/30 rounded p-2">
                <span className="text-green-600">Active Repos:</span>
                <span className="text-green-400 ml-2">{repositoryData.repositories.length}</span>
              </div>
              <div className="bg-black/40 border border-green-900/30 rounded p-2">
                <span className="text-green-600">Slots Remaining:</span>
                <span className="text-green-400 ml-2">
                  {repositoryData.premium_staker ? '∞' : repositoryData.member_slots_remaining}
                </span>
              </div>
            </div>

            {repositoryData.premium_staker && (
              <div className="mt-3 p-2 bg-purple-950/20 border border-purple-900/30 rounded">
                <p className="text-purple-400 font-mono text-xs">
                  🎉 Premium benefits active: {repositoryData.premium_benefits?.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* GitHub Connection Status */}
          <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-blue-400 font-mono text-sm">GitHub Connection</h3>
              <button
                onClick={relinkGitHub}
                disabled={relinkingGitHub}
                className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 px-3 py-1 rounded text-xs font-mono transition-all duration-300 disabled:opacity-50"
              >
                {relinkingGitHub ? '🔄 Re-linking...' : '🔗 Re-link GitHub'}
              </button>
            </div>
            <p className="text-blue-600 font-mono text-xs mb-2">
              If you're experiencing webhook setup issues, try re-linking your GitHub account to refresh permissions.
            </p>
          </div>

          {/* Add Repository */}
          <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
            <h3 className="text-blue-400 font-mono text-sm mb-3">Add New Repository</h3>
            
            <div className="space-y-3">
              <input
                type="text"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full bg-black/60 border border-blue-900/30 rounded px-3 py-2 
                         text-blue-400 font-mono text-sm placeholder-blue-600
                         focus:outline-none focus:border-blue-700/50"
              />
              
              {error && (
                <p className="text-red-400 font-mono text-xs">{error}</p>
              )}
              
              <button
                onClick={addRepository}
                disabled={addingRepo || !newRepoUrl.trim() || (!repositoryData.premium_staker && repositoryData.member_slots_remaining <= 0)}
                className="w-full bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono py-2 rounded-lg 
                         border border-blue-700/50 transition-all duration-300 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingRepo ? '⏳ Adding Repository...' : '+ Add Repository'}
              </button>
              
              {!repositoryData.premium_staker && repositoryData.member_slots_remaining <= 0 && (
                <p className="text-yellow-400 font-mono text-xs text-center">
                  Repository limit reached. Stake 5M+ $ABC for unlimited repos.
                </p>
              )}
            </div>
          </div>

          {/* Repository List */}
          <div className="space-y-2">
            <h3 className="text-green-400 font-mono text-sm">Your Repositories</h3>
            
            {repositoryData.repositories.length === 0 ? (
              <div className="bg-gray-950/20 border border-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-gray-400 font-mono text-xs">No repositories registered yet</p>
              </div>
            ) : (
              repositoryData.repositories.map((repo) => (
                <div key={repo.id} className="bg-black/60 border border-green-900/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-green-400 font-mono text-sm">{repo.repository_name}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {repo.status === 'active' && repo.webhook_configured ? (
                          <>
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-xs font-mono px-2 py-1 rounded bg-green-900/30 text-green-400">
                              🎯 Earning
                            </span>
                          </>
                        ) : repo.status === 'active' && !repo.webhook_configured ? (
                          <>
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                            <span className="text-xs font-mono px-2 py-1 rounded bg-yellow-900/30 text-yellow-400">
                              ⚠️ Setup Required
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            <span className="text-xs font-mono px-2 py-1 rounded bg-gray-900/30 text-gray-400">
                              📋 Pending
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs font-mono text-green-600">
                    <p>Type: {repo.registration_type}</p>
                    <p>Multiplier: {repo.reward_multiplier}x</p>
                    
                    {/* Status Explanation */}
                    <div className="mt-2 p-2 bg-black/40 border border-green-900/20 rounded">
                      {repo.status === 'active' && repo.webhook_configured ? (
                        <p className="text-green-400">
                          ✅ <strong>Ready!</strong> Your commits will earn {repo.reward_multiplier}x $ABC rewards
                        </p>
                      ) : repo.status === 'active' && !repo.webhook_configured ? (
                        <p className="text-yellow-400">
                          🔧 <strong>Almost there!</strong> Configure webhook to start earning rewards
                        </p>
                      ) : (
                        <p className="text-gray-400">
                          ⏳ <strong>Processing...</strong> Repository activation in progress
                        </p>
                      )}
                    </div>
                    
                    {!repo.webhook_configured && (
                      <div className="mt-2 space-y-2">
                        <p className="text-yellow-400">⚠️ Webhook not configured - rewards inactive</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => showWebhookInstructions(repo.id, repo.repository_name)}
                            className="bg-green-900/50 hover:bg-green-900/70 text-green-400 border border-green-700/50 px-2 py-1 rounded text-xs font-mono transition-all duration-300"
                          >
                            🔧 Setup Webhook
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-red-400 font-mono text-sm">Failed to load repositories</p>
          <button 
            onClick={fetchRepositories}
            className="mt-2 text-green-400 hover:text-green-300 font-mono text-xs underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}