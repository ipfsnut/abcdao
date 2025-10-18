'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { config } from '@/lib/config';

interface TreasuryTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  type: 'incoming' | 'outgoing' | 'staking_distribution' | 'weth_unwrap';
  description: string;
  ethValue: number;
  usdValue?: number;
}

// Treasury wallet address
const TREASURY_ADDRESS = '0xBE6525b767cA8D38d169C93C8120c0C0957388B8';
const STAKING_CONTRACT = '0x577822396162022654D5bDc9CB58018cB53e7017';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

export function useTreasuryTransactions() {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const txHistory: TreasuryTransaction[] = [];

      // Method 1: Get cached transactions from backend API
      try {
        console.log('Fetching treasury transactions from backend API...');
        const response = await fetch(`${config.backendUrl}/api/treasury/transactions`);
        if (response.ok) {
          const apiData = await response.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            console.log(`Fetched ${apiData.length} transactions from backend API`);
            txHistory.push(...apiData);
          }
        }
      } catch (e) {
        console.log('Backend transaction API not available:', e);
      }

      // Method 2: Fallback with a few recent known transactions if API fails
      if (txHistory.length === 0) {
        console.log('No backend data available, using recent distribution data as fallback...');
        
        // Get ETH price for USD calculations
        const ethPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const ethPriceData = await ethPriceResponse.json();
        const ethPrice = ethPriceData.ethereum?.usd || 3200;

        // Use known distribution transactions as fallback
        const fallbackTransactions = [
          {
            hash: '0xfd1c6010dcafbda0e692db9401514515dcba76a8e6654c7b06b042d4e0cc4136',
            blockNumber: 36999728,
            timestamp: 1760788803000,
            from: TREASURY_ADDRESS,
            to: STAKING_CONTRACT,
            value: ethers.parseEther('0.010988').toString(),
            gasUsed: '50000',
            gasPrice: '1000000000',
            type: 'staking_distribution' as const,
            description: 'ETH distribution to staking contract',
            ethValue: 0.010988,
            usdValue: 0.010988 * ethPrice
          },
          {
            hash: '0x5eed9de75e81888162c59f54c29d678e51168959d8a2df19f575818c260ec9b6',
            blockNumber: 36988929,
            timestamp: 1760767205000,
            from: TREASURY_ADDRESS,
            to: STAKING_CONTRACT,
            value: ethers.parseEther('0.01465').toString(),
            gasUsed: '50000',
            gasPrice: '1000000000',
            type: 'staking_distribution' as const,
            description: 'ETH distribution to staking contract',
            ethValue: 0.01465,
            usdValue: 0.01465 * ethPrice
          }
        ];

        txHistory.push(...fallbackTransactions);
      }

      // Sort by timestamp (newest first)
      txHistory.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(txHistory);
      
    } catch (err) {
      console.error('Error fetching treasury transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatTransactionHash = (hash: string): string => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTransactionColor = (type: TreasuryTransaction['type']): string => {
    switch (type) {
      case 'incoming':
        return 'text-green-400';
      case 'outgoing':
        return 'text-red-400';
      case 'staking_distribution':
        return 'text-blue-400';
      case 'weth_unwrap':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  const getTransactionIcon = (type: TreasuryTransaction['type']): string => {
    switch (type) {
      case 'incoming':
        return '↗️';
      case 'outgoing':
        return '↘️';
      case 'staking_distribution':
        return '🎁';
      case 'weth_unwrap':
        return '🔄';
      default:
        return '💰';
    }
  };

  return {
    transactions,
    loading,
    error,
    formatTransactionHash,
    formatTimestamp,
    getTransactionColor,
    getTransactionIcon,
    refetch: fetchTransactions
  };
}