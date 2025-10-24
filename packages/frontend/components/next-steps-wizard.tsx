/**
 * Next Steps Wizard Component
 * 
 * Guides users through progressive setup steps based on their current profile state
 */

'use client';

import { useState } from 'react';

interface NextStep {
  action: string;
  title: string;
  description: string;
  benefits: string[];
  priority: 'high' | 'medium' | 'low';
}

interface NextStepsWizardProps {
  steps: NextStep[];
  onGitHubConnect: () => void;
  onDiscordConnect: () => void;
  onFarcasterConnect: () => void;
}

export function NextStepsWizard({ 
  steps, 
  onGitHubConnect, 
  onDiscordConnect, 
  onFarcasterConnect 
}: NextStepsWizardProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(
    steps.find(s => s.priority === 'high')?.action || steps[0]?.action || null
  );

  if (!steps || steps.length === 0) {
    return (
      <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-green-400 mb-2">All Set!</h3>
          <p className="text-sm text-green-600 font-mono">
            Your profile is fully configured. Start building and earning!
          </p>
        </div>
      </div>
    );
  }

  const handleStepAction = (step: NextStep) => {
    switch (step.action) {
      case 'connect_github':
        onGitHubConnect();
        break;
      case 'connect_discord':
        onDiscordConnect();
        break;
      case 'connect_farcaster':
        onFarcasterConnect();
        break;
      case 'upgrade_membership':
        // Handle membership upgrade
        window.open('/join', '_blank');
        break;
      default:
        console.log('Unknown action:', step.action);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-green-400 bg-green-950/20 border-green-700/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-950/20 border-yellow-700/50';
      case 'low':
        return 'text-blue-400 bg-blue-950/20 border-blue-700/50';
      default:
        return 'text-gray-400 bg-gray-950/20 border-gray-700/50';
    }
  };

  const getStepIcon = (action: string) => {
    const iconMap = {
      'connect_github': '💻',
      'connect_discord': '💬',
      'connect_farcaster': '🌐',
      'upgrade_membership': '💎',
      'setup_repositories': '📁',
      'stake_tokens': '🏦'
    };
    return iconMap[action as keyof typeof iconMap] || '🚀';
  };

  return (
    <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-green-400">Next Steps</h3>
        <span className="text-xs font-mono text-green-600">
          {steps.length} step{steps.length !== 1 ? 's' : ''} remaining
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.action}
            className={`border rounded-lg transition-all duration-200 ${
              expandedStep === step.action 
                ? getPriorityColor(step.priority)
                : 'border-green-900/30 bg-black/20'
            }`}
          >
            {/* Step Header */}
            <button
              onClick={() => setExpandedStep(expandedStep === step.action ? null : step.action)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-green-950/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getStepIcon(step.action)}</span>
                <div>
                  <div className="font-semibold font-mono text-sm">
                    {index + 1}. {step.title}
                  </div>
                  <div className="text-xs opacity-80">
                    {step.description}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-mono ${
                  step.priority === 'high' ? 'bg-green-900/50 text-green-400' :
                  step.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-blue-900/50 text-blue-400'
                }`}>
                  {step.priority}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${
                    expandedStep === step.action ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded Content */}
            {expandedStep === step.action && (
              <div className="px-4 pb-4 border-t border-green-900/20">
                <div className="mt-3">
                  <div className="text-sm font-mono text-green-600 mb-2">Benefits:</div>
                  <ul className="space-y-1 mb-4">
                    {step.benefits.map((benefit, i) => (
                      <li key={i} className="text-xs text-green-700 font-mono flex items-center gap-2">
                        <span className="text-green-400">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handleStepAction(step)}
                    className={`w-full py-2 px-4 rounded-lg font-mono font-semibold text-sm transition-all duration-200 ${
                      step.priority === 'high'
                        ? 'bg-green-900/50 text-green-400 hover:bg-green-800/60 hover:matrix-glow'
                        : step.priority === 'medium'
                        ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-800/60'
                        : 'bg-blue-900/50 text-blue-400 hover:bg-blue-800/60'
                    }`}
                  >
                    {getActionButtonText(step.action)}
                  </button>
                  
                  {step.priority === 'high' && (
                    <div className="mt-2 text-xs text-green-600 font-mono text-center">
                      ⭐ Recommended next step for maximum benefit
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 pt-4 border-t border-green-900/30">
        <div className="flex items-center justify-between text-xs font-mono text-green-600 mb-2">
          <span>Setup Progress</span>
          <span>Complete these steps to unlock full potential</span>
        </div>
        
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded ${
                i < (5 - steps.length) ? 'bg-green-400' : 'bg-green-950/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function getActionButtonText(action: string): string {
  const textMap = {
    'connect_github': 'Connect GitHub Account',
    'connect_discord': 'Join Discord Server',
    'connect_farcaster': 'Connect Farcaster',
    'upgrade_membership': 'Upgrade Membership',
    'setup_repositories': 'Setup Repositories',
    'stake_tokens': 'Start Staking'
  };
  
  return textMap[action as keyof typeof textMap] || 'Take Action';
}