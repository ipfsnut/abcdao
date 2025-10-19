import { ethers } from 'ethers';
import { getPool } from './database.js';

/**
 * Blockchain Events Manager
 * 
 * Responsible for all on-chain event monitoring and transaction tracking.
 * Implements the systematic data architecture pattern with proactive event collection.
 * 
 * Core Responsibilities:
 * 1. Knowing what blockchain events are needed
 * 2. Polling for events systematically
 * 3. Storing events in structured database
 * 4. Serving event data through clean APIs
 * 5. Maintaining event processing state
 */
export class BlockchainEventsManager {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.pollInterval = 30 * 1000; // 30 seconds
    this.isInitialized = false;
    this.lastProcessedBlock = 0;
    
    // Contract configurations
    this.contracts = {
      staking: {
        address: process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017',
        abi: [
          {
            "type": "event",
            "name": "Staked",
            "inputs": [
              {"name": "user", "type": "address", "indexed": true},
              {"name": "amount", "type": "uint256", "indexed": false}
            ]
          },
          {
            "type": "event", 
            "name": "Unstaked",
            "inputs": [
              {"name": "user", "type": "address", "indexed": true},
              {"name": "amount", "type": "uint256", "indexed": false}
            ]
          },
          {
            "type": "event",
            "name": "RewardClaimed",
            "inputs": [
              {"name": "user", "type": "address", "indexed": true},
              {"name": "amount", "type": "uint256", "indexed": false}
            ]
          },
          {
            "type": "event",
            "name": "RewardsDistributed",
            "inputs": [
              {"name": "amount", "type": "uint256", "indexed": false}
            ]
          }
        ]
      },
      rewards: {
        address: process.env.ABC_REWARDS_CONTRACT_ADDRESS || '0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c',
        abi: [
          {
            "type": "event",
            "name": "RewardsClaimed",
            "inputs": [
              {"name": "user", "type": "address", "indexed": true},
              {"name": "amount", "type": "uint256", "indexed": false}
            ]
          },
          {
            "type": "event",
            "name": "RewardsAllocated", 
            "inputs": [
              {"name": "user", "type": "address", "indexed": true},
              {"name": "amount", "type": "uint256", "indexed": false}
            ]
          }
        ]
      }
    };

