import { PaymentMonitor } from './src/services/payment-monitor.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPaymentMonitor() {
  console.log('🧪 Testing Payment Monitor:');
  console.log('═'.repeat(40));
  
  const monitor = new PaymentMonitor();
  
  // Test recent payments check to see if it finds our known transactions
  console.log('\n🔍 Testing recent payments detection...');
  await monitor.checkRecentPayments(2); // Check last 2 hours
  
  console.log('\n📋 Payment Monitor Status:');
  console.log(`   Bot Wallet: ${monitor.botWalletAddress}`);
  console.log(`   Expected Amount: ${monitor.expectedAmount}`);
  console.log(`   Is Monitoring: ${monitor.isMonitoring}`);
  
  process.exit(0);
}

testPaymentMonitor().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});