# ABC DAO
## Always. Be. Coding.

---

## THE VALUE

ABC DAO pays developers in ETH for shipping code. Join for 0.002 ETH, link your GitHub, and earn rewards automatically when you commit. No applications. No voting. Just code and get paid.

**Simple mechanics**: Stake $ABC → Earn ETH from trading fees + membership fees. Commit code → Earn $ABC tokens + Farcaster recognition.

## HOW IT WORKS

1. **Join the DAO** - Pay 0.002 ETH membership fee
2. **Link GitHub** - Connect your repositories to your Farcaster account  
3. **Stake $ABC** - Buy and stake tokens to unlock commit rewards
4. **Ship code** - Every public commit earns $ABC tokens
5. **Earn ETH** - Stakers split all trading fees and membership revenue

The ABC Bot monitors your commits and posts celebrations on Farcaster while distributing rewards automatically.

## ECONOMICS

**Token**: $ABC on Base (Clanker v4)  
**Membership**: 0.002 ETH one-time fee  
**Revenue Split**: 50% bot wallet, 50% deployer wallet  

### Revenue Flows
- **Trading fees** → 50% to stakers as ETH rewards
- **Membership fees** → 100% to stakers as ETH rewards  
- **Developer rewards** → $ABC from bot wallet reserves

### Incentive Alignment
Stakers fund the reward pool and earn ETH. Developers earn $ABC for commits. More activity = more trading = more rewards for everyone.

## COMMIT REWARDS

**Requirements**: Paid membership + $ABC staked  
**Trigger**: Any public GitHub commit  
**Reward**: 10 $ABC per commit (max 10/day)  
**Recognition**: Automatic Farcaster cast by ABC Bot  

### Reward Rules
- Public repositories only
- Must have active $ABC stake
- Daily limit prevents spam
- All programming languages count
- No minimum commit size

## TECHNICAL IMPLEMENTATION

### Smart Contracts
- **$ABC Token**: Clanker v4 deployment on Base
- **Staking Contract**: ETH distribution to $ABC stakers
- **Revenue routing**: 50/50 split configured in token

### Infrastructure
- **Frontend**: abc.epicdylan.com (Cloudflare + Next.js)
- **Backend**: Railway (PostgreSQL + Redis)
- **GitHub Integration**: Webhook-based commit detection
- **Farcaster Bot**: Neynar API for automated posting

### Data Flow
1. **User joins** → Database record created → GitHub account linked
2. **User commits** → GitHub webhook → Reward calculation → $ABC transfer
3. **Bot posts** → Farcaster cast → Community recognition
4. **Revenue flows** → ETH to staking contract → Distributed to stakers

## SECURITY & OPERATION

### Contract Security
- **Staking contract**: OpenZeppelin v5 libraries (ReentrancyGuard, Pausable)
- **Architecture**: Based on Synthetix StakingRewards (battle-tested)
- **Unbonding period**: 7 days to prevent flash-loan attacks
- **Emergency controls**: Pause functionality for critical issues

### Operational Security
- **GitHub webhook verification**: HMAC signature validation
- **Rate limiting**: 10 commits max per user per day
- **Sybil resistance**: One Farcaster account per GitHub account
- **Public repos only**: Prevents private code gaming

### Economic Security
- **Fixed rewards**: 10 $ABC per commit (no inflation)
- **Revenue-backed**: ETH rewards funded by real activity
- **Membership barrier**: 0.002 ETH prevents spam signups
- **Sustainable model**: No reliance on external funding

## ADDRESSES

**Frontend**: [abc.epicdylan.com](https://abc.epicdylan.com)  
**Network**: Base Mainnet  
**Token**: $ABC (`0x5c0872b790bb73e2b3a9778db6e7704095624b07`)  
**Staking**: (`0x577822396162022654D5bDc9CB58018cB53e7017`)

---

*Always. Be. Coding. • October 2025*