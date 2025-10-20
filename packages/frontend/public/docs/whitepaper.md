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

### Fee Distribution Model

**Clanker Trading Fees**:
- **$ETH portion** → Staking contract → Distributed to stakers
- **$ABC portion** → Developer reward pool → Distributed to developers for commits

**Membership Fees ($ETH)**:
- **100%** → Staking contract → Distributed to stakers

**Developer Rewards ($ABC)**:
- Funded from $ABC trading fees collected by protocol
- Random rewards (50,000-999,000 $ABC per commit)

### Dual Reward System
- **Stakers**: Earn $ETH from trading fees + 100% of membership fees
- **Developers**: Earn $ABC tokens from trading fees for commits
- **Clear Separation**: $ETH flows to stakers, $ABC flows to developers

## 3. THE DEVELOPER GAME

### How to Play
1. **Join ABC DAO**: Pay 0.002 ETH membership fee to protocol wallet
2. **Link GitHub**: Connect your GitHub account via Farcaster miniapp
3. **Buy $ABC**: Purchase tokens on Base (Clanker v4 token)
4. **Stake tokens**: Lock $ABC to unlock commit rewards
5. **Ship code**: Code normally - all public commits count
6. **Earn rewards**: Get $ABC for commits + ETH from staking

### Staking Benefits
- **Earn $ETH from Clanker trading fees** (primary reward stream)
- **Earn $ETH from 100% of membership fees** (secondary reward stream)  
- Automatic WETH unwrapping for seamless reward distribution
- Passive income from protocol fees
- Build reputation on Farcaster
- No governance - just stake and earn

## 4. COMMIT RECOGNITION SYSTEM

### The ABC DAO Bots
- **Platform**: Farcaster accounts powered by Neynar API
- **Function**: Monitor GitHub commits from registered developers
- **Action**: Post achievement casts and distribute rewards via @abc-dao-commits

### Recognition Flow
1. Registered Developer makes a commit to registered repository
2. ABC DAO backend detects the commit via GitHub webhooks
3. @abc-dao-commits posts cast celebrating the commit (tags Farcaster username)
4. $ABC rewards recorded in database for future claiming
5. Real-time processing and reward distribution

### Reward Formula
- Simple: 1 commit = 1 reward
- Random reward amounts (50,000 to 1,000,000 $ABC)
- Current phase: No staking requirement (all registered members eligible)
- Daily cap: 10 commits max per developer
- All public repo commits count equally
- Future phase: Staking requirement for enhanced rewards

## 5. REWARD DISTRIBUTION

### Developer Rewards
- Funded by $ABC trading fees collected by protocol
- Random rewards between 50,000-999,000 $ABC per commit
- Immediate cast announcements via @abc-dao-commits with commit URLs
- PostgreSQL tracking with real-time processing
- Automated reward distribution system
- Claimable via main ABC DAO application

### Staker Rewards
- $ETH from Clanker trading fees (WETH auto-unwrapped)
- $ETH from 100% of membership fees
- Claim anytime from staking contract
- Passive income scales with protocol usage

## 6. FARCASTER INTEGRATION

### ABC DAO Bots
- **@abc-dao-commits**: Individual commit announcements and developer recognition
- **@abc-dao-dev**: Ecosystem updates, leaderboards, and general announcements
- **Powered by**: Neynar API
- **Status**: Live and operational

### Cast Templates
- "🚀 @username just pushed to repo: 'commit message' → Earned X $ABC → 🔗 [commit URL] → #ABCDAO #AlwaysBeCoding"
- Random intro variations: "⚡ Code shipped!", "🔥 Fresh push!", "💻 Update landed!"
- Daily batch processing for efficient reward distribution

### Social Features
- Automatic follow of active developers
- Recast notable achievements
- Weekly leaderboard posts
- Community celebration casts

## 7. MEMBERSHIP SYSTEM & BENEFITS

### Developer Membership (0.002 ETH)
**Core Benefits**:
- **Commit Recasts**: Automatic Farcaster recognition for every commit
- **Variable Rewards**: Earn 50,000-1,000,000 $ABC per commit (randomized)
- **Repository Registration**: Add up to 3 repositories to reward system
- **Priority Tags**: Use #high, #milestone tags for 1.5x reward multipliers
- **Governance Rights**: Vote on DAO proposals and treasury decisions
- **Staking Eligibility**: Stake $ABC to earn $ETH from trading fees

