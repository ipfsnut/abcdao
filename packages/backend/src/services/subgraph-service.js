/**
 * The Graph subgraph service for querying staking data
 * This replaces manual blockchain event scanning with efficient GraphQL queries
 */

import fetch from 'node-fetch';

class SubgraphService {
  constructor() {
    // This will be the deployed subgraph URL once we deploy to The Graph
    // For now, using a placeholder - will be updated after deployment
    this.subgraphUrl = process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/1704336/abc-stakers/0.1.0';
  }

  /**
   * Execute a GraphQL query against the subgraph
   */
  async query(graphqlQuery, variables = {}) {
    try {
      const response = await fetch(this.subgraphUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables
        })
      });

      if (!response.ok) {
        throw new Error(`Subgraph query failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data;
    } catch (error) {
      console.error('Subgraph query error:', error);
      throw error;
    }
  }

  /**
   * Get all active stakers (those with current stake > 0)
   */
  async getActiveStakers(first = 1000, skip = 0) {
    const query = `
      query GetActiveStakers($first: Int!, $skip: Int!) {
        stakers(
          first: $first
          skip: $skip
          where: { isActive: true }
          orderBy: currentStake
          orderDirection: desc
        ) {
          id
          address
          currentStake
          totalStaked
          totalUnstaked
          totalRewardsClaimed
          firstStakeTime
          lastStakeTime
          lastUnstakeTime
        }
      }
    `;

    return this.query(query, { first, skip });
  }

  /**
   * Get staking overview statistics
   */
  async getStakingOverview() {
    const query = `
      query GetStakingOverview {
        stakingStats(id: "global") {
          totalStakers
          totalStaked
          totalRewardsDistributed
          lastUpdated
        }
        stakers(where: { isActive: true }) {
          id
          currentStake
        }
      }
    `;

    const result = await this.query(query);
    
    // Calculate current metrics from stakers data
    const activeStakers = result.stakers || [];
    const totalActiveStakers = activeStakers.length;
    const totalCurrentStaked = activeStakers.reduce((sum, staker) => {
      return sum + parseFloat(staker.currentStake);
    }, 0);

    return {
      totalStakers: totalActiveStakers,
      totalStaked: totalCurrentStaked,
      totalRewardsDistributed: result.stakingStats?.totalRewardsDistributed || '0',
      lastUpdated: result.stakingStats?.lastUpdated || '0',
      activeStakers
    };
  }

  /**
   * Get staker details by address
   */
  async getStakerDetails(address) {
    const query = `
      query GetStakerDetails($address: String!) {
        staker(id: $address) {
          id
          address
          currentStake
          totalStaked
          totalUnstaked
          totalRewardsClaimed
          isActive
          firstStakeTime
          lastStakeTime
          lastUnstakeTime
          stakeEvents(orderBy: timestamp, orderDirection: desc, first: 10) {
            id
            amount
            timestamp
            blockNumber
            transactionHash
          }
          unstakeEvents(orderBy: timestamp, orderDirection: desc, first: 10) {
            id
            amount
            timestamp
            blockNumber
            transactionHash
          }
          rewardsClaimedEvents(orderBy: timestamp, orderDirection: desc, first: 10) {
            id
            amount
            timestamp
            blockNumber
            transactionHash
          }
        }
      }
    `;

    return this.query(query, { address: address.toLowerCase() });
  }

  /**
   * Get recent staking events across all users
   */
  async getRecentStakingEvents(first = 50) {
    const query = `
      query GetRecentEvents($first: Int!) {
        stakeEvents(first: $first, orderBy: timestamp, orderDirection: desc) {
          id
          staker {
            id
            address
          }
          amount
          timestamp
          blockNumber
          transactionHash
        }
        unstakeEvents(first: $first, orderBy: timestamp, orderDirection: desc) {
          id
          staker {
            id
            address
          }
          amount
          timestamp
          blockNumber
          transactionHash
        }
      }
    `;

    return this.query(query, { first });
  }

  /**
   * Get top stakers by current stake amount
   */
  async getTopStakers(first = 100) {
    const query = `
      query GetTopStakers($first: Int!) {
        stakers(
          first: $first
          where: { isActive: true }
          orderBy: currentStake
          orderDirection: desc
        ) {
          id
          address
          currentStake
          totalStaked
          totalRewardsClaimed
          firstStakeTime
          lastStakeTime
        }
      }
    `;

    return this.query(query, { first });
  }

  /**
   * Check if the subgraph is available and synced
   */
  async healthCheck() {
    try {
      const query = `
        query HealthCheck {
          _meta {
            block {
              number
              timestamp
            }
            deployment
            hasIndexingErrors
          }
        }
      `;

      const result = await this.query(query);
      return {
        isHealthy: !result._meta.hasIndexingErrors,
        lastBlock: result._meta.block.number,
        lastTimestamp: result._meta.block.timestamp,
        deployment: result._meta.deployment
      };
    } catch (error) {
      return {
        isHealthy: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const subgraphService = new SubgraphService();

// For testing/development, export the class as well
export { SubgraphService };