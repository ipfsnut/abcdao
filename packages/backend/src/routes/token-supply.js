import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

// Token Supply Breakdown
router.get('/supply', async (req, res) => {
  try {
    const TOTAL_SUPPLY = 100_000_000_000; // 100B tokens
    const DEV_LOCKUP = 5_000_000_000;     // 5B tokens (5%)
    const CLANKER_POOL = 47_500_000_000;  // 47.5B tokens
    
    // Initialize provider for contract calls
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    
    // Get dynamic balances (mock for now - replace with actual contract calls)
    let totalStaked = 2_500_000_000;      // 2.5B tokens staked
    let botWallet = 2_500_000_000;        // 2.5B tokens in treasury
    
    try {
      // TODO: Replace with actual contract calls
      // const stakingContract = new ethers.Contract(STAKING_ADDRESS, stakingABI, provider);
      // totalStaked = await stakingContract.totalStaked();
      
      // const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenABI, provider);  
      // botWallet = await tokenContract.balanceOf(BOT_WALLET_ADDRESS);
    } catch (contractError) {
      console.warn('Using mock contract data:', contractError.message);
    }
    
    // Calculate circulating supply
    const circulating = TOTAL_SUPPLY - CLANKER_POOL - DEV_LOCKUP - totalStaked - botWallet;
    
    // Build response
    const breakdown = {
      circulating: {
        amount: circulating,
        percentage: (circulating / TOTAL_SUPPLY) * 100,
        color: "#22c55e",
        label: "Circulating",
        description: "Available for trading and transfers",
        locked: false
      },
      staked: {
        amount: totalStaked,
        percentage: (totalStaked / TOTAL_SUPPLY) * 100,
        color: "#3b82f6",
        label: "Staked", 
        description: "Earning ETH rewards in staking contract",
        locked: true
      },
      bot_wallet: {
        amount: botWallet,
        percentage: (botWallet / TOTAL_SUPPLY) * 100,
        color: "#8b5cf6",
        label: "Treasury",
        description: "Reserved for developer rewards",
        locked: false
      },
      dev_lockup: {
        amount: DEV_LOCKUP,
        percentage: (DEV_LOCKUP / TOTAL_SUPPLY) * 100,
        color: "#eab308",
        label: "Development",
        description: "Team allocation with vesting schedule",
        locked: true
      },
      clanker_pool: {
        amount: CLANKER_POOL,
        percentage: (CLANKER_POOL / TOTAL_SUPPLY) * 100,
        color: "#6b7280",
        label: "Clanker Pool",
        description: "Locked liquidity (not circulating)",
        locked: true
      }
    };
    
    res.json({
      total_supply: TOTAL_SUPPLY,
      circulating_supply: circulating,
      breakdown,
      last_updated: new Date().toISOString(),
      data_sources: {
        staked: "Mock data - TODO: Connect staking contract",
        bot_wallet: "Mock data - TODO: Connect token contract", 
        dev_lockup: "Static allocation",
        clanker_pool: "Static allocation"
      }
    });
    
  } catch (error) {
    console.error('Error fetching token supply:', error);
    res.status(500).json({ error: 'Failed to fetch token supply data' });
  }
});

// Historical supply data (future endpoint)
router.get('/supply/history', async (req, res) => {
  const { period = '30d' } = req.query;
  
  try {
    // TODO: Implement historical tracking
    res.json({
      message: "Historical supply data - coming soon",
      period,
      data: []
    });
  } catch (error) {
    console.error('Error fetching supply history:', error);
    res.status(500).json({ error: 'Failed to fetch supply history' });
  }
});

export default router;