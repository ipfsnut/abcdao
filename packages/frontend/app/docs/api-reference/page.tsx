'use client';

import Link from 'next/link';

export default function APIReferencePage() {
  return (
    <div className="max-w-6xl">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚙️</span>
          <h1 className="text-4xl font-bold text-white">API Reference</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Comprehensive API documentation for developers building on top of ABC DAO or integrating with the reward system.
        </p>
      </div>

      {/* Base Information */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">🌐 Base Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Production Base URL</h3>
              <code className="text-green-400 bg-black/60 px-3 py-2 rounded block text-sm">
                https://abcdao-production.up.railway.app
              </code>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Health Check</h3>
              <code className="text-blue-400 bg-black/60 px-3 py-2 rounded block text-sm">
                GET /health
              </code>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">API Overview</h3>
              <code className="text-purple-400 bg-black/60 px-3 py-2 rounded block text-sm">
                GET /api
              </code>
              <p className="text-gray-400 text-sm mt-1">Returns all available endpoints</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">WebSocket</h3>
              <code className="text-yellow-400 bg-black/60 px-3 py-2 rounded block text-sm">
                ws://localhost:3001/realtime
              </code>
              <p className="text-gray-400 text-sm mt-1">Real-time updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Authentication */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🔐 Authentication & Users</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">GitHub OAuth</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">POST</span>
                    <code className="text-blue-400">/api/auth/github/authorize</code>
                  </div>
                  <p className="text-gray-400 text-sm">Generate GitHub OAuth URL for user authentication</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/auth/github/callback</code>
                  </div>
                  <p className="text-gray-400 text-sm">Handle GitHub OAuth callback</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Universal Authentication (Wallet-First)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">POST</span>
                    <code className="text-blue-400">/api/universal-auth/wallet</code>
                  </div>
                  <p className="text-gray-400 text-sm">Authenticate using wallet address</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">POST</span>
                    <code className="text-blue-400">/api/universal-auth/identify</code>
                  </div>
                  <p className="text-gray-400 text-sm">Smart authentication (auto-detect identifier)</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/universal-auth/profile</code>
                  </div>
                  <p className="text-gray-400 text-sm">Get current user profile</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">POST</span>
                    <code className="text-blue-400">/api/universal-auth/membership/purchase</code>
                  </div>
                  <p className="text-gray-400 text-sm">Process membership fee payment</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">User Data & Management</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/users/leaderboard</code>
                  </div>
                  <p className="text-gray-400 text-sm">Developer leaderboard with timeframe filtering</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/users/:fid/status</code>
                  </div>
                  <p className="text-gray-400 text-sm">User's link status and statistics</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/users/:fid/commits</code>
                  </div>
                  <p className="text-gray-400 text-sm">User's recent commit history</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/users/roster</code>
                  </div>
                  <p className="text-gray-400 text-sm">All active developers with pagination</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards & Commits */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">💰 Rewards & Commits</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/rewards/stats</code>
              </div>
              <p className="text-gray-400 text-sm">Overall reward system statistics</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/rewards/recent</code>
              </div>
              <p className="text-gray-400 text-sm">Recent reward activity with limit parameter</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/rewards/user/:fid</code>
              </div>
              <p className="text-gray-400 text-sm">User's rewards with PENDING/CLAIMABLE status</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/rewards/daily-stats</code>
              </div>
              <p className="text-gray-400 text-sm">Daily reward statistics for charts</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/user-actions/commits/daily-limit/:wallet</code>
              </div>
              <p className="text-gray-400 text-sm">Check user's daily commit limit status</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">POST</span>
                <code className="text-blue-400">/api/user-actions/commit</code>
              </div>
              <p className="text-gray-400 text-sm">Process commit action for rewards</p>
            </div>
          </div>
        </div>

        {/* Treasury & Staking */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🏦 Treasury & Staking</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Treasury Data</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/treasury/current</code>
                  </div>
                  <p className="text-gray-400 text-sm">Current treasury snapshot with balances</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/treasury-tiers/status</code>
                  </div>
                  <p className="text-gray-400 text-sm">Current reward tier based on treasury balance</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/treasury/history?days=30</code>
                  </div>
                  <p className="text-gray-400 text-sm">Historical treasury data</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/treasury/prices</code>
                  </div>
                  <p className="text-gray-400 text-sm">Current $ABC and ETH token prices</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Staking System</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/staking/overview</code>
                  </div>
                  <p className="text-gray-400 text-sm">Current staking metrics and APY</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/staking/position/:wallet</code>
                  </div>
                  <p className="text-gray-400 text-sm">User's staking position and rewards</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/staking/leaderboard</code>
                  </div>
                  <p className="text-gray-400 text-sm">Top stakers leaderboard</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">POST</span>
                    <code className="text-blue-400">/api/user-actions/staking</code>
                  </div>
                  <p className="text-gray-400 text-sm">Process staking actions (stake/unstake/claim)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Repository Management */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📁 Repository Management</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/repositories/:fid/repositories</code>
              </div>
              <p className="text-gray-400 text-sm">User's registered repositories</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">POST</span>
                <code className="text-blue-400">/api/repositories/:fid/repositories</code>
              </div>
              <p className="text-gray-400 text-sm">Register new repository</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/repositories/:fid/:repoId/webhook-instructions</code>
              </div>
              <p className="text-gray-400 text-sm">Get webhook setup instructions</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">POST</span>
                <code className="text-blue-400">/api/webhooks/github</code>
              </div>
              <p className="text-gray-400 text-sm">GitHub webhook handler (signature verified)</p>
            </div>
          </div>
        </div>

        {/* Treasury Automation */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🤖 Treasury Automation</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Token Statistics (Daily 2:00 PM UTC)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/abc-token-stats/current</code>
                  </div>
                  <p className="text-gray-400 text-sm">Real-time ABC token balances and statistics</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/abc-token-stats/history</code>
                  </div>
                  <p className="text-gray-400 text-sm">Historical token statistics updates</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Staking Statistics (Daily 10:00 AM UTC)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/abc-staking-stats/current</code>
                  </div>
                  <p className="text-gray-400 text-sm">Real-time staking data from blockchain</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/abc-staking-stats/history</code>
                  </div>
                  <p className="text-gray-400 text-sm">Historical staking statistics updates</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Clanker Claims (Daily 11:30 PM UTC)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/clanker-claims/history</code>
                  </div>
                  <p className="text-gray-400 text-sm">Clanker rewards claiming history</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                    <code className="text-green-400">/api/weth-unwraps/history</code>
                  </div>
                  <p className="text-gray-400 text-sm">WETH unwrapping transaction history</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🔍 System Health & Monitoring</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/system-health/overview</code>
              </div>
              <p className="text-gray-400 text-sm">Comprehensive health status of all systems</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/system-health/metrics</code>
              </div>
              <p className="text-gray-400 text-sm">Performance metrics for all data managers</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/blockchain-events/processing-status</code>
              </div>
              <p className="text-gray-400 text-sm">Blockchain event processing status</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">GET</span>
                <code className="text-green-400">/api/user-actions/realtime/stats</code>
              </div>
              <p className="text-gray-400 text-sm">Real-time WebSocket connection statistics</p>
            </div>
          </div>
        </div>

        {/* Authentication & Rate Limiting */}
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-yellow-300 mb-6">🔒 Authentication & Security</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-yellow-200 font-semibold mb-3">Public Endpoints</h3>
              <p className="text-yellow-100 text-sm mb-2">No authentication required:</p>
              <ul className="text-yellow-100 text-sm space-y-1">
                <li>• Health checks and system status</li>
                <li>• Public statistics and leaderboards</li>
                <li>• Market data and treasury information</li>
                <li>• Public repository and commit statistics</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-200 font-semibold mb-3">User Authentication</h3>
              <p className="text-yellow-100 text-sm mb-2">JWT token required for:</p>
              <ul className="text-yellow-100 text-sm space-y-1">
                <li>• User profile management and settings</li>
                <li>• Personal rewards and commit data</li>
                <li>• Repository registration and management</li>
                <li>• Staking position and user actions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-200 font-semibold mb-3">Admin Authentication</h3>
              <p className="text-yellow-100 text-sm mb-2">x-admin-key header required for:</p>
              <ul className="text-yellow-100 text-sm space-y-1">
                <li>• All <code className="bg-black/40 px-1 rounded">/api/admin/*</code> endpoints</li>
                <li>• Manual automation triggers</li>
                <li>• Treasury management functions</li>
                <li>• System administration operations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-200 font-semibold mb-3">Rate Limiting & Security</h3>
              <ul className="text-yellow-100 text-sm space-y-1">
                <li>• Repository registration: 3 max for standard users, unlimited for 5M+ ABC stakers</li>
                <li>• GitHub webhook signature verification required</li>
                <li>• Daily commit limits: 10 commits per user per day</li>
                <li>• Weekly priority tag limits: 5 uses per tag type</li>
                <li>• Real-time WebSocket connection monitoring</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Example Usage */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📝 Example Usage</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-3">Get User Leaderboard</h3>
              <div className="bg-black/60 rounded-lg p-4">
                <code className="text-green-400 text-sm">
                  curl https://abcdao-production.up.railway.app/api/users/leaderboard?timeframe=week&limit=10
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">Check Treasury Status</h3>
              <div className="bg-black/60 rounded-lg p-4">
                <code className="text-green-400 text-sm">
                  curl https://abcdao-production.up.railway.app/api/treasury-tiers/status
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">Get Current Staking Data</h3>
              <div className="bg-black/60 rounded-lg p-4">
                <code className="text-green-400 text-sm">
                  curl https://abcdao-production.up.railway.app/api/staking/overview
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">Manual Trigger (Admin Only)</h3>
              <div className="bg-black/60 rounded-lg p-4">
                <code className="text-yellow-400 text-sm">
                  curl -X POST https://abcdao-production.up.railway.app/api/abc-token-stats/trigger \<br/>
                  &nbsp;&nbsp;-H "x-admin-key: $ADMIN_SECRET"
                </code>
              </div>
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
              <p className="text-gray-400 text-sm">Complete setup guide for new users</p>
            </Link>
            
            <Link
              href="/docs/rewards-system"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">💰 Rewards System</h4>
              <p className="text-gray-400 text-sm">Understanding reward calculations and commit tags</p>
            </Link>
            
            <Link
              href="/docs/repository-setup"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">📁 Repository Setup</h4>
              <p className="text-gray-400 text-sm">Configure webhooks and register repositories</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}