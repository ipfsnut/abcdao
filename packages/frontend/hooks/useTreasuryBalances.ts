'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface TreasuryBalances {
  ethBalance: string;
  wethBalance: string;
  abcBalance: string;
  ethBalanceUSD: number;
  wethBalanceUSD: number;
  totalValueUSD: number;
  lastUpdated: string;
}

// Protocol treasury address - corrected from CLAUDE.md
const TREASURY_ADDRESS = '0xBE6525b767cA8D38d169C93C8120c0C0957388B8';

// WETH contract address on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

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
      const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/518Fe6U9g0rlJj0Sd5O_0');

      // Get ETH balance
      const ethBalanceWei = await provider.getBalance(TREASURY_ADDRESS);
      const ethBalance = ethers.formatEther(ethBalanceWei);

      // Get WETH balance
      const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
      const wethBalanceRaw = await wethContract.balanceOf(TREASURY_ADDRESS);
      const wethDecimals = await wethContract.decimals();
      const wethBalance = ethers.formatUnits(wethBalanceRaw, wethDecimals);

      // Get $ABC balance (we'll use the existing treasury hook for this)
      // This would require the $ABC token contract address when deployed
      const abcBalance = "0"; // Placeholder until $ABC token is deployed

      // Get current ETH price for USD calculations
      const ethPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const ethPriceData = await ethPriceResponse.json();
      const ethPrice = ethPriceData.ethereum?.usd || 3200;

      // Calculate USD values
      const ethBalanceUSD = parseFloat(ethBalance) * ethPrice;
      const wethBalanceUSD = parseFloat(wethBalance) * ethPrice; // WETH is 1:1 with ETH
      const totalValueUSD = ethBalanceUSD + wethBalanceUSD;

      const treasuryBalances: TreasuryBalances = {
        ethBalance,
        wethBalance,
        abcBalance,
        ethBalanceUSD,
        wethBalanceUSD,
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
        wethBalance: "0.00",
        abcBalance: "0",
        ethBalanceUSD: 0,
        wethBalanceUSD: 0,
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