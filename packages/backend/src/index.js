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

// Import services
import { initializeDatabase } from './services/database.js';
import { setupQueues } from './services/queue.js';
import { RewardDebtCron } from './jobs/reward-debt-cron.js';
import { NightlyLeaderboardJob } from './jobs/nightly-leaderboard-cron.js';
import { PaymentMonitor } from './services/payment-monitor.js';

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
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'abc-dao-backend',
    version: '1.0.1'
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

// Initialize services and start server
async function startServer() {
  try {
    // Try to initialize database connection (optional for health checks)
    if (process.env.DATABASE_URL) {
      try {
        await initializeDatabase();
        console.log('✅ Database connected');
      } catch (dbError) {
        console.warn('⚠️  Database connection failed, running without database:', dbError.message);
      }
    } else {
      console.warn('⚠️  DATABASE_URL not set, running without database');
    }
    
    // Try to setup job queues (optional for health checks) 
    if (process.env.REDIS_URL) {
      try {
        await setupQueues();
        console.log('✅ Job queues initialized');
      } catch (queueError) {
        console.warn('⚠️  Queue setup failed, running without queues:', queueError.message);
      }
    } else {
      console.warn('⚠️  REDIS_URL not set, running without queues');
    }
    
    // Start reward debt processing cron job
    if (process.env.ABC_REWARDS_CONTRACT_ADDRESS && process.env.BOT_WALLET_PRIVATE_KEY) {
      try {
        const rewardCron = new RewardDebtCron();
        rewardCron.start();
        console.log('✅ Reward debt cron job started');
        
        // Store reference for graceful shutdown
        global.rewardCron = rewardCron;
      } catch (cronError) {
        console.warn('⚠️  Reward cron setup failed:', cronError.message);
      }
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
    
    // Start server - bind to 0.0.0.0 for Railway
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 ABC DAO Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
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
  
  process.exit(0);
});

startServer();