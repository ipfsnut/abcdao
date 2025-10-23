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

// Process NFT mint and update membership (called by frontend after successful mint)
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
    
    // Immediately process the NFT mint to update membership
    const monitor = new NFTMembershipMonitor();
    
    // Get the transaction details to extract token ID
    const provider = monitor.provider;
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.status(400).json({ error: 'Transaction not found or not confirmed' });
    }
    
    // Parse the MembershipMinted event from the receipt
    const contract = monitor.contract;
    const membershipMintedTopic = contract.interface.getEventTopic('MembershipMinted');
    
    const mintEvent = receipt.logs.find(log => 
      log.address.toLowerCase() === contract.target.toLowerCase() && 
      log.topics[0] === membershipMintedTopic
    );
    
    if (!mintEvent) {
      return res.status(400).json({ error: 'No MembershipMinted event found in transaction' });
    }
    
    // Decode the event
    const decoded = contract.interface.parseLog(mintEvent);
    const tokenId = decoded.args.tokenId.toString();
    const member = decoded.args.member;
    
    if (member.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Wallet address mismatch' });
    }
    
    // Process the membership
    const success = await monitor.updateUserMembership(member, tokenId, txHash);
    
    if (success) {
      res.json({
        success: true,
        message: 'NFT membership processed successfully',
        data: {
          tokenId,
          walletAddress: member,
          txHash,
          farcasterFid
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to update user membership' });
    }
    
  } catch (error) {
    console.error('Error processing NFT mint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;