import express from 'express';
import { NFTMembershipMonitor } from '../services/nft-membership-monitor.js';

const router = express.Router();

// Get NFT contract statistics
router.get('/stats', async (req, res) => {
  try {
    const monitor = new NFTMembershipMonitor();
    const stats = await monitor.getContractStats();
    
    if (!stats) {
      return res.status(500).json({ error: 'Failed to fetch contract stats' });
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching NFT stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check recent NFT mints (for testing)
router.post('/check-recent', async (req, res) => {
  try {
    const { hours = 24 } = req.body;
    const monitor = new NFTMembershipMonitor();
    
    // This will log to console and process any missed events
    await monitor.checkRecentMints(hours);
    
    res.json({
      success: true,
      message: `Checked for NFT mints in last ${hours} hours`,
    });
  } catch (error) {
    console.error('Error checking recent NFT mints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record NFT mint notification (called by frontend after successful mint)
// This replaces the old /api/membership/verify endpoint for NFT-based membership
router.post('/nft-mint', async (req, res) => {
  try {
    const { farcasterFid, txHash, walletAddress } = req.body;
    
    if (!txHash || !walletAddress) {
      return res.status(400).json({ error: 'Transaction hash and wallet address are required' });
    }
    
    console.log(`🎫 NFT mint notification received:`);
    console.log(`   Wallet: ${walletAddress}`);
    console.log(`   TX Hash: ${txHash}`);
    console.log(`   Farcaster FID: ${farcasterFid || 'N/A'}`);
    
    // The actual processing will be handled by the event monitor
    // This endpoint is just for frontend notification/analytics
    
    res.json({
      success: true,
      message: 'NFT mint notification received',
      note: 'Membership will be processed automatically via blockchain events'
    });
  } catch (error) {
    console.error('Error processing NFT mint notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;