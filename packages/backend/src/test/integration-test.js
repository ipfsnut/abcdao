#!/usr/bin/env node

/**
 * ABC DAO Integration Test Suite
 * Tests all core functionality before production deployment
 */

import axios from 'axios';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3001';
const ADMIN_KEY = process.env.ADMIN_SECRET || 'test-admin-key';

class ABCDAOTester {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    try {
      await testFn();
      console.log(`✅ PASS: ${name}`);
      this.results.push({ name, status: 'PASS' });
      this.passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      this.results.push({ name, status: 'FAIL', error: error.message });
      this.failed++;
    }
    console.log('');
  }

  async testHealthCheck() {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status !== 200) throw new Error('Health check failed');
    if (!response.data.status === 'healthy') throw new Error('Health status not healthy');
  }

  async testFarcasterBotPosting() {
    const response = await axios.post(`${BASE_URL}/api/test/farcaster`);
    if (!response.data.success) throw new Error('Bot posting failed');
    console.log(`   Posted cast: ${response.data.castHash || 'success'}`);
  }

  async testBotWalletBalance() {
    const response = await axios.get(`${BASE_URL}/api/admin/wallet/balance`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    if (!response.data.address) throw new Error('Could not get wallet balance');
    console.log(`   Wallet: ${response.data.address}`);
    console.log(`   ETH: ${response.data.ethBalance}`);
    console.log(`   ABC: ${response.data.abcBalance || 'N/A (no token yet)'}`);
  }

  async testGitHubWebhookMock() {
    const mockPayload = {
      repository: { 
        full_name: 'test/repo',
        private: false 
      },
      pusher: { name: 'testuser' },
      commits: [{
        id: 'test-commit-' + Date.now(),
        message: 'Test commit for ABC DAO integration test',
        url: 'https://github.com/test/repo/commit/test'
      }]
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/webhooks/test`, mockPayload);
      if (response.status !== 200) throw new Error('Webhook test failed');
      console.log('   Mock webhook processed successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('unregistered')) {
        console.log('   Expected: No registered user (test passed)');
      } else {
        throw error;
      }
    }
  }

  async testDatabaseConnection() {
    // Test if we can reach the health endpoint which requires DB
    const response = await axios.get(`${BASE_URL}/health`);
    if (!response.data.timestamp) throw new Error('Database timestamp missing');
  }

  async testEnvironmentVariables() {
    const required = [
      'NEYNAR_API_KEY',
      'NEYNAR_SIGNER_UUID',
      'BOT_WALLET_PRIVATE_KEY',
      'BOT_WALLET_ADDRESS'
    ];

    for (const envVar of required) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    console.log(`   All ${required.length} required variables present`);
  }

  async testWalletConnectivity() {
    const privateKey = process.env.BOT_WALLET_PRIVATE_KEY;
    if (!privateKey) throw new Error('No bot wallet private key');
    
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`   Wallet address: ${wallet.address}`);
    console.log(`   ETH balance: ${ethers.formatEther(balance)}`);
    
    if (balance === 0n) {
      console.log('   ⚠️  WARNING: Wallet has no ETH for gas fees');
    }
  }

  async testContractABIs() {
    // Test that our contract ABIs are valid
    try {
      const stakingABI = [
        'function stake(uint256 _amount) external',
        'function unstake(uint256 _amount) external',
        'function withdrawRewards() external',
        'function getStakedAmount(address _user) external view returns (uint256)',
        'function isEligibleForRewards(address _user) external view returns (bool)'
      ];
      
      const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
      // Test ABI compilation without deployment
      const dummyAddress = '0x0000000000000000000000000000000000000001';
      new ethers.Contract(dummyAddress, stakingABI, provider);
      console.log('   Staking contract ABI valid');
    } catch (error) {
      throw new Error(`Contract ABI invalid: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting ABC DAO Integration Tests\n');
    console.log('=' .repeat(50));

    await this.test('Health Check', () => this.testHealthCheck());
    await this.test('Environment Variables', () => this.testEnvironmentVariables());
    await this.test('Database Connection', () => this.testDatabaseConnection());
    await this.test('Wallet Connectivity', () => this.testWalletConnectivity());
    await this.test('Bot Wallet Balance Check', () => this.testBotWalletBalance());
    await this.test('Farcaster Bot Posting', () => this.testFarcasterBotPosting());
    await this.test('GitHub Webhook Mock', () => this.testGitHubWebhookMock());
    await this.test('Contract ABIs', () => this.testContractABIs());

    console.log('=' .repeat(50));
    console.log('🏁 Test Results Summary');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);

    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed! System ready for deployment.');
      process.exit(0);
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ABCDAOTester();
  tester.runAllTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

export default ABCDAOTester;