'use client';

import Link from 'next/link';

export default function CommitTagsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🏷️</span>
          <h1 className="text-4xl font-bold text-white">Commit Tags</h1>
        </div>
        <p className="text-xl text-gray-300 leading-relaxed">
          Master commit tags to control reward behavior, multipliers, and optimize your earnings from every commit.
        </p>
      </div>

      {/* Quick Reference */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">🚀 Quick Tag Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 border border-green-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">#priority</div>
            <div className="text-sm text-gray-400">1.5x reward multiplier</div>
          </div>
          <div className="bg-black/40 border border-purple-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-400">#milestone</div>
            <div className="text-sm text-gray-400">1.5x reward multiplier</div>
          </div>
          <div className="bg-black/40 border border-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-400">#silent</div>
            <div className="text-sm text-gray-400">Skip announcements</div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* What are Commit Tags */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">💡 What are Commit Tags?</h2>
          
          <div className="space-y-4">
            <p className="text-gray-300 text-lg">
              Commit tags are special keywords you add to your commit messages to control how ABC DAO processes your commits. 
              They can multiply rewards, skip announcements, or modify other behaviors.
            </p>
            
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">How Tags Work</h3>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Case-insensitive:</strong> #Priority, #PRIORITY, and #priority all work the same</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Placement flexible:</strong> Tags can be anywhere in your commit message</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Multiple tags:</strong> You can use multiple tags in one commit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Automatic detection:</strong> System automatically parses and applies tag effects</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h3 className="text-blue-300 font-semibold mb-3">📝 Example Usage</h3>
              <div className="space-y-2">
                <div className="bg-black/40 rounded p-3">
                  <code className="text-green-300 text-sm">git commit -m "Fix critical authentication bug #priority"</code>
                </div>
                <div className="bg-black/40 rounded p-3">
                  <code className="text-purple-300 text-sm">git commit -m "Complete user dashboard #milestone #silent"</code>
                </div>
                <div className="bg-black/40 rounded p-3">
                  <code className="text-gray-400 text-sm">git commit -m "Update README formatting #norew"</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reward Multiplier Tags */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🚀 Reward Multiplier Tags</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-green-600 text-white px-3 py-2 rounded text-sm font-mono">#priority</span>
                <span className="text-green-400 font-semibold text-lg">1.5x Reward Multiplier</span>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-300">
                  Use for important features, urgent fixes, or high-impact work that deserves extra recognition.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">✅ Good Uses:</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Critical bug fixes</li>
                      <li>• Security vulnerabilities</li>
                      <li>• Performance optimizations</li>
                      <li>• Important feature implementations</li>
                      <li>• Breaking changes or major refactors</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-medium mb-2">❌ Avoid For:</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Minor formatting changes</li>
                      <li>• Documentation updates</li>
                      <li>• Typo fixes</li>
                      <li>• Routine maintenance</li>
                      <li>• Test file updates</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-black/40 rounded p-3">
                  <h4 className="text-green-400 font-semibold mb-2">Example Usage:</h4>
                  <div className="space-y-1">
                    <code className="text-green-300 text-sm block">git commit -m "Fix memory leak in user session handling #priority"</code>
                    <code className="text-green-300 text-sm block">git commit -m "Implement OAuth2 authentication #priority"</code>
                    <code className="text-green-300 text-sm block">git commit -m "URGENT: Patch SQL injection vulnerability #priority"</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-purple-600 text-white px-3 py-2 rounded text-sm font-mono">#milestone</span>
                <span className="text-purple-400 font-semibold text-lg">1.5x Reward Multiplier</span>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-300">
                  Reserved for major feature completions, project milestones, or significant achievements that mark important progress.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">✅ Perfect For:</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Completing major features</li>
                      <li>• Reaching version releases</li>
                      <li>• Integration completions</li>
                      <li>• Architecture overhauls</li>
                      <li>• MVP launches</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-yellow-400 font-medium mb-2">⚠️ Use Sparingly:</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Limited to 5 uses per week</li>
                      <li>• Save for truly significant work</li>
                      <li>• Not for incremental progress</li>
                      <li>• Team should agree on what qualifies</li>
                      <li>• Track usage to avoid hitting limit</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-black/40 rounded p-3">
                  <h4 className="text-purple-400 font-semibold mb-2">Example Usage:</h4>
                  <div className="space-y-1">
                    <code className="text-purple-300 text-sm block">git commit -m "Complete user authentication system #milestone"</code>
                    <code className="text-purple-300 text-sm block">git commit -m "Launch v2.0 with new dashboard #milestone"</code>
                    <code className="text-purple-300 text-sm block">git commit -m "Finish blockchain integration #milestone"</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-orange-600 text-white px-3 py-2 rounded text-sm font-mono">#experiment</span>
                <span className="text-orange-400 font-semibold text-lg">0.8x Reward Multiplier</span>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-300">
                  For experimental features, proof-of-concepts, or exploratory work that may not make it to production.
                </p>
                
                <div className="bg-black/40 rounded p-3">
                  <h4 className="text-orange-400 font-semibold mb-2">Example Usage:</h4>
                  <div className="space-y-1">
                    <code className="text-orange-300 text-sm block">git commit -m "Test new API integration approach #experiment"</code>
                    <code className="text-orange-300 text-sm block">git commit -m "Prototype AI-powered search #experiment"</code>
                    <code className="text-orange-300 text-sm block">git commit -m "POC: WebRTC implementation #experiment"</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Tags */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">⚙️ Control Tags</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-gray-600 text-white px-3 py-2 rounded text-sm font-mono">#silent</span>
                <span className="text-gray-400 font-semibold">Skip Farcaster Announcements</span>
              </div>
              <p className="text-gray-300 mb-3">
                Earn rewards normally but skip the public Farcaster announcement. Perfect for minor updates, 
                documentation changes, or when you don't want to spam the feed.
              </p>
              <div className="bg-black/40 rounded p-3">
                <code className="text-gray-400 text-sm">git commit -m "Update documentation formatting #silent"</code>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-gray-600 text-white px-3 py-2 rounded text-sm font-mono">#private</span>
                <span className="text-gray-400 font-semibold">Hide from Public Leaderboards</span>
              </div>
              <p className="text-gray-300 mb-3">
                Earn rewards but exclude this commit from public leaderboards and statistics. 
                Useful for internal work or sensitive commits.
              </p>
              <div className="bg-black/40 rounded p-3">
                <code className="text-gray-400 text-sm">git commit -m "Internal refactoring for next sprint #private"</code>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-red-600 text-white px-3 py-2 rounded text-sm font-mono">#norew</span>
                <span className="text-red-400 font-semibold">Skip Rewards Entirely</span>
              </div>
              <p className="text-gray-300 mb-3">
                Don't generate any rewards for this commit. Use for administrative tasks, 
                config changes, or commits that shouldn't count toward earnings.
              </p>
              <div className="bg-black/40 rounded p-3">
                <code className="text-red-300 text-sm">git commit -m "Update CI configuration #norew"</code>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-mono">#devon / #devoff</span>
                <span className="text-blue-400 font-semibold">Developer Status Control</span>
              </div>
              <p className="text-gray-300 mb-3">
                Special administrative tags to enable or disable developer status. 
                Typically used by administrators or for account management.
              </p>
              <div className="bg-black/40 rounded p-3">
                <div className="space-y-1">
                  <code className="text-blue-300 text-sm block">git commit -m "Enable rewards for new contributor #devon"</code>
                  <code className="text-blue-300 text-sm block">git commit -m "Temporary disable during migration #devoff"</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Limits & Strategy */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📊 Weekly Limits & Strategy</h2>
          
          <div className="space-y-6">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <h3 className="text-yellow-300 font-semibold mb-3">⚠️ Important Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Weekly Multiplier Limits</h4>
                  <ul className="text-yellow-100 text-sm space-y-1">
                    <li>• <strong>5 #priority tags per week</strong></li>
                    <li>• <strong>5 #milestone tags per week</strong></li>
                    <li>• Week runs Monday to Monday</li>
                    <li>• Limits reset every Monday at 00:00 UTC</li>
                    <li>• Exceeding limits downgrades to normal rewards</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">No Limits</h4>
                  <ul className="text-yellow-100 text-sm space-y-1">
                    <li>• #silent, #private, #norew - unlimited</li>
                    <li>• #experiment - unlimited</li>
                    <li>• #devon, #devoff - administrative</li>
                    <li>• Regular commits without tags</li>
                    <li>• Multiple tags in one commit</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <h3 className="text-green-300 font-semibold mb-3">🎯 Strategic Usage Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Maximize Your Rewards</h4>
                  <ul className="text-green-100 text-sm space-y-1">
                    <li>• Plan your week: identify 5 priority-worthy commits</li>
                    <li>• Save milestone tags for truly major completions</li>
                    <li>• Combine tags: #milestone #silent for big internal work</li>
                    <li>• Track your usage to avoid waste</li>
                    <li>• Coordinate with team to avoid conflicts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Best Practices</h4>
                  <ul className="text-green-100 text-sm space-y-1">
                    <li>• Use #silent for documentation and minor fixes</li>
                    <li>• Reserve #priority for genuinely urgent work</li>
                    <li>• #milestone should feel like a celebration</li>
                    <li>• Don't waste tags on trivial commits</li>
                    <li>• Consider team impact when using multipliers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Usage */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">🧠 Advanced Tag Strategies</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">🔗 Combining Tags</h3>
              <p className="text-gray-300 mb-3">
                You can use multiple tags in a single commit to combine their effects:
              </p>
              <div className="space-y-2">
                <div className="bg-black/40 rounded p-3">
                  <code className="text-green-300 text-sm">git commit -m "Complete API v2 migration #milestone #silent"</code>
                  <p className="text-gray-400 text-xs mt-1">→ 1.5x rewards, no Farcaster announcement</p>
                </div>
                <div className="bg-black/40 rounded p-3">
                  <code className="text-blue-300 text-sm">git commit -m "Fix auth security issue #priority #private"</code>
                  <p className="text-gray-400 text-xs mt-1">→ 1.5x rewards, hidden from leaderboards</p>
                </div>
                <div className="bg-black/40 rounded p-3">
                  <code className="text-orange-300 text-sm">git commit -m "Test new blockchain integration #experiment #silent"</code>
                  <p className="text-gray-400 text-xs mt-1">→ 0.8x rewards, no announcement</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">📈 Team Coordination</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">For Team Leads</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Establish team tag usage guidelines</li>
                    <li>• Track weekly multiplier usage</li>
                    <li>• Define what qualifies as #milestone</li>
                    <li>• Coordinate on important releases</li>
                    <li>• Share tag strategies with new members</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">For Contributors</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Communicate before using #milestone</li>
                    <li>• Don't compete for multiplier tags</li>
                    <li>• Ask when unsure about tag appropriateness</li>
                    <li>• Share knowledge about tag effects</li>
                    <li>• Focus on quality over tag optimization</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">🎮 Gamification Elements</h3>
              <p className="text-gray-300 mb-3">
                Tag usage adds strategic depth to your development workflow:
              </p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Resource Management:</strong> Limited weekly multipliers create strategic decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Planning Rewards:</strong> Encourages thoughtful commit organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Quality Focus:</strong> Makes you consider the impact of each commit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>Milestone Celebration:</strong> #milestone tags mark real achievements</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Documentation */}
        <div className="border-t border-gray-700 pt-8">
          <h3 className="text-lg font-semibold text-white mb-4">📚 Related Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/docs/rewards-system"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">💰 Rewards System</h4>
              <p className="text-gray-400 text-sm">Understanding reward calculations and treasury tiers</p>
            </Link>
            
            <Link
              href="/docs/getting-started"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">🚀 Getting Started</h4>
              <p className="text-gray-400 text-sm">Complete setup guide from registration to first rewards</p>
            </Link>
            
            <Link
              href="/docs/troubleshooting"
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <h4 className="text-white font-semibold mb-2">🛠️ Troubleshooting</h4>
              <p className="text-gray-400 text-sm">Common issues and solutions for tag usage</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}