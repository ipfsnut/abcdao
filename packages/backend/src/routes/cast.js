import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Send bug bounty cast from @abc-dao-dev
router.post('/bug-bounty', async (req, res) => {
  try {
    console.log('🎯 Sending bug bounty cast from @abc-dao-dev...');
    
    const castText = `🐛 BUG BOUNTY TIME! 🐛

Help make ABC DAO better and earn $ABC tokens! 

📱 Test our app: abc.epicdylan.com
🔍 Found a bug? Reply with:
   • Screenshot/description
   • Steps to reproduce
   • Your wallet address

💰 Rewards: 100-500 $ABC per valid bug report
🎯 Priority: UI/UX issues, broken links, mobile bugs

Let's build something amazing together! 🚀

#ABCDAO #BugBounty #BuildInPublic`;

    // Use ABC Dev Bot credentials
    const NEYNAR_API_KEY = process.env.ABC_DEV_API_KEY;
    const SIGNER_UUID = process.env.ABC_DEV_SIGNER_UUID;

    if (!NEYNAR_API_KEY || !SIGNER_UUID) {
      return res.status(500).json({ 
        error: 'Missing ABC Dev Bot credentials',
        details: {
          hasApiKey: !!NEYNAR_API_KEY,
          hasSignerUuid: !!SIGNER_UUID
        }
      });
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEYNAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signer_uuid: SIGNER_UUID,
        text: castText
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Bug bounty cast sent successfully!');
      console.log('🔗 Cast hash:', result.cast.hash);
      
      res.json({
        success: true,
        message: 'Bug bounty cast sent successfully!',
        cast: {
          hash: result.cast.hash,
          url: `https://warpcast.com/@abc-dao-dev/${result.cast.hash.substring(0, 10)}`,
          text: castText
        }
      });
    } else {
      console.error('❌ Failed to send cast:', result);
      res.status(400).json({
        success: false,
        error: 'Failed to send cast',
        details: result
      });
    }
    
  } catch (error) {
    console.error('❌ Error sending bug bounty cast:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Test ABC Dev Bot connection
router.get('/test-connection', async (req, res) => {
  try {
    const NEYNAR_API_KEY = process.env.ABC_DEV_API_KEY;
    
    if (!NEYNAR_API_KEY) {
      return res.status(500).json({ 
        error: 'Missing ABC Dev Bot API key' 
      });
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/user/me', {
      headers: {
        'Authorization': `Bearer ${NEYNAR_API_KEY}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      res.json({
        success: true,
        user: {
          username: result.user.username,
          displayName: result.user.display_name,
          fid: result.user.fid
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'API connection failed',
        details: result
      });
    }
    
  } catch (error) {
    console.error('❌ Connection test error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;