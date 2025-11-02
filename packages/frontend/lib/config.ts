// Environment configuration for the ABC DAO app
// Handles different environments: local, production, and Farcaster frames

export const config = {
  // Backend API URL
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  
  // App URL (frontend)
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Chain configuration
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453'), // Base mainnet
  
  // RPC URLs
  baseRpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  
  // WalletConnect
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  
  // Neynar (Farcaster)
  neynarClientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || '',
  
  // Check if running in production
  isProduction: process.env.NODE_ENV === 'production',
  
  // Bot wallet address for payments
  botWalletAddress: process.env.NEXT_PUBLIC_BOT_WALLET_ADDRESS || '0x48D87BE38677Ad764203b5516900691Cbd8C7042',
  
  // Check if we have all required environment variables
  isConfigured: () => {
    return !!(
      process.env.NEXT_PUBLIC_BACKEND_URL &&
      process.env.NEXT_PUBLIC_BASE_RPC_URL &&
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    );
  },
};

// Helper to detect if running in an iframe/frame (Farcaster mini-app)
export const isInFrame = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.self !== window.top || window.location !== window.parent.location;
  } catch {
    // If we can't access parent due to cross-origin, we're likely in a frame
    return true;
  }
};

// Helper to get the correct callback URL for OAuth flows
export const getCallbackUrl = () => {
  if (typeof window === 'undefined') return config.appUrl;
  
  // Use current origin to handle different deployments
  return window.location.origin;
};

// Helper to handle frame-specific navigation
export const navigateInFrame = (url: string, newTab = false) => {
  if (isInFrame() || newTab) {
    // In frame or forced new tab, open in new window
    window.open(url, '_blank');
    return true;
  } else {
    // Normal navigation
    window.location.href = url;
    return false;
  }
};