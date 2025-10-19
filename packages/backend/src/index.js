console.log('Starting ABC DAO Backend process...');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhooks.js';
import userRoutes from './routes/users.js';
import rewardRoutes from './routes/rewards.js';
import adminRoutes from './routes/admin.js';
import batchRoutes from './routes/batch.js';
import testGithubRoutes from './routes/test-github.js';
import commitTagRoutes from './routes/commit-tags.js';
import tokenSupplyRoutes from './routes/token-supply.js';
import repositoryRoutes from './routes/repositories.js';
import transactionValidationRoutes from './routes/transaction-validation.js';
import paymentRecoveryRoutes from './routes/payment-recovery.js';
// Removed: distributions routes now merged into rewards.js
import githubVerificationRoutes from './routes/github-verification.js';
import ethDistributionsRoutes from './routes/eth-distributions.js';
import clankerClaimsRoutes from './routes/clanker-claims.js';
import wethUnwrapsRoutes from './routes/weth-unwraps.js';
import universalAuthRoutes from './routes/universal-auth.js';
import userActionsRoutes from './routes/user-actions.js';
import treasuryRoutes from './routes/treasury.js';
import stakingRoutes from './routes/staking.js';
import usersCommitsRoutes from './routes/users-commits.js';
import blockchainEventsRoutes from './routes/blockchain-events.js';
import systemHealthRoutes from './routes/system-health.js';
import castRoutes from './routes/cast.js';

