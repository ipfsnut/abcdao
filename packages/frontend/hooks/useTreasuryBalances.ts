'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface TreasuryBalances {
  ethBalance: string;
  usdcBalance: string;
  abcBalance: string;
  ethBalanceUSD: number;
  usdcBalanceUSD: number;
  totalValueUSD: number;
  lastUpdated: string;
}

// Protocol treasury address from CLAUDE.md
const TREASURY_ADDRESS = '0xcCBE95Ab1E3ECfb73cFeA072460E24D5054c28B2';

// USDC contract address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// ERC20 ABI for balance queries
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

export function useTreasuryBalances() {
  const [balances, setBalances] = useState<TreasuryBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTreasuryBalances();
    // Refresh every 60 seconds
    const interval = setInterval(fetchTreasuryBalances, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchTreasuryBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use Alchemy RPC for Base network
      const ALCHEMY_URL = 'https://base-mainnet.g.alchemy.com/v2/your-api-key'; // Replace with actual key
      
      // For now, we'll use public RPC endpoints as fallback
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

      // Get ETH balance
      const ethBalanceWei = await provider.getBalance(TREASURY_ADDRESS);
      const ethBalance = ethers.formatEther(ethBalanceWei);

      // Get USDC balance
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      const usdcBalanceRaw = await usdcContract.balanceOf(TREASURY_ADDRESS);
      const usdcDecimals = await usdcContract.decimals();
      const usdcBalance = ethers.formatUnits(usdcBalanceRaw, usdcDecimals);

      // Get $ABC balance (we'll use the existing treasury hook for this)
      // This would require the $ABC token contract address when deployed
      const abcBalance = "0"; // Placeholder until $ABC token is deployed

      // Get current ETH price for USD calculations
      const ethPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const ethPriceData = await ethPriceResponse.json();
      const ethPrice = ethPriceData.ethereum?.usd || 3200;

      // Calculate USD values
      const ethBalanceUSD = parseFloat(ethBalance) * ethPrice;
      const usdcBalanceUSD = parseFloat(usdcBalance); // USDC is 1:1 with USD
      const totalValueUSD = ethBalanceUSD + usdcBalanceUSD;

      const treasuryBalances: TreasuryBalances = {
        ethBalance,
        usdcBalance,
        abcBalance,
        ethBalanceUSD,
        usdcBalanceUSD,
        totalValueUSD,
        lastUpdated: new Date().toISOString()
      };

      setBalances(treasuryBalances);
      setError(null);
    } catch (err) {
      console.error('Error fetching treasury balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch treasury balances');
      
      // Fallback to prevent crashes
      setBalances({
        ethBalance: "0.000",
        usdcBalance: "0.00",
        abcBalance: "0",
        ethBalanceUSD: 0,
        usdcBalanceUSD: 0,
        totalValueUSD: 0,
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string, decimals: number = 4): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0.000';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(decimals);
  };

  const formatUSD = (amount: number): string => {
    if (amount < 0.01) return '$0.00';
    if (amount < 1) return `$${amount.toFixed(3)}`;
    if (amount < 100) return `$${amount.toFixed(2)}`;
    if (amount < 10000) return `$${amount.toFixed(0)}`;
    if (amount < 1000000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  return {
    balances,
    loading,
    error,
    formatBalance,
    formatUSD,
    refetch: fetchTreasuryBalances
  };
}