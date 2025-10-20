'use client';

import Link from 'next/link';

export default function RepositorySetupPage() {
  return (
    <div className="max-w-5xl">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📁</span>
          <h1 className="text-4xl font-bold text-white">Repository Setup Guide</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Comprehensive guide for repository owners to set up ABC DAO integration and enable 
          automatic $ABC token rewards for contributors.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">📋 Prerequisites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">ABC DAO Membership</p>
                <p className="text-gray-400 text-sm">Paid 0.002 ETH membership fee or 5M+ $ABC staked</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">GitHub Account Linked</p>
                <p className="text-gray-400 text-sm">Connected to ABC DAO with proper permissions</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Repository Admin Access</p>
                <p className="text-gray-400 text-sm">Admin permissions required for webhook configuration</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <div>
                <p className="text-white font-medium">Active Development</p>
                <p className="text-gray-400 text-sm">Regular commits to make rewards meaningful</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Repository Registration */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🏗️ Repository Registration Process</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                <h3 className="text-xl font-semibold text-white">Access Repository Manager</h3>
              </div>
              
              <div className="ml-12 space-y-3">
                <p className="text-gray-300">Navigate to the repository management section in your ABC DAO dashboard.</p>
                <div className="bg-black/40 rounded p-3">
                  <ol className="text-gray-300 text-sm space-y-1">
                    <li>1. Log into ABC DAO app with your connected wallet</li>
                    <li>2. Go to "Repository Manager" or "Repositories" section</li>
                    <li>3. Click "Add Repository" or "Register New Repository"</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                <h3 className="text-xl font-semibold text-white">Repository Information</h3>
              </div>
              
              <div className="ml-12 space-y-3">
                <p className="text-gray-300">Enter your repository details for registration.</p>
                <div className="bg-black/40 rounded p-3">
                  <h4 className="text-green-400 font-semibold mb-2">Required Information:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• <strong>Repository Name:</strong> Format: <code className="bg-black/60 px-1 rounded">username/repository-name</code></li>
                    <li>• <strong>Repository Type:</strong> Public or Private (both supported)</li>
                    <li>• <strong>Primary Language:</strong> Main programming language used</li>
                    <li>• <strong>Description:</strong> Brief description of the project (optional)</li>
                  </ul>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
                  <p className="text-yellow-200 text-sm">
                    <strong>Repository Limits:</strong> Standard users can register up to 3 repositories. 
                    Users with 5M+ staked $ABC get unlimited registrations.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <h3 className="text-xl font-semibold text-white">Verification & Approval</h3>
              </div>
              
              <div className="ml-12 space-y-3">
                <p className="text-gray-300">ABC DAO verifies your repository access and approves registration.</p>
                <div className="bg-black/40 rounded p-3">
                  <h4 className="text-green-400 font-semibold mb-2">Verification Process:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• System checks your admin access to the repository</li>
                    <li>• Validates repository exists and is accessible</li>
                    <li>• Confirms your GitHub account has proper permissions</li>
                    <li>• Repository status shows as "Pending" during verification</li>
                    <li>• Approval typically takes 1-2 minutes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🔗 Webhook Configuration</h2>
          
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <h3 className="text-yellow-300 font-semibold mb-2">🔒 Security First Approach</h3>
              <p className="text-yellow-100 text-sm">
                ABC DAO uses manual webhook setup for security. This prevents unauthorized access to your repositories 
                while ensuring commit tracking works properly. The setup only takes 2-3 minutes.
              </p>
            </div>

            {/* Webhook Setup Steps */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">⚙️ GitHub Webhook Setup</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-blue-400 font-medium mb-2">Step 1: Access Repository Settings</h4>
                  <ol className="text-gray-300 text-sm space-y-1">
                    <li>1. Go to your repository on GitHub</li>
                    <li>2. Click the "Settings" tab (requires admin access)</li>
                    <li>3. Scroll down to "Webhooks" in the left sidebar</li>
                    <li>4. Click "Add webhook"</li>
                  </ol>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-green-400 font-medium mb-2">Step 2: Configure Webhook Settings</h4>
                  <div className="bg-black/40 rounded p-3">
                    <h5 className="text-green-400 font-semibold mb-2">Required Configuration:</h5>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400">Payload URL:</p>
                          <code className="text-green-300 bg-black/60 px-2 py-1 rounded block text-xs">
                            https://abcdao-production.up.railway.app/api/webhooks/github
                          </code>
                        </div>
                        <div>
                          <p className="text-gray-400">Content type:</p>
                          <code className="text-green-300 bg-black/60 px-2 py-1 rounded">application/json</code>
                        </div>
                        <div>
                          <p className="text-gray-400">Secret:</p>
                          <code className="text-green-300 bg-black/60 px-2 py-1 rounded text-xs">
                            [Provided in ABC DAO interface]
                          </code>
                        </div>
                        <div>
                          <p className="text-gray-400">Events:</p>
                          <code className="text-green-300 bg-black/60 px-2 py-1 rounded">Just the push event</code>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-gray-400">Active:</p>
                        <p className="text-green-300">✅ Must be checked</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="text-purple-400 font-medium mb-2">Step 3: Get Webhook Secret</h4>
                  <p className="text-gray-300 text-sm mb-2">ABC DAO provides a unique secret for each repository:</p>
                  <ol className="text-gray-300 text-sm space-y-1">
                    <li>1. In ABC DAO, go to your repository settings</li>
                    <li>2. Click "Get Webhook Instructions" or "Webhook Setup"</li>
                    <li>3. Copy the provided webhook secret</li>
                    <li>4. Paste it into the "Secret" field in GitHub</li>
                  </ol>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="text-yellow-400 font-medium mb-2">Step 4: Save & Test</h4>
                  <ol className="text-gray-300 text-sm space-y-1">
                    <li>1. Click "Add webhook" in GitHub</li>
                    <li>2. GitHub will show a green checkmark if successful</li>
                    <li>3. Return to ABC DAO and mark webhook as "Configured"</li>
                    <li>4. Make a test commit to verify tracking</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">🛠️ Webhook Troubleshooting</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="text-red-400 font-medium mb-2">❌ Common Issues</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• <strong>Wrong URL:</strong> Ensure you use the exact ABC DAO webhook URL</li>
                    <li>• <strong>Missing Secret:</strong> Must use the repository-specific secret from ABC DAO</li>
                    <li>• <strong>Wrong Events:</strong> Select "Just the push event" only</li>
                    <li>• <strong>Content Type:</strong> Must be "application/json", not "application/x-www-form-urlencoded"</li>
                    <li>• <strong>Inactive Webhook:</strong> Ensure "Active" checkbox is checked</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-blue-400 font-medium mb-2">🔍 Testing Your Webhook</h4>
                  <ol className="text-gray-300 text-sm space-y-1">
                    <li>1. Make a small commit to your repository</li>
                    <li>2. Check GitHub webhook "Recent Deliveries" tab</li>
                    <li>3. Look for 200 OK response from ABC DAO</li>
                    <li>4. Verify commit appears in ABC DAO dashboard</li>
                    <li>5. Check that rewards are generated (if eligible)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Configuration */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">⚙️ Advanced Configuration</h2>
          
          <div className="space-y-6">
            {/* Partner Program */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">🤝 Partner Program Application</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-blue-400 font-medium mb-3">Partner Benefits</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Unlimited repository registrations</li>
                    <li>• Priority support and assistance</li>
                    <li>• Custom reward structures (case-by-case)</li>
                    <li>• Enhanced integration features</li>
                    <li>• Early access to new features</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-blue-400 font-medium mb-3">Application Requirements</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Active open-source project</li>
                    <li>• Regular contribution activity</li>
                    <li>• Community engagement and growth</li>
                    <li>• Alignment with ABC DAO mission</li>
                    <li>• Minimum repository quality standards</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-900/20 border border-blue-700/50 rounded p-3">
                <p className="text-blue-200 text-sm">
                  Interested in becoming a partner? Contact <a href="https://warpcast.com/abc-dao-dev" target="_blank" className="text-blue-400 hover:text-blue-300">@abc-dao-dev</a> on Farcaster 
                  or submit a partner application through the ABC DAO interface.
                </p>
              </div>
            </div>

            {/* Premium Staking */}
            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-700/50 rounded-lg p-4">
              <h3 className="text-yellow-300 font-semibold mb-4">⭐ Premium Staking Benefits</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-yellow-200 font-medium mb-3">Unlock with 5M+ $ABC Staked</h4>
                  <ul className="text-yellow-100 text-sm space-y-1">
                    <li>• <strong>Unlimited repositories:</strong> No 3-repo limit</li>
                    <li>• <strong>No additional fees:</strong> Skip 0.002 ETH per repo</li>
                    <li>• <strong>Same reward structure:</strong> Standard limits still apply</li>
                    <li>• <strong>Priority processing:</strong> Faster webhook verification</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-yellow-200 font-medium mb-3">How to Qualify</h4>
                  <ol className="text-yellow-100 text-sm space-y-1">
                    <li>1. Acquire 5M+ $ABC tokens</li>
                    <li>2. Stake them in the ABC DAO staking contract</li>
                    <li>3. Connect same wallet to ABC DAO</li>
                    <li>4. Premium status activates automatically</li>
                    <li>5. Benefits persist while staked</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Link 
                  href="/staking" 
                  className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Learn About Staking →
                </Link>
              </div>
            </div>

            {/* API Integration */}
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">🔌 API Integration</h3>
              
              <p className="text-gray-300 text-sm mb-4">
                For automated repository management or custom integrations, use the ABC DAO API endpoints:
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-black/40 rounded p-3">
                  <h4 className="text-green-400 font-medium mb-2">Repository Management</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• <code className="text-green-400 bg-black/60 px-1 rounded text-xs">GET /api/repositories/:fid/repositories</code></li>
                    <li>• <code className="text-blue-400 bg-black/60 px-1 rounded text-xs">POST /api/repositories/:fid/repositories</code></li>
                    <li>• <code className="text-green-400 bg-black/60 px-1 rounded text-xs">GET /api/repositories/:fid/:repoId/webhook-instructions</code></li>
                  </ul>
                </div>
                <div className="bg-black/40 rounded p-3">
                  <h4 className="text-purple-400 font-medium mb-2">Webhook Processing</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• <code className="text-blue-400 bg-black/60 px-1 rounded text-xs">POST /api/webhooks/github</code></li>
                    <li>• <code className="text-blue-400 bg-black/60 px-1 rounded text-xs">POST /api/repositories/:fid/:repoId/webhook-configured</code></li>
                    <li>• <code className="text-green-400 bg-black/60 px-1 rounded text-xs">GET /api/rewards/repositories</code></li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4">
                <Link 
                  href="/docs/api-reference" 
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View Complete API Documentation →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">💡 Best Practices & Optimization</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-4">🎯 Repository Selection</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Active Development:</strong> Choose repositories with regular commits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Meaningful Work:</strong> Quality over quantity for commits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Team Coordination:</strong> Ensure all contributors know about ABC DAO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Admin Access:</strong> Maintain admin permissions for webhook management</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">⚡ Performance Tips</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong>Webhook Monitoring:</strong> Check GitHub webhook deliveries regularly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong>Commit Tags:</strong> Use #priority and #milestone strategically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong>Branch Strategy:</strong> Main/master branch commits are tracked</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong>Status Monitoring:</strong> Watch for repository status changes</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-green-900/20 border border-green-700/50 rounded-lg p-4">
            <h3 className="text-green-300 font-semibold mb-3">✅ Success Checklist</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ul className="text-green-100 text-sm space-y-1">
                <li>• ✅ Repository registered in ABC DAO</li>
                <li>• ✅ Webhook configured with correct URL</li>
                <li>• ✅ Repository-specific secret set</li>
                <li>• ✅ "Push events only" selected</li>
              </ul>
              <ul className="text-green-100 text-sm space-y-1">
                <li>• ✅ Webhook marked as configured in ABC DAO</li>
                <li>• ✅ Test commit generates rewards</li>
                <li>• ✅ GitHub shows successful webhook deliveries</li>
                <li>• ✅ Repository status shows "Active"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Documentation */}
        <div className="border-t border-gray-700 pt-8">
          <h3 className="text-lg font-semibold text-white mb-4">📚 Related Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/docs/getting-started"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">🚀 Getting Started</h4>
              <p className="text-gray-400 text-sm">Complete setup guide from registration to first rewards</p>
            </Link>
            
            <Link
              href="/docs/rewards-system"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">💰 Rewards System</h4>
              <p className="text-gray-400 text-sm">Understanding reward calculations and commit tags</p>
            </Link>
            
            <Link
              href="/docs/troubleshooting"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">🛠️ Troubleshooting</h4>
              <p className="text-gray-400 text-sm">Common setup issues and how to resolve them</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}