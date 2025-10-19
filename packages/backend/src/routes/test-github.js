import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Test GitHub OAuth flow
router.post('/github-oauth-test', async (req, res) => {
  try {
    // Test JWT token creation
    const testState = jwt.sign(
      { fid: 8573, username: 'ipfsnut' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('JWT Secret available:', !!process.env.JWT_SECRET);
    console.log('Test state token:', testState);
    
    // Test JWT verification
    const decoded = jwt.verify(testState, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Generate test auth URL
    const backendUrl = process.env.BACKEND_URL || 'https://abcdao-production.up.railway.app';
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(backendUrl + '/api/auth/github/callback')}&` +
      `scope=user:email&` +
      `state=${testState}`;
    
    res.json({
      success: true,
      environment: {
        jwt_secret: !!process.env.JWT_SECRET,
        github_client_id: !!process.env.GITHUB_CLIENT_ID,
        github_client_secret: !!process.env.GITHUB_CLIENT_SECRET,
        backend_url: process.env.BACKEND_URL,
        frontend_url: process.env.FRONTEND_URL
      },
      test_auth_url: authUrl,
      decoded_token: decoded
    });
    
  } catch (error) {
    console.error('GitHub OAuth test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;