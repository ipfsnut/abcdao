import express from 'express';
import { ethers } from 'ethers';
import { getPool, refreshConnectionPool, validateSchema } from '../services/database.js';

const router = express.Router();

// Simple auth middleware (replace with proper auth)
function requireAuth(req, res, next) {
  const authKey = req.headers['x-admin-key'];
  if (authKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get bot wallet balance
router.get('/wallet/balance', requireAuth, async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const ethBalance = await provider.getBalance(botWallet.address);
    
    let abcBalance = '0';
    if (process.env.ABC_TOKEN_ADDRESS && process.env.ABC_TOKEN_ADDRESS !== '0x...') {
      try {
        const abcContract = new ethers.Contract(
          process.env.ABC_TOKEN_ADDRESS,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        abcBalance = ethers.formatUnits(await abcContract.balanceOf(botWallet.address), 18);
      } catch (error) {
        console.warn('ABC token balance check failed:', error.message);
        abcBalance = 'N/A';
      }
    } else {
      abcBalance = 'N/A (token not deployed)';
    }
    
    res.json({
      address: botWallet.address,
      ethBalance: ethers.formatEther(ethBalance),
      abcBalance: abcBalance
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw ETH from bot wallet
router.post('/wallet/withdraw-eth', requireAuth, async (req, res) => {
  try {
    const { to, amount } = req.body;
    
    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const tx = await botWallet.sendTransaction({
      to: to,
      value: ethers.parseEther(amount)
    });
    
    console.log(`✅ Withdrew ${amount} ETH to ${to}. TX: ${tx.hash}`);
    
    res.json({
      success: true,
      txHash: tx.hash,
      amount: amount,
      to: to
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Forward ETH to staking contract (manual trigger)
router.post('/wallet/forward-eth', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body; // Optional, defaults to most of balance
    
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const balance = await provider.getBalance(botWallet.address);
    const gasReserve = ethers.parseEther('0.01'); // Keep 0.01 ETH for gas
    
    let forwardAmount;
    if (amount) {
      forwardAmount = ethers.parseEther(amount);
    } else {
      forwardAmount = balance - gasReserve;
    }
    
    if (forwardAmount <= 0) {
      return res.status(400).json({ error: 'Insufficient balance to forward' });
    }
    
    const tx = await botWallet.sendTransaction({
      to: process.env.STAKING_CONTRACT_ADDRESS,
      value: forwardAmount
    });
    
    console.log(`✅ Forwarded ${ethers.formatEther(forwardAmount)} ETH to staking. TX: ${tx.hash}`);
    
    res.json({
      success: true,
      txHash: tx.hash,
      amount: ethers.formatEther(forwardAmount),
      to: process.env.STAKING_CONTRACT_ADDRESS
    });
  } catch (error) {
    console.error('Forward error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unwrap WETH and forward to staking contract
router.post('/wallet/unwrap-weth', requireAuth, async (req, res) => {
  try {
    const { amount, forwardAmount } = req.body; // Optional params
    
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    // Base mainnet WETH contract
    const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
    const wethContract = new ethers.Contract(
      WETH_ADDRESS,
      [
        'function withdraw(uint256 wad) external',
        'function balanceOf(address) external view returns (uint256)',
        'function symbol() external view returns (string)'
      ],
      botWallet
    );
    
    // Check WETH balance
    const wethBalance = await wethContract.balanceOf(botWallet.address);
    
    if (wethBalance === 0n) {
      return res.status(400).json({ 
        error: 'No WETH balance to unwrap',
        wethBalance: '0'
      });
    }
    
    // Determine amount to unwrap
    let unwrapAmount;
    if (amount) {
      unwrapAmount = ethers.parseEther(amount);
      if (unwrapAmount > wethBalance) {
        return res.status(400).json({ 
          error: 'Insufficient WETH balance',
          requested: ethers.formatEther(unwrapAmount),
          available: ethers.formatEther(wethBalance)
        });
      }
    } else {
      unwrapAmount = wethBalance; // Unwrap all WETH
    }
    
    console.log(`🔄 Unwrapping ${ethers.formatEther(unwrapAmount)} WETH to ETH...`);
    
    // Unwrap WETH to ETH
    const unwrapTx = await wethContract.withdraw(unwrapAmount);
    await unwrapTx.wait();
    
    console.log(`✅ Unwrapped ${ethers.formatEther(unwrapAmount)} WETH. TX: ${unwrapTx.hash}`);
    
    // Just unwrap WETH - don't auto-forward for now
    const ethBalance = await provider.getBalance(botWallet.address);
    
    res.json({
      success: true,
      unwrapTx: unwrapTx.hash,
      unwrappedAmount: ethers.formatEther(unwrapAmount),
      currentEthBalance: ethers.formatEther(ethBalance),
      note: 'WETH unwrapped successfully. Use /wallet/forward-eth to manually send to staking when ready.'
    });
    
  } catch (error) {
    console.error('❌ WETH unwrap error:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Check WETH balance
router.get('/wallet/weth-balance', requireAuth, async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    // Base mainnet WETH contract
    const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
    const wethContract = new ethers.Contract(
      WETH_ADDRESS,
      ['function balanceOf(address) external view returns (uint256)'],
      provider
    );
    
    const wethBalance = await wethContract.balanceOf(botWallet.address);
    
    res.json({
      address: botWallet.address,
      wethBalance: ethers.formatEther(wethBalance),
      wethContract: WETH_ADDRESS
    });
    
  } catch (error) {
    console.error('WETH balance check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Database management endpoints
router.get('/database/schema-check', requireAuth, async (req, res) => {
  try {
    await validateSchema();
    res.json({
      success: true,
      message: 'Schema validation passed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Schema validation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/database/refresh-connections', requireAuth, async (req, res) => {
  try {
    await refreshConnectionPool();
    res.json({
      success: true,
      message: 'Database connection pool refreshed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Connection refresh failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/database/status', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    
    // Get basic connection info
    const connectionInfo = await pool.query('SELECT current_database(), current_user, version()');
    const db = connectionInfo.rows[0];
    
    // Get table counts
    const tables = ['users', 'commits', 'memberships', 'migrations'];
    const counts = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count);
      } catch (e) {
        counts[table] = `Error: ${e.message}`;
      }
    }
    
    // Get recent migrations
    const migrations = await pool.query('SELECT name, executed_at FROM migrations ORDER BY executed_at DESC LIMIT 5');
    
    res.json({
      database: db.current_database,
      user: db.current_user,
      version: db.version.split(' ').slice(0, 2).join(' '),
      tableCounts: counts,
      recentMigrations: migrations.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;