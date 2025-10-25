'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
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
  CheckCircleIcon
} from '@heroicons/react/24/outline';

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

export function GitHubOAuthRepositoryManager() {
  const { user: profile } = useFarcaster();
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [registeredRepos, setRegisteredRepos] = useState<RepositoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [githubLinked, setGithubLinked] = useState(false);

  useEffect(() => {
    if (profile?.fid) {
      checkGitHubConnection();
      fetchRegisteredRepos();
    }
  }, [profile]);

  const checkGitHubConnection = async () => {
    if (!profile?.fid) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${profile.fid}/github-repositories`);
      if (response.ok) {
        setGithubLinked(true);
        const data = await response.json();
        setGithubRepos(data.repositories);
      } else if (response.status === 401) {
        setGithubLinked(false);
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
      setGithubLinked(false);
    }
  };

  const fetchRegisteredRepos = async () => {
    if (!profile?.fid) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${profile.fid}/repositories`);
      if (response.ok) {
        const data = await response.json();
        setRegisteredRepos(data);
      }
    } catch (error) {
      console.error('Error fetching registered repositories:', error);
    }
  };

  const connectGitHub = async () => {
    if (!profile?.fid || !profile?.username) return;
    
    setLoading(true);
    try {
      // Use the updated universal auth endpoint
      const response = await fetch(`${config.backendUrl}/api/universal-auth/github/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farcaster_fid: profile.fid,
          farcaster_username: profile.username,
          context: 'farcaster_miniapp'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.auth_url) {
        // Open GitHub OAuth in new window
        window.open(data.auth_url, '_blank', 'width=600,height=700');
        
        // Poll for connection success
        const pollForConnection = setInterval(async () => {
          await checkGitHubConnection();
          if (githubLinked) {
            clearInterval(pollForConnection);
            toast.success('GitHub connected successfully!');
          }
        }, 2000);
        
        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(pollForConnection), 120000);
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
    if (!profile?.fid) return;
    
    setRegistering(repo.name);
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${profile.fid}/repositories/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository_url: repo.url
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Repository registered successfully!');
        await fetchRegisteredRepos();
        await checkGitHubConnection(); // Refresh available repos
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

  if (!profile) {
    return (
      <div className="bg-black/40 border border-yellow-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <p className="text-yellow-400 font-mono text-center">
          Connect Farcaster to manage repositories
        </p>
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
            <div className="flex items-center gap-3 p-3 bg-green-950/20 border border-green-700/50 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-mono">GitHub Connected</span>
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
              const isCurrentlyRegistering = registering === repo.name;
              
              return (
                <div 
                  key={repo.id} 
                  className="bg-green-950/20 border border-green-700/50 rounded-lg p-4 hover:bg-green-950/30 transition-colors"
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
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      {isRegistered ? (
                        <span className="px-3 py-1 bg-green-900/50 text-green-400 border border-green-700/50 rounded text-xs font-mono">
                          ✓ Registered
                        </span>
                      ) : (
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
    </div>
  );
}