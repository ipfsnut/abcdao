/**
 * Unified Staking Service
 * 
 * Combines The Graph subgraph data with direct blockchain queries for staking information.
 * Provides a clean API that abstracts the data source complexity.
 */

import { ethers } from 'ethers';
import { getPool } from './database.js';
import { subgraphService } from './subgraph-service.js';

export class StakingService {
  constructor() {
    this.stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.useSubgraph = process.env.USE_SUBGRAPH === 'true' || false;
    
    // Staking contract instance
    this.stakingABI = [
      {
        "type": "function",
        "name": "totalStaked",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "getStakeInfo",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [
          {"name": "amount", "type": "uint256", "internalType": "uint256"},
          {"name": "lastStakeTime", "type": "uint256", "internalType": "uint256"},
          {"name": "totalEthEarned", "type": "uint256", "internalType": "uint256"},
          {"name": "pendingEth", "type": "uint256", "internalType": "uint256"}
        ],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "getUnbondingInfo",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [{
          "name": "", 
          "type": "tuple[]", 
          "internalType": "struct ABCStakingV2.UnbondingInfo[]",
          "components": [
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
            {"name": "releaseTime", "type": "uint256", "internalType": "uint256"}
          ]
        }],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "getWithdrawableAmount",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      }
    ];
    
    this.contract = new ethers.Contract(this.stakingContractAddress, this.stakingABI, this.provider);
  }

  /**
   * Get all active stakers - uses subgraph if available, falls back to database/blockchain
   */
  async getActiveStakers() {
    try {
      if (this.useSubgraph) {
        const subgraphHealth = await subgraphService.healthCheck();
        if (subgraphHealth.isHealthy) {
          const result = await subgraphService.getActiveStakers();
          return this.formatStakersFromSubgraph(result.stakers);
        }
      }
      
      // Fallback to direct blockchain + database approach
      return await this.getActiveStakersFromBlockchain();
      
    } catch (error) {
      console.error('Error getting active stakers:', error);
      // Final fallback - return empty array to prevent crashes
      return [];
    }
  }

