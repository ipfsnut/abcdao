import { ethers } from 'ethers';
import { getPool } from './database.js';

/**
 * Treasury Service
 * Manages treasury data collection, caching, and API responses
 */
export class TreasuryService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    this.treasuryAddress = process.env.TREASURY_WALLET_ADDRESS || process.env.BOT_WALLET_PRIVATE_KEY ? 
      new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY).address : 
      '0x48D87BE38677Ad764203b5516900691Cbd8C7042';
    
    // Contract addresses
    this.stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    this.abcTokenAddress = process.env.ABC_TOKEN_ADDRESS;
    this.rewardsContractAddress = process.env.REWARDS_CONTRACT_ADDRESS;
    
    // Contract ABIs
    this.erc20ABI = [
      'function balanceOf(address) external view returns (uint256)',
      'function totalSupply() external view returns (uint256)',
      'function name() external view returns (string)',
      'function symbol() external view returns (string)',
      'function decimals() external view returns (uint8)'
    ];
    
    this.stakingABI = [
      'function totalStaked() external view returns (uint256)',
      'function totalRewardsDistributed() external view returns (uint256)',
      'function getStakeInfo(address) external view returns (uint256, uint256, uint256, uint256)',
      'function pendingRewards(address) external view returns (uint256)'
    ];
  }

  /**
   * Get current treasury snapshot from blockchain
   */
  async getCurrentSnapshot() {
    try {
      console.log('🏦 Fetching treasury snapshot from blockchain...');
      
      // Get ETH balance
      const ethBalance = await this.provider.getBalance(this.treasuryAddress);
      
      // Get ABC token balance if available
      let abcBalance = '0';
      if (this.abcTokenAddress && this.abcTokenAddress !== '0x...') {
        try {
          const abcContract = new ethers.Contract(this.abcTokenAddress, this.erc20ABI, this.provider);
          const balance = await abcContract.balanceOf(this.treasuryAddress);
          abcBalance = ethers.formatUnits(balance, 18);
        } catch (error) {
          console.warn('⚠️ ABC token balance check failed:', error.message);
          abcBalance = 'N/A';
        }
      }
      
      // Get staking contract data
      let stakingBalance = '0';
      let totalEthDistributed = '0';
      if (this.stakingContractAddress) {
        try {
          const stakingContract = new ethers.Contract(this.stakingContractAddress, this.stakingABI, this.provider);
          const [totalStaked, totalRewards] = await Promise.all([
            stakingContract.totalStaked(),
            stakingContract.totalRewardsDistributed()
          ]);
          stakingBalance = ethers.formatUnits(totalStaked, 18);
          totalEthDistributed = ethers.formatEther(totalRewards);
        } catch (error) {
          console.warn('⚠️ Staking contract data failed:', error.message);
        }
      }
      
      // Get rewards contract balance if available
      let rewardsBalance = '0';
      if (this.rewardsContractAddress && this.abcTokenAddress) {
        try {
          const abcContract = new ethers.Contract(this.abcTokenAddress, this.erc20ABI, this.provider);
          const balance = await abcContract.balanceOf(this.rewardsContractAddress);
          rewardsBalance = ethers.formatUnits(balance, 18);
        } catch (error) {
          console.warn('⚠️ Rewards contract balance check failed:', error.message);
        }
      }
      
      // Get total ABC distributed from database
      let totalAbcDistributed = '0';
      try {
        const pool = getPool();
        const result = await pool.query(`
          SELECT COALESCE(SUM(reward_amount), 0) as total
          FROM commits 
          WHERE reward_amount IS NOT NULL
        `);
        totalAbcDistributed = result.rows[0].total.toString();
      } catch (error) {
        console.warn('⚠️ Database ABC distributed query failed:', error.message);
      }
      
      const snapshot = {
        treasuryAddress: this.treasuryAddress,
        ethBalance: ethers.formatEther(ethBalance),
        abcBalance,
        stakingBalance,
        rewardsBalance,
        totalAbcDistributed,
        totalEthDistributed,
        lastUpdated: new Date().toISOString(),
        stakingContractAddress: this.stakingContractAddress,
        rewardsContractAddress: this.rewardsContractAddress,
        abcTokenAddress: this.abcTokenAddress
      };
      
      console.log('✅ Treasury snapshot collected:', {
        treasury: `${snapshot.abcBalance} ABC, ${snapshot.ethBalance} ETH`,
        staking: `${stakingBalance} ABC staked`,
        distributed: `${totalAbcDistributed} ABC, ${totalEthDistributed} ETH`
      });
      
      return snapshot;
      
    } catch (error) {
      console.error('❌ Treasury snapshot failed:', error);
      throw error;
    }
  }

  /**
   * Store treasury snapshot in database
   */
  async storeSnapshot(snapshot) {
    try {
      const pool = getPool();
      
      await pool.query(`
        INSERT INTO treasury_snapshots (
          treasury_abc_balance,
          treasury_eth_balance,
          staking_contract_balance,
          rewards_contract_balance,
          total_abc_distributed,
          total_eth_distributed,
          abc_price_usd,
          snapshot_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        parseFloat(snapshot.abcBalance || 0),
        parseFloat(snapshot.ethBalance || 0),
        parseFloat(snapshot.stakingBalance || 0),
        parseFloat(snapshot.rewardsBalance || 0),
        parseFloat(snapshot.totalAbcDistributed || 0),
        parseFloat(snapshot.totalEthDistributed || 0),
        0 // ABC price - TODO: implement price fetching
      ]);
      
      console.log('✅ Treasury snapshot stored in database');
      
    } catch (error) {
      console.error('❌ Failed to store treasury snapshot:', error);
      // Don't throw - allow API to return data even if storage fails
    }
  }

  /**
   * Get treasury statistics from database
   */
  async getTreasuryStats() {
    try {
      const pool = getPool();
      
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_snapshots,
          MAX(treasury_abc_balance + staking_contract_balance + rewards_contract_balance) as peak_value,
          MIN(treasury_abc_balance + staking_contract_balance + rewards_contract_balance) as minimum_value,
          AVG(treasury_abc_balance + staking_contract_balance + rewards_contract_balance) as average_value,
          MAX(snapshot_time) as last_snapshot
        FROM treasury_snapshots
        WHERE snapshot_time >= NOW() - INTERVAL '30 days'
      `);
      
      const stats = result.rows[0];
      
      return {
        statistics: {
          totalSnapshots: parseInt(stats.total_snapshots || 0),
          peakValue: parseFloat(stats.peak_value || 0),
          minimumValue: parseFloat(stats.minimum_value || 0),
          averageValue: parseFloat(stats.average_value || 0)
        },
        lastUpdated: stats.last_snapshot || new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Treasury stats query failed:', error);
      return {
        statistics: {
          totalSnapshots: 0,
          peakValue: 0,
          minimumValue: 0,
          averageValue: 0
        },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get ABC token data (price, metadata)
   */
  async getTokenData(symbol = 'ABC') {
    try {
      // For now, return basic token data
      // TODO: Implement actual price fetching from DEX/API
      
      let tokenInfo = {
        symbol: 'ABC',
        name: 'ABC DAO Token',
        decimals: 18,
        price: 0, // TODO: Fetch real price
        lastUpdated: new Date().toISOString()
      };
      
      // If we have the ABC token contract, get real metadata
      if (this.abcTokenAddress && this.abcTokenAddress !== '0x...') {
        try {
          const contract = new ethers.Contract(this.abcTokenAddress, this.erc20ABI, this.provider);
          const [name, tokenSymbol, decimals, totalSupply] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.decimals(),
            contract.totalSupply()
          ]);
          
          tokenInfo = {
            ...tokenInfo,
            name,
            symbol: tokenSymbol,
            decimals: Number(decimals),
            totalSupply: ethers.formatUnits(totalSupply, decimals),
            contractAddress: this.abcTokenAddress
          };
          
        } catch (error) {
          console.warn('⚠️ Token contract query failed:', error.message);
        }
      }
      
      return tokenInfo;
      
    } catch (error) {
      console.error('❌ Token data fetch failed:', error);
      return {
        symbol: 'ABC',
        name: 'ABC DAO Token',
        decimals: 18,
        price: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Create treasury snapshot and update all data
   */
  async updateTreasuryData() {
    try {
      console.log('🔄 Updating treasury data...');
      
      const snapshot = await this.getCurrentSnapshot();
      await this.storeSnapshot(snapshot);
      
      console.log('✅ Treasury data updated successfully');
      return snapshot;
      
    } catch (error) {
      console.error('❌ Treasury data update failed:', error);
      throw error;
    }
  }
}