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
- **Supply**: 100,000,000,000 $ABC (100B total supply)

### Revenue Streams for Stakers
- **Trading fees**: $ETH/$WETH from Clanker trading → Bot wallet → Auto-unwrapped → Staking contract → Distributed to stakers
- **Membership fees**: 0.002 ETH developer memberships → Staking contract → Distributed to stakers
- **Developer rewards**: $ABC from trading → Bot wallet → Fixed commit rewards (50,000-1,000,000 $ABC per commit)

### Dual Reward System
Stakers earn $ETH/$WETH (auto-converted to ETH) from two sources while developers earn $ABC for shipping code. The bot automatically unwraps any WETH received into ETH for seamless reward distribution.

## 3. THE DEVELOPER GAME

### How to Play
1. **Join ABC DAO**: Pay 0.002 ETH membership fee to bot wallet
2. **Link GitHub**: Connect your GitHub account via Farcaster miniapp
3. **Buy $ABC**: Purchase tokens on Base (Clanker v4 token)
4. **Stake tokens**: Lock $ABC to unlock commit rewards
5. **Ship code**: Code normally - all public commits count
6. **Earn rewards**: Get $ABC for commits + ETH from staking

### Staking Benefits
- Unlock commit rewards (must be staked to earn)
- **Earn $ETH from trading fees** (primary reward stream) - supports both ETH and WETH
- **Earn $ETH from membership fees** (secondary reward stream)
- Automatic WETH unwrapping for seamless reward distribution
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
3. Bot verifies developer has minimum $ABC staked (requirement may vary)
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
- $ETH/$WETH from trading fees distributed to $ABC stakers (WETH auto-unwrapped)
- Claim anytime from staking contract
- Compounds with more stakers joining
- Bot automatically processes WETH → ETH conversion for optimal claiming

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
2. **Staking Contract**: Manages stakes and $ETH distribution 
   - Built using OpenZeppelin v5.2 security patterns
   - Based on battle-tested Synthetix StakingRewards architecture
   - 7-day cooldown period for unstaking
   - Emergency pause functionality for security

### Membership System
**Payment Method**: Direct wallet transfer (no smart contract needed)
- **Fee**: 0.002 ETH one-time payment
- **Bot Wallet**: `0x475579e65E140B11bc4656dD4b05e0CADc8366eB`
- **Process**: Pay bot wallet → Submit transaction hash → Backend verification
- **Benefits**: Lifetime membership + GitHub commit rewards eligibility
- **Revenue Flow**: ETH to staking contract for rewards distribution

### Backend Services
1. **GitHub Webhook Service**: Receives commit events
2. **Neynar Bot Service**: Posts to Farcaster via @abcbot
3. **Account Linker**: GitHub-Farcaster connection via miniapp
4. **Membership Processor**: Verifies 0.002 ETH payments to bot wallet
5. **Reward Distributor**: Sends $ABC from bot wallet for commits
6. **WETH Unwrapper**: Automatically converts WETH to ETH for reward distribution
7. **ETH Forwarder**: Manual transfer of membership fees and unwrapped ETH to staking contract

### Security Measures
- **Smart Contract Security**: OpenZeppelin v5.2 libraries (ReentrancyGuard, Pausable, Ownable)
- **Architecture**: Synthetix-inspired reward calculation (audited by Trail of Bits 2025)
- **Payment Verification**: On-chain transaction validation for membership fees
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
**Token**: $ABC (`0x5c0872b790bb73e2b3a9778db6e7704095624b07`)  
**Staking**: (`0x577822396162022654D5bDc9CB58018cB53e7017`)  
**Bot Wallet**: (`0x475579e65E140B11bc4656dD4b05e0CADc8366eB`) - Supports ETH & WETH

*Version 1.0 | October 2025*