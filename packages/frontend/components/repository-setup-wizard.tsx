/**
 * Repository Setup Wizard Component
 * 
 * Guides users through the process of setting up repositories for earning ABC tokens
 */

'use client';

import { useState, useEffect } from 'react';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  isPrivate: boolean;
  lastActivity: string;
  commits: number;
  score: number;
  estimatedEarning: string;
  isSelected: boolean;
}

interface RepositorySetupWizardProps {
  user: any;
  onComplete: (selectedRepos: Repository[]) => void;
  onCancel: () => void;
  isOpen: boolean;
}

type WizardStep = 'welcome' | 'detection' | 'selection' | 'configuration' | 'confirmation';

export function RepositorySetupWizard({ user, onComplete, onCancel, isOpen }: RepositorySetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    if (isOpen && currentStep === 'detection') {
      runAutoDetection();
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    setSelectedCount(repositories.filter(repo => repo.isSelected).length);
  }, [repositories]);

  const runAutoDetection = async () => {
    setIsLoading(true);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://abcdao-production.up.railway.app';
      const response = await fetch(`${backendUrl}/api/repositories/${user.farcaster_fid}/detect`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not found or GitHub not connected
          setRepositories([]);
          setIsLoading(false);
          setCurrentStep('selection');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match component interface
      const transformedRepos: Repository[] = data.repositories.map((repo: any) => {
        // Calculate estimated earning based on score (rough approximation)
        const estimatedEarning = Math.round(repo.score * 1000).toString();
        
        // Format last activity
        const lastActivityDate = new Date(repo.updated_at);
        const daysSinceUpdate = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        const lastActivity = daysSinceUpdate === 0 ? 'Today' :
                           daysSinceUpdate === 1 ? '1 day ago' :
                           daysSinceUpdate < 7 ? `${daysSinceUpdate} days ago` :
                           daysSinceUpdate < 30 ? `${Math.floor(daysSinceUpdate / 7)} weeks ago` :
                           `${Math.floor(daysSinceUpdate / 30)} months ago`;
        
        return {
          id: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || 'No description available',
          language: repo.language || 'Unknown',
          stars: repo.stargazers_count,
          isPrivate: repo.private,
          lastActivity,
          commits: 0, // API doesn't provide commit count, could be enhanced
          score: repo.score,
          estimatedEarning,
          isSelected: repo.auto_eligible && !repo.already_registered // Auto-select eligible repos
        };
      });
      
      setRepositories(transformedRepos);
      setIsLoading(false);
      setCurrentStep('selection');
    } catch (error) {
      console.error('Failed to detect repositories:', error);
      
      // Fallback to empty state on error
      setRepositories([]);
      setIsLoading(false);
      setCurrentStep('selection');
    }
  };

  const toggleRepository = (repoId: string) => {
    setRepositories(repos =>
      repos.map(repo =>
        repo.id === repoId
          ? { ...repo, isSelected: !repo.isSelected }
          : repo
      )
    );
  };

  const selectAllRecommended = () => {
    setRepositories(repos =>
      repos.map(repo => ({
        ...repo,
        isSelected: repo.score >= 70
      }))
    );
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('detection');
        break;
      case 'selection':
        setCurrentStep('configuration');
        break;
      case 'configuration':
        setCurrentStep('confirmation');
        break;
      case 'confirmation':
        const selectedRepos = repositories.filter(repo => repo.isSelected);
        onComplete(selectedRepos);
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'detection':
        setCurrentStep('welcome');
        break;
      case 'selection':
        setCurrentStep('detection');
        break;
      case 'configuration':
        setCurrentStep('selection');
        break;
      case 'confirmation':
        setCurrentStep('configuration');
        break;
    }
  };

  const getLanguageColor = (language: string) => {
    const colors = {
      'TypeScript': 'text-blue-400',
      'JavaScript': 'text-yellow-400',
      'Python': 'text-green-400',
      'Dart': 'text-cyan-400',
      'HTML': 'text-orange-400'
    };
    return colors[language as keyof typeof colors] || 'text-gray-400';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalEstimatedEarning = repositories
    .filter(repo => repo.isSelected)
    .reduce((sum, repo) => sum + parseInt(repo.estimatedEarning), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-green-900/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-950/20 border-b border-green-900/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-green-400 matrix-glow">
                Repository Setup Wizard
              </h2>
              <p className="text-sm text-green-600 font-mono mt-1">
                Set up your repositories to start earning ABC tokens
              </p>
            </div>
            
            <button
              onClick={onCancel}
              className="text-green-600 hover:text-green-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-6 flex items-center gap-4">
            {[
              { id: 'welcome', label: 'Welcome', icon: '👋' },
              { id: 'detection', label: 'Detection', icon: '🔍' },
              { id: 'selection', label: 'Selection', icon: '✅' },
              { id: 'configuration', label: 'Config', icon: '⚙️' },
              { id: 'confirmation', label: 'Confirm', icon: '🎉' }
            ].map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                  currentStep === step.id
                    ? 'bg-green-900/50 text-green-400 ring-2 ring-green-700/50'
                    : index < ['welcome', 'detection', 'selection', 'configuration', 'confirmation'].indexOf(currentStep)
                    ? 'bg-green-700/50 text-green-300'
                    : 'bg-green-950/30 text-green-700'
                }`}>
                  {step.icon}
                </div>
                <span className={`ml-2 text-xs font-mono ${
                  currentStep === step.id ? 'text-green-400' : 'text-green-600'
                }`}>
                  {step.label}
                </span>
                {index < 4 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    index < ['welcome', 'detection', 'selection', 'configuration', 'confirmation'].indexOf(currentStep)
                      ? 'bg-green-700/50'
                      : 'bg-green-950/30'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🚀</div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">
                Welcome to ABC DAO Earning!
              </h3>
              <p className="text-green-600 font-mono mb-8 leading-relaxed">
                This wizard will help you set up your GitHub repositories to start earning ABC tokens 
                for your code contributions. We'll automatically detect your repositories and suggest 
                the best ones for maximum earning potential.
              </p>
              
              <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6 mb-8">
                <h4 className="text-lg font-bold text-green-400 mb-4">What we'll do:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">🔍</span>
                    <div>
                      <div className="font-semibold text-green-400 font-mono text-sm">Auto-Detection</div>
                      <div className="text-xs text-green-600">Scan your GitHub for active repositories</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl">📊</span>
                    <div>
                      <div className="font-semibold text-blue-400 font-mono text-sm">Smart Scoring</div>
                      <div className="text-xs text-green-600">Evaluate earning potential based on activity</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-xl">⚙️</span>
                    <div>
                      <div className="font-semibold text-purple-400 font-mono text-sm">Easy Setup</div>
                      <div className="text-xs text-green-600">Enable repositories with one click</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 text-xl">💰</span>
                    <div>
                      <div className="font-semibold text-yellow-400 font-mono text-sm">Start Earning</div>
                      <div className="text-xs text-green-600">Begin earning ABC tokens immediately</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-green-700 font-mono">
                🔒 We only access public repository information and commit metadata
              </div>
            </div>
          )}

          {/* Detection Step */}
          {currentStep === 'detection' && (
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">
                Detecting Your Repositories
              </h3>
              <p className="text-green-600 font-mono mb-8">
                We're scanning your GitHub account for repositories with earning potential...
              </p>
              
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-green-950/30 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-green-950/30 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-green-950/30 rounded w-1/2 mx-auto"></div>
                  </div>
                  
                  <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
                    <div className="text-sm text-green-600 font-mono">
                      🔄 Analyzing repository activity...
                    </div>
                    <div className="text-sm text-green-600 font-mono mt-2">
                      📊 Calculating earning scores...
                    </div>
                    <div className="text-sm text-green-600 font-mono mt-2">
                      💰 Estimating reward potential...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
                  <div className="text-lg font-bold text-green-400 mb-2">
                    ✅ Detection Complete!
                  </div>
                  <div className="text-sm text-green-600 font-mono">
                    Found {repositories.length} repositories ready for setup
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selection Step */}
          {currentStep === 'selection' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-green-400 mb-2">
                  Select Repositories to Enable
                </h3>
                <p className="text-green-600 font-mono text-sm mb-4">
                  Choose which repositories you want to enable for earning ABC tokens
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-600 font-mono">
                    {selectedCount} of {repositories.length} repositories selected
                  </div>
                  
                  <button
                    onClick={selectAllRecommended}
                    className="px-4 py-2 bg-green-900/50 text-green-400 rounded-lg font-mono text-sm hover:bg-green-800/60 transition-colors"
                  >
                    ✨ Select Recommended
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                      repo.isSelected
                        ? 'bg-green-950/20 border-green-700/50 ring-1 ring-green-700/30'
                        : 'bg-black/20 border-green-900/30 hover:border-green-700/50'
                    }`}
                    onClick={() => toggleRepository(repo.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center ${
                          repo.isSelected
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-green-700'
                        }`}>
                          {repo.isSelected && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-green-400 font-mono">
                              {repo.name}
                            </h4>
                            <span className={`font-mono text-xs ${getLanguageColor(repo.language)}`}>
                              {repo.language}
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-yellow-400">⭐ {repo.stars}</span>
                              {repo.score >= 70 && (
                                <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs">
                                  Recommended
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-green-600 mb-2">
                            {repo.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-green-700">
                            <span>💻 {repo.commits} commits</span>
                            <span>⏰ {repo.lastActivity}</span>
                            <span className={`font-mono ${getScoreColor(repo.score)}`}>
                              Score: {repo.score}/100
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-sm font-mono font-bold text-green-400">
                          ~{(parseInt(repo.estimatedEarning) / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-green-600">$ABC/month</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Step */}
          {currentStep === 'configuration' && (
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-4">
                Configure Settings
              </h3>
              
              <div className="space-y-6">
                {/* Auto-Detection Setting */}
                <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-400 font-mono mb-2">
                        🤖 Auto-Detection
                      </h4>
                      <p className="text-sm text-green-600">
                        Automatically suggest new repositories when you create them
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setAutoDetectionEnabled(!autoDetectionEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        autoDetectionEnabled ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        autoDetectionEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}></div>
                    </button>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
                  <h4 className="font-semibold text-blue-400 font-mono mb-4">
                    🔔 Notification Preferences
                  </h4>
                  
                  <div className="space-y-3">
                    {[
                      { id: 'commit-rewards', label: 'Commit Rewards', description: 'Get notified when commits are rewarded' },
                      { id: 'new-repos', label: 'New Repository Suggestions', description: 'Alerts for newly detected repositories' },
                      { id: 'milestones', label: 'Milestone Achievements', description: 'Celebrate earning milestones and streaks' }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm text-blue-400">{setting.label}</div>
                          <div className="text-xs text-green-600">{setting.description}</div>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-black border-blue-900 rounded focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Repositories Summary */}
                <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-6">
                  <h4 className="font-semibold text-purple-400 font-mono mb-4">
                    📊 Setup Summary
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-green-700">Repositories Selected:</div>
                      <div className="text-green-400 font-mono font-bold">{selectedCount}</div>
                    </div>
                    
                    <div>
                      <div className="text-green-700">Estimated Monthly Earning:</div>
                      <div className="text-green-400 font-mono font-bold">
                        {(totalEstimatedEarning / 1000).toFixed(0)}K $ABC
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 'confirmation' && (
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🎉</div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">
                You're All Set!
              </h3>
              <p className="text-green-600 font-mono mb-8">
                Your repositories are configured and ready to start earning ABC tokens. 
                You'll begin receiving rewards for your next commits.
              </p>
              
              <div className="bg-gradient-to-r from-green-950/30 to-blue-950/30 border border-green-700/50 rounded-xl p-6 mb-8">
                <h4 className="text-lg font-bold text-green-400 mb-4">Setup Complete ✅</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-green-700">Enabled Repositories</div>
                    <div className="text-2xl font-bold text-green-400">{selectedCount}</div>
                  </div>
                  
                  <div>
                    <div className="text-blue-700">Monthly Potential</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(totalEstimatedEarning / 1000).toFixed(0)}K
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-purple-700">Auto-Detection</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {autoDetectionEnabled ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-xl p-6">
                <div className="text-sm font-mono text-yellow-400 mb-2">💡 Next Steps:</div>
                <ul className="text-xs text-green-600 space-y-1 text-left">
                  <li>• Start making meaningful commits to your enabled repositories</li>
                  <li>• Check your developer dashboard for real-time earning updates</li>
                  <li>• Explore the analytics tab to track your performance</li>
                  <li>• Join our Discord community for tips and support</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-green-950/20 border-t border-green-900/30 p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-green-600 font-mono">
              {currentStep === 'welcome' && 'Step 1 of 5: Getting Started'}
              {currentStep === 'detection' && 'Step 2 of 5: Repository Detection'}
              {currentStep === 'selection' && 'Step 3 of 5: Repository Selection'}
              {currentStep === 'configuration' && 'Step 4 of 5: Configuration'}
              {currentStep === 'confirmation' && 'Step 5 of 5: Confirmation'}
            </div>
            
            <div className="flex gap-3">
              {currentStep !== 'welcome' && currentStep !== 'detection' && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-black/40 text-green-600 border border-green-900/50 rounded-lg font-mono text-sm hover:text-green-400 hover:border-green-700/50 transition-colors"
                >
                  ← Back
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={currentStep === 'detection' && isLoading}
                className="px-6 py-2 bg-green-900/50 text-green-400 rounded-lg font-mono text-sm hover:bg-green-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {currentStep === 'welcome' && 'Start Detection →'}
                {currentStep === 'detection' && (isLoading ? 'Detecting...' : 'Continue →')}
                {currentStep === 'selection' && `Enable ${selectedCount} Repos →`}
                {currentStep === 'configuration' && 'Finish Setup →'}
                {currentStep === 'confirmation' && 'Complete Setup 🎉'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}