import express from 'express';
import { blockchainEventsManager } from '../services/blockchain-events-manager.js';

const router = express.Router();

/**
 * Blockchain Events API Routes
 * 
 * Clean, domain-focused endpoints following the data architecture redesign.
 * All routes consume pre-computed data from the Blockchain Events Manager.
 */

// Test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ 
    status: 'blockchain events routes are working', 
    timestamp: new Date().toISOString(),
    manager: 'BlockchainEventsManager'
  });
});

/**
 * GET /api/blockchain-events/events/:contract?event=EventName&limit=100
 * Returns recent events for a specific contract
 */
router.get('/events/:contract', async (req, res) => {
  try {
    const contractAddress = req.params.contract;
    const eventName = req.query.event || null;
    const limit = parseInt(req.query.limit) || 100;
    
    // Validate contract address format
    if (!contractAddress || !contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        error: 'Invalid contract address format' 
      });
    }
    
    if (limit < 1 || limit > 500) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 500'
      });
    }

    const events = await blockchainEventsManager.getEventHistory(contractAddress, eventName, limit);
    
    const formattedEvents = events.map(event => ({
      id: event.id,
      block: {
        number: event.block_number,
        timestamp: event.timestamp
      },
      transaction: {
        hash: event.transaction_hash,
        logIndex: event.log_index
      },
      contract: {
        address: event.contract_address
      },
      event: {
        name: event.event_name,
        data: event.event_data
      },
      processing: {
        processed: event.processed,
        error: event.processing_error,
        createdAt: event.created_at
      }
    }));

    res.json({
      contractAddress,
      eventName,
      events: formattedEvents,
      count: formattedEvents.length,
      limit
    });

  } catch (error) {
    console.error('Error fetching blockchain events:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain events' });
  }
});

/**
 * GET /api/blockchain-events/state/:contract
 * Returns current state for a specific contract
 */
router.get('/state/:contract', async (req, res) => {
  try {
    const contractAddress = req.params.contract;
    
    // Validate contract address format
    if (!contractAddress || !contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        error: 'Invalid contract address format' 
      });
    }

    const contractStates = await blockchainEventsManager.getContractState(contractAddress);
    
    const formattedStates = contractStates.map(state => ({
      id: state.id,
      contract: {
        address: state.contract_address
      },
      state: {
        name: state.state_name,
        value: state.state_value,
        blockNumber: state.block_number
      },
      meta: {
        updatedAt: state.updated_at
      }
    }));

    res.json({
      contractAddress,
      states: formattedStates,
      count: formattedStates.length
    });

  } catch (error) {
    console.error('Error fetching contract state:', error);
    res.status(500).json({ error: 'Failed to fetch contract state' });
  }
});

/**
 * GET /api/blockchain-events/processing-status
 * Returns event processing status across all contracts
 */
router.get('/processing-status', async (req, res) => {
  try {
    const processingStatus = await blockchainEventsManager.getProcessingStatus();
    
    const formattedStatus = processingStatus.map(status => ({
      contract: {
        address: status.contract_address
      },
      processing: {
        lastProcessedBlock: status.last_processed_block,
        eventsProcessed: status.events_processed,
        lastError: status.last_error,
        updatedAt: status.updated_at
      }
    }));

    res.json({
      contracts: formattedStatus,
      count: formattedStatus.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching processing status:', error);
    res.status(500).json({ error: 'Failed to fetch processing status' });
  }
});

/**
 * GET /api/blockchain-events/summary
 * Returns summary of recent blockchain activity
 */
router.get('/summary', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    
    if (hours < 1 || hours > 168) { // Max 1 week
      return res.status(400).json({ 
        error: 'Invalid hours parameter',
        message: 'Hours must be between 1 and 168 (1 week)'
      });
    }

    // This would be enhanced with specific summary queries
    // For now, return processing status as summary
    const processingStatus = await blockchainEventsManager.getProcessingStatus();
    const freshness = await blockchainEventsManager.getDataFreshness();

    res.json({
      timeframe: {
        hours,
        from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      },
      contracts: processingStatus.map(status => ({
        address: status.contract_address,
        lastProcessedBlock: status.last_processed_block,
        eventsProcessed: status.events_processed,
        isHealthy: !status.last_error,
        lastError: status.last_error
      })),
      systemHealth: {
        domain: freshness?.domain || 'blockchain_events',
        isHealthy: freshness?.is_healthy || false,
        lastUpdate: freshness?.last_update,
        errorCount: freshness?.error_count || 0
      }
    });

  } catch (error) {
    console.error('Error fetching blockchain summary:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain summary' });
  }
});

