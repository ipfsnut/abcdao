const { ethers } = require('ethers');

// Contract addresses
const ABC_TOKEN = '0x5c0872b790bb73e2b3a9778db6e7704095624b07';
const REWARDS_CONTRACT = '0x577822396162022654D5bDc9CB58018cB53e7017';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

async function checkRewardsBalance() {
  try {
    console.log('🔍 Checking ABC token balance in Rewards contract...');
    
    // Connect to Base mainnet via Alchemy
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/your-key');
    
    // Create contract instance
    const tokenContract = new ethers.Contract(ABC_TOKEN, ERC20_ABI, provider);
    
    // Get balance and decimals
    const [balance, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(REWARDS_CONTRACT),
      tokenContract.decimals(),
      tokenContract.symbol()
    ]);
    
    // Format balance
    const formattedBalance = ethers.formatUnits(balance, decimals);
    const balanceNumber = parseFloat(formattedBalance);
    
    console.log('\n📊 Results:');
    console.log(`Token: ${symbol}`);
    console.log(`Rewards Contract: ${REWARDS_CONTRACT}`);
    console.log(`Raw Balance: ${balance.toString()}`);
    console.log(`Formatted Balance: ${balanceNumber.toLocaleString()} ${symbol}`);
    
    // Check if it's less than the required amount
    const requiredAmount = 10183146;
    console.log(`Required Amount: ${requiredAmount.toLocaleString()} ${symbol}`);
    
    if (balanceNumber < requiredAmount) {
      console.log('\n❌ INSUFFICIENT BALANCE!');
      console.log(`Shortage: ${(requiredAmount - balanceNumber).toLocaleString()} ${symbol}`);
      console.log('This would cause claim transactions to fail.');
    } else {
      console.log('\n✅ Sufficient balance for claims');
      console.log(`Excess: ${(balanceNumber - requiredAmount).toLocaleString()} ${symbol}`);
    }
    
  } catch (error) {
    console.error('Error checking balance:', error);
  }
}

checkRewardsBalance();