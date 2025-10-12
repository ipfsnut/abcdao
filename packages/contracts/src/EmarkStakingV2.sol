// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract EmarkStakingV2 is ReentrancyGuard, Ownable, Pausable {
    IERC20 public constant EMARK_TOKEN = IERC20(0xf87F3ebbF8CaCF321C2a4027bb66Df639a6f4B07);
    
    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastStakeTime;
        uint256 totalEthEarned;
    }
    
    struct UnbondingInfo {
        uint256 amount;
        uint256 releaseTime;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => UnbondingInfo[]) public unbonding;
    uint256 public totalStaked;
    uint256 public accRewardsPerShare;
    uint256 public totalRewardsDistributed;
    uint256 public constant UNBONDING_PERIOD = 1 minutes; // Very short for testing
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event UnbondingStarted(address indexed user, uint256 amount, uint256 releaseTime);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsReceived(uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    // Receive ETH from trading fees or manual deposits
    receive() external payable {
        if (msg.value > 0 && totalStaked > 0) {
            accRewardsPerShare += (msg.value * 1e18) / totalStaked;
            totalRewardsDistributed += msg.value;
            emit RewardsReceived(msg.value);
        }
    }
    
    // Allow manual reward deposits for testing
    function depositRewards() external payable onlyOwner {
        require(msg.value > 0, "No ETH sent");
        require(totalStaked > 0, "No tokens staked");
        accRewardsPerShare += (msg.value * 1e18) / totalStaked;
        totalRewardsDistributed += msg.value;
        emit RewardsReceived(msg.value);
    }
    
    modifier updateReward(address account) {
        if (account != address(0)) {
            StakeInfo storage userStake = stakes[account];
            userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / 1e18;
        }
        _;
    }
    
    function stake(uint256 _amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(_amount > 0, "Cannot stake 0");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Transfer EMARK tokens from user
        EMARK_TOKEN.transferFrom(msg.sender, address(this), _amount);
        
        // Update stake info
        userStake.amount += _amount;
        userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / 1e18;
        userStake.lastStakeTime = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }
    
    // Start unbonding process - tokens enter unbonding period
    function startUnbonding(uint256 _amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= _amount, "Insufficient staked amount");
        
        // Remove from staked amount immediately (stops earning rewards)
        userStake.amount -= _amount;
        userStake.rewardDebt = (userStake.amount * accRewardsPerShare) / 1e18;
        totalStaked -= _amount;
        
        // Add to unbonding queue
        uint256 releaseTime = block.timestamp + UNBONDING_PERIOD;
        unbonding[msg.sender].push(UnbondingInfo({
            amount: _amount,
            releaseTime: releaseTime
        }));
        
        emit UnbondingStarted(msg.sender, _amount, releaseTime);
    }
    
    // Complete unbonding and withdraw tokens
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
        EMARK_TOKEN.transfer(msg.sender, totalToWithdraw);
        
        emit Unstaked(msg.sender, totalToWithdraw);
    }
    
    function withdrawRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
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
    
    function getStakedAmount(address _user) external view returns (uint256) {
        return stakes[_user].amount;
    }
    
    function getUnbondingInfo(address _user) external view returns (UnbondingInfo[] memory) {
        return unbonding[_user];
    }
    
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
    
    function isEligibleForRewards(address _user) external view returns (bool) {
        return stakes[_user].amount >= 100 * 1e18; // 100 EMARK minimum for testing
    }
    
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
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}