    // Initialize contract instances
    this.contractInstances = {};
    for (const [name, config] of Object.entries(this.contracts)) {
      this.contractInstances[name] = new ethers.Contract(
        config.address,
        config.abi,
        this.provider
      );
    }
  }

  /**
   * Initialize the Blockchain Events Manager
   * Sets up event polling and performs initial state setup
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('Blockchain Events Manager already initialized');
      return;
    }

    console.log('⛓️  Initializing Blockchain Events Manager...');

    try {
      // Get last processed block from database
      this.lastProcessedBlock = await this.getLastProcessedBlock();
      
      // Start event polling
      setInterval(() => this.pollForEvents(), this.pollInterval);
      
      // Start transaction monitoring
      setInterval(() => this.monitorTransactions(), 60 * 1000); // 1 minute
      
      // Initial event poll
      await this.pollForEvents();
      
      this.isInitialized = true;
      console.log('✅ Blockchain Events Manager initialized successfully');
      console.log(`   - Event polling every ${this.pollInterval / 1000} seconds`);
      console.log(`   - Last processed block: ${this.lastProcessedBlock}`);

    } catch (error) {
      console.error('❌ Failed to initialize Blockchain Events Manager:', error);
      throw error;
    }
  }

  /**
   * Poll for new events across all monitored contracts
   */
  async pollForEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = this.lastProcessedBlock + 1;
      
      if (fromBlock > currentBlock) {
        return; // No new blocks to process
      }
      
      console.log(`⛓️  Polling events from block ${fromBlock} to ${currentBlock}`);
      
      // Poll each contract for events
      for (const [name, contract] of Object.entries(this.contractInstances)) {
        await this.pollContractEvents(name, contract, fromBlock, currentBlock);
      }
      
      // Update last processed block
      this.lastProcessedBlock = currentBlock;
      await this.saveLastProcessedBlock(currentBlock);
      
      // Update data freshness
      await this.updateDataFreshness('blockchain_events', true);
      
    } catch (error) {
      console.error('❌ Error polling for events:', error);
      await this.recordDataError('event_polling', error.message);
    }
  }

  /**
   * Poll events for a specific contract
   */
  async pollContractEvents(contractName, contract, fromBlock, toBlock) {
    try {
      const filter = {
        address: contract.address,
        fromBlock,
        toBlock
      };
      
      const logs = await this.provider.getLogs(filter);
      
      if (logs.length > 0) {
        console.log(`📋 Found ${logs.length} events for ${contractName}`);
      }
      
      for (const log of logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed) {
            await this.processEvent(contractName, log, parsed);
          }
        } catch (parseError) {
          console.warn(`Failed to parse log for ${contractName}:`, parseError.message);
        }
      }
      
      // Update processing log
      await this.updateProcessingLog(contract.address, logs.length, toBlock);
      
    } catch (error) {
      console.error(`Error polling events for ${contractName}:`, error);
      await this.updateProcessingLog(contract.address, 0, toBlock, error.message);
    }
  }

  /**
   * Process individual event
   */
  async processEvent(contractName, log, parsedEvent) {
    try {
      const pool = getPool();
      
      // Get block timestamp
      const block = await this.provider.getBlock(log.blockNumber);
      const timestamp = new Date(block.timestamp * 1000);
      
      // Store raw event
      await pool.query(`
        INSERT INTO blockchain_events (
          block_number, transaction_hash, log_index, contract_address,
          event_name, event_data, timestamp, processed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false)
        ON CONFLICT (transaction_hash, log_index) DO NOTHING
      `, [
        log.blockNumber,
        log.transactionHash,
        log.logIndex,
        log.address,
        parsedEvent.name,
        JSON.stringify(parsedEvent.args),
        timestamp
      ]);
      
      // Process specific event types
      await this.handleSpecificEvent(contractName, parsedEvent.name, parsedEvent.args, log);
      
      // Mark event as processed
      await pool.query(`
        UPDATE blockchain_events 
        SET processed = true 
        WHERE transaction_hash = $1 AND log_index = $2
      `, [log.transactionHash, log.logIndex]);
      
    } catch (error) {
      console.error('Error processing event:', error);
      
      // Mark event as failed
      const pool = getPool();
      await pool.query(`
        UPDATE blockchain_events 
        SET processing_error = $3
        WHERE transaction_hash = $1 AND log_index = $2
      `, [log.transactionHash, log.logIndex, error.message]);
    }
  }

  /**
   * Handle specific event types with business logic
   */
  async handleSpecificEvent(contractName, eventName, args, log) {
    const pool = getPool();
    
    try {
      switch (eventName) {
        case 'Staked':
          await this.handleStakedEvent(args.user, args.amount, log);
          break;
          
        case 'Unstaked':
          await this.handleUnstakedEvent(args.user, args.amount, log);
          break;
          
        case 'RewardClaimed':
          await this.handleRewardClaimedEvent(args.user, args.amount, log);
          break;
          
        case 'RewardsDistributed':
          await this.handleRewardsDistributedEvent(args.amount, log);
          break;
          
        case 'RewardsAllocated':
          await this.handleRewardsAllocatedEvent(args.user, args.amount, log);
          break;
          
        default:
          console.log(`Unhandled event: ${eventName}`);
      }
      
    } catch (error) {
      console.error(`Error handling ${eventName} event:`, error);
      throw error;
    }
  }

  /**
   * Handle staked event
   */
  async handleStakedEvent(user, amount, log) {
    const pool = getPool();
    
    // Update staker position if we have the staking data manager
    try {
      await pool.query(`
        INSERT INTO staker_positions (
          wallet_address, staked_amount, last_stake_time, updated_at
        ) VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (wallet_address) DO UPDATE SET
          staked_amount = staker_positions.staked_amount + $2,
          last_stake_time = NOW(),
          updated_at = NOW(),
          is_active = true
      `, [user, ethers.formatEther(amount)]);
      
      console.log(`🔒 Staked: ${user} staked ${ethers.formatEther(amount)} ABC`);
    } catch (error) {
      console.warn('Could not update staker position (table may not exist):', error.message);
    }
  }

  /**
   * Handle unstaked event
   */
  async handleUnstakedEvent(user, amount, log) {
    const pool = getPool();
    
    try {
      await pool.query(`
        UPDATE staker_positions 
        SET 
          staked_amount = GREATEST(0, staked_amount - $2),
          updated_at = NOW(),
          is_active = CASE WHEN staked_amount - $2 <= 0 THEN false ELSE true END
        WHERE wallet_address = $1
      `, [user, ethers.formatEther(amount)]);
      
      console.log(`🔓 Unstaked: ${user} unstaked ${ethers.formatEther(amount)} ABC`);
    } catch (error) {
      console.warn('Could not update staker position:', error.message);
    }
  }

  /**
   * Handle reward claimed event
   */
  async handleRewardClaimedEvent(user, amount, log) {
    const pool = getPool();
    
    try {
      await pool.query(`
        UPDATE staker_positions 
        SET 
          rewards_earned = rewards_earned + $2,
          last_reward_claim = NOW(),
          updated_at = NOW()
        WHERE wallet_address = $1
      `, [user, ethers.formatEther(amount)]);
      
      console.log(`💰 Reward Claimed: ${user} claimed ${ethers.formatEther(amount)} ETH`);
    } catch (error) {
      console.warn('Could not update reward claim:', error.message);
    }
  }

  /**
   * Handle rewards distributed event
   */
  async handleRewardsDistributedEvent(amount, log) {
    console.log(`📈 Rewards Distributed: ${ethers.formatEther(amount)} ETH distributed to stakers`);
  }

  /**
   * Handle rewards allocated event
   */
  async handleRewardsAllocatedEvent(user, amount, log) {
    console.log(`🎯 Rewards Allocated: ${user} allocated ${ethers.formatEther(amount)} ABC`);
  }

  /**
   * Monitor important transactions
   */
  async monitorTransactions() {
    try {
      const pool = getPool();
      
      // Get pending transactions
      const result = await pool.query(`
        SELECT * FROM monitored_transactions 
        WHERE status = 'pending' 
        ORDER BY created_at DESC
        LIMIT 50
      `);
      
      for (const tx of result.rows) {
        await this.checkTransactionStatus(tx);
      }
      
    } catch (error) {
      console.error('Error monitoring transactions:', error);
    }
  }

  /**
   * Check status of a specific transaction
   */
  async checkTransactionStatus(tx) {
    try {
      const receipt = await this.provider.getTransactionReceipt(tx.transaction_hash);
      
      if (receipt) {
        const pool = getPool();
        
        await pool.query(`
          UPDATE monitored_transactions 
          SET 
            status = $2,
            block_number = $3,
            gas_used = $4,
            confirmation_count = $5
          WHERE transaction_hash = $1
        `, [
          tx.transaction_hash,
          receipt.status === 1 ? 'confirmed' : 'failed',
          receipt.blockNumber,
          receipt.gasUsed.toString(),
          await this.provider.getBlockNumber() - receipt.blockNumber
        ]);
        
        console.log(`📋 Transaction ${tx.transaction_hash} ${receipt.status === 1 ? 'confirmed' : 'failed'}`);
      }
      
    } catch (error) {
      console.warn(`Could not check transaction ${tx.transaction_hash}:`, error.message);
    }
  }

  /**
   * Get last processed block from database
   */
  async getLastProcessedBlock() {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT MAX(last_processed_block) as last_block
        FROM event_processing_log
      `);
      
      return result.rows[0]?.last_block || 0;
    } catch (error) {
      console.warn('Could not get last processed block:', error.message);
      return 0;
    }
  }

  /**
   * Save last processed block to database
   */
  async saveLastProcessedBlock(blockNumber) {
    try {
      const pool = getPool();
      
      // Update all contract processing logs
      for (const contract of Object.values(this.contracts)) {
        await pool.query(`
          INSERT INTO event_processing_log (
            contract_address, event_name, last_processed_block, updated_at
          ) VALUES ($1, 'ALL_EVENTS', $2, NOW())
          ON CONFLICT (contract_address, event_name) DO UPDATE SET
            last_processed_block = $2,
            updated_at = NOW()
        `, [contract.address, blockNumber]);
      }
      
    } catch (error) {
      console.warn('Could not save last processed block:', error.message);
    }
  }

  /**
   * Update processing log for specific contract
   */
  async updateProcessingLog(contractAddress, eventsProcessed, lastBlock, error = null) {
    try {
      const pool = getPool();
      
      await pool.query(`
        INSERT INTO event_processing_log (
          contract_address, event_name, last_processed_block, 
          events_processed, last_error, updated_at
        ) VALUES ($1, 'ALL_EVENTS', $2, $3, $4, NOW())
        ON CONFLICT (contract_address, event_name) DO UPDATE SET
          last_processed_block = $2,
          events_processed = event_processing_log.events_processed + $3,
          last_error = $4,
          updated_at = NOW()
      `, [contractAddress, lastBlock, eventsProcessed, error]);
      
    } catch (updateError) {
      console.warn('Could not update processing log:', updateError.message);
    }
  }

  /**
   * Update data freshness tracking
   */
  async updateDataFreshness(domain, isHealthy) {
    const pool = getPool();
    
    await pool.query(`
      INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
      VALUES ($1, NOW(), $2, 0, NULL)
      ON CONFLICT (domain) DO UPDATE SET
        last_update = NOW(),
        is_healthy = $2,
        error_count = CASE WHEN $2 THEN 0 ELSE data_freshness.error_count END,
        last_error = CASE WHEN $2 THEN NULL ELSE data_freshness.last_error END
    `, [domain, isHealthy]);
  }

  /**
   * Record data error for monitoring
   */
  async recordDataError(operation, errorMessage) {
    const pool = getPool();
    
    try {
      await pool.query(`
        INSERT INTO data_freshness (domain, last_update, is_healthy, error_count, last_error)
        VALUES ('blockchain_events', NOW(), false, 1, $1)
        ON CONFLICT (domain) DO UPDATE SET
          is_healthy = false,
          error_count = data_freshness.error_count + 1,
          last_error = $1
      `, [errorMessage]);
    } catch (e) {
      console.error('Failed to record data error:', e);
    }
  }

  /**
   * API Methods - Clean data serving endpoints
   */

  /**
   * Get recent events for a contract
   */
  async getEventHistory(contractAddress, eventName = null, limit = 100) {
    const pool = getPool();
    
    let query = `
      SELECT * FROM blockchain_events 
      WHERE contract_address = $1
    `;
    const params = [contractAddress];
    
    if (eventName) {
      query += ` AND event_name = $2`;
      params.push(eventName);
    }
    
    query += ` ORDER BY block_number DESC, log_index DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get contract state
   */
  async getContractState(contractAddress) {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM contract_states 
      WHERE contract_address = $1
      ORDER BY updated_at DESC
    `, [contractAddress]);
    
    return result.rows;
  }

  /**
   * Get processing status
   */
  async getProcessingStatus() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        contract_address,
        last_processed_block,
        events_processed,
        last_error,
        updated_at
      FROM event_processing_log
      ORDER BY updated_at DESC
    `);
    
    return result.rows;
  }

  /**
   * Get data freshness status
   */
  async getDataFreshness() {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT * FROM data_freshness WHERE domain = 'blockchain_events'
    `);
    
    return result.rows[0];
  }
}

// Export singleton instance
export const blockchainEventsManager = new BlockchainEventsManager();