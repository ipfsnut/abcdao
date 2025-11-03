'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { useAccount } from 'wagmi';
import { config } from '@/lib/config';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  CodeBracketIcon, 
  StarIcon,
  LockClosedIcon,
  GlobeAltIcon,
  PlusIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { WebhookSetupModal } from './webhook-setup-modal';

interface GitHubRepository {
  id: number;
  name: string;
  url: string;
  description?: string;
  private: boolean;
  updated_at: string;
  language?: string;
  stargazers_count: number;
}

interface RepositoryData {
  repositories: any[];
  member_slots_used: number;
  member_slots_remaining: number;
  premium_staker: boolean;
}

interface RegisteredRepository {
  id: string;
  repository_name: string;
  repository_url: string;
  webhook_configured: boolean;
  status: 'pending' | 'active';
}

export function GitHubOAuthRepositoryManager() {
  const { user: profile } = useFarcaster();
  const { address: walletAddress } = useAccount();
  const [walletUserFid, setWalletUserFid] = useState<number | null>(null);
  
  // Get user identifier - prefer Farcaster FID, fallback to wallet lookup
  const getUserIdentifier = () => {
    if (profile?.fid) {
      return profile.fid.toString();
    }
    if (walletUserFid) {
      return walletUserFid.toString();
    }
    if (walletAddress) {
      return walletAddress;
    }
    return null;
  };
  
  const userIdentifier = getUserIdentifier();
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [registeredRepos, setRegisteredRepos] = useState<RepositoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [repoDataLoading, setRepoDataLoading] = useState(true); // Loading state for initial repo data
  const [registering, setRegistering] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [githubLinked, setGithubLinked] = useState(false);
  const [webhookSetupModal, setWebhookSetupModal] = useState<{
    isOpen: boolean;
    repository: { id: string; name: string; url: string } | null;
  }>({ isOpen: false, repository: null });

  // Fetch user FID when wallet is connected but no Farcaster profile
  useEffect(() => {
    const fetchWalletUserFid = async () => {
      if (!profile?.fid && walletAddress && !walletUserFid) {
        try {
          console.log(`🔍 Fetching FID for wallet ${walletAddress}...`);
          const response = await fetch(`${config.backendUrl}/api/universal-auth/wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: walletAddress })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user?.farcaster_fid) {
              console.log(`✅ Found FID ${data.user.farcaster_fid} for wallet`);
              setWalletUserFid(data.user.farcaster_fid);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch wallet user FID:', error);
        }
      }
    };
    
    fetchWalletUserFid();
  }, [walletAddress, profile?.fid, walletUserFid]);

  useEffect(() => {
    if (userIdentifier) {
      console.log(`🎯 User identifier available (${userIdentifier}), checking GitHub connection...`);
      checkGitHubConnection();
      fetchRegisteredRepos();
    }
  }, [userIdentifier]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('🎭 GitHub state changed:', { 
      githubLinked, 
      repoCount: githubRepos.length,
      userIdentifier,
      profileFid: profile?.fid,
      walletUserFid,
      walletAddress,
      authMethod: profile?.fid ? 'farcaster' : walletUserFid ? 'wallet-with-fid' : walletAddress ? 'wallet-only' : 'none'
    });
  }, [githubLinked, githubRepos, userIdentifier, profile?.fid, walletUserFid, walletAddress]);

  const checkGitHubConnection = async () => {
    if (!userIdentifier) {
      console.warn('⚠️ No user identifier available for GitHub connection check');
      return;
    }
    
    try {
      console.log(`🔍 Checking GitHub connection for identifier ${userIdentifier}...`);
      
      // Use universal endpoint if wallet address, legacy endpoint if FID
      const endpoint = userIdentifier.startsWith('0x') 
        ? `${config.backendUrl}/api/repositories/user/${userIdentifier}/github-repositories`
        : `${config.backendUrl}/api/repositories/${userIdentifier}/github-repositories`;
        
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ GitHub connected! Found ${data.repositories?.length || 0} repositories`);
        console.log('Repository data:', data);
        setGithubLinked(true);
        setGithubRepos(data.repositories || []);
      } else if (response.status === 401) {
        console.log('❌ GitHub not connected (401)');
        const errorData = await response.json().catch(() => ({ error: 'GitHub not connected' }));
        console.log('401 Error details:', errorData);
        setGithubLinked(false);
        setGithubRepos([]);
      } else {
        console.warn(`⚠️ Unexpected response status: ${response.status}`);
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn('Error details:', errorData);
        setGithubLinked(false);
        setGithubRepos([]);
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
      setGithubLinked(false);
      setGithubRepos([]);
    } finally {
      setRepoDataLoading(false);
    }
  };

  const fetchRegisteredRepos = async () => {
    if (!userIdentifier) return;
    
    try {
      console.log(`📁 Fetching registered repos for identifier ${userIdentifier}...`);
      
      // Use universal endpoint if wallet address, legacy endpoint if FID
      const endpoint = userIdentifier.startsWith('0x') 
        ? `${config.backendUrl}/api/repositories/user/${userIdentifier}/repositories`
        : `${config.backendUrl}/api/repositories/${userIdentifier}/repositories`;
        
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        console.log(`📁 Found ${data.repositories?.length || 0} registered repositories`);
        setRegisteredRepos(data);
      } else {
        console.warn(`⚠️ Failed to fetch registered repos: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching registered repositories:', error);
    } finally {
      setRepoDataLoading(false);
    }
  };

  const connectGitHub = async () => {
    if (!userIdentifier) {
      toast.error('Authentication required. Please connect your wallet or Farcaster account.');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`🔗 Initiating GitHub OAuth for identifier ${userIdentifier}...`);
      
      // Prepare OAuth request based on authentication method
      const oauthBody = profile?.fid && profile?.username ? {
        // Farcaster authentication
        farcaster_fid: profile.fid,
        farcaster_username: profile.username,
        context: 'farcaster_miniapp'
      } : walletAddress ? {
        // Wallet authentication
        wallet_address: walletAddress,
        context: 'webapp'
      } : {};
      
      console.log(`🔗 OAuth body:`, oauthBody);
      
      // Use the updated universal auth endpoint
      const response = await fetch(`${config.backendUrl}/api/universal-auth/github/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oauthBody)
      });
      
      const data = await response.json();
      
      if (response.ok && data.auth_url) {
        // Open GitHub OAuth in new window
        window.open(data.auth_url, '_blank', 'width=600,height=700');
        
        // Poll for connection success
        let pollCount = 0;
        const maxPolls = 60; // 2 minutes at 2-second intervals
        
        const pollForConnection = setInterval(async () => {
          pollCount++;
          console.log(`🔄 Polling for GitHub connection (${pollCount}/${maxPolls})...`);
          
          try {
            await checkGitHubConnection();
            // Check if repos were loaded (indicates successful connection)
            if (githubRepos.length > 0 || githubLinked) {
              clearInterval(pollForConnection);
              toast.success('GitHub connected successfully!');
              console.log('✅ GitHub connection confirmed via polling');
              return;
            }
          } catch (error) {
            console.warn('⚠️ Polling error:', error);
          }
          
          // Stop polling after max attempts
          if (pollCount >= maxPolls) {
            clearInterval(pollForConnection);
            console.log('⏰ GitHub connection polling timed out');
            toast.error('GitHub connection verification timed out. Please refresh and try again.');
          }
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to initialize GitHub authentication');
      }
    } catch (error) {
      console.error('Error connecting GitHub:', error);
      toast.error('Failed to connect GitHub');
    }
    setLoading(false);
  };

  const registerRepository = async (repo: GitHubRepository) => {
    if (!userIdentifier) {
      toast.error('Authentication required to register repository.');
      return;
    }
    
    setRegistering(repo.name);
    try {
      console.log(`📝 Registering repository ${repo.name} for identifier ${userIdentifier}...`);
      
      // Use universal endpoint if wallet address, legacy endpoint if FID
      const endpoint = userIdentifier.startsWith('0x') 
        ? `${config.backendUrl}/api/repositories/user/${userIdentifier}/repositories`
        : `${config.backendUrl}/api/repositories/${userIdentifier}/repositories`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository_url: repo.url,
          repository_name: repo.name
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Repository registered successfully!');
        await fetchRegisteredRepos();
        await checkGitHubConnection(); // Refresh available repos
        
        // Immediately open webhook setup modal for the newly registered repository
        setWebhookSetupModal({
          isOpen: true,
          repository: {
            id: data.repository.id.toString(),
            name: repo.name,
            url: repo.url
          }
        });
      } else {
        toast.error(data.error || 'Failed to register repository');
      }
    } catch (error) {
      console.error('Error registering repository:', error);
      toast.error('Failed to register repository');
    }
    setRegistering(null);
  };

  const isRepoRegistered = (repoName: string) => {
    return registeredRepos?.repositories?.some(r => r.repository_name === repoName);
  };

  const getRepoStatus = (repoName: string): RegisteredRepository | null => {
    return registeredRepos?.repositories?.find(r => r.repository_name === repoName) || null;
  };

  const openWebhookSetup = (repo: RegisteredRepository) => {
    setWebhookSetupModal({
      isOpen: true,
      repository: {
        id: repo.id,
        name: repo.repository_name,
        url: repo.repository_url
      }
    });
  };

  const closeWebhookSetup = () => {
    setWebhookSetupModal({ isOpen: false, repository: null });
    // Refresh repository data after webhook setup
    fetchRegisteredRepos();
  };

  if (!userIdentifier) {
    return (
      <div className="bg-black/40 border border-yellow-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <p className="text-yellow-400 font-mono text-center mb-4">
          Connect your account to manage repositories
        </p>
        <div className="text-center space-y-2">
          <p className="text-green-600 font-mono text-sm">
            {!profile && !walletAddress && '🔐 Authentication required'}
            {!profile && walletAddress && '🎭 Farcaster connection recommended'}
            {profile && !walletAddress && '💰 Wallet connection recommended'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                // Manual fallback for epicdylan
                const fallbackUser = {
                  fid: 8573,
                  username: 'epicdylan',
                  displayName: 'epicdylan',
                  pfpUrl: ''
                };
                localStorage.setItem('abc_farcaster_user', JSON.stringify(fallbackUser));
                window.location.reload();
              }}
              className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono px-4 py-2 rounded-lg border border-blue-700/50 transition-all duration-300"
            >
              🔧 Dev: Manual Auth (epicdylan)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GitHub Connection Status */}
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} github_repository_manager()
        </h2>
        
        {!githubLinked ? (
          <div className="text-center">
            <div className="mb-4 p-4 bg-blue-950/20 border border-blue-700/50 rounded-lg">
              <LinkIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-400 font-mono mb-2">Connect GitHub for seamless repository management</p>
              <p className="text-blue-600 font-mono text-sm">
                • Automatic webhook setup • No manual configuration • Instant activation
              </p>
            </div>
            <button
              onClick={connectGitHub}
              disabled={loading}
              className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono px-6 py-3 rounded-lg border border-blue-700/50 transition-all duration-300 hover:matrix-glow disabled:opacity-50"
            >
              {loading ? '// Connecting...' : '🔗 Connect GitHub Account'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-950/20 border border-green-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-mono">GitHub Connected</span>
              </div>
              <button
                onClick={checkGitHubConnection}
                className="text-green-600 hover:text-green-400 text-sm font-mono"
              >
                🔄 Refresh
              </button>
            </div>
            
            {/* Repository Stats */}
            {registeredRepos && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-3">
                  <p className="text-green-600 font-mono text-xs">Repository Slots</p>
                  <p className="text-green-400 font-mono text-lg">
                    {registeredRepos.member_slots_used}/{registeredRepos.premium_staker ? '∞' : '3'}
                  </p>
                </div>
                <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-3">
                  <p className="text-blue-600 font-mono text-xs">Available Repos</p>
                  <p className="text-blue-400 font-mono text-lg">{githubRepos.length}</p>
                </div>
                <div className="bg-purple-950/20 border border-purple-700/50 rounded-lg p-3">
                  <p className="text-purple-600 font-mono text-xs">Auto Setup</p>
                  <p className="text-purple-400 font-mono text-lg">✓ Enabled</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repository Selection */}
      {githubLinked && githubRepos.length > 0 && (
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-400 font-mono">
              Your GitHub Repositories
            </h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-green-600 hover:text-green-400 transition-colors"
            >
              <span className="font-mono text-sm">
                {isExpanded ? 'Collapse' : 'Expand'} ({githubRepos.length})
              </span>
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <div className={`space-y-3 ${isExpanded ? 'max-h-none' : 'max-h-96 overflow-y-auto'}`}>
            {githubRepos.slice(0, isExpanded ? undefined : 5).map((repo) => {
              const isRegistered = isRepoRegistered(repo.name);
              const repoStatus = getRepoStatus(repo.name);
              const isCurrentlyRegistering = registering === repo.name;
              const needsWebhookSetup = repoStatus && !repoStatus.webhook_configured;
              
              return (
                <div 
                  key={repo.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    needsWebhookSetup 
                      ? 'bg-yellow-950/20 border-yellow-700/50 hover:bg-yellow-950/30' 
                      : 'bg-green-950/20 border-green-700/50 hover:bg-green-950/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CodeBracketIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <h4 className="text-green-400 font-mono font-semibold truncate">{repo.name}</h4>
                        {repo.private ? (
                          <LockClosedIcon className="w-3 h-3 text-yellow-400" />
                        ) : (
                          <GlobeAltIcon className="w-3 h-3 text-green-600" />
                        )}
                        {/* Status indicators */}
                        {repoStatus && (
                          <div className="flex items-center gap-1">
                            {repoStatus.webhook_configured ? (
                              <span className="px-2 py-0.5 bg-green-900/50 text-green-400 border border-green-700/50 rounded text-xs">
                                🟢 Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 border border-yellow-700/50 rounded text-xs">
                                ⚠️ Setup Required
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-green-600 font-mono text-xs mb-2 truncate">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs font-mono text-green-600">
                        {repo.language && (
                          <span>Lang: {repo.language}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-3 h-3" />
                          <span>{repo.stargazers_count}</span>
                        </div>
                        <span>Updated: {new Date(repo.updated_at).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Webhook setup warning */}
                      {needsWebhookSetup && (
                        <div className="mt-2 p-2 bg-yellow-950/20 border border-yellow-700/50 rounded text-xs">
                          <div className="flex items-center gap-2 text-yellow-400 font-mono">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            <span>Webhook setup required to earn rewards</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-shrink-0 flex flex-col gap-2">
                      {!isRegistered ? (
                        <button
                          onClick={() => registerRepository(repo)}
                          disabled={isCurrentlyRegistering || (registeredRepos ? (registeredRepos.member_slots_remaining <= 0 && !registeredRepos.premium_staker) : false)}
                          className="flex items-center gap-2 bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono px-3 py-1 rounded text-xs border border-blue-700/50 transition-all duration-300 hover:matrix-glow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCurrentlyRegistering ? (
                            '// Registering...'
                          ) : (
                            <>
                              <PlusIcon className="w-3 h-3" />
                              Register
                            </>
                          )}
                        </button>
                      ) : repoStatus?.webhook_configured ? (
                        <span className="px-3 py-1 bg-green-900/50 text-green-400 border border-green-700/50 rounded text-xs font-mono">
                          ✓ Active & Earning
                        </span>
                      ) : (
                        <button
                          onClick={() => repoStatus && openWebhookSetup(repoStatus)}
                          className="flex items-center gap-2 bg-yellow-900/50 hover:bg-yellow-900/70 text-yellow-400 font-mono px-3 py-1 rounded text-xs border border-yellow-700/50 transition-all duration-300 hover:matrix-glow"
                        >
                          <WrenchScrewdriverIcon className="w-3 h-3" />
                          Setup Webhook
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {!isExpanded && githubRepos.length > 5 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-green-600 hover:text-green-400 font-mono text-sm transition-colors"
                >
                  ... and {githubRepos.length - 5} more repositories
                </button>
              </div>
            )}
          </div>
          
          {registeredRepos && registeredRepos.member_slots_remaining <= 0 && !registeredRepos.premium_staker && (
            <div className="mt-4 p-3 bg-yellow-950/20 border border-yellow-700/50 rounded-lg">
              <p className="text-yellow-400 font-mono text-sm">
                ⚠ Repository limit reached. Stake 5M+ $ABC to unlock unlimited repositories.
              </p>
            </div>
          )}
        </div>
      )}

      {githubLinked && githubRepos.length === 0 && (
        <div className="bg-black/40 border border-yellow-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm text-center">
          <p className="text-yellow-400 font-mono">No repositories found with admin access.</p>
          <p className="text-yellow-600 font-mono text-sm mt-1">
            Create a repository on GitHub or ensure you have admin permissions.
          </p>
        </div>
      )}

      {/* Webhook Setup Modal */}
      {webhookSetupModal.isOpen && webhookSetupModal.repository && (
        <WebhookSetupModal
          isOpen={webhookSetupModal.isOpen}
          onClose={closeWebhookSetup}
          repository={webhookSetupModal.repository}
          onWebhookConfigured={closeWebhookSetup}
        />
      )}
    </div>
  );
}