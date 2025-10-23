#!/usr/bin/env node

/**
 * Script to fix NFT metadata for existing tokens
 * Generates unique metadata for each token and uploads to IPFS
 */

import { NFTMembershipMonitor } from '../src/services/nft-membership-monitor.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const command = process.argv[2];
  
  console.log('🎫 ABC DAO NFT Metadata Fixer');
  console.log('=============================\n');
  
  const monitor = new NFTMembershipMonitor();
  
  switch (command) {
    case 'check':
      console.log('📊 Checking current contract status...');
      const stats = await monitor.getContractStats();
      if (stats) {
        console.log(`✅ Contract: ${stats.contractAddress}`);
        console.log(`✅ Total Minted: ${stats.totalMinted}`);
        console.log(`✅ Mint Price: ${stats.mintPrice} ETH`);
      }
      break;
      
    case 'fix':
      console.log('🔧 Fixing existing token metadata...');
      console.log('⚠️  This will upload new metadata files to IPFS');
      console.log('⚠️  Make sure PINATA_API_KEY and PINATA_SECRET_API_KEY are set\n');
      
      await monitor.fixExistingTokens();
      break;
      
    case 'test':
      console.log('🧪 Testing metadata generation...');
      const testResult = await monitor.metadataGenerator.processTokenMetadata(
        '999', // Test token ID
        '0x1234567890123456789012345678901234567890', // Test address
        Date.now()
      );
      
      if (testResult.success) {
        console.log('✅ Test metadata generation successful!');
        console.log('📄 Generated metadata:');
        console.log(JSON.stringify(testResult.metadata, null, 2));
      } else {
        console.error('❌ Test failed:', testResult.error);
      }
      break;
      
    default:
      console.log('Usage: node scripts/fix-nft-metadata.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  check  - Check current contract status');
      console.log('  test   - Test metadata generation (no upload)');
      console.log('  fix    - Fix existing token metadata (uploads to IPFS)');
      console.log('');
      console.log('Environment Variables Required:');
      console.log('  PINATA_API_KEY - Pinata API key for IPFS uploads');
      console.log('  PINATA_SECRET_API_KEY - Pinata secret key');
      console.log('  BASE_RPC_URL - Base network RPC URL');
      break;
  }
}

main().catch(console.error);