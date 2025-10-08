# ABC DAO WHITEPAPER
## Ship Code, Earn Rewards - The Developer Game for Farcaster

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

### Revenue Distribution
- Trading fees in $ETH → Distributed to stakers
- Trading fees in $ABC → Distributed to developers in random batches as rewards for commits
- All routing handled automatically on-chain

## 3. THE DEVELOPER GAME

### How to Play
1. Buy and stake $ABC tokens
2. Connect your GitHub account to your Farcaster profile
3. Ship code as you normally would
4. Earn $ABC rewards for every commit
5. Get automatic Farcaster casts celebrating your work

### Staking Benefits
- Unlock commit rewards (must be staked to earn)
- Earn $ETH from trading fees
- Governance participation rights
- Higher stake = higher commit rewards
- Build reputation on Farcaster

## 4. COMMIT RECOGNITION SYSTEM

### The ABC Bot
- **Platform**: Farcaster account powered by Neynar API
- **Function**: Monitors GitHub commits from registered developers
- **Action**: Posts achievement casts and distributes rewards

### Recognition Flow
1. Developer makes a commit to any public repo
2. ABC Bot detects the commit via GitHub webhooks
3. Bot verifies developer is staked
4. Bot posts cast celebrating the commit
5. $ABC rewards distributed automatically

### Reward Formula
- Base reward per commit: Fixed amount of $ABC
- Multiplier based on stake size (more stake = higher rewards)
- Daily cap to prevent gaming
- No complex scoring - every commit is valued equally

## 5. TREASURY & REWARDS POOL

### Developer Rewards
- Funded by 50% of $ABC trading fees
- Automatically distributed for commits in random amounts of up to 1M $ABC per reward
- No voting required - fully automated
- Sustainable reward distribution

### DAO Treasury
- N/A (no emissions, no inflation)

## 6. FARCASTER INTEGRATION

### ABC Bot Account
- **Username**: @abcbot (to be created)
- **Purpose**: Automated developer recognition
- **Powered by**: Neynar API
- **Hosting**: Dedicated service for webhook processing

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
1. **Token Contract**: v4 Clanker $ABC token
2. **Staking Contract**: Manages stakes and trading fee distribution
3. **Rewards Contract**: Handles commit rewards and multipliers
4. **Governance Contract**: Proposal and voting system

### Backend Services
1. **GitHub Webhook Service**: Receives commit events
2. **Neynar Bot Service**: Posts to Farcaster
3. **Rewards Oracle**: Validates commits and triggers rewards
4. **Database**: Tracks GitHub-Farcaster account links

### Security Measures
- Rate limiting on reward claims
- Commit verification to prevent spoofing
- Multi-sig for emergency functions
- Regular security audits

## 8. LAUNCH STRATEGY

### Phase 1: Contract Development
- Deploy and test smart contracts on Base

### Phase 2: Token Launch
- Fair launch mechanics (no pre-mine)

### Phase 3: Platform Launch
- Launch staking at abc.epicdylan.com and on Farcaster miniapp

### Phase 4: Growth
- Community marketing
- Partnership development

## 9. WHY ABC SUCCEEDS

### Simplicity First
- No complex tokenomics to understand
- Clear value proposition
- Easy participation

### Community Focused
- Farcaster-native from day one
- Supporting builders who matter
- Democratic decision-making

### Sustainable Model
- Trading fees create dual rewards: ETH for stakers, ABC for devs who ship code
- No reliance on emissions or inflation
- Self-perpetuating ecosystem growth

## 10. CONCLUSION

ABC DAO strips Web3 devrel to its essential elements: **ship code, earn rewards**. By focusing on the Farcaster community and maintaining radical simplicity, we create a sustainable funding mechanism for the builders who will define the future of decentralized social networks.

The best DAOs don't need complex mechanisms. They need clear purpose, aligned incentives, and committed communities. ABC DAO provides exactly that—nothing more, nothing less.

---

**Stake & Vote**: [abc.epicdylan.com](https://abc.epicdylan.com)  
**Network**: Base Mainnet  
**Contract**: [Address TBA]  

*Version 0.1 | October 2025*