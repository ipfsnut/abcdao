import { ethers } from 'ethers';

/**
 * Adaptive Reward Calculator
 * Dynamically adjusts reward tiers based on protocol wallet treasury balance
 */
export class AdaptiveRewardCalculator {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    this.protocolWalletAddress = process.env.PROTOCOL_WALLET_ADDRESS || '0xBE6525b767cA8D38d169C93C8120c0C0957388B8';
    this.abcTokenAddress = process.env.ABC_TOKEN_ADDRESS || '0x5c0872b790bb73e2b3a9778db6e7704095624b07';
    
    this.abcTokenABI = [
      'function balanceOf(address owner) view returns (uint256)'
    ];

    // Reward tier configurations
    this.rewardTiers = {
      standard: {
        name: 'Standard Rewards',
        threshold: 250_000_000, // >250M ABC
        tiers: [
          { min: 0, max: 50000, baseReward: [50000, 60000] },     // 50k-60k
          { min: 50001, max: 100000, baseReward: [75000, 150000] }, // 75k-150k
          { min: 100001, max: Infinity, baseReward: [200000, 1000000] } // 200k-1M
        ]
      },
      reduced: {
        name: 'Reduced Rewards',
        threshold: 100_000_000, // 100-250M ABC
        tiers: [
          { min: 0, max: 50000, baseReward: [25000, 30000] },     // 25k-30k (50% reduction)
          { min: 50001, max: 100000, baseReward: [37500, 75000] }, // 37.5k-75k (50% reduction)
          { min: 100001, max: Infinity, baseReward: [100000, 250000] } // 100k-250k (75% max cap)
        ]
      },
      emergency: {
        name: 'Emergency Mode',
        threshold: 0, // <100M ABC
        tiers: [
          { min: 0, max: Infinity, baseReward: [1000, 50000] } // 1k-50k ABC range for maximum conservation
        ]
      }
    };

    this.priorityMultipliers = {
      normal: 1.0,
      high: 1.5,
      milestone: 2.0,
      experimental: 0.8
    };

