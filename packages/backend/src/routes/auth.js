import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getPool } from '../services/database.js';

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
    
    const pool = getPool();
    
    // Update or create user record
    await pool.query(`
      INSERT INTO users (farcaster_fid, farcaster_username, github_username, github_id, access_token, verified_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (farcaster_fid) 
      DO UPDATE SET 
        github_username = $3,
        github_id = $4,
        access_token = $5,
        verified_at = NOW(),
        updated_at = NOW()
    `, [
      farcasterInfo.fid,
      farcasterInfo.username,
      githubUser.login,
      githubUser.id,
      accessToken
    ]);
    
    console.log(`✅ Linked GitHub ${githubUser.login} to Farcaster ${farcasterInfo.username}`);
    
    // Redirect back to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?github_linked=true&github_username=${githubUser.login}`);
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'OAuth failed' });
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

export default router;