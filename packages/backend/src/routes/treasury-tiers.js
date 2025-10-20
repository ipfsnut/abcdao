import express from 'express';
import adaptiveRewardCalculator from '../services/adaptive-reward-calculator.js';

const router = express.Router();

/**
 * Get current treasury tier status
 */
router.get('/status', async (req, res) => {
  try {
    const tierStatus = await adaptiveRewardCalculator.getTierStatus();
    res.json({
      success: true,
      data: tierStatus
    });
  } catch (error) {
    console.error('Error fetching tier status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tier status'
    });
  }
});

/**
 * Predict tier changes based on burn rate
 */
router.get('/predictions', async (req, res) => {
  try {
    // Default to 100k ABC per day burn rate if not provided
    const dailyBurnRate = parseFloat(req.query.burnRate) || 100000;
    
    const currentTier = await adaptiveRewardCalculator.getCurrentTier();
    const predictions = await adaptiveRewardCalculator.predictTierChanges(dailyBurnRate);
    
    res.json({
      success: true,
      data: {
        currentTier: currentTier.type,
        treasuryBalance: currentTier.treasuryBalance,
        dailyBurnRate,
        predictions
      }
    });
  } catch (error) {
    console.error('Error predicting tier changes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict tier changes'
    });
  }
});

/**
 * Calculate reward for given parameters (testing endpoint)
 */
router.post('/calculate-reward', async (req, res) => {
  try {
    const { tags = [], priority = 'normal', locCount } = req.body;
    
    const rewardCalculation = await adaptiveRewardCalculator.calculateReward(tags, priority, locCount);
    
    res.json({
      success: true,
      data: rewardCalculation
    });
  } catch (error) {
    console.error('Error calculating reward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate reward'
    });
  }
});

/**
 * Get treasury balance directly
 */
router.get('/balance', async (req, res) => {
  try {
    const balance = await adaptiveRewardCalculator.getTreasuryBalance();
    
    res.json({
      success: true,
      data: {
        balance,
        formatted: `${balance.toLocaleString()} $ABC`,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch treasury balance'
    });
  }
});

export default router;