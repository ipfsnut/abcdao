# ABC Staking Subgraph

A complete subgraph for indexing staking events from the ABC DAO staking contract on Base network.

## 🎯 What This Solves

**Before**: Manual blockchain scanning, RPC rate limits, incomplete staker discovery  
**After**: Efficient GraphQL queries, complete event history, real-time staker data

## 📁 Project Structure

```
subgraph/
├── package.json           # Dependencies and scripts
├── subgraph.yaml          # Subgraph configuration
├── schema.graphql         # Data schema definition
├── abis/
│   └── ABCStaking.json    # Contract ABI
├── src/
│   └── abc-staking.ts     # Event mapping logic
├── DEPLOYMENT_GUIDE.md    # Step-by-step deployment
├── deploy.sh             # Automated deployment script
├── test-queries.graphql   # Example GraphQL queries
└── README.md             # This file
```

## 🚀 Quick Deployment

1. **Create subgraph in [The Graph Studio](https://thegraph.com/studio/)**
2. **Run deployment script:**
   ```bash
   cd subgraph
   ./deploy.sh
   ```
3. **Update backend configuration:**
   ```env
   SUBGRAPH_URL=https://api.studio.thegraph.com/query/[YOUR_ID]/abc-staking/[VERSION]
   USE_SUBGRAPH=true
   ```

## 📊 Data Schema

### Entities

- **Staker**: Individual staker with current and historical data
- **StakeEvent**: Individual stake transactions  
- **UnstakeEvent**: Individual unstake transactions
- **RewardsClaimedEvent**: Reward claim transactions
- **StakingStats**: Global staking statistics

### Key Queries

```graphql
# Get all active stakers
{
  stakers(where: { isActive: true }) {
    address
    currentStake
    totalStaked
    totalRewardsClaimed
  }
}

# Get staking overview
{
  stakingStats(id: "global") {
    totalStakers
    totalStaked
    totalRewardsDistributed
  }
}
```

## 🔧 Backend Integration

The subgraph integrates with our backend through:

- **SubgraphService**: GraphQL query abstraction
- **StakingService**: Unified API with blockchain fallback
- **API Routes**: Updated `/api/staking/overview` endpoint

## ⚡ Performance Benefits

- **Query Speed**: GraphQL vs RPC calls (10x-100x faster)
- **Data Completeness**: Full event history from contract deployment
- **Real-time Updates**: Automatic indexing of new events
- **Rate Limits**: No more RPC throttling issues

## 🧪 Testing

After deployment, test with:

```bash
node test-subgraph-integration.js
```

## 📈 Expected Results

Once deployed and synced, you'll see:

- **Accurate Staker Count**: Real number of active stakers
- **Complete Event History**: All stakes, unstakes, and rewards
- **Fast Queries**: Sub-second response times
- **Reliable Data**: No more sync issues between blockchain and database

## 🔗 Contract Details

- **Address**: `0x577822396162022654D5bDc9CB58018cB53e7017`
- **Network**: Base Mainnet  
- **Start Block**: `37000000`
- **Events**: Staked, Unstaked, RewardsClaimed

## 📚 Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [Subgraph Studio](https://thegraph.com/studio/)
- [GraphQL Tutorial](https://graphql.org/learn/)
- [Base Network Info](https://base.org/)