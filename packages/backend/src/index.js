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

// Import services
import { initializeDatabase } from './services/database.js';
import { setupQueues } from './services/queue.js';
import { RewardDebtCron } from './jobs/reward-debt-cron.js';
import { NightlyLeaderboardJob } from './jobs/nightly-leaderboard-cron.js';
import { PaymentMonitor } from './services/payment-monitor.js';
import { PaymentRecoveryCron } from './jobs/payment-recovery-cron.js';
import { EthDistributionCron } from './jobs/eth-distribution-cron.js';
import { ClankerRewardsCron } from './jobs/clanker-rewards-cron.js';
import { WethUnwrapCron } from './jobs/weth-unwrap-cron.js';
import discordBot from './services/discord-bot.js';

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
    // Start Express server FIRST for fast health checks
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 ABC DAO Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
      console.log('⏱️  Initializing background services...');
    });
    
    // Initialize background services AFTER server is listening (with timeout)
    setTimeout(async () => {
      try {
        console.log('🔄 Starting background services initialization...');
        await initializeBackgroundServices();
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
async function initializeBackgroundServices() {
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
        console.log('✅ ETH distribution cron job started (runs every 6 hours)');
        
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

    // Start WETH unwrap cron job
    if (process.env.BOT_WALLET_PRIVATE_KEY) {
      try {
        const wethUnwrapCron = new WethUnwrapCron();
        wethUnwrapCron.start();
        console.log('✅ WETH unwrap cron job started (runs every 2 hours)');
        
        // Store reference for graceful shutdown
        global.wethUnwrapCron = wethUnwrapCron;
      } catch (wethCronError) {
        console.warn('⚠️  WETH unwrap cron setup failed:', wethCronError.message);
      }
    } else {
      console.warn('⚠️  Bot wallet not configured, skipping WETH unwrap cron');
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
  
  // Stop WETH unwrap cron
  if (global.wethUnwrapCron) {
    global.wethUnwrapCron.stop();
  }
  
  process.exit(0);
});

startServer();