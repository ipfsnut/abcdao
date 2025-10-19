import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getPool } from '../services/database.js';
import farcasterService from '../services/farcaster.js';

const router = express.Router();

// GitHub OAuth callback handler
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: { 'Accept': 'application/json' }
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Failed to get access token' });
    }
    
    // Get GitHub user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { 'Authorization': `token ${accessToken}` }
    });
    
    const githubUser = userResponse.data;
    
    // Decode state to get Farcaster info (JWT token with fid/username)
    let farcasterInfo;
    try {
      farcasterInfo = jwt.verify(state, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    console.log('🔍 Debug info:', {
      hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
      hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      farcasterInfo: farcasterInfo ? { fid: farcasterInfo.fid, username: farcasterInfo.username } : null,
      githubUser: githubUser ? { login: githubUser.login, id: githubUser.id } : null
    });

    const pool = getPool();
    
    // Check if user already exists
    const existingUser = await pool.query(`
      SELECT id, verified_at FROM users WHERE farcaster_fid = $1
    `, [farcasterInfo.fid]);
    
    const isNewLinking = existingUser.rows.length === 0 || !existingUser.rows[0].verified_at;
    
    if (existingUser.rows.length > 0) {
      // Update existing user
      await pool.query(`
        UPDATE users 
        SET github_username = $2, github_id = $3, access_token = $4, verified_at = NOW(), updated_at = NOW()
        WHERE farcaster_fid = $1
      `, [
        farcasterInfo.fid,
        githubUser.login,
        githubUser.id,
        accessToken
      ]);
    } else {
      // Insert new user
      await pool.query(`
        INSERT INTO users (farcaster_fid, farcaster_username, github_username, github_id, access_token, verified_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        farcasterInfo.fid,
        farcasterInfo.username,
        githubUser.login,
        githubUser.id,
        accessToken
      ]);
    }
    
    console.log(`✅ Linked GitHub ${githubUser.login} to Farcaster ${farcasterInfo.username}`);
    
    // Auto-follow the user when they first complete GitHub linking
    if (isNewLinking) {
      try {
        await farcasterService.followUser(farcasterInfo.fid);
        console.log(`✅ Auto-followed new developer: @${farcasterInfo.username} (FID: ${farcasterInfo.fid})`);
      } catch (error) {
        console.error('⚠️ Auto-follow failed (non-critical):', error.message);
        // Don't fail the linking process if follow fails
      }
    }
    
    // Use HTML response with JavaScript for better mobile/frame compatibility
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${frontendUrl}/dev?github_linked=true&username=${encodeURIComponent(githubUser.login)}`;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>GitHub Linked Successfully</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: monospace;
            background: #0a0a0a; 
            color: #00ff41; 
            padding: 2rem; 
            text-align: center;
            line-height: 1.6;
          }
          .success { 
            background: #001100; 
            border: 1px solid #00ff41; 
            padding: 2rem; 
            border-radius: 8px; 
            margin: 2rem auto;
            max-width: 500px;
          }
          .glow { text-shadow: 0 0 10px #00ff41; }
          .username { color: #ffaa00; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1 class="glow">✅ GitHub Linked!</h1>
          <p>GitHub <span class="username">@${githubUser.login}</span> linked to Farcaster <span class="username">@${farcasterInfo.username}</span></p>
          <p>Redirecting back to ABC DAO...</p>
        </div>
        <script>
          // Try multiple redirect methods for different contexts
          setTimeout(() => {
            try {
              // For Farcaster frames
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'github_linked',
                  username: '${githubUser.login}',
                  success: true
                }, '*');
              }
              
              // Standard redirect
              window.location.href = '${successUrl}';
              
              // Fallback: try to close the window
              setTimeout(() => {
                try {
                  window.close();
                } catch (e) {
                  // Can't close, redirect again
                  window.location.replace('${successUrl}');
                }
              }, 1000);
            } catch (e) {
              console.error('Redirect error:', e);
              // Last resort: show manual link
              document.body.innerHTML += '<p><a href="${successUrl}" style="color: #00ff41;">Click here to continue</a></p>';
            }
          }, 2000);
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({ 
      error: 'OAuth failed',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Generate GitHub OAuth URL
router.post('/github/authorize', async (req, res) => {
  const { farcasterFid, farcasterUsername } = req.body;
  
  if (!farcasterFid || !farcasterUsername) {
    return res.status(400).json({ error: 'Missing Farcaster info' });
  }
  
  try {
    // Create state token with Farcaster info
    const state = jwt.sign(
      { fid: farcasterFid, username: farcasterUsername },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const backendUrl = process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app';
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(backendUrl + '/api/auth/github/callback')}&` +
      `scope=user:email&` +
      `state=${state}`;
    
    res.json({ authUrl });
    
  } catch (error) {
    console.error('GitHub auth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Unlink GitHub account (allow users to cancel before payment)
router.post('/github/unlink', async (req, res) => {
  const { farcasterFid } = req.body;
  
  if (!farcasterFid) {
    return res.status(400).json({ error: 'Missing Farcaster FID' });
  }
  
  try {
    const pool = getPool();
    
    // Check if user exists and is not yet a paying member
    const userResult = await pool.query(`
      SELECT farcaster_username, github_username, membership_status 
      FROM users 
      WHERE farcaster_fid = $1
    `, [farcasterFid]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Only allow unlinking if they haven't paid for membership yet
    if (user.membership_status && user.membership_status !== 'free') {
      return res.status(400).json({ 
        error: 'Cannot unlink GitHub after membership payment. Contact support if needed.' 
      });
    }
    
    // Clear GitHub data but keep the user record
    await pool.query(`
      UPDATE users 
      SET 
        github_username = NULL,
        github_id = NULL,
        access_token = NULL,
        verified_at = NULL,
        updated_at = NOW()
      WHERE farcaster_fid = $1
    `, [farcasterFid]);
    
    console.log(`🔗 Unlinked GitHub ${user.github_username} from Farcaster ${user.farcaster_username}`);
    
    res.json({ 
      success: true, 
      message: 'GitHub account unlinked successfully',
      unlinked: {
        farcaster_username: user.farcaster_username,
        github_username: user.github_username
      }
    });
    
  } catch (error) {
    console.error('GitHub unlink error:', error);
    res.status(500).json({ error: 'Failed to unlink GitHub account' });
  }
});

export default router;