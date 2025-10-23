import { ethers } from 'ethers';
import { getPool } from './database.js';
import { farcasterService } from './farcaster.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * NFT Membership Transfer Policy:
 * 
 * - Membership is granted to the ORIGINAL MINTER of the NFT
 * - NFT transfers (selling/trading) do NOT transfer membership
 * - Each person must mint their own NFT to get membership
 * - The NFT serves as a collectible proof of membership, not the membership itself
 * 
 * Example:
 * 1. Alice mints NFT #123 → Alice gets membership
 * 2. Alice sells NFT #123 to Bob → Alice keeps membership, Bob doesn't get it
 * 3. Bob wants membership → Bob must mint NFT #124
 */

// ABC Membership NFT contract ABI (events and view functions)
const MEMBERSHIP_NFT_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "member", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "MembershipMinted",
    "type": "event"
  },
  // View functions
  {
    "inputs": [{"internalType": "address", "name": "member", "type": "address"}],
    "name": "isMember",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MINT_PRICE",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

class NFTMembershipMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.contractAddress = process.env.MEMBERSHIP_NFT_CONTRACT_ADDRESS || '0x9B790111758CB7C666e742814b86CF8185792f6E';
    this.contract = new ethers.Contract(this.contractAddress, MEMBERSHIP_NFT_ABI, this.provider);
    this.isMonitoring = false;
    this.lastCheckedBlock = null;
  }

  /**
   * Start monitoring NFT membership mints
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ NFT membership monitor already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🎫 Starting NFT membership monitor...');
    console.log(`   Contract: ${this.contractAddress}`);
    
    try {
      const mintPrice = await this.contract.MINT_PRICE();
      const totalSupply = await this.contract.totalSupply();
      console.log(`   Mint Price: ${ethers.formatEther(mintPrice)} ETH`);
      console.log(`   Total Minted: ${totalSupply.toString()}`);
    } catch (error) {
      console.log(`   Contract info unavailable: ${error.message}`);
    }

    // Get current block to start monitoring from
    this.lastCheckedBlock = await this.provider.getBlockNumber();
    console.log(`   Starting from block: ${this.lastCheckedBlock}\n`);

    // Listen for MembershipMinted events ONLY
    // Note: We explicitly ignore Transfer events - NFT ownership transfers 
    // do NOT affect membership status. Membership is tied to original minter.
    this.contract.on('MembershipMinted', async (member, tokenId, event) => {
      await this.processMembershipMinted(member, tokenId, event);
    });

    // Also listen for events in new blocks as a backup
    this.provider.on('block', (blockNumber) => {
      this.processNewBlock(blockNumber);
    });

    // Periodic check every 30 seconds as backup
    this.intervalCheck = setInterval(() => {
      this.checkMissedEvents();
    }, 30000);

    console.log('✅ NFT membership monitor started');
  }

  /**
   * Stop monitoring NFT membership events
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.contract.removeAllListeners('MembershipMinted');
    this.provider.removeAllListeners('block');
    
    if (this.intervalCheck) {
      clearInterval(this.intervalCheck);
    }

    console.log('🛑 NFT membership monitor stopped');
  }

  /**
   * Process a MembershipMinted event
   */
  async processMembershipMinted(member, tokenId, event) {
    try {
      console.log(`🎫 NFT membership minted!`);
      console.log(`   Member: ${member}`);
      console.log(`   Token ID: ${tokenId.toString()}`);
      console.log(`   Transaction: ${event.transactionHash}`);
      console.log(`   Block: ${event.blockNumber}`);

      // Try to find existing user and update membership
      await this.updateUserMembership(member, tokenId.toString(), event.transactionHash);

    } catch (error) {
      console.error(`❌ Error processing NFT mint:`, error.message);
    }
  }

  /**
   * Update user membership status in database
   * Note: Membership is tied to the original minter (walletAddress), 
   * NOT to current NFT holder. NFT transfers don't affect membership.
   */
  async updateUserMembership(walletAddress, tokenId, txHash) {
    try {
      const pool = getPool();
      
      console.log(`📝 Processing NFT membership for wallet ${walletAddress}...`);

      // Check if user exists by wallet address
      let userResult = await pool.query(
        'SELECT id, display_name, farcaster_username, github_username FROM users WHERE wallet_address = $1 OR wallet_address_primary = $1',
        [walletAddress]
      );

      let user;
      if (userResult.rows.length === 0) {
        console.log(`   👤 Creating new user for wallet: ${walletAddress}`);
        
        // Create new user with NFT membership
        const createResult = await pool.query(`
          INSERT INTO users (
            wallet_address, 
            wallet_address_primary,
            display_name,
            membership_status,
            membership_paid_at,
            membership_tx_hash,
            membership_amount,
            nft_token_id,
            nft_mint_tx_hash,
            entry_context,
            can_earn_rewards,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, 'paid', NOW(), $4, '0.002', $5, $4, 'nft_mint', false, NOW(), NOW())
          RETURNING id, display_name, farcaster_username, github_username
        `, [walletAddress, walletAddress, `Member-${tokenId}`, txHash, tokenId]);

        user = createResult.rows[0];
        console.log(`   ✅ Created new user with ID: ${user.id}`);
      } else {
        user = userResult.rows[0];
        console.log(`   👤 Found existing user: ${user.display_name || user.farcaster_username || `User-${user.id}`}`);

        // Update existing user's membership status
        await pool.query(`
          UPDATE users 
          SET 
            membership_status = 'paid',
            membership_paid_at = NOW(),
            membership_tx_hash = $1,
            membership_amount = '0.002',
            nft_token_id = $2,
            nft_mint_tx_hash = $1,
            updated_at = NOW()
          WHERE id = $3
        `, [txHash, tokenId, user.id]);
      }

      // Insert membership record
      await pool.query(`
        INSERT INTO memberships (user_id, payment_tx_hash, amount_eth, paid_at, status, payment_method, nft_token_id, original_minter)
        VALUES ($1, $2, '0.002', NOW(), 'active', 'nft_mint', $3, $4)
        ON CONFLICT (payment_tx_hash) DO NOTHING
      `, [user.id, txHash, tokenId, walletAddress]);

      console.log(`   ✅ NFT membership activated for wallet ${walletAddress}`);
      console.log(`   Token ID: #${tokenId}`);
      console.log(`   Transaction: ${txHash}`);

      // Post welcome cast if user has Farcaster linked
      if (user.farcaster_username && user.github_username) {
        try {
          await farcasterService.announceNewContributor(user.github_username, user.farcaster_username);
          console.log(`   🎉 Welcome cast posted for @${user.farcaster_username}`);
        } catch (castError) {
          console.error(`   ⚠️ Failed to post welcome cast:`, castError.message);
        }
      } else if (user.farcaster_username) {
        try {
          // Custom welcome cast for NFT members without GitHub
          const message = `🎫 Welcome to ABC DAO!

@${user.farcaster_username} just minted membership NFT #${tokenId}!

Link your GitHub to start earning $ABC for commits 🚀`;
          await farcasterService.publishCast(message);
          console.log(`   🎉 NFT welcome cast posted for @${user.farcaster_username}`);
        } catch (castError) {
          console.error(`   ⚠️ Failed to post NFT welcome cast:`, castError.message);
        }
      } else {
        console.log(`   💡 User can link Farcaster/GitHub later for social features`);
      }
      console.log('');

      return true;

    } catch (error) {
      console.error(`❌ Database error updating wallet ${walletAddress}:`, error.message);
      return false;
    }
  }

  /**
   * Process new block for missed events (backup method)
   */
  async processNewBlock(blockNumber) {
    if (!this.isMonitoring || blockNumber <= this.lastCheckedBlock) return;

    // Update last checked block
    this.lastCheckedBlock = blockNumber;
  }

  /**
   * Check for any missed events (backup method)
   */
  async checkMissedEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      // Check last 10 blocks for any missed events
      const startBlock = Math.max(this.lastCheckedBlock - 10, currentBlock - 10);
      
      if (startBlock >= currentBlock) return;

      // Query contract events for missed MembershipMinted events
      const filter = this.contract.filters.MembershipMinted();
      const events = await this.contract.queryFilter(filter, startBlock, currentBlock);
      
      for (const event of events) {
        // Only process events we might have missed
        if (event.blockNumber > this.lastCheckedBlock) {
          console.log(`🔍 Processing missed NFT mint event from block ${event.blockNumber}`);
          await this.processMembershipMinted(event.args.member, event.args.tokenId, event);
        }
      }

    } catch (error) {
      console.error('❌ Error in missed events check:', error.message);
    }
  }

  /**
   * Manual check for recent NFT mints (for testing)
   */
  async checkRecentMints(hours = 24) {
    console.log(`🔍 Checking for NFT mints in last ${hours} hours...`);
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      // Estimate blocks (Base ~2s per block)
      const blocksToCheck = Math.floor((hours * 60 * 60) / 2);
      const startBlock = Math.max(0, currentBlock - blocksToCheck);
      
      console.log(`   Checking blocks ${startBlock} to ${currentBlock}`);
      
      const filter = this.contract.filters.MembershipMinted();
      const events = await this.contract.queryFilter(filter, startBlock, currentBlock);
      
      console.log(`✅ Found ${events.length} NFT mint events in last ${hours} hours`);
      
      for (const event of events) {
        console.log(`   Token #${event.args.tokenId.toString()} → ${event.args.member}`);
        await this.processMembershipMinted(event.args.member, event.args.tokenId, event);
      }
      
    } catch (error) {
      console.error('❌ Manual NFT mint check failed:', error.message);
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats() {
    try {
      const totalSupply = await this.contract.totalSupply();
      const mintPrice = await this.contract.MINT_PRICE();
      
      return {
        totalMinted: totalSupply.toString(),
        mintPrice: ethers.formatEther(mintPrice),
        contractAddress: this.contractAddress
      };
    } catch (error) {
      console.error('❌ Failed to get contract stats:', error.message);
      return null;
    }
  }
}

export { NFTMembershipMonitor };