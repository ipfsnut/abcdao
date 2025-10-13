# ABC DAO WHITEPAPER
## Ship Code, Earn Rewards - The Live Action Developer Game for Farcaster

---

## ABSTRACT

ABC DAO gamifies open-source development by rewarding developers who ship code with $ABC tokens and social recognition on Farcaster. By combining staking mechanics with automatic commit recognition, ABC creates a sustainable ecosystem where developers are incentivized to build in public while earning crypto rewards and growing their reputation.

## 1. INTRODUCTION

Building in public should be rewarded. ABC DAO transforms everyday coding into a game where developers earn $ABC tokens and Farcaster recognition simply by shipping code. No grant applications, no complex scoring - just stake your tokens and let your commits do the talking.

Our philosophy: **Ship code, get rewards.** Every commit counts. Every push gets recognized. Every developer wins.

## 2. TOKENOMICS

- **Token**: $ABC (v4 Clanker token)
- **Network**: Base Mainnet  
- **Supply**: Fixed supply determined at launch

### Revenue Streams for Stakers
- **Trading fees**: $ETH from Clanker trading → Staking contract → Distributed to stakers
- **Membership fees**: 0.002 ETH developer memberships → Staking contract → Distributed to stakers
- **Developer rewards**: $ABC from trading → Bot wallet → Random commit rewards

### Dual Reward System
Stakers earn $ETH from two sources while developers earn $ABC for shipping code.

## 3. THE DEVELOPER GAME

### How to Play
1. Purchase one-time developer membership (0.002 ETH)
2. Buy and stake $ABC tokens
3. Connect your GitHub account to your Farcaster profile
4. Ship code as you normally would
5. Earn $ABC rewards for every commit
6. Get automatic Farcaster casts celebrating your work

### Staking Benefits
- Unlock commit rewards (must be staked to earn)
- **Earn $ETH from trading fees** (primary reward stream)
- **Earn $ETH from membership fees** (secondary reward stream)
- Higher stake = higher commit rewards
- Build reputation on Farcaster
- No governance - just ship and earn

## 4. COMMIT RECOGNITION SYSTEM

### The ABC Bot
- **Platform**: Farcaster account powered by Neynar API
- **Function**: Monitors GitHub commits from registered developers
- **Action**: Posts achievement casts and distributes rewards

### Recognition Flow
1. Registered Developer makes a commit to any public repo
2. ABC Bot detects the commit via GitHub webhooks
3. Bot verifies developer has 1M or more $ABC staked
4. Bot posts cast celebrating the commit
5. $ABC rewards distributed automatically

### Reward Formula
- Simple: 1 commit = 1 reward
- Random reward amounts (50,000 to 1,000,000 $ABC)
- Must have minimum stake to qualify
- Daily cap: 10 commits max per developer
- All public repo commits count equally

## 5. REWARD DISTRIBUTION

### Developer Rewards
- Funded by $ABC from trading fees
- Random rewards between 50,000-1,000,000 $ABC per commit
- Fully automated - no manual intervention
- Sustainable through continuous fee generation

### Staker Rewards
- $ETH from trading fees distributed to $ABC stakers
- Claim anytime from staking contract
- Compounds with more stakers joining

## 6. FARCASTER INTEGRATION

### ABC Bot Account
- **Username**: @abcbot
- **Purpose**: Automated developer recognition
- **Powered by**: Neynar API
- **Status**: Integrated and tested

### Cast Templates
- "🚀 @username just shipped code! [commit message] → Earned X $ABC"
- "🔥 @username is on fire! 5 commits today → Total earned: X $ABC"
- "💎 New milestone: @username has shipped 100 commits with ABC!"

### Social Features
- Automatic follow of active developers
- Recast notable achievements
- Weekly leaderboard posts
- Community celebration casts

## 7. TECHNICAL ARCHITECTURE

### Smart Contracts
1. **Token Contract**: v4 Clanker $ABC token (deployed via Clanker)
2. **Staking Contract**: Manages stakes and $ETH distribution (receives ETH directly from creator wallet)
   - Built using OpenZeppelin v5.2 security patterns
   - Based on battle-tested Synthetix StakingRewards architecture
   - 7-day cooldown period for unstaking
   - Emergency pause functionality for security
3. **Membership Contract**: One-time developer access (0.002 ETH payment)
   - Simple ETH-only payments
   - Automatic forwarding to staking contract
   - Lifetime membership model
   - Revenue enhances staker rewards

### Backend Services
1. **GitHub Webhook Service**: Receives commit events
2. **Neynar Bot Service**: Posts to Farcaster via @abcbot
3. **Account Linker**: GitHub-Farcaster connection
4. **Reward Distributor**: Sends $ABC from bot wallet
5. **ETH Forwarder**: Weekly transfer of accumulated ETH to staking contract

### Security Measures
- **Smart Contract Security**: OpenZeppelin v5.2 libraries (ReentrancyGuard, Pausable, Ownable)
- **Architecture**: Synthetix-inspired reward calculation (audited by Trail of Bits 2025)
- **Rate limiting** on reward claims
- **Commit verification** to prevent spoofing
- **Emergency controls**: Pause functionality for critical situations
- **Battle-tested patterns**: Following the "beaten path" for minimal security risk



## 8. CONCLUSION

ABC DAO strips Web3 devrel to its essential elements: **ship code, earn rewards**. By focusing on the Farcaster community and maintaining radical simplicity, we create a sustainable funding mechanism for the builders who will define the future of decentralized social networks.

The best DAOs don't need complex mechanisms. They need clear purpose, aligned incentives, and committed communities. ABC DAO provides exactly that—nothing more, nothing less.

---

**Stake & Ship**: [abc.epicdylan.com](https://abc.epicdylan.com)  
**Network**: Base Mainnet  
**Contract**: [Address TBA]  

*Version 1.0 | October 2025