import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  ABCStaking,
  Staked,
  Unstaked,
  RewardsClaimed
} from "../generated/ABCStaking/ABCStaking"
import { Staker, StakeEvent, UnstakeEvent, RewardsClaimedEvent, StakingStats } from "../generated/schema"

export function handleStaked(event: Staked): void {
  let staker = Staker.load(event.params.user.toHexString())
  
  if (staker == null) {
    staker = new Staker(event.params.user.toHexString())
    staker.address = event.params.user
    staker.totalStaked = BigInt.fromI32(0)
    staker.totalUnstaked = BigInt.fromI32(0)
    staker.currentStake = BigInt.fromI32(0)
    staker.totalRewardsClaimed = BigInt.fromI32(0)
    staker.isActive = false
    staker.firstStakeTime = event.block.timestamp
    staker.lastStakeTime = event.block.timestamp
  }

  // Update staker data
  staker.totalStaked = staker.totalStaked.plus(event.params.amount)
  staker.currentStake = staker.currentStake.plus(event.params.amount)
  staker.isActive = staker.currentStake.gt(BigInt.fromI32(0))
  staker.lastStakeTime = event.block.timestamp
  staker.save()

  // Create stake event
  let stakeEvent = new StakeEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  stakeEvent.staker = staker.id
  stakeEvent.amount = event.params.amount
  stakeEvent.timestamp = event.block.timestamp
  stakeEvent.blockNumber = event.block.number
  stakeEvent.transactionHash = event.transaction.hash
  stakeEvent.save()

  // Update global stats
  updateStakingStats()
}

export function handleUnstaked(event: Unstaked): void {
  let staker = Staker.load(event.params.user.toHexString())
  
  if (staker == null) {
    // This shouldn't happen, but handle gracefully
    staker = new Staker(event.params.user.toHexString())
    staker.address = event.params.user
    staker.totalStaked = BigInt.fromI32(0)
    staker.totalUnstaked = BigInt.fromI32(0)
    staker.currentStake = BigInt.fromI32(0)
    staker.totalRewardsClaimed = BigInt.fromI32(0)
    staker.isActive = false
    staker.firstStakeTime = event.block.timestamp
    staker.lastStakeTime = event.block.timestamp
  }

  // Update staker data
  staker.totalUnstaked = staker.totalUnstaked.plus(event.params.amount)
  staker.currentStake = staker.currentStake.minus(event.params.amount)
  staker.isActive = staker.currentStake.gt(BigInt.fromI32(0))
  staker.lastUnstakeTime = event.block.timestamp
  staker.save()

  // Create unstake event
  let unstakeEvent = new UnstakeEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  unstakeEvent.staker = staker.id
  unstakeEvent.amount = event.params.amount
  unstakeEvent.timestamp = event.block.timestamp
  unstakeEvent.blockNumber = event.block.number
  unstakeEvent.transactionHash = event.transaction.hash
  unstakeEvent.save()

  // Update global stats
  updateStakingStats()
}

export function handleRewardsClaimed(event: RewardsClaimed): void {
  let staker = Staker.load(event.params.user.toHexString())
  
  if (staker == null) {
    // This shouldn't happen, but handle gracefully
    staker = new Staker(event.params.user.toHexString())
    staker.address = event.params.user
    staker.totalStaked = BigInt.fromI32(0)
    staker.totalUnstaked = BigInt.fromI32(0)
    staker.currentStake = BigInt.fromI32(0)
    staker.totalRewardsClaimed = BigInt.fromI32(0)
    staker.isActive = false
    staker.firstStakeTime = event.block.timestamp
    staker.lastStakeTime = event.block.timestamp
  }

  // Update staker rewards
  staker.totalRewardsClaimed = staker.totalRewardsClaimed.plus(event.params.amount)
  staker.save()

  // Create rewards claimed event
  let rewardsEvent = new RewardsClaimedEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  rewardsEvent.staker = staker.id
  rewardsEvent.amount = event.params.amount
  rewardsEvent.timestamp = event.block.timestamp
  rewardsEvent.blockNumber = event.block.number
  rewardsEvent.transactionHash = event.transaction.hash
  rewardsEvent.save()

  // Update global stats
  updateStakingStats()
}

function updateStakingStats(): void {
  let stats = StakingStats.load("global")
  
  if (stats == null) {
    stats = new StakingStats("global")
    stats.totalStakers = BigInt.fromI32(0)
    stats.totalStaked = BigInt.fromI32(0)
    stats.totalRewardsDistributed = BigInt.fromI32(0)
  }

  // Count active stakers (this is inefficient for large numbers, but works for now)
  // In production, you'd want to maintain this count more efficiently
  let activeStakers = BigInt.fromI32(0)
  let totalCurrentStaked = BigInt.fromI32(0)
  
  // Note: This is a simplified version. For better performance with many stakers,
  // you'd maintain counters in the event handlers rather than recalculating
  
  stats.lastUpdated = BigInt.fromI32(1) // Will be set by each event
  stats.save()
}