  /**
   * Get staking overview statistics
   */
  async getStakingOverview() {
    try {
      if (this.useSubgraph) {
        const subgraphHealth = await subgraphService.healthCheck();
        if (subgraphHealth.isHealthy) {
          const overview = await subgraphService.getStakingOverview();
          return {
            totalStakers: overview.totalStakers,
            totalStaked: overview.totalStaked,
            totalRewardsDistributed: overview.totalRewardsDistributed,
            lastUpdated: new Date(parseInt(overview.lastUpdated) * 1000)
          };
        }
      }
      
      // Fallback to direct blockchain approach
      return await this.getOverviewFromBlockchain();
      
    } catch (error) {
      console.error('Error getting staking overview:', error);
      return {
        totalStakers: 0,
        totalStaked: 0,
        totalRewardsDistributed: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Direct blockchain approach - gets total staked from contract
   * and counts known stakers from database if available
   */
  async getOverviewFromBlockchain() {
    const pool = getPool();
    
    // Get total staked from contract
    const totalStaked = await this.contract.totalStaked();
    const totalStakedFormatted = parseFloat(ethers.formatEther(totalStaked));
    
    // Try to get staker count from database
    let totalStakers = 0;
    try {
      const stakersResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM staker_positions 
        WHERE is_active = true AND staked_amount > 0
      `);
      totalStakers = parseInt(stakersResult.rows[0]?.count) || 0;
    } catch (dbError) {
      console.warn('Could not get staker count from database:', dbError.message);
    }
    
    // Get total rewards distributed from database
    let totalRewardsDistributed = 0;
    try {
      const rewardsResult = await pool.query(`
        SELECT COALESCE(SUM(eth_amount), 0) as total
        FROM eth_distributions 
        WHERE status = 'completed'
      `);
      totalRewardsDistributed = parseFloat(rewardsResult.rows[0]?.total) || 0;
    } catch (dbError) {
      console.warn('Could not get rewards total from database:', dbError.message);
    }
    
    return {
      totalStakers,
      totalStaked: totalStakedFormatted,
      totalRewardsDistributed,
      lastUpdated: new Date()
    };
  }

  /**
   * Get active stakers using direct blockchain queries
   */
  async getActiveStakersFromBlockchain() {
    const pool = getPool();
    const stakers = [];
    
    try {
      // Try to get known stakers from database first
      const stakersResult = await pool.query(`
        SELECT wallet_address, staked_amount, last_stake_time
        FROM staker_positions 
        WHERE is_active = true AND staked_amount > 0
        ORDER BY staked_amount DESC
      `);
      
      // Verify each staker's current position on-chain
      for (const row of stakersResult.rows) {
        try {
          const stakeInfo = await this.contract.getStakeInfo(row.wallet_address);
          const currentStake = parseFloat(ethers.formatEther(stakeInfo[0]));
          
          if (currentStake > 0) {
            stakers.push({
              address: row.wallet_address,
              currentStake,
              lastStakeTime: stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null,
              totalEthEarned: parseFloat(ethers.formatEther(stakeInfo[2])),
              pendingEth: parseFloat(ethers.formatEther(stakeInfo[3]))
            });
          }
        } catch (contractError) {
          console.warn(`Error checking stake for ${row.wallet_address}:`, contractError.message);
        }
      }
      
      // If database is empty or has no stakers, check known wallet addresses
      if (stakers.length === 0) {
        const knownWallets = [
          process.env.PROTOCOL_WALLET_ADDRESS || process.env.BOT_WALLET_PRIVATE_KEY && new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY).address,
          '0xBE6525b767cA8D38d169C93C8120c0C0957388B8', // Protocol wallet
          '0x3427b4716B90C11F9971e43999a48A47Cf5B571E'  // Another known address
        ].filter(Boolean); // Remove any undefined values
        
        console.log('Database has no stakers, checking known wallets:', knownWallets);
        
        for (const address of knownWallets) {
          try {
            const stakeInfo = await this.contract.getStakeInfo(address);
            const currentStake = parseFloat(ethers.formatEther(stakeInfo[0]));
            
            if (currentStake > 0) {
              stakers.push({
                address,
                currentStake,
                lastStakeTime: stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null,
                totalEthEarned: parseFloat(ethers.formatEther(stakeInfo[2])),
                pendingEth: parseFloat(ethers.formatEther(stakeInfo[3]))
              });
              console.log(`Found active staker: ${address} with ${currentStake.toLocaleString()} ABC`);
            }
          } catch (contractError) {
            console.warn(`Error checking known wallet ${address}:`, contractError.message);
          }
        }
      }
      
      return stakers;
      
    } catch (dbError) {
      console.warn('Could not query database for stakers:', dbError.message);
      
      // Fallback: check known wallets directly
      return await this.checkKnownWallets();
    }
  }

  /**
   * Check known wallet addresses for staking activity
   */
  async checkKnownWallets() {
    const knownWallets = [
      process.env.PROTOCOL_WALLET_ADDRESS || (process.env.BOT_WALLET_PRIVATE_KEY && new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY).address),
      '0xBE6525b767cA8D38d169C93C8120c0C0957388B8', // Protocol wallet
      '0x3427b4716B90C11F9971e43999a48A47Cf5B571E'  // Another known address
    ].filter(Boolean); // Remove any undefined values
    
    const stakers = [];
    
    for (const address of knownWallets) {
      try {
        const stakeInfo = await this.contract.getStakeInfo(address);
        const currentStake = parseFloat(ethers.formatEther(stakeInfo[0]));
        
        if (currentStake > 0) {
          stakers.push({
            address,
            currentStake,
            lastStakeTime: stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null,
            totalEthEarned: parseFloat(ethers.formatEther(stakeInfo[2])),
            pendingEth: parseFloat(ethers.formatEther(stakeInfo[3]))
          });
        }
      } catch (contractError) {
        console.warn(`Error checking known wallet ${address}:`, contractError.message);
      }
    }
    
    return stakers;
  }

  /**
   * Format stakers data from subgraph response
   */
  formatStakersFromSubgraph(stakers) {
    return stakers.map(staker => ({
      address: staker.address,
      currentStake: parseFloat(ethers.formatEther(staker.currentStake)),
      totalStaked: parseFloat(ethers.formatEther(staker.totalStaked)),
      totalUnstaked: parseFloat(ethers.formatEther(staker.totalUnstaked)),
      totalRewardsClaimed: parseFloat(ethers.formatEther(staker.totalRewardsClaimed)),
      firstStakeTime: new Date(parseInt(staker.firstStakeTime) * 1000),
      lastStakeTime: new Date(parseInt(staker.lastStakeTime) * 1000),
      lastUnstakeTime: staker.lastUnstakeTime ? new Date(parseInt(staker.lastUnstakeTime) * 1000) : null
    }));
  }

  /**
   * Get staker details by address
   */
  async getStakerDetails(address) {
    try {
      if (this.useSubgraph) {
        const subgraphHealth = await subgraphService.healthCheck();
        if (subgraphHealth.isHealthy) {
          const result = await subgraphService.getStakerDetails(address);
          if (result.staker) {
            return this.formatStakersFromSubgraph([result.staker])[0];
          }
        }
      }
      
      // Fallback to direct contract query
      const stakeInfo = await this.contract.getStakeInfo(address);
      const currentStake = parseFloat(ethers.formatEther(stakeInfo[0]));
      
      if (currentStake === 0) {
        return null;
      }
      
      return {
        address,
        currentStake,
        lastStakeTime: stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null,
        totalEthEarned: parseFloat(ethers.formatEther(stakeInfo[2])),
        pendingEth: parseFloat(ethers.formatEther(stakeInfo[3]))
      };
      
    } catch (error) {
      console.error(`Error getting staker details for ${address}:`, error);
      return null;
    }
  }

  /**
   * Check if subgraph is available and healthy
   */
  async isSubgraphAvailable() {
    if (!this.useSubgraph) return false;
    
    try {
      const health = await subgraphService.healthCheck();
      return health.isHealthy;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get aggregate unbonding data across all known stakers
   */
  async getUnbondingOverview() {
    try {
      // Get all known stakers (including those who may have unstaked)
      const pool = getPool();
      const allKnownStakers = [];
      
      // Get stakers from database
      try {
        const stakersResult = await pool.query(`
          SELECT DISTINCT wallet_address 
          FROM staker_positions 
          ORDER BY wallet_address
        `);
        allKnownStakers.push(...stakersResult.rows.map(row => row.wallet_address));
      } catch (dbError) {
        console.warn('Could not get stakers from database:', dbError.message);
      }
      
      // Add hardcoded known addresses (in case database is incomplete)
      const knownWallets = [
        process.env.PROTOCOL_WALLET_ADDRESS || (process.env.BOT_WALLET_PRIVATE_KEY && new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY).address),
        '0xBE6525b767cA8D38d169C93C8120c0C0957388B8', // Protocol wallet
        '0x3427b4716B90C11F9971e43999a48A47Cf5B571E', // Another known address
        // Discovered addresses from populate script
        '0x18A85ad341b2D6A2bd67fbb104B4827B922a2A3c',
        '0x7E02c2dA4910531B7D6E8b6bDaFb69d13C71dB1d', 
        '0xB6754E53Ce15dF43269F59f21C9c235F1f673d67',
        '0xbF7dBd0313C9C185292feaF528a977BB7954062C',
        '0xC2771d8De241fCc2304d4c0e4574b1F41B388527',
        '0xc634E11751d3c154bf23D2965ef76C41B832C156'
      ].filter(Boolean);
      
      // Combine and deduplicate
      const uniqueStakers = [...new Set([...allKnownStakers, ...knownWallets])];
      
      let totalUnbonding = 0;
      let totalWithdrawable = 0;
      let stakersWithUnbonding = 0;
      
      console.log(`Checking unbonding status for ${uniqueStakers.length} known stakers...`);
      
      for (const address of uniqueStakers) {
        try {
          // Get unbonding info
          const unbondingInfo = await this.contract.getUnbondingInfo(address);
          const withdrawableAmount = await this.contract.getWithdrawableAmount(address);
          
          if (unbondingInfo && Array.isArray(unbondingInfo) && unbondingInfo.length > 0) {
            const stakerUnbonding = unbondingInfo.reduce((sum, info) => {
              return sum + parseFloat(ethers.formatEther(info.amount));
            }, 0);
            
            if (stakerUnbonding > 0) {
              totalUnbonding += stakerUnbonding;
              stakersWithUnbonding++;
            }
          }
          
          if (withdrawableAmount && withdrawableAmount > 0) {
            totalWithdrawable += parseFloat(ethers.formatEther(withdrawableAmount));
          }
          
        } catch (contractError) {
          console.warn(`Error checking unbonding for ${address}:`, contractError.message);
        }
      }
      
      return {
        totalUnbonding,
        totalWithdrawable,
        stakersWithUnbonding,
        totalPendingSell: totalUnbonding + totalWithdrawable, // Total that could hit market
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Error getting unbonding overview:', error);
      return {
        totalUnbonding: 0,
        totalWithdrawable: 0,
        stakersWithUnbonding: 0,
        totalPendingSell: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Enable or disable subgraph usage
   */
  setSubgraphUsage(enabled) {
    this.useSubgraph = enabled;
  }
}

// Export singleton instance
export const stakingService = new StakingService();