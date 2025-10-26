'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { config } from '@/lib/config';
import { useFarcaster } from '@/contexts/unified-farcaster-context';
import { 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface WebhookSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: {
    id: string;
    name: string;
    url: string;
  };
  onWebhookConfigured?: () => void;
}

interface WebhookInstructions {
  github_url: string;
  payload_url: string;
  secret: string;
  content_type: string;
  events: string[];
  active: boolean;
}

export function WebhookSetupModal({ isOpen, onClose, repository, onWebhookConfigured }: WebhookSetupModalProps) {
  const { user: profile } = useFarcaster();
  const [instructions, setInstructions] = useState<WebhookInstructions | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && profile?.fid) {
      fetchWebhookInstructions();
    }
  }, [isOpen, profile?.fid, repository.id]);

  const fetchWebhookInstructions = async () => {
    if (!profile?.fid) return;
    
    setLoading(true);
    try {
      // Try to get user identifier from parent component context or use FID
      const userIdentifier = profile.fid;
      
      const response = await fetch(
        `${config.backendUrl}/api/repositories/${userIdentifier}/repositories/${repository.id}/webhook-instructions`
      );
      
      if (response.ok) {
        const data = await response.json();
        setInstructions(data.webhook_setup);
        setWebhookConfigured(data.repository.webhook_configured);
        
        if (data.repository.webhook_configured) {
          setCurrentStep(4); // Skip to success step
        }
      } else {
        toast.error('Failed to load webhook instructions');
      }
    } catch (error) {
      console.error('Error fetching webhook instructions:', error);
      toast.error('Failed to load webhook instructions');
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const markWebhookAsConfigured = async () => {
    if (!profile?.fid) return;
    
    setVerifying(true);
    try {
      // Try to get user identifier from parent component context or use FID
      const userIdentifier = profile.fid;
      
      const response = await fetch(
        `${config.backendUrl}/api/repositories/${userIdentifier}/repositories/${repository.id}/webhook-configured`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.ok) {
        setWebhookConfigured(true);
        setCurrentStep(4);
        toast.success('Webhook configured successfully! Repository is now active for rewards.');
        onWebhookConfigured?.();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to verify webhook configuration');
      }
    } catch (error) {
      console.error('Error marking webhook as configured:', error);
      toast.error('Failed to verify webhook configuration');
    }
    setVerifying(false);
  };

  const tryAutomaticSetup = async () => {
    if (!profile?.fid) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${config.backendUrl}/api/repositories/${profile.fid}/repositories/${repository.id}/fix-webhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.ok) {
        setWebhookConfigured(true);
        setCurrentStep(4);
        toast.success('Webhook configured automatically! Repository is now active for rewards.');
        onWebhookConfigured?.();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Automatic setup failed. Please use manual setup.');
        setCurrentStep(2); // Go to manual setup
      }
    } catch (error) {
      console.error('Error with automatic webhook setup:', error);
      toast.error('Automatic setup failed. Please use manual setup.');
      setCurrentStep(2);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-green-700/50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-1">🔗 Webhook Setup Required</h3>
              <p className="text-green-600 font-mono text-sm">
                Configure webhook for <span className="text-green-400">{repository.name}</span> to start earning rewards
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-green-600 hover:text-green-400 text-xl p-2"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-green-400 font-mono">Loading webhook instructions...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                {[
                  { step: 1, label: 'Setup Method', icon: '🔧' },
                  { step: 2, label: 'Configure Webhook', icon: '⚙️' },
                  { step: 3, label: 'Verify & Activate', icon: '✅' },
                  { step: 4, label: 'Complete', icon: '🎉' }
                ].map((item) => (
                  <div key={item.step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm border-2 ${
                      currentStep >= item.step 
                        ? 'bg-green-900/50 border-green-700/50 text-green-400' 
                        : 'bg-gray-900/50 border-gray-700/50 text-gray-400'
                    }`}>
                      {currentStep > item.step ? '✓' : item.icon}
                    </div>
                    <div className="ml-2 text-xs font-mono">
                      <div className={currentStep >= item.step ? 'text-green-400' : 'text-gray-400'}>
                        {item.label}
                      </div>
                    </div>
                    {item.step < 4 && (
                      <div className={`w-8 h-0.5 mx-4 ${
                        currentStep > item.step ? 'bg-green-700/50' : 'bg-gray-700/50'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Setup Method Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-blue-400 mb-3">🤖 Try Automatic Setup First</h4>
                    <p className="text-blue-600 font-mono text-sm mb-4">
                      We'll attempt to configure the webhook automatically using your GitHub permissions.
                    </p>
                    <button
                      onClick={tryAutomaticSetup}
                      disabled={loading}
                      className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 font-mono px-6 py-3 rounded-lg border border-blue-700/50 transition-all duration-300 hover:matrix-glow disabled:opacity-50"
                    >
                      {loading ? '🔄 Setting up...' : '🚀 Try Automatic Setup'}
                    </button>
                  </div>

                  <div className="text-center py-2">
                    <span className="text-green-600 font-mono text-sm">OR</span>
                  </div>

                  <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-green-400 mb-3">📋 Manual Setup</h4>
                    <p className="text-green-600 font-mono text-sm mb-4">
                      Follow step-by-step instructions to configure the webhook manually.
                    </p>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono px-6 py-3 rounded-lg border border-green-700/50 transition-all duration-300 hover:matrix-glow"
                    >
                      📖 Use Manual Setup
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Manual Configuration */}
              {currentStep === 2 && instructions && (
                <div className="space-y-6">
                  <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-mono font-semibold">Important</span>
                    </div>
                    <p className="text-yellow-600 font-mono text-sm">
                      You need admin access to <strong>{repository.name}</strong> to configure webhooks.
                    </p>
                  </div>

                  {/* Step 2.1: Open GitHub Settings */}
                  <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-green-400 mb-3">Step 1: Open GitHub Repository Settings</h4>
                    <p className="text-green-600 font-mono text-sm mb-4">
                      Click the button below to open your repository's webhook settings in a new tab.
                    </p>
                    <a
                      href={instructions.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gray-900/50 hover:bg-gray-900/70 text-gray-400 hover:text-gray-300 font-mono px-4 py-2 rounded-lg border border-gray-700/50 transition-all duration-300"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      Open {repository.name} → Settings → Webhooks
                    </a>
                  </div>

                  {/* Step 2.2: Add Webhook Configuration */}
                  <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-blue-400 mb-3">Step 2: Add New Webhook</h4>
                    <p className="text-blue-600 font-mono text-sm mb-4">
                      Click "Add webhook" and fill in the following configuration:
                    </p>

                    <div className="space-y-4">
                      {/* Payload URL */}
                      <div>
                        <label className="block text-blue-400 font-mono text-sm mb-2">Payload URL</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={instructions.payload_url}
                            readOnly
                            className="flex-1 bg-black/40 border border-blue-700/50 rounded px-3 py-2 text-blue-400 font-mono text-sm"
                          />
                          <button
                            onClick={() => copyToClipboard(instructions.payload_url, 'Payload URL')}
                            className={`p-2 rounded border transition-colors ${
                              copiedField === 'Payload URL'
                                ? 'bg-green-900/50 border-green-700/50 text-green-400'
                                : 'bg-blue-900/50 border-blue-700/50 text-blue-400 hover:bg-blue-900/70'
                            }`}
                          >
                            {copiedField === 'Payload URL' ? (
                              <CheckCircleIcon className="w-4 h-4" />
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Content Type */}
                      <div>
                        <label className="block text-blue-400 font-mono text-sm mb-2">Content type</label>
                        <div className="bg-black/40 border border-blue-700/50 rounded px-3 py-2 text-blue-400 font-mono text-sm">
                          {instructions.content_type}
                        </div>
                      </div>

                      {/* Secret */}
                      <div>
                        <label className="block text-blue-400 font-mono text-sm mb-2">Secret</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={instructions.secret}
                            readOnly
                            className="flex-1 bg-black/40 border border-blue-700/50 rounded px-3 py-2 text-blue-400 font-mono text-sm"
                          />
                          <button
                            onClick={() => copyToClipboard(instructions.secret, 'Secret')}
                            className={`p-2 rounded border transition-colors ${
                              copiedField === 'Secret'
                                ? 'bg-green-900/50 border-green-700/50 text-green-400'
                                : 'bg-blue-900/50 border-blue-700/50 text-blue-400 hover:bg-blue-900/70'
                            }`}
                          >
                            {copiedField === 'Secret' ? (
                              <CheckCircleIcon className="w-4 h-4" />
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Events */}
                      <div>
                        <label className="block text-blue-400 font-mono text-sm mb-2">Which events would you like to trigger this webhook?</label>
                        <div className="bg-black/40 border border-blue-700/50 rounded px-3 py-2 text-blue-400 font-mono text-sm">
                          ✓ Just the push event
                        </div>
                      </div>

                      {/* Active */}
                      <div>
                        <label className="block text-blue-400 font-mono text-sm mb-2">Active</label>
                        <div className="bg-black/40 border border-blue-700/50 rounded px-3 py-2 text-blue-400 font-mono text-sm">
                          ✓ {instructions.active ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-green-950/20 border border-green-700/50 rounded-lg">
                      <p className="text-green-400 font-mono text-sm">
                        💡 <strong>Pro tip:</strong> After filling in all fields, click "Add webhook" on GitHub, then come back here to verify.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="bg-gray-900/50 hover:bg-gray-900/70 text-gray-400 font-mono px-4 py-2 rounded-lg border border-gray-700/50 transition-all duration-300"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono px-6 py-2 rounded-lg border border-green-700/50 transition-all duration-300 hover:matrix-glow"
                    >
                      I've Added the Webhook →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Verification */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <h4 className="text-lg font-bold text-green-400 mb-3">Verify Webhook Configuration</h4>
                    <p className="text-green-600 font-mono text-sm mb-6">
                      Click the button below to verify that your webhook is properly configured and activate rewards for this repository.
                    </p>
                    
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="bg-gray-900/50 hover:bg-gray-900/70 text-gray-400 font-mono px-4 py-2 rounded-lg border border-gray-700/50 transition-all duration-300"
                      >
                        ← Back to Setup
                      </button>
                      <button
                        onClick={markWebhookAsConfigured}
                        disabled={verifying}
                        className="bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono px-6 py-2 rounded-lg border border-green-700/50 transition-all duration-300 hover:matrix-glow disabled:opacity-50"
                      >
                        {verifying ? '🔄 Verifying...' : '🚀 Activate Repository'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
                    <h5 className="text-blue-400 font-mono font-semibold mb-2">📋 Checklist</h5>
                    <div className="space-y-2 text-blue-600 font-mono text-sm">
                      <div>✓ Opened GitHub repository settings</div>
                      <div>✓ Clicked "Add webhook"</div>
                      <div>✓ Filled in payload URL, content type, and secret</div>
                      <div>✓ Selected "Just the push event"</div>
                      <div>✓ Ensured webhook is "Active"</div>
                      <div>✓ Clicked "Add webhook" on GitHub</div>
                      <div>✓ Saw green checkmark indicating success</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-8 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h4 className="text-2xl font-bold text-green-400 mb-3">Webhook Configured Successfully!</h4>
                    <p className="text-green-600 font-mono text-lg mb-6">
                      <span className="text-green-400">{repository.name}</span> is now active and will earn ABC tokens for every commit.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
                        <div className="text-blue-400 font-mono text-sm">Status</div>
                        <div className="text-blue-400 font-mono text-lg">🟢 Active</div>
                      </div>
                      <div className="bg-purple-950/20 border border-purple-700/50 rounded-lg p-4">
                        <div className="text-purple-400 font-mono text-sm">Webhook</div>
                        <div className="text-purple-400 font-mono text-lg">✅ Configured</div>
                      </div>
                      <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-4">
                        <div className="text-yellow-400 font-mono text-sm">Rewards</div>
                        <div className="text-yellow-400 font-mono text-lg">💰 Enabled</div>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="bg-green-900/50 hover:bg-green-900/70 text-green-400 font-mono px-8 py-3 rounded-lg border border-green-700/50 transition-all duration-300 hover:matrix-glow"
                    >
                      🚀 Start Coding & Earning!
                    </button>
                  </div>

                  <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-6">
                    <h5 className="text-blue-400 font-mono font-semibold mb-3">🎯 What happens next?</h5>
                    <div className="space-y-3 text-blue-600 font-mono text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-green-400">💻</span>
                        <span>Make commits to <strong>{repository.name}</strong></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-400">🤖</span>
                        <span>ABC bot will automatically detect and reward your commits</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-purple-400">📢</span>
                        <span>Get notified on Farcaster when you earn ABC tokens</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400">💰</span>
                        <span>Earn 50k-999k $ABC per commit based on quality and activity</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}