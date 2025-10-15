import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function testEthDistribution() {
  console.log('🧪 ETH Distribution Pre-Deployment Tests\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    const botWallet = new ethers.Wallet(
      '0x8b3a36f3e4d1c7a2b5e8f9d6c3a0b7e4f1d8c5a2b9e6f3d0c7a4b1e8f5d2c9a6', // Correct key
      provider
    );
    
    const stakingContract = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    const treasuryAddress = '0x18A85ad341b2D6A2bd67fbb104B4827B922a2A3c';
    
    console.log('🔧 Configuration Check:');
    console.log(`- Bot Wallet: ${botWallet.address}`);
    console.log(`- Staking Contract: ${stakingContract}`);
    console.log(`- Treasury Address: ${treasuryAddress}\n`);
    
    // Test 1: Check current balances
    console.log('📊 Current Balances:');
    const botBalance = await provider.getBalance(botWallet.address);
    const stakingBalance = await provider.getBalance(stakingContract);
    const treasuryBalance = await provider.getBalance(treasuryAddress);
    
    console.log(`- Bot: ${ethers.formatEther(botBalance)} ETH`);
    console.log(`- Staking: ${ethers.formatEther(stakingBalance)} ETH`);
    console.log(`- Treasury: ${ethers.formatEther(treasuryBalance)} ETH\n`);
    
    // Test 2: Check if staking contract can receive ETH
    console.log('🔍 Staking Contract Analysis:');
    const stakingCode = await provider.getCode(stakingContract);
    console.log(`- Has code: ${stakingCode !== '0x' ? '✅ Yes' : '❌ No (EOA)'}`);
    
    // Test 3: Gas estimation for transfers
    console.log('\n⛽ Gas Estimation Tests:');
    const testAmount = ethers.parseEther('0.001'); // Small test amount
    
    try {
      const stakingGas = await provider.estimateGas({
        from: botWallet.address,
        to: stakingContract,
        value: testAmount
      });
      console.log(`- Staking transfer gas: ${stakingGas.toString()} (limit: 50,000)`);
      console.log(`- Staking gas OK: ${stakingGas < 50000 ? '✅ Yes' : '❌ Too high'}`);
    } catch (error) {
      console.log(`- Staking transfer: ❌ FAIL - ${error.message}`);
    }
    
    try {
      const treasuryGas = await provider.estimateGas({
        from: botWallet.address,
        to: treasuryAddress,
        value: testAmount
      });
      console.log(`- Treasury transfer gas: ${treasuryGas.toString()} (limit: 50,000)`);
      console.log(`- Treasury gas OK: ${treasuryGas < 50000 ? '✅ Yes' : '❌ Too high'}`);
    } catch (error) {
      console.log(`- Treasury transfer: ❌ FAIL - ${error.message}`);
    }
    
    // Test 4: Distribution calculation simulation
    console.log('\n🧮 Distribution Calculation Test:');
    const gasReserve = ethers.parseEther('0.005');
    const availableBalance = botBalance - gasReserve;
    
    if (availableBalance <= 0) {
      console.log('❌ No balance available for distribution');
      return;
    }
    
    const stakingAmount = (availableBalance * 25n) / 10000n; // 0.25%
    const treasuryAmount = (availableBalance * 25n) / 10000n; // 0.25%
    const remaining = botBalance - stakingAmount - treasuryAmount;
    
    console.log(`- Available: ${ethers.formatEther(availableBalance)} ETH`);
    console.log(`- To Staking (0.25%): ${ethers.formatEther(stakingAmount)} ETH`);
    console.log(`- To Treasury (0.25%): ${ethers.formatEther(treasuryAmount)} ETH`);
    console.log(`- Remaining (99.5%): ${ethers.formatEther(remaining)} ETH`);
    
    // Test 5: Environment variables check
    console.log('\n🔧 Environment Variables:');
    console.log(`- STAKING_CONTRACT_ADDRESS: ${process.env.STAKING_CONTRACT_ADDRESS ? '✅ Set' : '❌ Missing'}`);
    console.log(`- BOT_WALLET_PRIVATE_KEY: ${process.env.BOT_WALLET_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`- NEYNAR_API_KEY: ${process.env.NEYNAR_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`- NEYNAR_SIGNER_UUID: ${process.env.NEYNAR_SIGNER_UUID ? '✅ Set' : '❌ Missing'}`);
    
    // Test 6: Minimum threshold check
    console.log('\n📏 Threshold Check:');
    const minThreshold = ethers.parseEther('0.01');
    const willRun = botBalance >= minThreshold;
    console.log(`- Current balance: ${ethers.formatEther(botBalance)} ETH`);
    console.log(`- Minimum threshold: ${ethers.formatEther(minThreshold)} ETH`);
    console.log(`- Will distribute: ${willRun ? '✅ Yes' : '❌ No (below threshold)'}`);
    
    console.log('\n🎯 Test Summary:');
    console.log('Please verify all checks pass before deploying the ETH distribution system.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEthDistribution();