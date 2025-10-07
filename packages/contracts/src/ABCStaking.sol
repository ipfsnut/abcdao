// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ABCStaking is ReentrancyGuard, Ownable {
    IERC20 public immutable abcToken;
    
    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastStakeTime;
        uint256 totalEthEarned;
    }
    
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public accRewardsPerShare;
    uint256 public totalRewardsDistributed;
    uint256 public constant COOLDOWN_PERIOD = 7 days;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsReceived(uint256 amount);
    
    constructor(address _abcToken) Ownable(msg.sender) {
        abcToken = IERC20(_abcToken);
    }
    
    // Receive ETH from trading fees
    receive() external payable {
        if (msg.value > 0 && totalStaked > 0) {
            accRewardsPerShare += (msg.value * 1e18) / totalStaked;
            totalRewardsDistributed += msg.value;
            emit RewardsReceived(msg.value);
        }
    }
    
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Update rewards before staking more
        if (userStake.amount > 0) {
            userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / 1e18;
        }
        
        // Transfer ABC tokens from user
        abcToken.transferFrom(msg.sender, address(this), _amount);
        
        // Update stake info
        userStake.amount += _amount;
        userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / 1e18;
        userStake.lastStakeTime = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }
    
    function unstake(uint256 _amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= _amount, "Insufficient staked amount");
        require(block.timestamp >= userStake.lastStakeTime + COOLDOWN_PERIOD, "Cooldown period not met");
        
        // Update rewards before unstaking
        userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / 1e18;
        
        // Update stake info
        userStake.amount -= _amount;
        userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / 1e18;
        totalStaked -= _amount;
        
        // Transfer ABC tokens back to user
        abcToken.transfer(msg.sender, _amount);
        
        emit Unstaked(msg.sender, _amount);
    }
    
    function withdrawRewards() external nonReentrant {
        uint256 pending = pendingRewards(msg.sender);
        require(pending > 0, "No rewards to claim");
        
        StakeInfo storage userStake = stakes[msg.sender];
        userStake.totalEthEarned += pending;
        userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / 1e18;
        
        payable(msg.sender).transfer(pending);
        emit RewardsClaimed(msg.sender, pending);
    }

    function getTotalEarned(address _user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        return userStake.totalEthEarned + pendingRewards(_user);
    }
    
    function pendingRewards(address _user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        if (userStake.amount == 0) return 0;
        
        uint256 accumulated = (userStake.amount * accRewardsPerShare) / 1e18;
        return accumulated - userStake.rewardDebt;
    }
    
    function getVotingPower(address _user) external view returns (uint256) {
        return stakes[_user].amount;
    }
}