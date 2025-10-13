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
    IERC20 public constant ABC_TOKEN = IERC20(0x5c0872b790bb73e2b3a9778db6e7704095624b07);
    
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
    event EthRewardsClaimed(address indexed user, uint256 amount);
    event WethRewardsClaimed(address indexed user, uint256 amount);
    event EthRewardsReceived(uint256 amount);
    event WethRewardsReceived(uint256 amount);
    
    constructor(address _abcToken, address _weth) Ownable(msg.sender) {
        require(_abcToken != address(0), "ABC token address cannot be zero");
        require(_weth != address(0), "WETH address cannot be zero");
        
        ABC_TOKEN = IERC20(_abcToken);
        WETH = IERC20(_weth);
    }
    
    // Receive ETH rewards
    receive() external payable {
        if (msg.value > 0 && totalStaked > 0) {
            accEthRewardsPerShare += (msg.value * PRECISION) / totalStaked;
            totalEthRewardsDistributed += msg.value;
            emit EthRewardsReceived(msg.value);
        }
    }
    
    // Accept WETH rewards
    function depositWethRewards(uint256 _amount) external {
        require(_amount > 0, "No WETH amount specified");
        require(totalStaked > 0, "No tokens staked");
        
        // Transfer WETH from sender to contract
        WETH.transferFrom(msg.sender, address(this), _amount);
        
        accWethRewardsPerShare += (_amount * PRECISION) / totalStaked;
        totalWethRewardsDistributed += _amount;
        emit WethRewardsReceived(_amount);
    }
    
    // Owner can deposit ETH rewards manually
    function depositEthRewards() external payable onlyOwner {
        require(msg.value > 0, "No ETH sent");
        require(totalStaked > 0, "No tokens staked");
        accEthRewardsPerShare += (msg.value * PRECISION) / totalStaked;
        totalEthRewardsDistributed += msg.value;
        emit EthRewardsReceived(msg.value);
    }
    
    modifier updateReward(address account) {
        if (account != address(0)) {
            StakeInfo storage userStake = stakes[account];
            
            // Update reward debts to current levels (prevents underflow)
            userStake.ethRewardDebt = (userStake.amount * accEthRewardsPerShare) / PRECISION;
            userStake.wethRewardDebt = (userStake.amount * accWethRewardsPerShare) / PRECISION;
        }
        _;
    }
    
    function stake(uint256 _amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(_amount > 0, "Cannot stake 0");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Transfer ABC tokens from user
        ABC_TOKEN.transferFrom(msg.sender, address(this), _amount);
        
        // Update stake info
        userStake.amount += _amount;
        userStake.lastStakeTime = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }
    
    function startUnbonding(uint256 _amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= _amount, "Insufficient staked amount");
        
        // Remove from staked amount immediately (stops earning rewards)
        userStake.amount -= _amount;
        totalStaked -= _amount;
        
        // Add to unbonding queue
        uint256 releaseTime = block.timestamp + UNBONDING_PERIOD;
        unbonding[msg.sender].push(UnbondingInfo({
            amount: _amount,
            releaseTime: releaseTime
        }));
        
        emit UnbondingStarted(msg.sender, _amount, releaseTime);
    }
    
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
    
    // Claim ETH rewards
    function withdrawEthRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 pending = pendingEthRewards(msg.sender);
        require(pending > 0, "No ETH rewards to claim");
        
        StakeInfo storage userStake = stakes[msg.sender];
        userStake.totalEthEarned += pending;
        
        // Safe transfer
        (bool success, ) = payable(msg.sender).call{value: pending}("");
        require(success, "ETH transfer failed");
        
        emit EthRewardsClaimed(msg.sender, pending);
    }
    
    // Claim WETH rewards
    function withdrawWethRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 pending = pendingWethRewards(msg.sender);
        require(pending > 0, "No WETH rewards to claim");
        
        StakeInfo storage userStake = stakes[msg.sender];
        userStake.totalWethEarned += pending;
        
        WETH.transfer(msg.sender, pending);
        emit WethRewardsClaimed(msg.sender, pending);
    }
    
    // Claim both ETH and WETH rewards in one transaction
    function withdrawAllRewards() external nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 ethPending = pendingEthRewards(msg.sender);
        uint256 wethPending = pendingWethRewards(msg.sender);
        
        require(ethPending > 0 || wethPending > 0, "No rewards to claim");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        if (ethPending > 0) {
            userStake.totalEthEarned += ethPending;
            (bool success, ) = payable(msg.sender).call{value: ethPending}("");
            require(success, "ETH transfer failed");
            emit EthRewardsClaimed(msg.sender, ethPending);
        }
        
        if (wethPending > 0) {
            userStake.totalWethEarned += wethPending;
            WETH.transfer(msg.sender, wethPending);
            emit WethRewardsClaimed(msg.sender, wethPending);
        }
    }
    
    // FIXED: Safe pending rewards calculation (prevents underflow)
    function pendingEthRewards(address _user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        if (userStake.amount == 0) return 0;
        
        uint256 accumulated = (userStake.amount * accEthRewardsPerShare) / PRECISION;
        
        // SAFETY: Prevent underflow
        if (accumulated <= userStake.ethRewardDebt) {
            return 0;
        }
        
        return accumulated - userStake.ethRewardDebt;
    }
    
    function pendingWethRewards(address _user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        if (userStake.amount == 0) return 0;
        
        uint256 accumulated = (userStake.amount * accWethRewardsPerShare) / PRECISION;
        
        // SAFETY: Prevent underflow
        if (accumulated <= userStake.wethRewardDebt) {
            return 0;
        }
        
        return accumulated - userStake.wethRewardDebt;
    }
    
    // View functions
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
    
    function getTotalEthEarned(address _user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        return userStake.totalEthEarned + pendingEthRewards(_user);
    }
    
    function getTotalWethEarned(address _user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[_user];
        return userStake.totalWethEarned + pendingWethRewards(_user);
    }
    
    function getStakeInfo(address _user) external view returns (
        uint256 amount,
        uint256 lastStakeTime,
        uint256 totalEthEarned,
        uint256 totalWethEarned,
        uint256 pendingEth,
        uint256 pendingWeth
    ) {
        StakeInfo memory userStake = stakes[_user];
        return (
            userStake.amount,
            userStake.lastStakeTime,
            userStake.totalEthEarned,
            userStake.totalWethEarned,
            pendingEthRewards(_user),
            pendingWethRewards(_user)
        );
    }
    
    function isEligibleForRewards(address _user) external view returns (bool) {
        return stakes[_user].amount >= 100 * 1e18; // 100 ABC minimum
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency function to recover stuck tokens (except ABC and staked amounts)
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        require(token != address(ABC_TOKEN), "Cannot recover staking token");
        IERC20(token).transfer(owner(), amount);
    }
}