    // Cache treasury balance for 5 minutes to avoid excessive RPC calls
    this.treasuryCache = {
      balance: null,
      lastUpdated: 0,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Get current treasury balance with caching
   */
  async getTreasuryBalance() {
    const now = Date.now();
    
    if (this.treasuryCache.balance && (now - this.treasuryCache.lastUpdated) < this.treasuryCache.cacheDuration) {
      return this.treasuryCache.balance;
    }

    try {
      const abcToken = new ethers.Contract(this.abcTokenAddress, this.abcTokenABI, this.provider);
      const balanceWei = await abcToken.balanceOf(this.protocolWalletAddress);
      const balance = parseFloat(ethers.formatUnits(balanceWei, 18));
      
      // Update cache
      this.treasuryCache.balance = balance;
      this.treasuryCache.lastUpdated = now;
      
      return balance;
    } catch (error) {
      console.error('Failed to fetch treasury balance:', error);
      // Return cached value if available, otherwise assume standard tier
      return this.treasuryCache.balance || 300_000_000;
    }
  }

  /**
   * Determine current reward tier based on treasury balance
   */
  async getCurrentTier() {
    const treasuryBalance = await this.getTreasuryBalance();
    
    if (treasuryBalance > this.rewardTiers.standard.threshold) {
      return { type: 'standard', config: this.rewardTiers.standard, treasuryBalance };
    } else if (treasuryBalance > this.rewardTiers.reduced.threshold) {
      return { type: 'reduced', config: this.rewardTiers.reduced, treasuryBalance };
    } else {
      return { type: 'emergency', config: this.rewardTiers.emergency, treasuryBalance };
    }
  }

  /**
   * Calculate reward amount based on current treasury tier
   */
  async calculateReward(tags = [], priority = 'normal', locCount = null) {
    const currentTier = await this.getCurrentTier();
    const tierConfig = currentTier.config;
    
    // Estimate LOC if not provided (legacy compatibility)
    const estimatedLoc = locCount || this.estimateLocFromTags(tags);
    
    // Find appropriate tier based on LOC
    const applicableTier = tierConfig.tiers.find(tier => 
      estimatedLoc >= tier.min && estimatedLoc <= tier.max
    ) || tierConfig.tiers[tierConfig.tiers.length - 1]; // Fallback to highest tier
    
    // Calculate base reward with randomization
    const [minReward, maxReward] = applicableTier.baseReward;
    let baseReward;
    
    if (minReward === maxReward) {
      // This case shouldn't happen with current tiers, but kept for safety
      baseReward = minReward;
    } else {
      // Apply the same distribution as original system
      const rand = Math.random();
      if (rand < 0.95) {
        // 95% chance of tier minimum range
        const range = Math.min(10000, maxReward - minReward);
        baseReward = Math.floor(Math.random() * range) + minReward;
      } else if (rand < 0.975) {
        // 2.5% chance of mid-tier
        const midMin = minReward + 10000;
        const midMax = Math.min(maxReward, midMin + 40000);
        baseReward = Math.floor(Math.random() * (midMax - midMin)) + midMin;
      } else {
        // 2.5% chance of max tier
        baseReward = Math.floor(Math.random() * (maxReward - (maxReward * 0.1))) + (maxReward * 0.1);
      }
    }

    // Apply priority multiplier
    const multiplier = this.priorityMultipliers[priority] || 1.0;
    const finalReward = Math.floor(baseReward * multiplier);

    // Log tier information for transparency
    this.logRewardCalculation(currentTier, estimatedLoc, baseReward, finalReward, priority);

    return {
      amount: finalReward,
      tier: currentTier.type,
      tierName: tierConfig.name,
      treasuryBalance: currentTier.treasuryBalance,
      estimatedLoc,
      baseReward,
      priorityMultiplier: multiplier
    };
  }

  /**
   * Estimate lines of code from commit tags (legacy compatibility)
   */
  estimateLocFromTags(tags) {
    // Simple heuristic based on tags
    if (tags.includes('major') || tags.includes('milestone')) return 150000;
    if (tags.includes('feature') || tags.includes('large')) return 75000;
    if (tags.includes('fix') || tags.includes('small')) return 25000;
    
    // Default assumption for typical commits
    return 30000;
  }

  /**
   * Log reward calculation for transparency
   */
  logRewardCalculation(currentTier, estimatedLoc, baseReward, finalReward, priority) {
    console.log(`💰 Adaptive Reward Calculation:`);
    console.log(`   Treasury: ${currentTier.treasuryBalance.toLocaleString()} $ABC`);
    console.log(`   Tier: ${currentTier.config.name} (${currentTier.type})`);
    console.log(`   Estimated LOC: ${estimatedLoc.toLocaleString()}`);
    console.log(`   Base Reward: ${baseReward.toLocaleString()} $ABC`);
    console.log(`   Priority: ${priority} (${this.priorityMultipliers[priority] || 1.0}x)`);
    console.log(`   Final Reward: ${finalReward.toLocaleString()} $ABC`);
  }

  /**
   * Get current tier status for dashboard/API
   */
  async getTierStatus() {
    const currentTier = await this.getCurrentTier();
    
    return {
      currentTier: currentTier.type,
      tierName: currentTier.config.name,
      treasuryBalance: currentTier.treasuryBalance,
      thresholds: {
        standard: this.rewardTiers.standard.threshold,
        reduced: this.rewardTiers.reduced.threshold,
        emergency: this.rewardTiers.emergency.threshold
      },
      tiers: currentTier.config.tiers.map(tier => ({
        locRange: tier.max === Infinity ? `${tier.min.toLocaleString()}+` : `${tier.min.toLocaleString()}-${tier.max.toLocaleString()}`,
        rewardRange: tier.baseReward[0] === tier.baseReward[1] ? 
          `${tier.baseReward[0].toLocaleString()} $ABC` :
          `${tier.baseReward[0].toLocaleString()}-${tier.baseReward[1].toLocaleString()} $ABC`
      })),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Predict tier changes based on burn rate
   */
  async predictTierChanges(dailyBurnRate) {
    const currentTier = await this.getCurrentTier();
    const balance = currentTier.treasuryBalance;
    
    const predictions = [];
    
    if (currentTier.type === 'standard') {
      const daysToReduced = Math.floor((balance - this.rewardTiers.standard.threshold) / dailyBurnRate);
      const daysToEmergency = Math.floor((balance - this.rewardTiers.reduced.threshold) / dailyBurnRate);
      
      if (daysToReduced > 0) {
        predictions.push({
          tier: 'reduced',
          daysRemaining: daysToReduced,
          date: new Date(Date.now() + (daysToReduced * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        });
      }
      
      if (daysToEmergency > 0) {
        predictions.push({
          tier: 'emergency',
          daysRemaining: daysToEmergency,
          date: new Date(Date.now() + (daysToEmergency * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        });
      }
    } else if (currentTier.type === 'reduced') {
      const daysToEmergency = Math.floor((balance - this.rewardTiers.reduced.threshold) / dailyBurnRate);
      
      if (daysToEmergency > 0) {
        predictions.push({
          tier: 'emergency',
          daysRemaining: daysToEmergency,
          date: new Date(Date.now() + (daysToEmergency * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        });
      }
    }
    
    return predictions;
  }
}

// Export singleton instance
export default new AdaptiveRewardCalculator();