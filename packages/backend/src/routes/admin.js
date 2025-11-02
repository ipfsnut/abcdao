import express from 'express';
import { ethers } from 'ethers';
import { getPool, refreshConnectionPool, validateSchema } from '../services/database.js';
import { farcasterService } from '../services/farcaster.js';

const router = express.Router();

// Simple auth middleware (replace with proper auth)
function requireAuth(req, res, next) {
  const authKey = req.headers['x-admin-key'];
  if (authKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get protocol wallet balance
router.get('/wallet/balance', requireAuth, async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const ethBalance = await provider.getBalance(protocolWallet.address);
    
    let abcBalance = '0';
    if (process.env.ABC_TOKEN_ADDRESS && process.env.ABC_TOKEN_ADDRESS !== '0x...') {
      try {
        const abcContract = new ethers.Contract(
          process.env.ABC_TOKEN_ADDRESS,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        abcBalance = ethers.formatUnits(await abcContract.balanceOf(protocolWallet.address), 18);
      } catch (error) {
        console.warn('ABC token balance check failed:', error.message);
        abcBalance = 'N/A';
      }
    } else {
      abcBalance = 'N/A (token not deployed)';
    }
    
    res.json({
      address: protocolWallet.address,
      ethBalance: ethers.formatEther(ethBalance),
      abcBalance: abcBalance
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw ETH from protocol wallet
router.post('/wallet/withdraw-eth', requireAuth, async (req, res) => {
  try {
    const { to, amount } = req.body;
    
    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const tx = await protocolWallet.sendTransaction({
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
    const protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const balance = await provider.getBalance(protocolWallet.address);
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
    
    const tx = await protocolWallet.sendTransaction({
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
    const protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
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
    const wethBalance = await wethContract.balanceOf(protocolWallet.address);
    
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
    const ethBalance = await provider.getBalance(protocolWallet.address);
    
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
    const protocolWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    // Base mainnet WETH contract
    const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
    const wethContract = new ethers.Contract(
      WETH_ADDRESS,
      ['function balanceOf(address) external view returns (uint256)'],
      provider
    );
    
    const wethBalance = await wethContract.balanceOf(protocolWallet.address);
    
    res.json({
      address: protocolWallet.address,
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

// Trigger ETH distribution immediately for testing
router.post('/trigger/eth-distribution', requireAuth, async (req, res) => {
  try {
    const { EthDistributionCron } = await import('../jobs/eth-distribution-cron.js');
    const ethCron = new EthDistributionCron();
    
    console.log('🧪 Admin triggered ETH distribution...');
    await ethCron.runNow();
    
    res.json({
      success: true,
      message: 'ETH distribution triggered successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Admin ETH distribution trigger failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Trigger ABC rewards processing immediately for testing
router.post('/trigger/abc-rewards', requireAuth, async (req, res) => {
  try {
    const { RewardDebtCron } = await import('../jobs/reward-debt-cron.js');
    const rewardCron = new RewardDebtCron();
    
    console.log('🧪 Admin triggered ABC rewards processing...');
    await rewardCron.runNow();
    
    res.json({
      success: true,
      message: 'ABC rewards processing triggered successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Admin ABC rewards trigger failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mark user's rewards as claimable after contract allocation
router.post('/users/:fid/mark-claimable', requireAuth, async (req, res) => {
  try {
    const { fid } = req.params;
    const { contract_tx_hash } = req.body;
    
    if (!contract_tx_hash) {
      return res.status(400).json({ error: 'contract_tx_hash required' });
    }
    
    const pool = getPool();
    
    const result = await pool.query(`
      UPDATE commits 
      SET 
        reward_status = 'claimable',
        contract_tx_hash = $1,
        transferred_at = NOW()
      WHERE user_id = (SELECT id FROM users WHERE farcaster_fid = $2)
        AND reward_status = 'pending'
        AND reward_amount IS NOT NULL
      RETURNING id, commit_hash, reward_amount, reward_status
    `, [contract_tx_hash, fid]);
    
    console.log(`✅ Marked ${result.rows.length} rewards as claimable for FID ${fid}`);
    
    res.json({
      success: true,
      updated_rewards: result.rows.length,
      rewards: result.rows,
      message: 'Rewards marked as claimable successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Mark claimable failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update user wallet address in production database
router.post('/users/:fid/update-wallet', requireAuth, async (req, res) => {
  try {
    const { fid } = req.params;
    const { wallet_address } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address required' });
    }
    
    const pool = getPool();
    
    const result = await pool.query(`
      UPDATE users 
      SET wallet_address = $1, updated_at = NOW()
      WHERE farcaster_fid = $2
      RETURNING farcaster_fid, farcaster_username, wallet_address, updated_at
    `, [wallet_address, fid]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ Updated wallet address for FID ${fid}: ${wallet_address}`);
    
    res.json({
      success: true,
      user: result.rows[0],
      message: 'Wallet address updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Wallet address update failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug: Check user wallet address in production database
router.get('/debug/user/:fid', requireAuth, async (req, res) => {
  try {
    const { fid } = req.params;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        farcaster_fid,
        farcaster_username,
        wallet_address,
        membership_status,
        verified_at,
        updated_at
      FROM users 
      WHERE farcaster_fid = $1
    `, [fid]);
    
    res.json({
      success: true,
      user: result.rows[0] || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug query failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add missing reward tracking columns to commits table
router.post('/database/add-reward-columns', requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    
    console.log('🔧 Adding missing reward tracking columns to commits table...');
    
    const migrations = [
      'ALTER TABLE commits ADD COLUMN IF NOT EXISTS reward_status VARCHAR(20) DEFAULT \'pending\'',
      'ALTER TABLE commits ADD COLUMN IF NOT EXISTS contract_tx_hash VARCHAR(66)',
      'ALTER TABLE commits ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP'
    ];
    
    const results = [];
    for (const sql of migrations) {
      try {
        await pool.query(sql);
        results.push({ sql, status: 'success' });
        console.log(`✅ Executed: ${sql}`);
      } catch (error) {
        results.push({ sql, status: 'error', error: error.message });
        console.error(`❌ Failed: ${sql} - ${error.message}`);
      }
    }
    
    // Verify the columns were added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'commits' 
      AND column_name IN ('reward_status', 'contract_tx_hash', 'transferred_at') 
      ORDER BY column_name
    `);
    
    console.log('✅ Reward tracking columns migration completed');
    
    res.json({
      success: true,
      message: 'Reward tracking columns added successfully',
      migrations: results,
      newColumns: verifyResult.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Reward columns migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Post cast from bot account
router.post('/cast', requireAuth, async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required and must be non-empty' });
    }
    
    if (text.length > 320) {
      return res.status(400).json({ error: 'Text must be 320 characters or less' });
    }
    
    console.log(`🎙️ Admin casting: ${text.substring(0, 50)}...`);
    
    const cast = await farcasterService.publishCast(text, options);
    
    res.json({
      success: true,
      cast: {
        hash: cast.hash,
        text: cast.text,
        timestamp: cast.timestamp
      },
      message: 'Cast published successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Admin cast failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Populate discovered stakers in production database
router.post('/populate-stakers/discovered', requireAuth, async (req, res) => {
  try {
    console.log('🎯 Populating discovered stakers via admin API...');
    
    // Discovered staker addresses from transaction history
    const discoveredStakers = [
      '0x18A85ad341b2D6A2bd67fbb104B4827B922a2A3c',
      '0x7E02c2dA4910531B7D6E8b6bDaFb69d13C71dB1d', 
      '0xB6754E53Ce15dF43269F59f21C9c235F1f673d67',
      '0xbF7dBd0313C9C185292feaF528a977BB7954062C',
      '0xC2771d8De241fCc2304d4c0e4574b1F41B388527',
      '0xc634E11751d3c154bf23D2965ef76C41B832C156'
    ];
    
    // Set up contract
    const stakingContractAddress = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    
    const stakingABI = [
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
      }
    ];
    
    const contract = new ethers.Contract(stakingContractAddress, stakingABI, provider);
    const pool = getPool();
    
    let addedCount = 0;
    let totalStaked = 0;
    const results = [];
    
    for (const address of discoveredStakers) {
      try {
        console.log(`Checking ${address}...`);
        
        // Get current stake info from contract
        const stakeInfo = await contract.getStakeInfo(address);
        const stakedAmount = parseFloat(ethers.formatEther(stakeInfo[0]));
        const totalEthEarned = parseFloat(ethers.formatEther(stakeInfo[2]));
        const pendingEth = parseFloat(ethers.formatEther(stakeInfo[3]));
        const lastStakeTime = stakeInfo[1] > 0 ? new Date(Number(stakeInfo[1]) * 1000) : null;
        
        if (stakedAmount > 0) {
          console.log(`✅ Active staker: ${stakedAmount.toFixed(2)} ABC staked`);
          
          // Insert into database
          await pool.query(`
            INSERT INTO staker_positions (
              wallet_address,
              staked_amount,
              rewards_earned,
              pending_rewards,
              last_stake_time,
              is_active,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (wallet_address) 
            DO UPDATE SET
              staked_amount = $2,
              rewards_earned = $3,
              pending_rewards = $4,
              last_stake_time = $5,
              is_active = $6,
              updated_at = NOW()
          `, [
            address,
            stakedAmount,
            totalEthEarned,
            pendingEth,
            lastStakeTime,
            true
          ]);
          
          addedCount++;
          totalStaked += stakedAmount;
          
          results.push({
            address,
            stakedAmount,
            totalEthEarned,
            pendingEth,
            status: 'added'
          });
        } else {
          console.log(`❌ No stake found for ${address}`);
          results.push({
            address,
            stakedAmount: 0,
            status: 'no_stake'
          });
        }
        
      } catch (error) {
        console.log(`⚠️ Error checking ${address}: ${error.message}`);
        results.push({
          address,
          error: error.message,
          status: 'error'
        });
      }
    }
    
    // Check final database status
    const finalResult = await pool.query(`
      SELECT COUNT(*) as count, 
             SUM(staked_amount) as total_staked
      FROM staker_positions 
      WHERE is_active = true AND staked_amount > 0
    `);
    
    const final = finalResult.rows[0];
    
    console.log(`✅ Populated ${addedCount} stakers with ${totalStaked.toFixed(2)} ABC`);
    
    res.json({
      success: true,
      message: 'Stakers populated successfully',
      results: {
        stakersProcessed: discoveredStakers.length,
        stakersAdded: addedCount,
        totalStakedAmount: totalStaked,
        finalDatabaseStatus: {
          totalActiveStakers: parseInt(final.count),
          totalStakedInDB: parseFloat(final.total_staked || 0)
        },
        details: results
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error populating stakers:', error);
    
    res.status(500).json({ 
      error: 'Failed to populate stakers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Discord bot status check
router.get('/discord/status', requireAuth, async (req, res) => {
  try {
    const discordBot = global.discordBot;
    
    if (!discordBot) {
      return res.json({
        status: 'not_initialized',
        message: 'Discord bot not found in global scope',
        env_check: {
          bot_token: process.env.DISCORD_BOT_TOKEN ? 'CONFIGURED' : 'MISSING',
          guild_id: process.env.DISCORD_GUILD_ID || 'MISSING',
          commits_channel: process.env.DISCORD_COMMITS_CHANNEL_ID || 'MISSING',
          announcements_channel: process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID || 'MISSING'
        }
      });
    }
    
    res.json({
      status: discordBot.isReady ? 'ready' : 'not_ready',
      bot_user: discordBot.client?.user?.tag || 'Unknown',
      guild_count: discordBot.client?.guilds?.cache?.size || 0,
      env_check: {
        bot_token: process.env.DISCORD_BOT_TOKEN ? 'CONFIGURED' : 'MISSING',
        guild_id: process.env.DISCORD_GUILD_ID || 'MISSING',
        commits_channel: process.env.DISCORD_COMMITS_CHANNEL_ID || 'MISSING',
        announcements_channel: process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID || 'MISSING'
      },
      channels: {
        commits: discordBot.channelIds?.commits || 'NOT_SET',
        announcements: discordBot.channelIds?.announcements || 'NOT_SET',
        general: discordBot.channelIds?.general || 'NOT_SET'
      }
    });
    
  } catch (error) {
    console.error('Discord status check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      env_check: {
        bot_token: process.env.DISCORD_BOT_TOKEN ? 'CONFIGURED' : 'MISSING',
        guild_id: process.env.DISCORD_GUILD_ID || 'MISSING'
      }
    });
  }
});

// Sync user staking data from blockchain to database
router.post('/sync-staker/:address', requireAuth, async (req, res) => {
  const { address } = req.params;
  
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    
    const STAKING_CONTRACT = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    const STAKING_ABI = [
      'function getStakeInfo(address) view returns (uint256 amount, uint256 rewardDebt)',
      'function pendingRewards(address) view returns (uint256)',
      'function totalRewardsDistributed() view returns (uint256)',
      'function totalStaked() view returns (uint256)'
    ];
    
    const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
    
    // Get blockchain data
    const [stakeInfo, pendingRewards, totalDistributed, totalStaked] = await Promise.all([
      contract.getStakeInfo(address),
      contract.pendingRewards(address),
      contract.totalRewardsDistributed(),
      contract.totalStaked()
    ]);
    
    const stakedAmount = parseFloat(ethers.formatUnits(stakeInfo.amount, 18));
    const pending = parseFloat(ethers.formatEther(pendingRewards));
    const totalEth = parseFloat(ethers.formatEther(totalDistributed));
    const totalStakedAmount = parseFloat(ethers.formatUnits(totalStaked, 18));
    
    // Calculate user's historical share
    const userShareRatio = stakedAmount / totalStakedAmount;
    const estimatedEthEarned = totalEth * userShareRatio;
    
    const pool = getPool();
    
    // Check if record exists
    const existingResult = await pool.query(`
      SELECT id FROM staker_positions 
      WHERE LOWER(wallet_address) = $1
    `, [address.toLowerCase()]);
    
    if (existingResult.rows.length > 0) {
      // Update existing
      await pool.query(`
        UPDATE staker_positions 
        SET 
          staked_amount = $2,
          rewards_earned = $3,
          pending_rewards = $4,
          is_active = true,
          updated_at = NOW()
        WHERE LOWER(wallet_address) = $1
      `, [address.toLowerCase(), stakedAmount, estimatedEthEarned, pending]);
      
      res.json({
        success: true,
        action: 'updated',
        address,
        staked_amount: stakedAmount,
        rewards_earned: estimatedEthEarned,
        pending_rewards: pending,
        user_share_ratio: userShareRatio,
        total_distributed: totalEth
      });
    } else {
      // Create new
      await pool.query(`
        INSERT INTO staker_positions (
          wallet_address, staked_amount, rewards_earned, pending_rewards,
          last_stake_time, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), true, NOW(), NOW())
      `, [address, stakedAmount, estimatedEthEarned, pending]);
      
      res.json({
        success: true,
        action: 'created',
        address,
        staked_amount: stakedAmount,
        rewards_earned: estimatedEthEarned,
        pending_rewards: pending,
        user_share_ratio: userShareRatio,
        total_distributed: totalEth
      });
    }
    
  } catch (error) {
    console.error('Staker sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;