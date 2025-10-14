'use client';

import { useState } from 'react';
// Using emojis instead of lucide-react icons to avoid dependency

export function RepositoryIntegrationButton() {
  const [isOpen, setIsOpen] = useState(false);

  const downloadGuide = () => {
    // Create a blob with the guide content
    const guideContent = `# ABC DAO Repository Integration Guide

## 🎯 Enable $ABC Rewards for Your Repository

This guide shows repository owners how to integrate with ABC DAO's reward system to automatically reward contributors with $ABC tokens for their commits.

## 📋 Prerequisites

### For Repository Owners:
- Repository must be **public** on GitHub
- Admin access to repository settings
- ABC DAO webhook secret (contact team)

### For Contributors:
- Must be ABC DAO members (paid membership + GitHub linked)
- GitHub account linked at https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao

## ⚙️ Setup Instructions

### Step 1: Add ABC DAO Webhook

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Webhooks**
3. Click **Add webhook**
4. Configure the webhook:

\`\`\`
Payload URL: https://abcdao-production.up.railway.app/api/webhooks/github
Content type: application/json
Secret: [Contact ABC DAO team for webhook secret]
Events: Select "Push events"
Active: ✅ Checked
\`\`\`

5. Click **Add webhook**

### Step 2: Verify Integration

After setup, make a test commit. If successful, you should see:
- ✅ Webhook delivery in GitHub webhook logs  
- ✅ Bot cast on Farcaster announcing the commit (if contributor is ABC DAO member)
- ✅ Reward recorded in ABC DAO system

## 💰 How Rewards Work

### Automatic Reward Calculation
- **Base reward**: Calculated per commit
- **Bonus multipliers**: Applied for priority commits, quality contributions
- **Distribution**: Rewards added to contributor's claimable balance

### Commit Tags (Optional)
Contributors can add special tags to commit messages for bonus rewards:

\`\`\`bash
git commit -m "Fix user authentication bug #priority"
git commit -m "Add new feature #milestone" 
git commit -m "Update documentation #docs"
\`\`\`

### Bot Announcements
When ABC DAO members commit to integrated repositories:
- 🤖 **Bot posts on Farcaster** announcing the contribution
- 📊 **Reward amount** is publicly displayed
- 🔗 **Links** to commit and contributor profile

## 👥 Member Management

### Current ABC DAO Members
Contributors with GitHub linked and ready to earn rewards:
- **4 active developers** currently earning rewards
- **3 pending members** need to complete GitHub linking

### Adding New Contributors
1. **Join ABC DAO**: Pay 0.002 ETH membership fee
2. **Link GitHub**: Connect account at ABC DAO miniapp
3. **Start contributing**: Commits to integrated repos automatically earn rewards

## 🔧 Technical Details

### Webhook Events Processed
- **Push events**: New commits to main/master branches
- **Commit data**: Author, message, repository, timestamp
- **Filtering**: Only processes commits from ABC DAO members

### Reward Calculation Factors
- **Commit size**: Lines changed, files modified
- **Repository importance**: Multiplier based on project significance  
- **Contribution quality**: Manual review for bonus rewards
- **Time factors**: Recent activity bonuses

### Smart Contract Integration
- **$ABC Token**: ERC-20 token on Base blockchain
- **Reward distribution**: Automated through smart contracts
- **Claiming**: Contributors claim accumulated rewards via interface

## 📞 Support & Contact

### Getting Started
- **Webhook secret**: Contact ABC DAO team on Farcaster
- **Integration help**: Ask in ABC DAO channels
- **Technical issues**: Report via GitHub or Farcaster

### For Contributors
- **Join ABC DAO**: https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao
- **Check rewards**: View earned balance in miniapp
- **Claim tokens**: Use built-in claiming interface

## 📊 Repository Benefits

### For Project Owners
- ✅ **Incentivized contributions** from ABC DAO community
- ✅ **Automatic contributor rewards** without manual overhead
- ✅ **Social promotion** via bot casts on Farcaster
- ✅ **Quality developers** attracted by reward system

### For Contributors  
- ✅ **Earn $ABC tokens** for valuable contributions
- ✅ **Recognition** through public bot announcements
- ✅ **Governance participation** in ABC DAO decisions
- ✅ **Staking rewards** by holding $ABC tokens

## 🚀 Example Integration

### Sample Repository Setup
\`\`\`bash
# Repository: awesome-project
# Owner: alice
# Webhook: ✅ Configured
# ABC DAO member: bob (GitHub: @bob-dev)

# Bob makes a commit:
git commit -m "Add new API endpoint #priority"
git push origin main

# Results:
# 1. Webhook triggers ABC DAO backend
# 2. System recognizes @bob-dev as ABC DAO member  
# 3. Calculates reward (base + priority bonus)
# 4. Bot posts: "🎉 @bob earned 150 $ABC for priority commit to awesome-project!"
# 5. Reward added to Bob's claimable balance
\`\`\`

## 🎯 Next Steps

1. **Contact ABC DAO team** for webhook secret
2. **Add webhook** to your repository
3. **Test integration** with a commit
4. **Promote to contributors** about ABC DAO membership benefits
5. **Monitor rewards** and celebrate your contributors!

---

**Ready to reward your contributors? Set up ABC DAO integration today!**

*Contact: ABC DAO team on Farcaster | Miniapp: https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao*`;

    const blob = new Blob([guideContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'abc-dao-repository-integration-guide.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 px-3 py-1.5 rounded-lg font-mono text-xs sm:text-sm transition-all duration-300 hover:matrix-glow flex items-center gap-2"
      >
        <span>📖</span>
        <span className="hidden sm:inline">Repository Integration</span>
        <span className="sm:hidden">Repo Guide</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-blue-900/50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-blue-900/50">
              <h2 className="text-lg font-bold text-blue-400 font-mono">
                📖 Repository Integration Guide
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blue-400 hover:text-blue-300 p-1 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={downloadGuide}
                    className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 p-4 rounded-lg font-mono transition-all duration-300 hover:matrix-glow flex items-center gap-3"
                  >
                    <span className="text-xl">📥</span>
                    <div className="text-left">
                      <div className="font-bold">Download Guide</div>
                      <div className="text-xs text-blue-300">Full integration instructions</div>
                    </div>
                  </button>
                  
                  <a
                    href="https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-900/50 hover:bg-green-900/70 text-green-400 border border-green-700/50 p-4 rounded-lg font-mono transition-all duration-300 hover:matrix-glow flex items-center gap-3"
                  >
                    <span className="text-xl">🔗</span>
                    <div className="text-left">
                      <div className="font-bold">Join ABC DAO</div>
                      <div className="text-xs text-green-300">Start earning rewards</div>
                    </div>
                  </a>
                </div>

                {/* Benefits Overview */}
                <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-4">
                  <h3 className="text-blue-400 font-mono font-bold mb-3">🎯 Integration Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-blue-300 font-mono font-semibold mb-2">For Repository Owners:</h4>
                      <ul className="space-y-1 text-blue-200 font-mono text-xs">
                        <li>→ Attract quality contributors</li>
                        <li>→ Automatic reward distribution</li>
                        <li>→ Social promotion on Farcaster</li>
                        <li>→ Zero maintenance overhead</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-blue-300 font-mono font-semibold mb-2">For Contributors:</h4>
                      <ul className="space-y-1 text-blue-200 font-mono text-xs">
                        <li>→ Earn $ABC tokens per commit</li>
                        <li>→ Public recognition via bot</li>
                        <li>→ Governance participation</li>
                        <li>→ Staking rewards on holdings</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Setup */}
                <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-4">
                  <h3 className="text-green-400 font-mono font-bold mb-3">⚙️ Quick Setup</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 font-mono font-bold">1.</span>
                      <div>
                        <p className="text-green-300 font-mono font-semibold">Add Webhook</p>
                        <p className="text-green-200 font-mono text-xs">GitHub → Settings → Webhooks → Add webhook</p>
                        <code className="text-green-400 font-mono text-xs bg-black/40 px-2 py-1 rounded">
                          https://abcdao-production.up.railway.app/api/webhooks/github
                        </code>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 font-mono font-bold">2.</span>
                      <div>
                        <p className="text-green-300 font-mono font-semibold">Get Webhook Secret</p>
                        <p className="text-green-200 font-mono text-xs">Contact ABC DAO team on Farcaster for secret</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-600 font-mono font-bold">3.</span>
                      <div>
                        <p className="text-green-300 font-mono font-semibold">Test Integration</p>
                        <p className="text-green-200 font-mono text-xs">Make a commit and watch for bot cast</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Membership Tiers */}
                <div className="bg-purple-950/20 border border-purple-700/50 rounded-lg p-4">
                  <h3 className="text-purple-400 font-mono font-bold mb-3">💼 Membership Tiers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-950/20 border border-green-700/50 rounded-lg p-3">
                      <h4 className="text-green-400 font-mono font-semibold mb-2">Developer Members</h4>
                      <ul className="space-y-1 text-green-200 font-mono text-xs">
                        <li>→ 0.002 ETH membership fee</li>
                        <li>→ Register up to 3 repositories</li>
                        <li>→ Earn rewards per commit</li>
                        <li>→ Governance voting rights</li>
                      </ul>
                    </div>
                    <div className="bg-blue-950/20 border border-blue-700/50 rounded-lg p-3">
                      <h4 className="text-blue-400 font-mono font-semibold mb-2">Partner Organizations</h4>
                      <ul className="space-y-1 text-blue-200 font-mono text-xs">
                        <li>→ 1,000,000 $ABC payment</li>
                        <li>→ Higher reward multipliers (2x-5x)</li>
                        <li>→ Priority support & promotion</li>
                        <li>→ Custom reward structures</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-lg p-4 text-center">
                  <h3 className="text-yellow-400 font-mono font-bold mb-2">🤝 Get Started</h3>
                  <p className="text-yellow-200 font-mono text-sm mb-3">
                    Ready to integrate your repository and start rewarding contributors?
                  </p>
                  <p className="text-yellow-300 font-mono text-xs">
                    Contact ABC DAO team on Farcaster or join our miniapp to begin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}