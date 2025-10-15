'use client';

import { useState, useEffect } from 'react';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
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
  const { user: profile } = useFarcaster();
  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingRepo, setAddingRepo] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.fid) {
      fetchRepositories();
    }
  }, [profile]);

  const fetchRepositories = async () => {
    if (!profile?.fid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${profile.fid}/repositories`);
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
    if (!profile?.fid || !newRepoUrl.trim()) return;
    
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
      const response = await fetch(`${config.backendUrl}/api/repositories/${profile.fid}/repositories`, {
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

  if (!profile) {
    return (
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} repository_manager()
        </h2>
        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 text-center">
          <p className="text-red-400 font-mono text-sm">
            Connect Farcaster account first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
        {'>'} repository_manager()
      </h2>
      
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
                      <span className={`text-xs font-mono px-2 py-1 rounded ${
                        repo.status === 'active' 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {repo.status}
                      </span>
                      {repo.webhook_configured && (
                        <span className="text-green-400 text-xs">✅</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs font-mono text-green-600">
                    <p>Type: {repo.registration_type}</p>
                    <p>Multiplier: {repo.reward_multiplier}x</p>
                    {!repo.webhook_configured && (
                      <p className="text-yellow-400 mt-1">
                        ⚠️ Webhook not configured - rewards inactive
                      </p>
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