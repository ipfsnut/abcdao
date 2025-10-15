import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

// Contract addresses and ABIs
const CONTRACTS = {
  ABC_TOKEN: {
    address: '0x5c0872b790bb73e2b3a9778db6e7704095624b07',
    abi: [
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  },
  ABC_STAKING: {
    address: '0x577822396162022654D5bDc9CB58018cB53e7017',
    abi: [
      {
        "type": "function",
        "name": "totalStaked",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      }
    ]
  }
};

// Token Supply Breakdown
router.get('/supply', async (req, res) => {
  try {
    // Initialize provider for contract calls
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    
    // Bot wallet address
    const BOT_WALLET_ADDRESS = process.env.BOT_WALLET_ADDRESS || '0xcCBE95Ab1E3ECfb73cFeA072460E24D5054c28B2';
    
    // Real Clanker pool manager address (largest holder from BaseScan)
    const CLANKER_POOL_MANAGER = '0x498581fF718922c3f8e6A244956aF099B2652b2b';
    
    // Get dynamic balances from contracts
    let TOTAL_SUPPLY = 100_000_000_000; // Default
    let totalStaked = 0;
    let botWallet = 0;
    let clankerPool = 0;
    const DEV_LOCKUP = 5_000_000_000; // Fixed 5B tokens (5%)
    let dataSource = 'Live blockchain data';
    
    try {
      const tokenContract = new ethers.Contract(
        CONTRACTS.ABC_TOKEN.address,
        CONTRACTS.ABC_TOKEN.abi,
        provider
      );
      
      // Get actual total supply from contract
      const totalSupplyRaw = await tokenContract.totalSupply();
      TOTAL_SUPPLY = Number(ethers.formatEther(totalSupplyRaw));
      
      // Get total staked from staking contract
      const stakingContract = new ethers.Contract(
        CONTRACTS.ABC_STAKING.address,
        CONTRACTS.ABC_STAKING.abi,
        provider
      );
      const stakedRaw = await stakingContract.totalStaked();
      totalStaked = Number(ethers.formatEther(stakedRaw));
      
      // Get bot wallet balance
      const botBalanceRaw = await tokenContract.balanceOf(BOT_WALLET_ADDRESS);
      botWallet = Number(ethers.formatEther(botBalanceRaw));
      
      // Get actual Clanker pool manager balance (largest holder)
      const poolManagerBalanceRaw = await tokenContract.balanceOf(CLANKER_POOL_MANAGER);
      clankerPool = Number(ethers.formatEther(poolManagerBalanceRaw));
      
      console.log(`📊 Live data: Supply=${TOTAL_SUPPLY.toLocaleString()}, Staked=${totalStaked.toLocaleString()}, Treasury=${botWallet.toLocaleString()}, Pool=${clankerPool.toLocaleString()}`);
      
    } catch (contractError) {
      console.warn('Failed to fetch live contract data, using fallback:', contractError.message);
      // Fallback to reasonable estimates based on known data
      TOTAL_SUPPLY = 100_000_000_000;
      totalStaked = 171_000_000;        // Based on real data we saw
      botWallet = 100_000_000;          // Based on real data we saw  
      clankerPool = 94_000_000_000;     // Based on real pool manager balance
      dataSource = 'Fallback estimates (contract error)';
    }
    
    // Calculate circulating supply (total supply minus pool tokens)
    // Pool tokens are locked in DEX, everything else is circulating
    const circulating = Math.max(0, TOTAL_SUPPLY - clankerPool);
    
    // Calculate liquid tokens (everything not locked)
    const liquid = Math.max(0, TOTAL_SUPPLY - clankerPool - DEV_LOCKUP - botWallet - totalStaked);
    
    // Build response with correct categorization
    const breakdown = {
      liquid: {
        amount: liquid,
        percentage: (liquid / TOTAL_SUPPLY) * 100,
        color: "#22c55e",
        label: "Liquid",
        description: "Held by users, freely tradeable",
        locked: false,
        circulating: true
      },
      clanker_pool: {
        amount: clankerPool,
        percentage: (clankerPool / TOTAL_SUPPLY) * 100,
        color: "#6b7280",
        label: "Clanker DEX Pool",
        description: "Locked in DEX pool",
        locked: true,
        circulating: false
      },
      treasury: {
        amount: botWallet,
        percentage: (botWallet / TOTAL_SUPPLY) * 100,
        color: "#3b82f6",
        label: "Treasury Lock",
        description: "Protocol rewards pool",
        locked: true,
        circulating: false
      },
      staked: {
        amount: totalStaked,
        percentage: (totalStaked / TOTAL_SUPPLY) * 100,
        color: "#8b5cf6",
        label: "Staking Lock", 
        description: "Locked in staking contract, earning ETH rewards",
        locked: true,
        circulating: false
      },
      dev_lockup: {
        amount: DEV_LOCKUP,
        percentage: (DEV_LOCKUP / TOTAL_SUPPLY) * 100,
        color: "#eab308",
        label: "Development Lock",
        description: "Protocol allocation",
        locked: true,
        circulating: false
      }
    };
    
    res.json({
      total_supply: TOTAL_SUPPLY,
      circulating_supply: circulating,
      breakdown,
      last_updated: new Date().toISOString(),
      data_sources: {
        total_supply: dataSource === 'Live blockchain data' ? "Token contract totalSupply()" : dataSource,
        staked: dataSource === 'Live blockchain data' ? "Staking contract: 0x577822..." : dataSource,
        treasury: dataSource === 'Live blockchain data' ? "Token balanceOf(treasury wallet)" : dataSource,
        clanker_pool: dataSource === 'Live blockchain data' ? "Token balanceOf(pool manager): 0x498581..." : dataSource,
        dev_lockup: "Fixed 5% team allocation",
        circulating_supply: "Calculated: Total - Clanker Pool",
        liquid: "Calculated: Total - (Clanker Pool + Treasury + Staked + Development Locks)"
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