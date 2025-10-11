# ABC DAO Backend

Backend services for the ABC DAO developer rewards system.

## Features

- ✅ GitHub OAuth account linking
- ✅ Webhook processing for commit tracking  
- ✅ Automated ABC token rewards
- ✅ Farcaster bot integration
- ✅ Daily limits and anti-gaming
- ✅ Queue-based job processing
- ✅ PostgreSQL with auto-migrations
- ✅ User stats and leaderboards

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Start development server
npm run dev
```

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` - GitHub OAuth app
- `NEYNAR_API_KEY` - Farcaster bot API key
- `BOT_WALLET_PRIVATE_KEY` - Wallet for ABC rewards
- Contract addresses for ABC token, staking, treasury

### Railway Deployment

1. Connect GitHub repo to Railway
2. Add PostgreSQL and Redis services
3. Set environment variables in Railway dashboard
4. Deploy automatically on git push

## API Endpoints

### Authentication
- `POST /api/auth/github/authorize` - Generate GitHub OAuth URL
- `GET /api/auth/github/callback` - Handle OAuth callback

### Users  
- `GET /api/users/:fid/status` - Get user link status and stats
- `GET /api/users/:fid/commits` - Get user's commit history
- `POST /api/users/:fid/wallet` - Update user's wallet address
- `GET /api/users/leaderboard` - Get developer leaderboard

### Webhooks
- `POST /api/webhooks/github` - GitHub commit webhooks
- `POST /api/webhooks/test` - Test webhook (dev only)

### Rewards
- `GET /api/rewards/stats` - Overall reward statistics
- `GET /api/rewards/recent` - Recent reward activity
- `GET /api/rewards/daily-stats` - Daily stats for charts
- `GET /api/rewards/repositories` - Repository statistics

## Architecture

```
GitHub Commit → Webhook → Queue → Check Eligibility → Send ABC → Post Cast
                   ↓
               Database ← Update Stats ← Process Reward ← Redis Queue
```

## Queue Processing

1. **Reward Queue**: Processes commit rewards
   - Checks 1M ABC minimum stake
   - Enforces 10 commits/day limit
   - Sends random ABC amount (100-10k)
   - Updates database stats

2. **Cast Queue**: Posts to Farcaster
   - Celebrates successful commits
   - Includes reward amount and repository
   - Handles posting retries

## Database Schema

- `users` - Farcaster ↔ GitHub account mappings
- `commits` - Tracked commits and rewards
- `daily_stats` - Per-user daily statistics

## Development

```bash
# Run with auto-reload
npm run dev

# View queue dashboard
open http://localhost:3001/admin/queues

# Test webhook
curl -X POST http://localhost:3001/api/webhooks/test
```

## Production Deployment

1. **Railway Setup**:
   - PostgreSQL service
   - Redis service  
   - Web service (this backend)

2. **GitHub Setup**:
   - Create GitHub OAuth app
   - Set webhook URL to your Railway domain
   - Configure webhook secret

3. **Farcaster Setup**:
   - Create @abcbot account
   - Get Neynar API credentials
   - Configure signer UUID

4. **Smart Contracts**:
   - Deploy ABC token via Clanker
   - Deploy staking and treasury contracts
   - Fund bot wallet with ABC tokens