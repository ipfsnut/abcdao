# ABC Staking Subgraph Deployment Guide

## Prerequisites
- Node.js and npm installed
- MetaMask or other Web3 wallet
- The Graph CLI installed globally

## Step 1: Create Subgraph in Studio

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet (MetaMask recommended)
3. Click "Create a subgraph"
4. Fill in details:
   - **Name**: `abc-staking`
   - **Subtitle**: `ABC DAO Staking Contract Events`
   - **Description**: `Tracks staking events for the ABC DAO staking contract on Base network`
   - **Image**: Upload ABC DAO logo if available
5. Click "Create subgraph"
6. **Important**: Copy your subgraph slug (ID) from the URL or dashboard

## Step 2: Get Your Deploy Key

1. On your subgraph page in Studio, find the "Deploy Key" section
2. Copy the deploy key - it looks like: `1234567890abcdef...`
3. **Important**: Keep this secure - it's used to deploy your subgraph

## Step 3: Deploy Commands

Run these commands from the `packages/backend/subgraph` directory:

```bash
# 1. Authenticate with The Graph Studio
graph auth --studio <YOUR_DEPLOY_KEY>

# 2. Build the subgraph (we already did this)
npm run build

# 3. Deploy to Studio
graph deploy --studio <YOUR_SUBGRAPH_SLUG>
```

When prompted for version, use: `0.1.0`

## Step 4: Monitor Deployment

1. After deployment, go back to your subgraph in Studio
2. Check the "Logs" tab for any indexing errors
3. Wait for sync to complete (can take several minutes)
4. Test queries in the "Playground" tab

## Step 5: Update Backend Configuration

Once deployed successfully:

1. Copy your subgraph query URL from Studio
2. Update the backend `.env` file:
   ```
   SUBGRAPH_URL=https://api.studio.thegraph.com/query/[YOUR_ID]/abc-staking/[VERSION]
   USE_SUBGRAPH=true
   ```

## Example Queries to Test

Once deployed, test these queries in the Studio playground:

### Get Active Stakers
```graphql
{
  stakers(where: { isActive: true }) {
    id
    address
    currentStake
    totalStaked
    totalRewardsClaimed
  }
}
```

### Get Recent Stake Events
```graphql
{
  stakeEvents(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    staker {
      address
    }
    amount
    timestamp
    blockNumber
  }
}
```

## Troubleshooting

- **Build Errors**: Check ABI format and schema syntax
- **Sync Issues**: Verify contract address and start block
- **Network Issues**: Confirm Base network is selected
- **Authentication**: Ensure deploy key is correct

## Our Subgraph Details

- **Contract**: `0x577822396162022654D5bDc9CB58018cB53e7017`
- **Network**: Base Mainnet
- **Start Block**: `37000000` (approximate)
- **Events**: Staked, Unstaked, RewardsClaimed