/**
 * GET /api/blockchain-events/events/staking/recent?limit=50
 * Returns recent staking-related events
 */
router.get('/events/staking/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const stakingContract = process.env.STAKING_CONTRACT_ADDRESS || '0x577822396162022654D5bDc9CB58018cB53e7017';
    
    if (limit < 1 || limit > 200) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 200'
      });
    }

    const events = await blockchainEventsManager.getEventHistory(stakingContract, null, limit);
    
    // Filter for staking-related events
    const stakingEvents = events.filter(event => 
      ['Staked', 'Unstaked', 'RewardClaimed', 'RewardsDistributed'].includes(event.event_name)
    );
    
    const formattedEvents = stakingEvents.map(event => ({
      id: event.id,
      type: event.event_name,
      block: {
        number: event.block_number,
        timestamp: event.timestamp
      },
      transaction: {
        hash: event.transaction_hash
      },
      data: event.event_data,
      processed: event.processed
    }));

    res.json({
      contract: stakingContract,
      events: formattedEvents,
      count: formattedEvents.length,
      limit
    });

  } catch (error) {
    console.error('Error fetching staking events:', error);
    res.status(500).json({ error: 'Failed to fetch staking events' });
  }
});

/**
 * GET /api/blockchain-events/events/rewards/recent?limit=50
 * Returns recent rewards-related events
 */
router.get('/events/rewards/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const rewardsContract = process.env.ABC_REWARDS_CONTRACT_ADDRESS || '0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c';
    
    if (limit < 1 || limit > 200) {
      return res.status(400).json({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 200'
      });
    }

    const events = await blockchainEventsManager.getEventHistory(rewardsContract, null, limit);
    
    // Filter for rewards-related events
    const rewardsEvents = events.filter(event => 
      ['RewardsClaimed', 'RewardsAllocated'].includes(event.event_name)
    );
    
    const formattedEvents = rewardsEvents.map(event => ({
      id: event.id,
      type: event.event_name,
      block: {
        number: event.block_number,
        timestamp: event.timestamp
      },
      transaction: {
        hash: event.transaction_hash
      },
      data: event.event_data,
      processed: event.processed
    }));

    res.json({
      contract: rewardsContract,
      events: formattedEvents,
      count: formattedEvents.length,
      limit
    });

  } catch (error) {
    console.error('Error fetching rewards events:', error);
    res.status(500).json({ error: 'Failed to fetch rewards events' });
  }
});

/**
 * GET /api/blockchain-events/health
 * Returns data manager health status
 */
router.get('/health', async (req, res) => {
  try {
    const freshness = await blockchainEventsManager.getDataFreshness();
    const isHealthy = freshness?.is_healthy || false;
    const lastUpdate = freshness?.last_update;
    const timeSinceUpdate = lastUpdate ? Date.now() - new Date(lastUpdate).getTime() : null;
    
    // Consider data stale if it's more than 2 minutes old (events poll every 30 seconds)
    const isStale = timeSinceUpdate && timeSinceUpdate > 2 * 60 * 1000;
    
    res.json({
      status: isHealthy && !isStale ? 'healthy' : 'unhealthy',
      domain: 'blockchain_events',
      isHealthy,
      isStale,
      lastUpdate,
      timeSinceUpdateMs: timeSinceUpdate,
      errorCount: freshness?.error_count || 0,
      lastError: freshness?.last_error
    });

  } catch (error) {
    console.error('Error checking blockchain events health:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to check blockchain events health',
      message: error.message
    });
  }
});

export default router;