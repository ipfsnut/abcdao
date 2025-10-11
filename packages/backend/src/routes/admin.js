import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

// Simple auth middleware (replace with proper auth)
function requireAuth(req, res, next) {
  const authKey = req.headers['x-admin-key'];
  if (authKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get bot wallet balance
router.get('/wallet/balance', requireAuth, async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const ethBalance = await provider.getBalance(botWallet.address);
    
    let abcBalance = '0';
    if (process.env.ABC_TOKEN_ADDRESS && process.env.ABC_TOKEN_ADDRESS !== '0x...') {
      try {
        const abcContract = new ethers.Contract(
          process.env.ABC_TOKEN_ADDRESS,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        abcBalance = ethers.formatUnits(await abcContract.balanceOf(botWallet.address), 18);
      } catch (error) {
        console.warn('ABC token balance check failed:', error.message);
        abcBalance = 'N/A';
      }
    } else {
      abcBalance = 'N/A (token not deployed)';
    }
    
    res.json({
      address: botWallet.address,
      ethBalance: ethers.formatEther(ethBalance),
      abcBalance: abcBalance
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw ETH from bot wallet
router.post('/wallet/withdraw-eth', requireAuth, async (req, res) => {
  try {
    const { to, amount } = req.body;
    
    if (!ethers.isAddress(to)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const tx = await botWallet.sendTransaction({
      to: to,
      value: ethers.parseEther(amount)
    });
    
    console.log(`✅ Withdrew ${amount} ETH to ${to}. TX: ${tx.hash}`);
    
    res.json({
      success: true,
      txHash: tx.hash,
      amount: amount,
      to: to
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Forward ETH to staking contract (manual trigger)
router.post('/wallet/forward-eth', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body; // Optional, defaults to most of balance
    
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const botWallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    const balance = await provider.getBalance(botWallet.address);
    const gasReserve = ethers.parseEther('0.01'); // Keep 0.01 ETH for gas
    
    let forwardAmount;
    if (amount) {
      forwardAmount = ethers.parseEther(amount);
    } else {
      forwardAmount = balance - gasReserve;
    }
    
    if (forwardAmount <= 0) {
      return res.status(400).json({ error: 'Insufficient balance to forward' });
    }
    
    const tx = await botWallet.sendTransaction({
      to: process.env.STAKING_CONTRACT_ADDRESS,
      value: forwardAmount
    });
    
    console.log(`✅ Forwarded ${ethers.formatEther(forwardAmount)} ETH to staking. TX: ${tx.hash}`);
    
    res.json({
      success: true,
      txHash: tx.hash,
      amount: ethers.formatEther(forwardAmount),
      to: process.env.STAKING_CONTRACT_ADDRESS
    });
  } catch (error) {
    console.error('Forward error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;