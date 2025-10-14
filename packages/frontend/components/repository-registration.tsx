'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { config } from '@/lib/config';

interface Repository {
  id: number;
  repository_name: string;
  repository_url: string;
  registration_type: 'member' | 'partner';
  webhook_configured: boolean;
  reward_multiplier: number;
  status: string;
  created_at: string;
}

interface RepositoryData {
  repositories: Repository[];
  member_slots_used: number;
  member_slots_remaining: number;
  partner_repositories: Repository[];
}

export function RepositoryRegistration() {
  const { user: profile } = useFarcaster();
  const [repositories, setRepositories] = useState<RepositoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  
  // Member registration form
  const [memberForm, setMemberForm] = useState({
    repository_url: '',
    repository_name: ''
  });
  
  // Partner application form
  const [partnerForm, setPartnerForm] = useState({
    organization_name: '',
    contact_email: '',
    repository_name: '',
    repository_url: '',
    description: '',
    requested_multiplier: 2.0
  });
  
  const [showPartnerForm, setShowPartnerForm] = useState(false);

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
        setRepositories(data);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to load repositories');
    }
    setLoading(false);
  };

  const handleMemberRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.fid) return;
    
    // Extract repo name from URL
    const match = memberForm.repository_url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) {
      toast.error('Invalid GitHub repository URL');
      return;
    }
    
    const repoName = match[1];
    
    setRegistering(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/${profile.fid}/repositories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository_url: memberForm.repository_url,
          repository_name: repoName
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        setMemberForm({ repository_url: '', repository_name: '' });
        fetchRepositories();
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering repository:', error);
      toast.error('Failed to register repository');
    }
    setRegistering(false);
  };

  const handlePartnerApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.fid) return;
    
    setRegistering(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/repositories/partner-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...partnerForm,
          farcaster_fid: profile.fid
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        setPartnerForm({
          organization_name: '',
          contact_email: '',
          repository_name: '',
          repository_url: '',
          description: '',
          requested_multiplier: 2.0
        });
        setShowPartnerForm(false);
        fetchRepositories();
      } else {
        toast.error(data.error || 'Application failed');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    }
    setRegistering(false);
  };

  if (!profile) {
    return (
      <div className="bg-black/40 border border-yellow-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <p className="text-yellow-400 font-mono text-center">
          Connect Farcaster to register repositories
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Repository Management Header */}
      <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-green-400 matrix-glow font-mono">
          {'>'} repository_manager()
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-3">
            <p className="text-green-600 font-mono text-xs">Member Slots</p>
            <p className="text-green-400 font-mono text-lg">
              {repositories?.member_slots_used || 0}/3
            </p>
          </div>
          <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-3">
            <p className="text-blue-600 font-mono text-xs">Partner Repos</p>
            <p className="text-blue-400 font-mono text-lg">
              {repositories?.partner_repositories?.length || 0}
            </p>
          </div>
          <div className="bg-purple-950/20 border border-purple-700/50 rounded-lg p-3">
            <p className="text-purple-600 font-mono text-xs">Total Active</p>
            <p className="text-purple-400 font-mono text-lg">
              {repositories?.repositories?.filter(r => r.status === 'active').length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Member Repository Registration */}
      {repositories && repositories.member_slots_remaining > 0 && (
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-3 text-green-400 font-mono">
            Register Member Repository (Free)
          </h3>
          
          <form onSubmit={handleMemberRegistration} className="space-y-4">
            <div>
              <label className="block text-green-600 font-mono text-sm mb-2">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={memberForm.repository_url}
                onChange={(e) => setMemberForm(prev => ({ ...prev, repository_url: e.target.value }))}
                placeholder="https://github.com/username/repository"
                className="w-full bg-black/60 border border-green-700/50 rounded-lg px-3 py-2 text-green-400 font-mono text-sm focus:border-green-500 focus:outline-none"
                required
              />
              <p className="text-green-600/70 font-mono text-xs mt-1">
                You must have admin access to this repository
              </p>
            </div>
            
            <button
              type="submit"
              disabled={registering || !memberForm.repository_url}
              className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono py-2 rounded-lg border border-green-700/50 transition-all duration-300 hover:matrix-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? '// Registering...' : 'REGISTER REPOSITORY'}
            </button>
          </form>
        </div>
      )}

      {/* Partner Organization Application */}
      <div className="bg-black/40 border border-blue-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
        <h3 className="text-lg font-bold mb-3 text-blue-400 font-mono">
          Partner Organization (1,000,000 $ABC)
        </h3>
        
        <div className="mb-4 p-3 bg-blue-950/20 border border-blue-700/50 rounded-lg">
          <p className="text-blue-400 font-mono text-sm mb-2">Partner Benefits:</p>
          <ul className="text-blue-300 font-mono text-xs space-y-1">
            <li>→ Higher reward multipliers (2x-5x)</li>
            <li>→ Priority support and featured promotion</li>
            <li>→ Custom reward structures</li>
            <li>→ Dedicated partnership management</li>
          </ul>
        </div>
        
        {!showPartnerForm ? (
          <button
            onClick={() => setShowPartnerForm(true)}
            className="w-full bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono py-2 rounded-lg border border-blue-700/50 transition-all duration-300 hover:matrix-glow"
          >
            APPLY FOR PARTNERSHIP
          </button>
        ) : (
          <form onSubmit={handlePartnerApplication} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-600 font-mono text-sm mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={partnerForm.organization_name}
                  onChange={(e) => setPartnerForm(prev => ({ ...prev, organization_name: e.target.value }))}
                  className="w-full bg-black/60 border border-blue-700/50 rounded-lg px-3 py-2 text-blue-400 font-mono text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-blue-600 font-mono text-sm mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={partnerForm.contact_email}
                  onChange={(e) => setPartnerForm(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full bg-black/60 border border-blue-700/50 rounded-lg px-3 py-2 text-blue-400 font-mono text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-blue-600 font-mono text-sm mb-2">
                Repository URL *
              </label>
              <input
                type="url"
                value={partnerForm.repository_url}
                onChange={(e) => setPartnerForm(prev => ({ ...prev, repository_url: e.target.value }))}
                placeholder="https://github.com/organization/repository"
                className="w-full bg-black/60 border border-blue-700/50 rounded-lg px-3 py-2 text-blue-400 font-mono text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-blue-600 font-mono text-sm mb-2">
                Project Description
              </label>
              <textarea
                value={partnerForm.description}
                onChange={(e) => setPartnerForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your project and why it should be featured..."
                rows={3}
                className="w-full bg-black/60 border border-blue-700/50 rounded-lg px-3 py-2 text-blue-400 font-mono text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-blue-600 font-mono text-sm mb-2">
                Requested Reward Multiplier
              </label>
              <select
                value={partnerForm.requested_multiplier}
                onChange={(e) => setPartnerForm(prev => ({ ...prev, requested_multiplier: parseFloat(e.target.value) }))}
                className="w-full bg-black/60 border border-blue-700/50 rounded-lg px-3 py-2 text-blue-400 font-mono text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value={2.0}>2.0x (Standard)</option>
                <option value={3.0}>3.0x (High Impact)</option>
                <option value={4.0}>4.0x (Critical Infrastructure)</option>
                <option value={5.0}>5.0x (Ecosystem Essential)</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPartnerForm(false)}
                className="flex-1 bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 font-mono py-2 rounded-lg border border-gray-600/50 transition-all duration-300"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={registering}
                className="flex-1 bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono py-2 rounded-lg border border-blue-700/50 transition-all duration-300 hover:matrix-glow disabled:opacity-50"
              >
                {registering ? '// Submitting...' : 'SUBMIT APPLICATION'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Current Repositories */}
      {repositories && repositories.repositories.length > 0 && (
        <div className="bg-black/40 border border-green-900/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-4 text-green-400 font-mono">
            Your Registered Repositories
          </h3>
          
          <div className="space-y-3">
            {repositories.repositories.map((repo) => (
              <div key={repo.id} className="bg-green-950/20 border border-green-700/50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-green-400 font-mono font-semibold">{repo.repository_name}</h4>
                    <p className="text-green-600 font-mono text-xs">{repo.repository_url}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-mono ${
                      repo.registration_type === 'partner' 
                        ? 'bg-blue-900/50 text-blue-400 border border-blue-700/50'
                        : 'bg-green-900/50 text-green-400 border border-green-700/50'
                    }`}>
                      {repo.registration_type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${
                      repo.status === 'active'
                        ? 'bg-green-900/50 text-green-400 border border-green-700/50'
                        : 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
                    }`}>
                      {repo.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-green-600">Webhook: </span>
                    <span className={repo.webhook_configured ? 'text-green-400' : 'text-yellow-400'}>
                      {repo.webhook_configured ? '✓ Configured' : '⚠ Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-600">Multiplier: </span>
                    <span className="text-green-400">{repo.reward_multiplier}x</span>
                  </div>
                  <div>
                    <span className="text-green-600">Registered: </span>
                    <span className="text-green-400">
                      {new Date(repo.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {!repo.webhook_configured && repo.status === 'pending' && (
                  <div className="mt-3 p-2 bg-yellow-950/20 border border-yellow-700/50 rounded">
                    <p className="text-yellow-400 font-mono text-xs">
                      ⚠ Configure webhook to activate rewards:
                    </p>
                    <code className="text-yellow-300 font-mono text-xs">
                      URL: https://abcdao-production.up.railway.app/api/webhooks/github
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}