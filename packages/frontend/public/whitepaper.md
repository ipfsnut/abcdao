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

**Clanker Trading Fees ($WETH + $ABC)**:
- **50%** → Dev wallet (primary treasury/collector)
- **50%** → Protocol wallet → Auto-unwrapped → Staking contract → Distributed to stakers

**Membership Fees ($ETH)**:
- **100%** → Protocol wallet → Staking contract → Distributed to stakers

**Developer Rewards ($ABC)**:
- Funded from Protocol wallet's portion of $ABC trading fees
- Random rewards (50,000-1,000,000 $ABC per commit)

### Dual Reward System
- **Stakers**: Earn $ETH from 50% of Clanker trading fees + 100% of membership fees
- **Developers**: Earn $ABC tokens for commits (funded from Protocol wallet's trading fee portion)
- **Dev Wallet**: Holds 50% of all Clanker trading fees as primary treasury reserves

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
- **Earn $ETH from 50% of Clanker trading fees** (primary reward stream)
- **Earn $ETH from 100% of membership fees** (secondary reward stream)
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
3. Bot posts cast celebrating the commit (tags Farcaster username)
4. $ABC rewards recorded in database for future claiming
5. Daily batch processing prepares rewards for distribution

### Reward Formula
- Simple: 1 commit = 1 reward
- Random reward amounts (50,000 to 1,000,000 $ABC)
- Current phase: No staking requirement (all registered members eligible)
- Daily cap: 10 commits max per developer
- All public repo commits count equally
- Future phase: Staking requirement for enhanced rewards

## 5. REWARD DISTRIBUTION

### Developer Rewards (Current Phase)
- Funded by $ABC from Bot wallet's 50% share of trading fees
- Random rewards between 50,000-1,000,000 $ABC per commit
- Immediate cast announcements via @abc-bot with commit URLs
- PostgreSQL tracking with job queue processing (Bull/Redis)
- Real-time webhook processing with exponential backoff retry
- Future implementation: Smart contract-based claimable rewards

### Staker Rewards
- $ETH from Bot wallet's 50% share of Clanker trading fees (WETH auto-unwrapped)
- $ETH from 100% of membership fees
- Claim anytime from staking contract
- Compounds with more stakers joining

### Treasury Reserves
- Dev wallet holds 50% of all Clanker trading fees ($WETH + $ABC)
- Primary treasury for long-term project sustainability
- Separate from operational Protocol wallet distributions

## 6. FARCASTER INTEGRATION

### ABC Bot Account
- **Username**: @abc-bot
- **Purpose**: Automated developer recognition
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
- **Repository Registration**: Add up to 3 public repositories to reward system
- **Priority Tags**: Use #priority, #milestone, #docs tags for bonus rewards
- **Governance Rights**: Vote on DAO proposals and treasury decisions
- **Staking Eligibility**: Stake $ABC to earn $ETH from trading fees

**Repository Integration**:
- Members can register up to **3 public repositories** for automatic rewards
- GitHub webhook integration tracks commits in real-time  
- Bot automatically casts achievements: "🚀 @username shipped code! Earned X $ABC"
- Commit tags (#priority, #milestone) trigger bonus reward multipliers
- All repositories must be public and member must have admin access

### Partnership Program (1,000,000 $ABC)
**Organizational Benefits**:
- **Enhanced Multipliers**: 2x-5x reward rates for all contributors
- **Priority Support**: Dedicated partnership management
- **Featured Promotion**: Highlighted in community channels and bot casts
- **Custom Structures**: Tailored reward systems for specific project needs
- **Unlimited Repositories**: Add any number of repositories to reward system
- **Partnership Badge**: Special recognition in all community interactions

**Partnership Qualification**:
- Payment of 1,000,000 $ABC tokens to partnership contract
- Organization must maintain active development community
- Repositories must be substantial open-source projects
- Commitment to promoting ABC DAO to contributors

### Repository Reward System
**Automatic Processing**:
- Webhook monitors all registered repositories 24/7
- Only commits from ABC DAO members trigger rewards
- Bot posts immediate recognition on Farcaster
- Rewards automatically added to claimable balance
- No manual intervention required

**Smart Recognition**:
- Base rewards: 50,000-1,000,000 $ABC (randomized)
- Priority commits: +50% bonus for #priority tag
- Milestone commits: +100% bonus for #milestone tag  
- Documentation: +25% bonus for #docs tag
- Partnership repos: 2x-5x base multiplier applied

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
- **Bot Wallet**: `0xBE8C49A4F70D56a489b710F1d45689A3BBb04f35`
- **Process**: Pay bot wallet → Submit transaction hash → Backend verification
- **Benefits**: Lifetime membership + GitHub commit rewards eligibility
- **Revenue Flow**: ETH to staking contract for rewards distribution

### Backend Services
1. **GitHub Webhook Service**: Processes commit events with job queue system
2. **Neynar Bot Service**: Automated posting via @abc-bot account
3. **Account Linker**: Secure GitHub-Farcaster OAuth flow with JWT state tokens
4. **Reward Database**: PostgreSQL with migrations and proper indexing
5. **Fee Splitter**: Distributes 50% of Clanker fees to Dev wallet, 50% to Bot wallet
6. **Job Queue System**: Bull/Redis for reliable commit and cast processing
7. **Cast Processing**: Automated reward announcements with commit URLs
8. **WETH Unwrapper**: Automatically converts WETH to ETH for reward distribution
9. **ETH Forwarder**: Transfers Bot wallet's ETH (fees + membership) to staking contract
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