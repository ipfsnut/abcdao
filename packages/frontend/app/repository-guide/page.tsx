'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RepositoryGuidePage() {
  const [activeStep, setActiveStep] = useState(1);

  const downloadGuide = () => {
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

  const steps = [
    {
      id: 1,
      title: "Get Webhook Secret",
      description: "Contact ABC DAO team on Farcaster for your unique webhook secret",
      action: "Contact Team",
      href: "https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao"
    },
    {
      id: 2,
      title: "Configure Webhook",
      description: "Add the ABC DAO webhook to your GitHub repository settings",
      action: "Open GitHub",
      href: "https://github.com"
    },
    {
      id: 3,
      title: "Test Integration",
      description: "Make a test commit and watch for the bot cast on Farcaster",
      action: "Make Commit",
      href: null
    },
    {
      id: 4,
      title: "Promote to Team",
      description: "Tell your contributors about ABC DAO membership benefits",
      action: "Share Guide",
      href: null
    }
  ];

  return (
    <div className="min-h-screen bg-black text-blue-400 font-mono">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="relative flex items-center justify-center mb-3">
            <Link href="/" className="absolute left-0">
              <img 
                src="/abc-logo.png" 
                alt="ABC Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <div className="text-center">
              <h1 className="text-2xl sm:text-4xl font-bold matrix-glow">
                {'>'} REPOSITORY_INTEGRATION
              </h1>
              <p className="text-xs text-blue-600 font-mono mt-1">
                Ship Code, Earn Rewards - Integration Guide
              </p>
            </div>
            <Link 
              href="/"
              className="absolute right-0 bg-blue-950/20 hover:bg-blue-900/30 border border-blue-900/50 hover:border-blue-700/50 
                         text-blue-400 hover:text-blue-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-mono text-xs sm:text-sm 
                         transition-all duration-300 matrix-button"
            >
              {'<'} Back
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 matrix-glow">
            🚀 Reward Your Contributors
          </h2>
          <p className="text-lg sm:text-xl text-blue-300 mb-8 max-w-3xl mx-auto">
            Automatically reward developers with $ABC tokens for every commit. 
            Set up takes 5 minutes. Contributors earn rewards immediately.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={downloadGuide}
              className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 px-6 py-3 rounded-lg font-mono transition-all duration-300 hover:matrix-glow flex items-center gap-3 justify-center"
            >
              <span className="text-xl">📥</span>
              <span>Download Complete Guide</span>
            </button>
            
            <a
              href="https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-900/50 hover:bg-green-900/70 text-green-400 border border-green-700/50 px-6 py-3 rounded-lg font-mono transition-all duration-300 hover:matrix-glow flex items-center gap-3 justify-center"
            >
              <span className="text-xl">🔗</span>
              <span>Join ABC DAO</span>
            </a>
          </div>
        </div>

        {/* Quick Setup Steps */}
        <div className="bg-black/40 border border-blue-900/50 rounded-xl p-8 backdrop-blur-sm mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center text-blue-400">
            ⚡ 4-Step Integration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`p-6 rounded-lg border transition-all duration-300 cursor-pointer ${
                  activeStep === step.id
                    ? 'bg-blue-950/40 border-blue-500/50 matrix-glow'
                    : 'bg-blue-950/20 border-blue-700/50 hover:border-blue-600/50'
                }`}
                onClick={() => setActiveStep(step.id)}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-3">
                    {step.id}
                  </div>
                  <h4 className="font-semibold text-blue-300 mb-2">
                    {step.title}
                  </h4>
                  <p className="text-sm text-blue-200 mb-4">
                    {step.description}
                  </p>
                  {step.href ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-800/50 hover:bg-blue-800/70 text-blue-300 px-3 py-1 rounded text-xs transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {step.action}
                    </a>
                  ) : (
                    <div className="inline-block bg-blue-800/30 text-blue-400 px-3 py-1 rounded text-xs">
                      {step.action}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Membership Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Developer Membership */}
          <div className="bg-green-950/20 border border-green-700/50 rounded-xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-green-400 mb-2">
                👨‍💻 Developer Members
              </h3>
              <div className="text-3xl font-bold text-green-300">
                0.002 ETH
              </div>
              <p className="text-sm text-green-600">One-time membership fee</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-green-200">Register up to <strong>3 repositories</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-green-200">Earn <strong>50,000-1,000,000 $ABC</strong> per commit</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-green-200">Automatic <strong>Farcaster recognition</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-green-200">Priority tags for <strong>bonus rewards</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-green-200">Governance <strong>voting rights</strong></span>
              </li>
            </ul>
            
            <a
              href="https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-900/50 hover:bg-green-900/70 text-green-400 border border-green-700/50 px-4 py-3 rounded-lg font-mono transition-all duration-300 hover:matrix-glow flex items-center justify-center gap-2"
            >
              <span>Join as Developer</span>
              <span className="text-lg">→</span>
            </a>
          </div>

          {/* Partner Organizations */}
          <div className="bg-purple-950/20 border border-purple-700/50 rounded-xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-purple-400 mb-2">
                🏢 Partner Organizations
              </h3>
              <div className="text-3xl font-bold text-purple-300">
                1M $ABC Per Repository
              </div>
              <p className="text-sm text-purple-600">Partnership payment</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-purple-500 text-lg">✓</span>
                <span className="text-purple-200"><strong>Unlimited repositories</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 text-lg">✓</span>
                <span className="text-purple-200"><strong>Priority support</strong> & promotion</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 text-lg">✓</span>
                <span className="text-purple-200">Custom <strong>reward structures</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 text-lg">✓</span>
                <span className="text-purple-200">Partnership <strong>badge & recognition</strong></span>
              </li>
            </ul>
            
            <a
              href="https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-purple-900/50 hover:bg-purple-900/70 text-purple-400 border border-purple-700/50 px-4 py-3 rounded-lg font-mono transition-all duration-300 hover:matrix-glow flex items-center justify-center gap-2"
            >
              <span>Apply for Partnership</span>
              <span className="text-lg">→</span>
            </a>
          </div>
        </div>

        {/* Technical Setup */}
        <div className="bg-black/40 border border-blue-900/50 rounded-xl p-8 backdrop-blur-sm mb-12">
          <h3 className="text-2xl font-bold mb-6 text-blue-400">
            🔧 Technical Setup Details
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-4">Webhook Configuration</h4>
              <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4 font-mono text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-blue-600">Payload URL:</span>
                    <br />
                    <code className="text-blue-300">https://abcdao-production.up.railway.app/api/webhooks/github</code>
                  </div>
                  <div>
                    <span className="text-blue-600">Content type:</span>
                    <br />
                    <code className="text-blue-300">application/json</code>
                  </div>
                  <div>
                    <span className="text-blue-600">Events:</span>
                    <br />
                    <code className="text-blue-300">Push events</code>
                  </div>
                  <div>
                    <span className="text-blue-600">Secret:</span>
                    <br />
                    <code className="text-blue-300">[Contact ABC DAO team]</code>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-4">Commit Tag Bonuses</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <code className="bg-green-950/30 text-green-400 px-2 py-1 rounded text-sm">#priority</code>
                  <span className="text-blue-200">+50% bonus rewards</span>
                </div>
                <div className="flex items-center gap-3">
                  <code className="bg-purple-950/30 text-purple-400 px-2 py-1 rounded text-sm">#milestone</code>
                  <span className="text-blue-200">+100% bonus rewards</span>
                </div>
                <div className="flex items-center gap-3">
                  <code className="bg-blue-950/30 text-blue-400 px-2 py-1 rounded text-sm">#docs</code>
                  <span className="text-blue-200">+25% bonus rewards</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-950/20 border border-blue-800/50 rounded">
                <p className="text-blue-300 text-sm font-mono">
                  <strong>Example:</strong><br />
                  <code>git commit -m &quot;Fix auth bug #priority&quot;</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="bg-yellow-950/20 border border-yellow-700/50 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">
            🤝 Ready to Get Started?
          </h3>
          <p className="text-yellow-200 mb-6 max-w-2xl mx-auto">
            Join the ABC DAO community and start rewarding your contributors today. 
            Contact our team for your webhook secret and integration support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://farcaster.xyz/miniapps/S1edg9PycxZP/abcdao"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-900/50 hover:bg-yellow-900/70 text-yellow-400 border border-yellow-700/50 px-6 py-3 rounded-lg font-mono transition-all duration-300 hover:matrix-glow"
            >
              Contact ABC DAO Team
            </a>
            <button
              onClick={downloadGuide}
              className="bg-blue-900/50 hover:bg-blue-900/70 text-blue-400 border border-blue-700/50 px-6 py-3 rounded-lg font-mono transition-all duration-300 hover:matrix-glow"
            >
              Download Full Guide
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}