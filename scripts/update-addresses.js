#!/usr/bin/env node

/**
 * Update Frontend Contract Addresses
 * 
 * This script updates the frontend configuration with new ABC token and staking addresses.
 * Run this after deploying the ABC staking contract.
 * 
 * Usage:
 *   node scripts/update-addresses.js --abc-token=0x... --abc-staking=0x...
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--abc-token=')) {
      config.abcToken = arg.split('=')[1];
    } else if (arg.startsWith('--abc-staking=')) {
      config.abcStaking = arg.split('=')[1];
    }
  });
  
  return config;
}

// Validate Ethereum address format
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Update contracts.ts file
function updateContractsFile(abcToken, abcStaking) {
  const contractsPath = path.join(__dirname, '../packages/frontend/lib/contracts.ts');
  
  if (!fs.existsSync(contractsPath)) {
    console.error('❌ contracts.ts file not found at:', contractsPath);
    process.exit(1);
  }
  
  let content = fs.readFileSync(contractsPath, 'utf8');
  
  // Update ABC_TOKEN address
  if (abcToken) {
    content = content.replace(
      /ABC_TOKEN: \{[\s\S]*?address: '[^']*'/,
      `ABC_TOKEN: {
    address: '${abcToken}'`
    );
    console.log('✅ Updated ABC_TOKEN address to:', abcToken);
  }
  
  // Update ABC_STAKING address  
  if (abcStaking) {
    content = content.replace(
      /ABC_STAKING: \{[\s\S]*?address: '[^']*'/,
      `ABC_STAKING: {
    address: '${abcStaking}'`
    );
    console.log('✅ Updated ABC_STAKING address to:', abcStaking);
  }
  
  fs.writeFileSync(contractsPath, content);
  console.log('✅ contracts.ts updated successfully');
}

// Update .env.local file
function updateEnvFile(abcToken, abcStaking) {
  const envPath = path.join(__dirname, '../packages/frontend/.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found at:', envPath);
    return;
  }
  
  let content = fs.readFileSync(envPath, 'utf8');
  
  // Update or add ABC token address
  if (abcToken) {
    if (content.includes('NEXT_PUBLIC_ABC_TOKEN_ADDRESS=')) {
      content = content.replace(
        /NEXT_PUBLIC_ABC_TOKEN_ADDRESS=.*/,
        `NEXT_PUBLIC_ABC_TOKEN_ADDRESS=${abcToken}`
      );
    } else {
      content += `\nNEXT_PUBLIC_ABC_TOKEN_ADDRESS=${abcToken}\n`;
    }
    console.log('✅ Updated NEXT_PUBLIC_ABC_TOKEN_ADDRESS');
  }
  
  // Update or add staking contract address
  if (abcStaking) {
    if (content.includes('NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=')) {
      content = content.replace(
        /NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=${abcStaking}`
      );
    } else {
      content += `\nNEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=${abcStaking}\n`;
    }
    console.log('✅ Updated NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS');
  }
  
  fs.writeFileSync(envPath, content);
  console.log('✅ .env.local updated successfully');
}

// Update deployments.json file
function updateDeploymentsFile(abcToken, abcStaking) {
  const deploymentsPath = path.join(__dirname, '../packages/contracts/deployments.json');
  
  if (!fs.existsSync(deploymentsPath)) {
    console.error('❌ deployments.json file not found at:', deploymentsPath);
    process.exit(1);
  }
  
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  
  // Update base network addresses
  if (abcToken) {
    deployments.base.ABC_TOKEN = abcToken;
  }
  if (abcStaking) {
    deployments.base.ABC_STAKING_V2 = abcStaking;
  }
  
  // Update timestamp
  deployments.lastUpdated = new Date().toISOString();
  deployments.notes = "Updated with ABC token and staking addresses";
  
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log('✅ deployments.json updated successfully');
}

// Main function
function main() {
  console.log('🚀 ABC Address Updater');
  console.log('=====================');
  
  const { abcToken, abcStaking } = parseArgs();
  
  // Validation
  if (!abcToken && !abcStaking) {
    console.error('❌ No addresses provided. Use --abc-token and/or --abc-staking flags.');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/update-addresses.js --abc-token=0x... --abc-staking=0x...');
    process.exit(1);
  }
  
  if (abcToken && !isValidAddress(abcToken)) {
    console.error('❌ Invalid ABC token address format:', abcToken);
    process.exit(1);
  }
  
  if (abcStaking && !isValidAddress(abcStaking)) {
    console.error('❌ Invalid ABC staking address format:', abcStaking);
    process.exit(1);
  }
  
  // Backup original files
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  console.log('📁 Creating backups...');
  
  try {
    const contractsPath = path.join(__dirname, '../packages/frontend/lib/contracts.ts');
    const deploymentsPath = path.join(__dirname, '../packages/contracts/deployments.json');
    
    if (fs.existsSync(contractsPath)) {
      fs.copyFileSync(contractsPath, `${contractsPath}.backup-${timestamp}`);
    }
    if (fs.existsSync(deploymentsPath)) {
      fs.copyFileSync(deploymentsPath, `${deploymentsPath}.backup-${timestamp}`);
    }
    
    console.log('✅ Backup files created');
  } catch (error) {
    console.error('❌ Failed to create backups:', error.message);
    process.exit(1);
  }
  
  // Update files
  try {
    updateContractsFile(abcToken, abcStaking);
    updateEnvFile(abcToken, abcStaking);
    updateDeploymentsFile(abcToken, abcStaking);
    
    console.log('');
    console.log('🎉 Address update completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your frontend development server');
    console.log('2. Test the staking functionality');
    console.log('3. Deploy to production when ready');
    
  } catch (error) {
    console.error('❌ Failed to update addresses:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateContractsFile, updateEnvFile, updateDeploymentsFile };