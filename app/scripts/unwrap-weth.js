import { ethers } from 'ethers';
import { config } from 'dotenv';

// Load environment variables
config();

// Configuration
const PROTOCOL_WALLET = '0xBE6525b767cA8D38d169C93C8120c0C0957388B8';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // Base WETH
const BASE_RPC = 'https://mainnet.base.org'; // Public RPC, replace with Alchemy if needed

// WETH ABI - just the withdraw function
const WETH_ABI = [
  'function withdraw(uint256 wad) external',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function unwrapWETH() {
  try {
    console.log('🔧 Starting WETH unwrapping process...');
    
    // Check for private key
    if (!process.env.BOT_WALLET_PRIVATE_KEY) {
      throw new Error('BOT_WALLET_PRIVATE_KEY environment variable not set');
    }
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const wallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
    
    console.log(`📍 Protocol wallet: ${PROTOCOL_WALLET}`);
    console.log(`💰 Wallet address: ${wallet.address}`);
    
    // Verify this is the correct wallet
    if (wallet.address.toLowerCase() !== PROTOCOL_WALLET.toLowerCase()) {
      throw new Error(`Private key does not match protocol wallet. Expected: ${PROTOCOL_WALLET}, Got: ${wallet.address}`);
    }
    
    // Get WETH contract
    const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);
    
    // Check WETH balance
    const wethBalance = await wethContract.balanceOf(PROTOCOL_WALLET);
    const wethBalanceEth = ethers.formatEther(wethBalance);
    
    console.log(`🏦 Current WETH balance: ${wethBalanceEth} WETH`);
    
    if (wethBalance === 0n) {
      console.log('✅ No WETH to unwrap. Exiting.');
      return;
    }
    
    // Check current ETH balance
    const ethBalance = await provider.getBalance(PROTOCOL_WALLET);
    const ethBalanceEth = ethers.formatEther(ethBalance);
    console.log(`💸 Current ETH balance: ${ethBalanceEth} ETH`);
    
    // Estimate gas for withdrawal
    const gasEstimate = await wethContract.withdraw.estimateGas(wethBalance);
    const gasPrice = await provider.getFeeData();
    const estimatedCost = gasEstimate * gasPrice.gasPrice;
    
    console.log(`⛽ Estimated gas cost: ${ethers.formatEther(estimatedCost)} ETH`);
    
    // Execute withdrawal of full WETH balance
    console.log(`🔄 Unwrapping ${wethBalanceEth} WETH to ETH...`);
    
    const tx = await wethContract.withdraw(wethBalance, {
      gasLimit: gasEstimate,
      gasPrice: gasPrice.gasPrice
    });
    
    console.log(`📝 Transaction sent: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ WETH successfully unwrapped!');
      
      // Check final balances
      const finalEthBalance = await provider.getBalance(PROTOCOL_WALLET);
      const finalWethBalance = await wethContract.balanceOf(PROTOCOL_WALLET);
      
      console.log(`🏦 Final ETH balance: ${ethers.formatEther(finalEthBalance)} ETH`);
      console.log(`🏦 Final WETH balance: ${ethers.formatEther(finalWethBalance)} WETH`);
      console.log(`🎉 Unwrapped ${wethBalanceEth} WETH successfully!`);
      
    } else {
      console.error('❌ Transaction failed');
    }
    
  } catch (error) {
    console.error('💥 Error unwrapping WETH:', error.message);
    process.exit(1);
  }
}

// Run the script
unwrapWETH()
  .then(() => {
    console.log('🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

export { unwrapWETH };