**Repository Integration**:
- Members can register up to **3 repositories** for automatic rewards (public or private)
- **Premium Stakers** (5M+ $ABC staked) get unlimited repository slots
- GitHub webhook integration tracks commits in real-time  
- Bot automatically casts achievements: "🚀 @username shipped code! Earned X $ABC"
- Commit tags (#high, #milestone) trigger 1.5x reward multipliers
- Repository admin access required for registration

### Partnership Program (1,000,000 $ABC)
**Organizational Benefits**:
- **Enhanced Multipliers**: 2x reward rates for all contributors
- **Priority Support**: Dedicated partnership management
- **Featured Promotion**: Highlighted in community channels and bot casts
- **Unlimited Repositories**: Add any number of repositories to reward system
- **Partnership Badge**: Special recognition in all community interactions
- **Flexible Configuration**: Custom reward parameters and channel targeting

**Partnership Qualification**:
- Payment of 1,000,000 $ABC tokens to protocol wallet
- Organization must maintain active development community
- Must be substantial open-source projects or applications
- Commitment to promoting ABC DAO within developer community
- Application review and approval process

### Repository Reward System
**Automatic Processing**:
- Webhook monitors all registered repositories 24/7
- Only commits from ABC DAO members trigger rewards
- Bot posts immediate recognition on Farcaster
- Rewards automatically added to claimable balance
- No manual intervention required

**Smart Recognition**:
- Base rewards: 50,000-999,000 $ABC (randomized distribution)
- High priority: 1.5x multiplier for #high tag
- Milestone commits: 1.5x multiplier for #milestone tag  
- Silent commits: #silent tag skips Farcaster announcements
- Skip rewards: #norew tag excludes commit from rewards
- Partnership repos: 2x base multiplier applied

## 8. TECHNICAL ARCHITECTURE

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
- **Protocol Wallet**: `0xBE6525b767cA8D38d169C93C8120c0C0957388B8`
- **Process**: Pay protocol wallet → Submit transaction hash → Backend verification
- **Benefits**: Lifetime membership + GitHub commit rewards eligibility
- **Revenue Flow**: ETH to staking contract for rewards distribution

### Backend Services
1. **GitHub Webhook Service**: Processes commit events with job queue system
2. **Neynar Bot Service**: Automated posting via @abc-dao-dev account
3. **Account Linker**: Secure GitHub-Farcaster OAuth flow with JWT state tokens
4. **Reward Database**: PostgreSQL with migrations and proper indexing
5. **Fee Splitter**: Distributes 50% of Clanker fees to Dev wallet, 50% to Protocol wallet
6. **Job Queue System**: Bull/Redis for reliable commit and cast processing
7. **Cast Processing**: Automated reward announcements with commit URLs
8. **WETH Unwrapper**: Automatically converts WETH to ETH for reward distribution
9. **ETH Forwarder**: Transfers Protocol wallet's ETH (fees + membership) to staking contract
10. **Future: Smart Contract Integration**: Claimable rewards system (pending)

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
**Protocol Wallet**: (`0xBE6525b767cA8D38d169C93C8120c0C0957388B8`) - Supports ETH & WETH

## Automated ETH Distribution

The ABC DAO protocol wallet automatically distributes incoming ETH every 6 hours according to the following allocation:

**Distribution Breakdown:**
- **25% → Staking Contract** (`0x577822396162022654D5bDc9CB58018cB53e7017`) - Rewards for $ABC stakers
- **25% → Treasury** (`0x18A85ad341b2D6A2bd67fbb104B4827B922a2A3c`) - Protocol development and maintenance
- **50% → Protocol Operations** (`0xBE6525b767cA8D38d169C93C8120c0C0957388B8`) - Retained for gas, operations, and future distributions

**Automation Details:**
- **Frequency**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Minimum Threshold**: 0.01 ETH (prevents gas-inefficient micro-distributions)
- **Gas Reserve**: 0.005 ETH maintained for transaction fees
- **Transparency**: All distributions announced on Farcaster with transaction links

This automated system ensures sustainable funding for both staker rewards and community development while maintaining operational efficiency.

*Version 1.0 | October 2025*