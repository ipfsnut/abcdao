#!/usr/bin/env node
import axios from 'axios';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '../.env' });

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createBotAccount() {
  try {
    console.log('🤖 ABC Bot Account Creator');
    console.log('==========================\n');

    if (!NEYNAR_API_KEY) {
      console.error('❌ NEYNAR_API_KEY not found in .env file');
      process.exit(1);
    }

    // Step 1: Generate a new wallet for the bot
    console.log('📝 Step 1: Generating wallet for bot...');
    const wallet = ethers.Wallet.createRandom();
    console.log('✅ Wallet generated');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    console.log(`   Mnemonic: ${wallet.mnemonic.phrase}\n`);

    // Step 2: Get username from user
    const username = await question('Enter desired username for bot (e.g., abcbot): ');
    
    if (!username || username.length < 3) {
      console.error('❌ Username must be at least 3 characters');
      process.exit(1);
    }

    console.log(`\n📝 Step 2: Fetching available FID for @${username}...`);
    
    // Step 3: Fetch FID from Neynar
    const fidResponse = await axios.post(
      `${NEYNAR_BASE_URL}/v2/farcaster/user/fid`,
      {},
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-api-key': NEYNAR_API_KEY
        }
      }
    );

    const fid = fidResponse.data.fid;
    console.log(`✅ FID ${fid} reserved`);

    // Step 4: Create signature for registration
    console.log('\n📝 Step 3: Creating registration signature...');
    
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    const messageHash = ethers.utils.solidityKeccak256(
      ['uint256', 'address', 'uint256'],
      [fid, wallet.address, deadline]
    );
    
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
    console.log('✅ Signature created');

    // Step 5: Register the account
    console.log(`\n📝 Step 4: Registering @${username} on Farcaster...`);
    
    const registerResponse = await axios.post(
      `${NEYNAR_BASE_URL}/v2/farcaster/user`,
      {
        signature: signature,
        fid: fid,
        requested_user_custody_address: wallet.address,
        deadline: deadline,
        fname: username,
        metadata: {
          bio: "ABC DAO Bot 🤖 Ship code, earn $ABC!\n\n💰 $ABC: 0x5c0872b790bb73e2b3a9778db6e7704095624b07\n📱 Add miniapp: farcaster.xyz/miniapps/S1edg9PycxZP/abcdao\n\n#AlwaysBeCoding",
          display_name: "ABC Bot",
          pfp_url: "https://i.imgur.com/3kFzKxm.png" // You can change this
        }
      },
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-api-key': NEYNAR_API_KEY
        }
      }
    );

    if (registerResponse.data.success) {
      console.log('✅ Account successfully created!\n');
      console.log('=== IMPORTANT: SAVE THIS INFORMATION ===');
      console.log(`Username: @${username}`);
      console.log(`FID: ${fid}`);
      console.log(`Wallet Address: ${wallet.address}`);
      console.log(`Private Key: ${wallet.privateKey}`);
      console.log(`Mnemonic: ${wallet.mnemonic.phrase}`);
      console.log('\n🔐 Add these to your .env file:');
      console.log(`BOT_FARCASTER_FID=${fid}`);
      console.log(`BOT_FARCASTER_USERNAME=${username}`);
      console.log(`BOT_WALLET_PRIVATE_KEY=${wallet.privateKey}`);
      console.log(`BOT_WALLET_ADDRESS=${wallet.address}`);
      console.log(`BOT_MNEMONIC="${wallet.mnemonic.phrase}"`);
      console.log('========================================\n');
    } else {
      console.error('❌ Registration failed:', registerResponse.data);
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
      if (error.response.status === 409) {
        console.log('\n💡 Username might already be taken. Try a different one.');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    rl.close();
  }
}

// Alternative: Create signer for existing account
async function createSignerForExistingAccount() {
  console.log('\n📝 Creating signer for existing account...');
  console.log('1. Go to https://dev.neynar.com');
  console.log('2. Navigate to "Agents and bots"');
  console.log('3. Click "Create new signer"');
  console.log('4. Enter your bot FID');
  console.log('5. Complete the transaction');
  console.log('6. Copy the signer UUID\n');
}

async function main() {
  console.log('Choose an option:');
  console.log('1. Create new Farcaster account for bot');
  console.log('2. Create signer for existing account');
  
  const choice = await question('\nEnter choice (1 or 2): ');
  
  if (choice === '1') {
    await createBotAccount();
  } else if (choice === '2') {
    await createSignerForExistingAccount();
  } else {
    console.log('Invalid choice');
  }
  
  process.exit(0);
}

main().catch(console.error);