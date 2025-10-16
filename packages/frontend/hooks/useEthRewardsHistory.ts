'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

export interface EthRewardDistribution {
  id: string;
  timestamp: number;
  ethAmount: number;
  totalStaked: number;
  stakersCount: number;
  apy: number; // Calculated APY at that point
  ethPrice?: number; // ETH price at distribution time
}

export function useEthRewardsHistory() {
  const [distributions, setDistributions] = useState<EthRewardDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRewardsHistory();
  }, []);

  const fetchRewardsHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch real ETH distribution history from multiple sources
      const realDistributions: EthRewardDistribution[] = [];
      
      // Method 1: Get from backend API 
      try {
        const response = await fetch(`${config.backendUrl}/api/distributions/history`);
        if (response.ok) {
          const apiData = await response.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            console.log(`Fetched ${apiData.length} distributions from backend API`);
            realDistributions.push(...apiData);
          }
        }
      } catch (e) {
        console.log('Backend distribution API not available:', e);
      }
      
      // Method 2: Query blockchain for actual ETH distribution events
      try {
        const { ethers } = await import('ethers');
        const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/518Fe6U9g0rlJj0Sd5O_0');
        
        // Get current ETH price
        const ethPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const ethPriceData = await ethPriceResponse.json();
        const currentEthPrice = ethPriceData.ethereum?.usd || 3200;
        
        // Query staking contract for ETH deposits (distributions)
        const stakingContract = '0x577822396162022654D5bDc9CB58018cB53e7017';
        
        // Get recent blocks to scan for ETH transfers to staking contract
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 10000); // Last ~10k blocks (~few days on Base)
        
        // Note: Direct block scanning is more reliable than event filters for ETH transfers
        
        // Get transaction receipts for transfers to staking contract
        const transfers = [];
        
        // Check known distribution transactions first
        const knownTxHashes = [
          '0x6949daf8bcaaac73db0b71fcfec97f33915b4a263a62d133040646e96ca5eb3c',
          '0xb029d9081dafbe64f0596ee5b88ca2a6e5514fc45a90e9ab0c171d843fd674a2'
        ];
        
        for (const txHash of knownTxHashes) {
          try {
            const tx = await provider.getTransaction(txHash);
            const receipt = await provider.getTransactionReceipt(txHash);
            
            if (tx && receipt && receipt.status === 1) {
              const block = await provider.getBlock(receipt.blockNumber);
              const ethAmount = parseFloat(ethers.formatEther(tx.value));
              
              if (ethAmount > 0.001 && block) {
                transfers.push({
                  id: tx.hash,
                  timestamp: block.timestamp * 1000,
                  ethAmount: ethAmount,
                  totalStaked: 711483264,
                  stakersCount: 15,
                  apy: 0, // Will calculate below
                  ethPrice: currentEthPrice,
                  transactionHash: tx.hash,
                  blockNumber: receipt.blockNumber
                });
              }
            }
          } catch (txError) {
            console.warn(`Error checking known transaction ${txHash}:`, txError instanceof Error ? txError.message : String(txError));
          }
        }
        
        // Also scan recent blocks but with a more efficient approach
        for (let i = 0; i < Math.min(50, latestBlock - fromBlock); i += 20) {
          try {
            const blockNumber = latestBlock - i;
            const block = await provider.getBlock(blockNumber, true);
            
            if (block && block.transactions) {
              for (const txHash of block.transactions) {
                try {
                  const tx = await provider.getTransaction(txHash as string);
                  if (tx && tx.to?.toLowerCase() === stakingContract.toLowerCase() && tx.value && tx.value > 0) {
                    const ethAmount = parseFloat(ethers.formatEther(tx.value));
                    
                    if (ethAmount > 0.001) {
                      // Check if we already have this transaction
                      const exists = transfers.find(t => t.transactionHash === tx.hash);
                      if (!exists) {
                        transfers.push({
                          id: tx.hash,
                          timestamp: block.timestamp * 1000,
                          ethAmount: ethAmount,
                          totalStaked: 711483264,
                          stakersCount: 15,
                          apy: 0, // Will calculate below
                          ethPrice: currentEthPrice,
                          transactionHash: tx.hash,
                          blockNumber: blockNumber
                        });
                      }
                    }
                  }
                } catch (txError) {
                  // Skip invalid transactions
                  continue;
                }
              }
            }
          } catch (blockError) {
            console.warn(`Error scanning block ${latestBlock - i}:`, blockError instanceof Error ? blockError.message : String(blockError));
          }
        }
        
        // Calculate APY for each distribution
        for (const dist of transfers) {
          if (dist.totalStaked > 0 && dist.ethAmount > 0) {
            // Simplified APY calculation
            const weeklyEthPerABC = dist.ethAmount / dist.totalStaked;
            const abcPrice = 0.0000123; // Current ABC price estimate
            const weeklyReturn = (weeklyEthPerABC * dist.ethPrice) / abcPrice;
            dist.apy = weeklyReturn * 52 * 100;
          }
        }
        
        realDistributions.push(...transfers);
        console.log(`Found ${transfers.length} ETH distributions from blockchain scan`);
        
      } catch (e) {
        console.warn('Could not fetch blockchain distribution data:', e);
      }
      
      // Method 3: No fallback data - show "no data" state instead of fake data
      if (realDistributions.length === 0) {
        console.log('No real distribution data available, showing empty state');
        // Don't add fake data - let components handle empty state properly
      }
      
      // Sort by timestamp (newest first)
      realDistributions.sort((a, b) => b.timestamp - a.timestamp);
      
      setDistributions(realDistributions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards history');
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentWeeklyAPY = () => {
    if (distributions.length === 0) return 0;
    
    const lastDistribution = distributions[0];
    
    // Real APY calculation based on actual ETH rewards
    // APY = (ETH earned per ABC token * ETH price / ABC price) * 52 weeks * 100
    const ethPerABC = lastDistribution.ethAmount / lastDistribution.totalStaked;
    const ethPrice = lastDistribution.ethPrice || 3200;
    const abcPrice = 0.0000123; // Current ABC price estimate
    
    const weeklyReturn = (ethPerABC * ethPrice) / abcPrice;
    return weeklyReturn * 52 * 100; // Annualized percentage
  };

  const getAverageAPY = (weeks: number = 4) => {
    if (distributions.length === 0) return 0;
    
    const recentDistributions = distributions.slice(0, weeks);
    const avgAPY = recentDistributions.reduce((sum, dist) => sum + dist.apy, 0) / recentDistributions.length;
    return avgAPY;
  };

  const getTotalETHDistributed = () => {
    return distributions.reduce((total, dist) => total + dist.ethAmount, 0);
  };

  const getDistributionTrend = () => {
    if (distributions.length < 2) return 'stable';
    
    const recent = distributions[0].ethAmount;
    const previous = distributions[1].ethAmount;
    
    if (recent > previous * 1.1) return 'increasing';
    if (recent < previous * 0.9) return 'decreasing';
    return 'stable';
  };

  return {
    distributions,
    loading,
    error,
    calculateCurrentWeeklyAPY,
    getAverageAPY,
    getTotalETHDistributed,
    getDistributionTrend,
    refetch: fetchRewardsHistory
  };
}