// Import services
import { initializeDatabase } from './services/database.js';
import { setupQueues } from './services/queue.js';
import { RewardDebtCron } from './jobs/reward-debt-cron.js';
import { NightlyLeaderboardJob } from './jobs/nightly-leaderboard-cron.js';
import { PaymentMonitor } from './services/payment-monitor.js';
import { PaymentRecoveryCron } from './jobs/payment-recovery-cron.js';
import { EthDistributionCron } from './jobs/eth-distribution-cron.js';
import { ClankerRewardsCron } from './jobs/clanker-rewards-cron.js';
// Removed: WethUnwrapCron now integrated into ClankerRewardsCron
import discordBot from './services/discord-bot.js';
import { RealtimeBroadcastManager } from './services/realtime-broadcast.js';
import { startVerificationService } from './services/blockchain-verification.js';
import { treasuryDataManager } from './services/treasury-data-manager.js';
import { stakingDataManager } from './services/staking-data-manager.js';
import { userCommitDataManager } from './services/user-commit-data-manager.js';
import { blockchainEventsManager } from './services/blockchain-events-manager.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - configure helmet to allow OAuth redirects
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for OAuth redirects
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://warpcast.com',
  'https://client.warpcast.com',
  'https://abcdao.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow localhost and Railway subdomains for development
    if (origin.includes('localhost') || origin.includes('railway.app')) {
      return callback(null, true);
    }
    
    // Allow Cloudflare Pages deployments
    if (origin.includes('.pages.dev')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check - always return healthy regardless of background service status
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'abc-dao-backend',
    version: '1.0.2',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes index
app.get('/api', (req, res) => {
  res.json({
    message: 'ABC DAO API - User-Triggered Data Architecture',
    version: '2.0.0',
    features: ['Real-time WebSocket updates', 'Optimistic user actions', 'Background blockchain verification'],
    endpoints: {
      // New user-triggered architecture
      'user-actions': {
        'POST /api/user-actions/process': 'Process user action (stake, unstake, commit)',
        'GET /api/user-actions/staking/overview': 'Get real-time staking metrics',
        'GET /api/user-actions/staking/position/:wallet': 'Get user staking position',
        'GET /api/user-actions/history/:wallet': 'Get user action history',
        'GET /api/user-actions/commits/:wallet': 'Get user commits',
        'POST /api/user-actions/staking': 'Direct staking action',
        'POST /api/user-actions/commit': 'Direct commit action'
      },
      // Legacy endpoints (still active)
      'users': {
        'GET /api/users': 'List users',
        'GET /api/users/:fid': 'Get user by FID', 
        'POST /api/users/:fid/process-payment': 'Process membership payment'
      },
      'rewards': {
        'GET /api/rewards': 'Get rewards data',
        'POST /api/rewards/process': 'Process rewards'
      },
      'auth': {
        'POST /api/auth/github': 'GitHub OAuth',
        'POST /api/auth/transaction': 'Transaction validation'
      },
      'admin': {
        'GET /api/admin/stats': 'Admin statistics',
        'POST /api/admin/payment-recovery': 'Payment recovery'
      },
      'webhooks': {
        'POST /api/webhooks/github': 'GitHub webhook handler'
      },
      'treasury': {
        'GET /api/treasury/current': 'Current treasury snapshot',
        'GET /api/treasury/history': 'Treasury historical data',
        'GET /api/treasury/prices': 'Token prices',
        'GET /api/treasury/stats': 'Treasury statistics'
      },
      'staking': {
        'GET /api/staking/overview': 'Current staking metrics and APY',
        'GET /api/staking/history': 'Historical staking data',
        'GET /api/staking/position/:wallet': 'User staking position',
        'GET /api/staking/apy/historical': 'APY calculation history',
        'GET /api/staking/leaderboard': 'Top stakers'
      },
      'users-commits': {
        'GET /api/users-commits/profile/:identifier': 'User profile by wallet/FID/username',
        'GET /api/users-commits/leaderboard': 'User leaderboard',
        'GET /api/users-commits/commits/recent': 'Recent commits across all users',
        'GET /api/users-commits/commits/user/:userId': 'Commits for specific user',
        'GET /api/users-commits/stats': 'System-wide user and commit statistics',
        'POST /api/users-commits/webhook/github': 'GitHub webhook for systematic processing'
      },
      'blockchain-events': {
        'GET /api/blockchain-events/events/:contract': 'Recent events for contract',
        'GET /api/blockchain-events/state/:contract': 'Current contract state',
        'GET /api/blockchain-events/processing-status': 'Event processing status',
        'GET /api/blockchain-events/events/staking/recent': 'Recent staking events',
        'GET /api/blockchain-events/events/rewards/recent': 'Recent rewards events'
      },
      'system-health': {
        'GET /api/system-health/overview': 'Overall system health status',
        'GET /api/system-health/details': 'Detailed health information',
        'GET /api/system-health/metrics': 'Performance metrics for all domains',
        'POST /api/system-health/refresh-all': 'Manually trigger refresh for all data managers'
      }
    },
    websocket: {
      'ws://localhost:3001/realtime': 'Real-time updates (authenticate with userWallet)'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/test', testGithubRoutes);
app.use('/api/stats', tokenSupplyRoutes);
app.use('/api/commits', commitTagRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/auth', transactionValidationRoutes);
app.use('/api/admin', paymentRecoveryRoutes);
app.use('/api/github', githubVerificationRoutes);
app.use('/api/distributions', ethDistributionsRoutes);
app.use('/api/clanker-claims', clankerClaimsRoutes);
app.use('/api/weth-unwraps', wethUnwrapsRoutes);
app.use('/api/universal-auth', universalAuthRoutes);
app.use('/api/user-actions', userActionsRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/staking', stakingRoutes);
app.use('/api/users-commits', usersCommitsRoutes);
app.use('/api/blockchain-events', blockchainEventsRoutes);
app.use('/api/system-health', systemHealthRoutes);
app.use('/api/cast', castRoutes);

// Custom cast endpoint (requires admin key for security)
app.post('/api/cast/custom', async (req, res) => {
  try {
    // Simple auth check
    const authKey = req.headers['x-admin-key'];
    if (authKey !== process.env.ADMIN_SECRET && req.body.adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, customMessage } = req.body;
    const castText = customMessage || message;
    
    if (!castText) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Use direct Neynar API instead of service
    const { NeynarAPIClient } = await import('@neynar/nodejs-sdk');
    
    if (!process.env.NEYNAR_API_KEY || !process.env.NEYNAR_SIGNER_UUID) {
      return res.status(503).json({ error: 'Farcaster credentials not configured' });
    }
    
    const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    const cast = await neynar.publishCast(process.env.NEYNAR_SIGNER_UUID, castText);
    
    res.json({ 
      success: true, 
      message: 'Custom cast published!',
      castHash: cast.cast.hash,
      castUrl: `https://warpcast.com/${cast.cast.author.username}/${cast.cast.hash}`
    });
    
  } catch (error) {
    console.error('Custom cast error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Queue monitoring (for development) - commented out for now
// if (process.env.NODE_ENV === 'development') {
//   const { rewardQueue, castQueue } = await setupQueues();
//   
//   const serverAdapter = new ExpressAdapter();
//   serverAdapter.setBasePath('/admin/queues');
//   
//   createBullBoard({
//     queues: [
//       new BullAdapter(rewardQueue),
//       new BullAdapter(castQueue)
//     ],
//     serverAdapter
//   });
//   
//   app.use('/admin/queues', serverAdapter.getRouter());
// }

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'github-webhook') {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server first, then initialize background services
async function startServer() {
  try {
    // Create HTTP server for WebSocket support
    const { createServer } = await import('http');
    const server = createServer(app);
    
    // Start server FIRST for fast health checks
    server.listen(PORT, () => {
      console.log(`🚀 ABC DAO Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/realtime`);
      console.log('⏱️  Initializing background services...');
    });
    
    // Initialize background services AFTER server is listening (with timeout)
    setTimeout(async () => {
      try {
        console.log('🔄 Starting background services initialization...');
        await initializeBackgroundServices(server);
      } catch (error) {
        console.warn('⚠️  Background services initialization failed:', error.message);
        console.warn('🏥 Server remains healthy for API requests');
      }
    }, 50); // Reduced delay for faster startup
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Separate function for background service initialization
async function initializeBackgroundServices(server) {
  console.log('🔄 Initializing background services...');
  
  // Helper function to run operations with timeout
  async function withTimeout(operation, name, timeoutMs = 30000) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs)
      );
      
      await Promise.race([operation(), timeoutPromise]);
      console.log(`✅ ${name} completed`);
      return true;
    } catch (error) {
      console.warn(`⚠️  ${name} failed:`, error.message);
      return false;
    }
  }
  
  try {
    // Try to initialize database connection (optional for health checks)
  if (process.env.DATABASE_URL) {
    await withTimeout(
      () => initializeDatabase(),
      'Database initialization',
      15000
    );
  } else {
    console.warn('⚠️  DATABASE_URL not set, running without database');
  }
    
  // Try to setup job queues (optional for health checks) 
  if (process.env.REDIS_URL) {
    await withTimeout(
      () => setupQueues(),
      'Queue setup',
      10000
    );
  } else {
    console.warn('⚠️  REDIS_URL not set, running without queues');
  }
    
  // Start background services with timeout protection
  const serviceInitializers = [];
  
  // Start reward debt processing cron job
  if (process.env.ABC_REWARDS_CONTRACT_ADDRESS && process.env.BOT_WALLET_PRIVATE_KEY) {
    serviceInitializers.push(
      withTimeout(
        async () => {
          const rewardCron = new RewardDebtCron();
          rewardCron.start();
          global.rewardCron = rewardCron;
        },
        'Reward debt cron job',
        5000
      )
    );
  } else {
    console.warn('⚠️  Reward contract or bot wallet not configured, skipping cron job');
  }

    // Start nightly leaderboard generation (always run)
    try {
      const leaderboardJob = new NightlyLeaderboardJob();
      leaderboardJob.start();
      console.log('✅ Nightly leaderboard job started (runs at 11:59 PM UTC)');
      
      // Store reference for graceful shutdown
      global.leaderboardJob = leaderboardJob;
    } catch (leaderboardError) {
      console.warn('⚠️  Nightly leaderboard job setup failed:', leaderboardError.message);
    }

    // Start payment monitor
    if (process.env.BOT_WALLET_ADDRESS) {
      try {
        const paymentMonitor = new PaymentMonitor();
        await paymentMonitor.startMonitoring();
        console.log('✅ Payment monitor started');
        
        // Store reference for graceful shutdown
        global.paymentMonitor = paymentMonitor;
      } catch (monitorError) {
        console.warn('⚠️  Payment monitor setup failed:', monitorError.message);
      }
    } else {
      console.warn('⚠️  Bot wallet address not configured, skipping payment monitor');
    }

    // Start payment recovery cron (always run)
    try {
      const paymentRecoveryCron = new PaymentRecoveryCron();
      paymentRecoveryCron.start();
      console.log('✅ Payment recovery cron job started (runs every 12 hours)');
      
      // Store reference for graceful shutdown
      global.paymentRecoveryCron = paymentRecoveryCron;
    } catch (recoveryError) {
      console.warn('⚠️  Payment recovery cron setup failed:', recoveryError.message);
    }

    // Start ETH distribution cron job
    if (process.env.STAKING_CONTRACT_ADDRESS && process.env.BOT_WALLET_PRIVATE_KEY) {
      try {
        const ethDistributionCron = new EthDistributionCron();
        ethDistributionCron.start();
        console.log('✅ ETH distribution cron job started (runs daily at 12:00 PM UTC)');
        
        // Store reference for graceful shutdown
        global.ethDistributionCron = ethDistributionCron;
      } catch (ethCronError) {
        console.warn('⚠️  ETH distribution cron setup failed:', ethCronError.message);
      }
    } else {
      console.warn('⚠️  Staking contract or bot wallet not configured, skipping ETH distribution');
    }

    // Start Clanker rewards cron job
    if (process.env.BOT_WALLET_PRIVATE_KEY) {
      try {
        const clankerRewardsCron = new ClankerRewardsCron();
        clankerRewardsCron.start();
        console.log('✅ Clanker rewards cron job started (runs daily at 11:30 PM UTC)');
        
        // Store reference for graceful shutdown
        global.clankerRewardsCron = clankerRewardsCron;
      } catch (clankerCronError) {
        console.warn('⚠️  Clanker rewards cron setup failed:', clankerCronError.message);
      }
    } else {
      console.warn('⚠️  Bot wallet not configured, skipping Clanker rewards cron');
    }

    // WETH unwrapping now integrated into Clanker rewards cron job
    // No standalone WETH unwrap cron needed - it's triggered after successful claims

    // Initialize Real-time WebSocket Broadcasting
    try {
      const realtimeBroadcaster = RealtimeBroadcastManager.getInstance();
      realtimeBroadcaster.initialize(server);
      console.log('✅ Real-time WebSocket broadcasting initialized');
      global.realtimeBroadcaster = realtimeBroadcaster;
    } catch (realtimeError) {
      console.warn('⚠️  Real-time broadcasting setup failed:', realtimeError.message);
    }

    // Start Blockchain Verification Service
    if (process.env.BASE_RPC_URL) {
      try {
        const verificationService = startVerificationService();
        console.log('✅ Blockchain verification service started');
        global.verificationService = verificationService;
      } catch (verificationError) {
        console.warn('⚠️  Blockchain verification setup failed:', verificationError.message);
      }
    } else {
      console.warn('⚠️  BASE_RPC_URL not configured, skipping blockchain verification');
    }

    // Initialize Discord bot completely asynchronously (non-blocking)
    if (process.env.DISCORD_BOT_TOKEN) {
      // Start Discord bot initialization in background without waiting
      withTimeout(
        async () => {
          await discordBot.initialize();
          global.discordBot = discordBot;
        },
        'Discord bot initialization',
        10000 // 10 second timeout
      ).catch(error => {
        console.warn('⚠️  Discord bot initialization failed:', error.message);
      });
      console.log('✅ Discord bot initialization started in background');
    } else {
      console.warn('⚠️  Discord bot token not configured, skipping Discord integration');
    }

    // Initialize Treasury Data Manager
    try {
      await treasuryDataManager.initialize();
      console.log('✅ Treasury Data Manager initialized');
      global.treasuryDataManager = treasuryDataManager;
    } catch (treasuryError) {
      console.warn('⚠️  Treasury Data Manager initialization failed:', treasuryError.message);
    }

    // Initialize Staking Data Manager
    try {
      await stakingDataManager.initialize();
      console.log('✅ Staking Data Manager initialized');
      global.stakingDataManager = stakingDataManager;
    } catch (stakingError) {
      console.warn('⚠️  Staking Data Manager initialization failed:', stakingError.message);
    }

    // Initialize User/Commit Data Manager
    try {
      await userCommitDataManager.initialize();
      console.log('✅ User/Commit Data Manager initialized');
      global.userCommitDataManager = userCommitDataManager;
    } catch (userCommitError) {
      console.warn('⚠️  User/Commit Data Manager initialization failed:', userCommitError.message);
    }

    // Initialize Blockchain Events Manager
    try {
      await blockchainEventsManager.initialize();
      console.log('✅ Blockchain Events Manager initialized');
      global.blockchainEventsManager = blockchainEventsManager;
    } catch (blockchainError) {
      console.warn('⚠️  Blockchain Events Manager initialization failed:', blockchainError.message);
    }
    
    console.log('✅ All background services initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize background services:', error);
    // Don't exit - server is already running for health checks
    console.log('🏥 Server remains available for health checks despite service initialization failures');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down gracefully...');
  
  // Stop reward cron job
  if (global.rewardCron) {
    global.rewardCron.stop();
  }
  
  // Stop payment monitor
  if (global.paymentMonitor) {
    global.paymentMonitor.stopMonitoring();
  }
  
  // Stop payment recovery cron
  if (global.paymentRecoveryCron) {
    global.paymentRecoveryCron.stop();
  }
  
  // Stop ETH distribution cron
  if (global.ethDistributionCron) {
    global.ethDistributionCron.stop();
  }
  
  // Stop Clanker rewards cron
  if (global.clankerRewardsCron) {
    global.clankerRewardsCron.stop();
  }
  
  // Stop verification service
  if (global.verificationService) {
    global.verificationService.stop();
  }
  
  // Treasury Data Manager cleanup (intervals are cleared automatically on process exit)
  if (global.treasuryDataManager) {
    console.log('👋 Treasury Data Manager shutdown');
  }
  
  // Staking Data Manager cleanup (intervals are cleared automatically on process exit)
  if (global.stakingDataManager) {
    console.log('👋 Staking Data Manager shutdown');
  }
  
  // User/Commit Data Manager cleanup
  if (global.userCommitDataManager) {
    console.log('👋 User/Commit Data Manager shutdown');
  }
  
  // Blockchain Events Manager cleanup
  if (global.blockchainEventsManager) {
    console.log('👋 Blockchain Events Manager shutdown');
  }
  
  // WETH unwrapping now handled by Clanker rewards cron
  // No standalone WETH cron to stop
  
  process.exit(0);
});

startServer();