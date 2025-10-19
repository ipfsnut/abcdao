import express from 'express';
import rewardProcessor from '../services/reward-processor.js';

const router = express.Router();

// Simple auth middleware (same as admin routes)
function requireAuth(req, res, next) {
  const authKey = req.headers['x-admin-key'];
  if (authKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Manual trigger for daily reward batch
router.post('/daily-rewards', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Manual trigger: Daily reward batch processing...');
    
    const batchResult = await rewardProcessor.processDailyRewards();
    
    if (batchResult.addresses.length === 0) {
      return res.json({
        success: true,
        message: 'No new rewards to process',
        processed: 0,
        totalAmount: 0
      });
    }
    
    // TODO: Add smart contract call here
    console.log('📊 Batch ready for contract:', {
      recipients: batchResult.addresses.length,
      totalAmount: batchResult.totalAmount,
      castsProcessed: batchResult.totalProcessed
    });
    
    res.json({
      success: true,
      message: 'Daily rewards processed successfully',
      recipients: batchResult.addresses.length,
      totalAmount: batchResult.totalAmount,
      castsProcessed: batchResult.totalProcessed,
      addresses: batchResult.addresses,
      amounts: batchResult.amounts,
      note: 'Smart contract integration pending'
    });
    
  } catch (error) {
    console.error('❌ Daily batch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Batch processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get batch processing status/history
router.get('/status', requireAuth, async (req, res) => {
  try {
    // TODO: Add database table to track batch history
    res.json({
      success: true,
      message: 'Batch status endpoint',
      note: 'Batch history tracking not implemented yet'
    });
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed'
    });
  }
});

export default router;