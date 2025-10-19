import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Contract addresses
const STAKING_CONTRACT_ADDRESS = process.env.STAKING_CONTRACT_ADDRESS;
const ABC_TOKEN_ADDRESS = process.env.ABC_TOKEN_ADDRESS;
const BASE_RPC_URL = process.env.BASE_RPC_URL;

// ERC20 ABI for checking token balance
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

async function checkStakingBalance() {
  try {
    console.log('🔍 Checking Staking Contract Balances...\n');
    
    // Setup provider
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    
    // Get ETH balance
    const ethBalance = await provider.getBalance(STAKING_CONTRACT_ADDRESS);
    console.log(`📊 Staking Contract: ${STAKING_CONTRACT_ADDRESS}`);
    console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
    
    // Get ABC token balance
    const abcContract = new ethers.Contract(ABC_TOKEN_ADDRESS, ERC20_ABI, provider);
    const abcBalance = await abcContract.balanceOf(STAKING_CONTRACT_ADDRESS);
    const abcDecimals = await abcContract.decimals();
    
    console.log(`🪙  $ABC Balance: ${ethers.formatUnits(abcBalance, abcDecimals)} ABC`);
    
    // Also check bot wallet for comparison
    const BOT_WALLET_ADDRESS = process.env.BOT_WALLET_ADDRESS;
    if (BOT_WALLET_ADDRESS) {
      console.log('\n🤖 Bot Wallet Comparison:');
      const botEthBalance = await provider.getBalance(BOT_WALLET_ADDRESS);
      const botAbcBalance = await abcContract.balanceOf(BOT_WALLET_ADDRESS);
      
      console.log(`📊 Bot Wallet: ${BOT_WALLET_ADDRESS}`);
      console.log(`💰 ETH Balance: ${ethers.formatEther(botEthBalance)} ETH`);
      console.log(`🪙  $ABC Balance: ${ethers.formatUnits(botAbcBalance, abcDecimals)} ABC`);
    }
    
  } catch (error) {
    console.error('❌ Error checking balances:', error);
  }
}

checkStakingBalance();