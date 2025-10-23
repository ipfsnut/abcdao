# ABC DAO WHITEPAPER
## Ship Code, Earn Rewards - The Developer Community for Web3 Builders

---

## ABSTRACT

ABC DAO creates a sustainable developer community where contributors earn $ABC tokens for their code commits while stakers earn ETH rewards from protocol activity. With wallet-first onboarding and automated reward distribution, ABC DAO simplifies Web3 development incentives through transparent, automated systems built on Base.

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

### How to Join
1. **Connect Wallet**: Connect any Web3 wallet (MetaMask, Rainbow, Coinbase, etc.)
2. **Pay Membership Fee**: One-time 0.002 ETH payment to protocol wallet
3. **Optional Enhancements**: 
   - Link GitHub account to start earning $ABC for commits
   - Link Farcaster for community announcements and social features
   - Buy & stake $ABC tokens to earn ETH rewards from protocol fees
4. **Start Contributing**: All registered developers earn rewards for code contributions

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
**Payment Method**: Direct wallet transfer with automatic verification
- **Fee**: 0.002 ETH one-time payment
- **Protocol Wallet**: `0xBE6525b767cA8D38d169C93C8120c0C0957388B8` (abcdao.base.eth)
- **Payment Processing**: 
  - Wallet-only payments: Tracked by sender address and amount
  - Farcaster-enhanced: Transaction data includes FID for enhanced features
  - Automatic verification: Backend monitors protocol wallet for incoming payments
  - Instant activation: Membership activated within minutes of payment confirmation
- **Benefits**: Lifetime membership with optional GitHub/Farcaster linking for enhanced features
- **User Experience**: Simplified onboarding - wallet connection is the only requirement

### Backend Services
1. **Payment Monitor**: Real-time monitoring of protocol wallet for membership payments
   - Supports both wallet-only and Farcaster-enhanced payments
   - Automatic user creation and membership activation
   - Dual payment processing: FID-based and wallet address-based tracking
2. **GitHub Webhook Service**: Processes commit events with job queue system
3. **Neynar Bot Service**: Automated posting via @abc-dao-commits and @abc-dao-dev accounts
4. **Treasury Automation**: 
   - Automated Clanker rewards claiming (daily at 11:30 PM UTC)
   - Automatic WETH unwrapping for seamless ETH distribution
   - Daily token statistics posting for transparency
   - Daily staking statistics and APY updates
5. **Reward Database**: PostgreSQL with comprehensive user and commit tracking
6. **Cast Processing**: Automated reward announcements with commit URLs
7. **WETH Unwrapper**: Event-driven WETH to ETH conversion after Clanker claims
8. **Social Media Automation**: Daily transparency posts about protocol metrics

### Automated Treasury Operations

**Daily Automation Schedule:**
- **10:00 AM UTC**: Staking statistics and APY updates posted to social media
- **2:00 PM UTC**: Token statistics and transparency metrics posted 
- **11:30 PM UTC**: Automated Clanker rewards claiming with immediate WETH unwrapping

**Transparency Features:**
- **Real-time protocol metrics**: Live treasury value, staking APY, token distribution
- **Automated social posting**: Daily transparency updates via @abc-dao-dev
- **Public dashboards**: All protocol metrics visible on main application
- **Transaction announcements**: All treasury operations posted with transaction links

**Treasury Management:**
- **Automated Clanker claims**: Daily claiming of creator rewards from Clanker protocol
- **Event-driven WETH unwrapping**: Immediate conversion of WETH to ETH after claims
- **Protocol fee distribution**: Automated distribution to staking contract and treasury
- **Gas optimization**: Intelligent batching and threshold-based operations

### Security Measures
- **Smart Contract Security**: OpenZeppelin v5.2 libraries (ReentrancyGuard, Pausable, Ownable)
- **Architecture**: Synthetix-inspired reward calculation with proven security patterns
- **Payment Verification**: Dual-mode payment tracking (wallet-based and FID-enhanced)
- **Automated monitoring**: Real-time protocol wallet monitoring for all transactions
- **Rate limiting** on reward claims and user actions
- **Commit verification** to prevent spoofing
- **Emergency controls**: Pause functionality for critical situations
- **Battle-tested patterns**: Following established DeFi security practices

## 8. FUTURE ROADMAP

### Planned Enhancements
1. **NFT Membership Migration**: Transform database membership to NFT-based system
   - One-click joining via Farcaster frames
   - Transferable and programmable membership NFTs
   - Viral social sharing and discovery mechanisms
   - Secondary marketplace for membership trading

2. **User Clanker Token Claims**: Enable users to claim rewards from their own Clanker tokens
   - Integration with Clanker LP Locker V2 contract
   - User dashboard for managing multiple token rewards
   - Automated claiming services with fee structure

3. **Enhanced Social Integration**: 
   - Discord bot integration for community management
   - Automated newsletter generation from protocol activity
   - Enhanced Farcaster frame interactions

### Technical Evolution
- Migration from centralized membership to decentralized NFT ownership
- Enhanced automation for treasury management and reward distribution
- Improved user experience through social-first onboarding

## 9. CONCLUSION

ABC DAO represents a new paradigm in developer incentives: **wallet-first, code-driven, socially amplified**. By reducing barriers to entry while maintaining meaningful rewards, we create a sustainable ecosystem where developers can focus on building while being automatically recognized and rewarded for their contributions.

The protocol's automated systems ensure transparency and reliability, while optional social features enhance community engagement without creating dependencies. This approach attracts both solo developers seeking simple reward mechanisms and teams looking for comprehensive community integration.

---

**Stake & Ship**: [abc.epicdylan.com](https://abc.epicdylan.com)  
**Network**: Base Mainnet  
**Token**: $ABC (`0x5c0872b790bb73e2b3a9778db6e7704095624b07`)  
**Staking**: (`0x577822396162022654D5bDc9CB58018cB53e7017`)  
**Protocol Wallet**: (`0xBE6525b767cA8D38d169C93C8120c0C0957388B8`) - Supports ETH & WETH

## Automated ETH Distribution

The ABC DAO protocol wallet automatically distributes incoming ETH daily at noon UTC according to the following allocation:

**Distribution Breakdown:**
- **25% → Staking Contract** (`0x577822396162022654D5bDc9CB58018cB53e7017`) - Rewards for $ABC stakers
- **25% → Treasury** (`0x18A85ad341b2D6A2bd67fbb104B4827B922a2A3c`) - Protocol development and maintenance
- **50% → Protocol Operations** (`0xBE6525b767cA8D38d169C93C8120c0C0957388B8`) - Retained for gas, operations, and future distributions

**Automation Details:**
- **Frequency**: Daily at 12:00 PM UTC
- **Minimum Threshold**: 0.01 ETH (prevents gas-inefficient micro-distributions)
- **Gas Reserve**: 0.005 ETH maintained for transaction fees
- **Transparency**: All distributions announced on Farcaster with transaction links

This automated system ensures sustainable funding for both staker rewards and community development while maintaining operational efficiency.

*Version 2.0 | October 2025 - Updated for wallet-first architecture and automated treasury operations*