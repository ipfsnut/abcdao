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

### Clanker Fee Mechanics
- Trading fees (in both $ETH and $ABC) → Creator wallet & Treasury contract
- Fees accumulate from every trade on the DEX pool
  - $ETH → Stakers earn passive income
  - $ABC → Developer commit rewards

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
- Random reward amounts (100 to 1,000,000 $ABC)
- Must have minimum stake to qualify
- Daily cap: 10 commits max per developer
- All public repo commits count equally

## 5. REWARD DISTRIBUTION

### Developer Rewards
- Funded by $ABC from trading fees (via creator wallet)
- Random rewards between 100-10,000 $ABC per commit
- Fully automated - no manual intervention
- Sustainable through continuous fee generation

### Staker Rewards
- All $ETH from trading fees distributed proportionally
- Claim anytime from staking contract
- Compounds with more stakers joining

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
1. **Token Contract**: v4 Clanker $ABC token (handles fee routing)
2. **Staking Contract**: Manages stakes and $ETH distribution
3. **Rewards Contract**: Handles commit rewards from creator wallet

### Backend Services
1. **GitHub Webhook Service**: Receives commit events
2. **Neynar Bot Service**: Posts to Farcaster
3. **Account Linker**: Simple GitHub-Farcaster connection
4. **Reward Distributor**: Sends $ABC from creator wallet

### Security Measures
- Rate limiting on reward claims
- Commit verification to prevent spoofing
- Multi-sig for emergency functions
- Regular security audits

## 8. LAUNCH STRATEGY

- Create @abcbot Farcaster account via Neynar
- Register GitHub app for webhooks
- Deploy backend services
- Launch $ABC via v4 Clanker
- 80% fee routing to creator wallet configured
- Initial liquidity provided
- Deploy staking contract
- Enable GitHub-Farcaster linking at abc.epicdylan.com or via Farcaster miniapp
- First commits start earning rewards
- ABC Bot begins posting celebrations
- Onboard active Farcaster developers
- Weekly leaderboards
- Viral growth through automated casts

## 9. RISK MITIGATION

### Potential Risks & Solutions

| Risk | Mitigation |
|------|------------|
| Commit spam | Daily cap of 10 commits per developer |
| Multiple GitHub accounts | Farcaster account verification limits sybils |
| Private repo gaming | Only public repositories count |
| Low trading volume | Small rewards sustainable even with low fees |
| Reward depletion | Random amounts (100-1M) prevent drain |

## 10. WHY ABC SUCCEEDS

### Simplicity First
- No complex tokenomics to understand
- Clear value proposition: commit = reward
- Easy participation

### Community Focused
- Farcaster-native from day one
- Supporting builders who matter
- No politics - just code and rewards

### Sustainable Model
- Clanker fees create dual rewards: ETH for stakers, ABC for developers
- No reliance on emissions or inflation
- Self-perpetuating ecosystem growth

## 11. CONCLUSION

ABC DAO strips Web3 devrel to its essential elements: **ship code, earn rewards**. By focusing on the Farcaster community and maintaining radical simplicity, we create a sustainable funding mechanism for the builders who will define the future of decentralized social networks.

The best DAOs don't need complex mechanisms. They need clear purpose, aligned incentives, and committed communities. ABC DAO provides exactly that—nothing more, nothing less.

---

**Stake & Ship**: [abc.epicdylan.com](https://abc.epicdylan.com)  
**Network**: Base Mainnet  
**Contract**: [Address TBA]  

*Version 1.0 | October 2025