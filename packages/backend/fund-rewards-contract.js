/**
 * Fund the ABC Rewards contract with tokens from protocol wallet
 * This fixes the "insufficient contract balance" error when claiming rewards
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACTS = {
  ABC_TOKEN: '0x5c0872b790bb73e2b3a9778db6e7704095624b07',
  ABC_REWARDS: '0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c',
  PROTOCOL_WALLET: '0xBE6525b767cA8D38d169C93C8120c0C0957388B8'
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

async function fundRewardsContract() {
  console.log('🏦 ABC DAO Rewards Contract Funding');
  console.log('=====================================');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BOT_WALLET_PRIVATE_KEY, provider);
  
  console.log(`📡 Connected to Base via: ${process.env.BASE_RPC_URL}`);
  console.log(`👤 Protocol wallet: ${wallet.address}`);
  
  // Connect to ABC token contract
  const abcToken = new ethers.Contract(CONTRACTS.ABC_TOKEN, ERC20_ABI, wallet);
  
  // Check current balances
  console.log('\n📊 Current Balances:');
  const protocolBalance = await abcToken.balanceOf(CONTRACTS.PROTOCOL_WALLET);
  const rewardsBalance = await abcToken.balanceOf(CONTRACTS.ABC_REWARDS);
  
  const protocolTokens = ethers.formatUnits(protocolBalance, 18);
  const rewardsTokens = ethers.formatUnits(rewardsBalance, 18);
  
  console.log(`   Protocol Wallet: ${parseFloat(protocolTokens).toLocaleString()} $ABC`);
  console.log(`   Rewards Contract: ${parseFloat(rewardsTokens).toLocaleString()} $ABC`);
  
  // Calculate transfer amount (fund with 10M tokens for now)
  const transferAmount = ethers.parseUnits('10000000', 18); // 10M tokens
  const transferTokens = ethers.formatUnits(transferAmount, 18);
  
  if (protocolBalance < transferAmount) {
    console.log('❌ Insufficient protocol wallet balance');
    process.exit(1);
  }
  
  console.log(`\n💸 Transferring ${parseFloat(transferTokens).toLocaleString()} $ABC to rewards contract...`);
  
  try {
    // Execute transfer
    const tx = await abcToken.transfer(CONTRACTS.ABC_REWARDS, transferAmount);
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Check new balances
    console.log('\n📊 New Balances:');
    const newProtocolBalance = await abcToken.balanceOf(CONTRACTS.PROTOCOL_WALLET);
    const newRewardsBalance = await abcToken.balanceOf(CONTRACTS.ABC_REWARDS);
    
    const newProtocolTokens = ethers.formatUnits(newProtocolBalance, 18);
    const newRewardsTokens = ethers.formatUnits(newRewardsBalance, 18);
    
    console.log(`   Protocol Wallet: ${parseFloat(newProtocolTokens).toLocaleString()} $ABC`);
    console.log(`   Rewards Contract: ${parseFloat(newRewardsTokens).toLocaleString()} $ABC`);
    
    console.log('\n🎉 Rewards contract successfully funded!');
    console.log('💎 Users can now claim their rewards!');
    
  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
    process.exit(1);
  }
}

// Check if running as script
if (process.argv[1] === new URL(import.meta.url).pathname) {
  fundRewardsContract().catch(console.error);
}

export { fundRewardsContract };