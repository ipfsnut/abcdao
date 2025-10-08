# ABC DAO Launch Setup Guide

## Current Codebase Status

### ✅ Complete Components
- **Smart Contracts**:
  - `ABCStaking.sol` - Staking with ETH rewards (7-day cooldown, 1M ABC minimum for commit rewards)
  - `ABCTreasury.sol` - Auto-splits fees: ETH→stakers, ABC→bot wallet
  - OpenZeppelin dependencies configured
  - Foundry setup with tests

- **Frontend** (Next.js):
  - Basic UI with stake/unstake/vote tabs
  - Farcaster auth via Neynar (`components/farcaster-auth.tsx`)
  - RainbowKit wallet connection
  - API route for user lookup (`/api/user/[fid]/route.ts`)

- **Documentation**:
  - `WHITEPAPER.md` - Complete project specification
  - `README.md` - Basic project overview

### 🚧 Missing for Launch

#### Smart Contracts
- [ ] ABCToken.sol (will be Clanker v4 - handled externally)
- [ ] Deploy scripts for mainnet
- [ ] Contract verification setup
- [ ] Security audit

#### Backend Services
- [ ] GitHub webhook service
- [ ] Bot wallet management system
- [ ] Account linking database
- [ ] Commit reward distribution logic
- [ ] Neynar bot integration

#### Frontend Updates
- [ ] Connect to actual contracts (currently mockup)
- [ ] GitHub account linking UI
- [ ] Real-time staking data
- [ ] Commit history display
- [ ] Reward claims interface

#### Infrastructure
- [ ] @abcbot Farcaster account
- [ ] GitHub App registration
- [ ] Database for user mappings
- [ ] Production hosting

---

## Complete Launch Rollout Plan

### Phase 1: Infrastructure Setup (Week 1)

#### Farcaster Bot Setup
- [ ] Create @abcbot Farcaster account
- [ ] Get Neynar API key and configure bot
- [ ] Test basic posting capabilities
- [ ] Design cast templates for commit celebrations

#### GitHub Integration
- [ ] Register GitHub App for webhook access
- [ ] Set up webhook endpoint infrastructure
- [ ] Create database schema for user mappings:
  ```sql
  users (
    farcaster_fid INT,
    farcaster_username VARCHAR,
    github_username VARCHAR,
    wallet_address VARCHAR,
    created_at TIMESTAMP
  )
  ```

#### Backend Services
- [ ] Deploy webhook service (Node.js/Express)
- [ ] Create bot wallet for ABC distribution
- [ ] Implement commit detection and validation
- [ ] Test end-to-end webhook → database → bot flow

### Phase 2: Smart Contract Deployment 

#### Contract Preparation
- [ ] Final contract testing on Base testnet
- [ ] Deploy `ABCTreasury.sol` to Base mainnet
- [ ] Deploy `ABCStaking.sol` to Base mainnet
- [ ] Verify contracts on Basescan

#### Token Launch
- [ ] Launch $ABC via Clanker v4
- [ ] Configure fee routing

#### Integration Testing
- [ ] Test fee flow: Trading → Creator Wallet → Treasury → Staking
- [ ] Verify ABC routing to bot wallet
- [ ] Test staking contract with real ABC tokens

### Phase 3: Frontend & Game Activation (Week 3)

#### Frontend Integration
- [ ] Connect frontend to deployed contracts
- [ ] Implement real staking functionality
- [ ] Add GitHub account linking interface
- [ ] Real-time data from contracts

#### Game Logic Implementation
- [ ] Deploy commit reward distribution system
- [ ] Implement eligibility checking (1M ABC minimum)
- [ ] Daily caps and anti-gaming measures
- [ ] Random reward amounts (100-10k ABC)

#### Launch Preparation
- [ ] End-to-end testing with real users
- [ ] Deploy frontend to abc.epicdylan.com
- [ ] Prepare launch announcement casts
- [ ] Documentation for early users

### Phase 4: Public Launch (Week 4)

#### Soft Launch
- [ ] Announce to close Farcaster friends
- [ ] Monitor first commits and rewards
- [ ] Fix any immediate issues
- [ ] Collect feedback

#### Feature Testing
- [ ] Test with multiple developers
- [ ] Monitor treasury flows
- [ ] Verify bot posting correctly
- [ ] Check reward distribution accuracy

#### Full Launch
- [ ] Public announcement on Farcaster
- [ ] Onboard prominent FC developers
- [ ] Launch week promotions
- [ ] Monitor system performance

---

## Technical Implementation Details

### Required Environment Variables
```bash
# Backend Service
NEYNAR_API_KEY=xxx
GITHUB_WEBHOOK_SECRET=xxx
DATABASE_URL=xxx
BOT_WALLET_PRIVATE_KEY=xxx
ABC_TOKEN_ADDRESS=xxx
STAKING_CONTRACT_ADDRESS=xxx
TREASURY_CONTRACT_ADDRESS=xxx

# Frontend
NEXT_PUBLIC_NEYNAR_CLIENT_ID=xxx
NEXT_PUBLIC_ABC_TOKEN_ADDRESS=xxx
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=xxx
```

### Backend Service Architecture
```
GitHub Webhook → Validate Commit → Check User Eligibility → 
Send ABC Reward → Post Farcaster Cast → Update Database
```

### Database Schema
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  farcaster_fid INTEGER UNIQUE,
  farcaster_username VARCHAR(255),
  github_username VARCHAR(255),
  wallet_address VARCHAR(42),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE commits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  commit_hash VARCHAR(40),
  repository VARCHAR(255),
  commit_message TEXT,
  reward_amount DECIMAL(18,2),
  cast_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE daily_stats (
  user_id INTEGER,
  date DATE,
  commit_count INTEGER,
  total_rewards DECIMAL(18,2),
  PRIMARY KEY (user_id, date)
);
```

### Security Considerations
- [ ] Rate limiting on webhook endpoints
- [ ] Commit hash verification to prevent replays
- [ ] Bot wallet security (multi-sig recommended)
- [ ] User verification through Farcaster signatures
- [ ] Input validation on all endpoints

### Monitoring & Analytics
- [ ] Treasury balance tracking
- [ ] Daily active developers
- [ ] Commit volume metrics
- [ ] Reward distribution analytics
- [ ] Bot posting success rates

---

## Launch Checklist

### Pre-Launch
- [ ] All contracts deployed and verified
- [ ] Frontend connected to mainnet contracts
- [ ] Bot account created and configured
- [ ] Database schema deployed
- [ ] Webhook service live and tested
- [ ] Initial ABC liquidity provided
- [ ] Team wallets have test ABC for staking

### Launch Day
- [ ] Monitor first transactions
- [ ] Verify treasury fee routing
- [ ] Check bot posting functionality
- [ ] Response team ready for issues
- [ ] Social media accounts ready
- [ ] Documentation links working

### Post-Launch (Week 1)
- [ ] Daily monitoring of all systems
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Bug fix deployments if needed
- [ ] Weekly leaderboard implementation
- [ ] Community building initiatives

---

## Success Metrics

### Week 1 Targets
- 10+ developers with 1M+ ABC staked
- 50+ commits tracked and rewarded
- 100+ Farcaster casts from @abcbot
- $1000+ ETH rewards distributed to stakers

### Month 1 Targets
- 100+ active developers
- 1000+ commits tracked
- $10,000+ trading volume
- Strong Farcaster community engagemen

### Long-term Goals
- Become the default way FC developers showcase workwe
- Sustainable reward economics
- Integration with major Farcaster projects
- Expansion beyond commit tracking

---

*Last Updated: October 8, 2025*
*Version: 1.0*