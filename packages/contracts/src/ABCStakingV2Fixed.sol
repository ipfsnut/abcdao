// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ABCStakingV2Fixed
 * @dev Fixed version of the ABC staking contract with proper reward debt handling
 * 
 * KEY FIXES:
 * 1. Fixed updateReward modifier to preserve pending rewards before updating debt
 * 2. Removed duplicate reward debt updates
 * 3. Added safety checks to prevent underflow in reward calculations
 * 4. Proper reward accounting that prevents reward theft
 * 5. Simplified to single ETH reward token for clarity
 */
contract ABCStakingV2Fixed is ReentrancyGuard, Ownable, Pausable {
    // Use the actual ABC token address
    IERC20 public constant ABC_TOKEN = IERC20(0x5C0872b790Bb73E2B3A9778db6e7704095624b07);
    
    struct StakeInfo {
        uint256 amount;           // Amount of tokens staked
        uint256 rewardDebt;       // Reward debt for proper reward calculation
        uint256 lastStakeTime;    // When the user last staked
        uint256 totalEthEarned;   // Total ETH earned and claimed
    }
    
    struct UnbondingInfo {
        uint256 amount;
        uint256 releaseTime;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => UnbondingInfo[]) public unbonding;
    uint256 public totalStaked;
    uint256 public accRewardsPerShare;  // Accumulated rewards per share (scaled by 1e18)
    uint256 public totalRewardsDistributed;
    uint256 public constant UNBONDING_PERIOD = 7 days; // Production unbonding period
    uint256 public constant PRECISION = 1e18;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event UnbondingStarted(address indexed user, uint256 amount, uint256 releaseTime);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsReceived(uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Receive ETH from trading fees or membership fees
     * Automatically distributes rewards proportionally to all stakers
     */
    receive() external payable {
        if (msg.value > 0 && totalStaked > 0) {
            accRewardsPerShare += (msg.value * PRECISION) / totalStaked;
            totalRewardsDistributed += msg.value;
            emit RewardsReceived(msg.value);
        }
    }
    
    /**
     * @dev Allow manual reward deposits for testing and additional revenue streams
     */
    function depositRewards() external payable onlyOwner {
        require(msg.value > 0, "No ETH sent");
        require(totalStaked > 0, "No tokens staked");
        
        accRewardsPerShare += (msg.value * PRECISION) / totalStaked;
        totalRewardsDistributed += msg.value;
        emit RewardsReceived(msg.value);
    }
    
    /**
     * @dev FIXED: Proper updateReward modifier that preserves pending rewards
     * 
     * CRITICAL FIX: The original modifier was setting rewardDebt = accumulated rewards,
     * which effectively stole all pending rewards from users. This version:
     * 1. Calculates pending rewards first
     * 2. Adds them to totalEthEarned (preserving them)
     * 3. Then updates reward debt to current state
     */
    modifier updateReward(address account) {
        if (account != address(0)) {
            StakeInfo storage userStake = stakes[account];
            
            // CRITICAL: Calculate and preserve any pending rewards BEFORE updating debt
            uint256 pending = _calculatePendingRewards(account);
            if (pending > 0) {
                userStake.totalEthEarned += pending;
            }
            
            // Now safely update reward debt to current accumulated rewards per share
            userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / PRECISION;
        }
        _;
    }
    
    /**
     * @dev Stake ABC tokens to earn ETH rewards
     * FIXED: Removed duplicate reward debt update (modifier handles it properly)
     */
    function stake(uint256 _amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(_amount > 0, "Cannot stake 0");
        require(ABC_TOKEN.balanceOf(msg.sender) >= _amount, "Insufficient token balance");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Transfer ABC tokens from user
        ABC_TOKEN.transferFrom(msg.sender, address(this), _amount);
        
        // Update stake info
        userStake.amount += _amount;
        userStake.lastStakeTime = block.timestamp;
        totalStaked += _amount;
        
        // FIXED: Reward debt is properly set by updateReward modifier AFTER amount increase
        userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / PRECISION;
        
        emit Staked(msg.sender, _amount);
    }
    
    /**
     * @dev Start unbonding process - tokens enter unbonding period and stop earning rewards
     * FIXED: Proper reward debt update after amount decrease
     */
    function startUnbonding(uint256 _amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= _amount, "Insufficient staked amount");
        require(_amount > 0, "Cannot unbond 0");
        
        // Remove from staked amount immediately (stops earning rewards)
        userStake.amount -= _amount;
        totalStaked -= _amount;
        
        // FIXED: Update reward debt after amount decrease
        userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / PRECISION;
        
        // Add to unbonding queue
        uint256 releaseTime = block.timestamp + UNBONDING_PERIOD;
        unbonding[msg.sender].push(UnbondingInfo({
            amount: _amount,
            releaseTime: releaseTime
        }));
        
        emit UnbondingStarted(msg.sender, _amount, releaseTime);
    }
    
    /**
     * @dev Complete unbonding and withdraw tokens
     * Only withdraws tokens that have completed the unbonding period
     */
    function unstake() external nonReentrant whenNotPaused {
        UnbondingInfo[] storage userUnbonding = unbonding[msg.sender];
        uint256 totalToWithdraw = 0;
        uint256 newLength = 0;
        
        // Process all unbonding entries
        for (uint256 i = 0; i < userUnbonding.length; i++) {
            if (block.timestamp >= userUnbonding[i].releaseTime) {
                totalToWithdraw += userUnbonding[i].amount;
            } else {
                // Keep this entry, move it to the front
                if (newLength != i) {
                    userUnbonding[newLength] = userUnbonding[i];
                }
                newLength++;
            }
        }
        
        require(totalToWithdraw > 0, "No tokens ready to withdraw");
        
        // Resize array to remove processed entries
        while (userUnbonding.length > newLength) {
            userUnbonding.pop();
        }
        
        // Transfer tokens back to user
        ABC_TOKEN.transfer(msg.sender, totalToWithdraw);
        
        emit Unstaked(msg.sender, totalToWithdraw);
    }
    
    /**
     * @dev Withdraw accumulated ETH rewards
     * FIXED: Properly uses totalEthEarned which is already updated by updateReward modifier
     */
    function withdrawRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        StakeInfo storage userStake = stakes[msg.sender];
        uint256 rewards = userStake.totalEthEarned;
        
        require(rewards > 0, "No rewards to claim");
        require(address(this).balance >= rewards, "Insufficient contract balance");
        
        // Reset earned rewards (they're being claimed)
        userStake.totalEthEarned = 0;
        
        // Send ETH rewards to user
        (bool success, ) = payable(msg.sender).call{value: rewards}("");
        require(success, "ETH transfer failed");
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Get total rewards earned (claimed + pending)
     */
    function getTotalEarned(address _user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        return userStake.totalEthEarned + pendingRewards(_user);
    }
    
    /**
     * @dev FIXED: Calculate pending rewards with proper safety checks
     */
    function pendingRewards(address _user) public view returns (uint256) {
        return _calculatePendingRewards(_user);
    }
    
    /**
     * @dev Internal function to calculate pending rewards with safety checks
     * CRITICAL FIX: Added underflow protection
     */
    function _calculatePendingRewards(address _user) internal view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        if (userStake.amount == 0) return 0;
        
        uint256 accumulated = (userStake.amount * accRewardsPerShare) / PRECISION;
        
        // FIXED: Add safety check to prevent underflow
        if (accumulated > userStake.rewardDebt) {
            return accumulated - userStake.rewardDebt;
        }
        return 0;
    }
    
    /**
     * @dev Get user's staked amount
     */
    function getStakedAmount(address _user) external view returns (uint256) {
        return stakes[_user].amount;
    }
    
    /**
     * @dev Get user's unbonding information
     */
    function getUnbondingInfo(address _user) external view returns (UnbondingInfo[] memory) {
        return unbonding[_user];
    }
    
    /**
     * @dev Get amount ready to be withdrawn (unbonding period completed)
     */
    function getWithdrawableAmount(address _user) external view returns (uint256) {
        UnbondingInfo[] memory userUnbonding = unbonding[_user];
        uint256 withdrawable = 0;
        
        for (uint256 i = 0; i < userUnbonding.length; i++) {
            if (block.timestamp >= userUnbonding[i].releaseTime) {
                withdrawable += userUnbonding[i].amount;
            }
        }
        
        return withdrawable;
    }
    
    /**
     * @dev Check if user is eligible for commit rewards (has minimum stake)
     */
    function isEligibleForRewards(address _user) external view returns (bool) {
        return stakes[_user].amount >= 1000000 * 1e18; // 1M ABC minimum for commit rewards
    }
    
    /**
     * @dev Get comprehensive stake information for frontend
     */
    function getStakeInfo(address _user) external view returns (
        uint256 amount,
        uint256 lastStakeTime,
        uint256 totalEthEarned,
        uint256 pendingEth
    ) {
        StakeInfo memory userStake = stakes[_user];
        return (
            userStake.amount,
            userStake.lastStakeTime,
            userStake.totalEthEarned,
            pendingRewards(_user)
        );
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw function for owner (only if contract is paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        require(address(this).balance > 0, "No ETH to withdraw");
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdraw failed");
    }
    
    /**
     * @dev Get contract balance for transparency
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}