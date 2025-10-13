// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ABCRewards
 * @dev Manages claimable $ABC token rewards for developers
 * Used by ABC DAO bot to allocate rewards that users can claim
 */
contract ABCRewards is ReentrancyGuard, Ownable, Pausable {
    IERC20 public immutable abcToken;
    
    struct UserRewards {
        uint256 totalAllocated;    // Total rewards allocated to user
        uint256 totalClaimed;      // Total rewards claimed by user
        uint256 lastUpdated;       // Last time rewards were allocated
    }
    
    struct RewardBatch {
        address[] users;
        uint256[] amounts;
        bytes32 batchId;
        uint256 timestamp;
        bool processed;
    }
    
    mapping(address => UserRewards) public userRewards;
    mapping(bytes32 => RewardBatch) public rewardBatches;
    mapping(address => bool) public authorized; // Addresses that can allocate rewards
    
    uint256 public totalAllocated;
    uint256 public totalClaimed;
    uint256 public batchCount;
    
    // Events
    event RewardsAllocated(address indexed user, uint256 amount, bytes32 indexed batchId);
    event RewardsClaimed(address indexed user, uint256 amount);
    event BatchProcessed(bytes32 indexed batchId, uint256 userCount, uint256 totalAmount);
    event AuthorizedUpdated(address indexed account, bool authorized);
    event TokensWithdrawn(address indexed owner, uint256 amount);
    
    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(address _abcToken) Ownable(msg.sender) {
        abcToken = IERC20(_abcToken);
        // Owner is automatically authorized
        authorized[msg.sender] = true;
    }
    
    /**
     * @dev Set authorization for an address to allocate rewards
     * @param account Address to authorize/deauthorize
     * @param _authorized Whether to authorize or deauthorize
     */
    function setAuthorized(address account, bool _authorized) external onlyOwner {
        authorized[account] = _authorized;
        emit AuthorizedUpdated(account, _authorized);
    }
    
    /**
     * @dev Allocate rewards to a single user
     * @param user Address of the user
     * @param amount Amount of ABC tokens to allocate
     */
    function allocateReward(address user, uint256 amount) external onlyAuthorized whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        
        bytes32 batchId = keccak256(abi.encodePacked(user, amount, block.timestamp, batchCount));
        
        // Update user rewards
        UserRewards storage rewards = userRewards[user];
        rewards.totalAllocated += amount;
        rewards.lastUpdated = block.timestamp;
        
        // Update global stats
        totalAllocated += amount;
        
        emit RewardsAllocated(user, amount, batchId);
    }
    
    /**
     * @dev Allocate rewards to multiple users in a batch
     * @param users Array of user addresses
     * @param amounts Array of reward amounts (must match users length)
     */
    function allocateRewardsBatch(
        address[] calldata users, 
        uint256[] calldata amounts
    ) external onlyAuthorized whenNotPaused {
        require(users.length == amounts.length, "Arrays length mismatch");
        require(users.length > 0, "Empty arrays");
        require(users.length <= 100, "Batch too large"); // Gas limit protection
        
        bytes32 batchId = keccak256(abi.encodePacked(users, amounts, block.timestamp, batchCount));
        uint256 batchTotal = 0;
        
        // Store batch info
        rewardBatches[batchId] = RewardBatch({
            users: users,
            amounts: amounts,
            batchId: batchId,
            timestamp: block.timestamp,
            processed: true
        });
        
        // Process each user in the batch
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 amount = amounts[i];
            
            require(user != address(0), "Invalid user address");
            require(amount > 0, "Amount must be greater than 0");
            
            // Update user rewards
            UserRewards storage rewards = userRewards[user];
            rewards.totalAllocated += amount;
            rewards.lastUpdated = block.timestamp;
            
            batchTotal += amount;
            
            emit RewardsAllocated(user, amount, batchId);
        }
        
        // Update global stats
        totalAllocated += batchTotal;
        batchCount++;
        
        emit BatchProcessed(batchId, users.length, batchTotal);
    }
    
    /**
     * @dev Claim available rewards for the caller
     */
    function claimRewards() external nonReentrant whenNotPaused {
        uint256 claimable = getClaimableAmount(msg.sender);
        require(claimable > 0, "No rewards to claim");
        
        // Check contract has enough tokens
        require(abcToken.balanceOf(address(this)) >= claimable, "Insufficient contract balance");
        
        // Update user state
        UserRewards storage rewards = userRewards[msg.sender];
        rewards.totalClaimed += claimable;
        
        // Update global state
        totalClaimed += claimable;
        
        // Transfer tokens
        abcToken.transfer(msg.sender, claimable);
        
        emit RewardsClaimed(msg.sender, claimable);
    }
    
    /**
     * @dev Get claimable amount for a user
     * @param user Address of the user
     * @return Amount of ABC tokens the user can claim
     */
    function getClaimableAmount(address user) public view returns (uint256) {
        UserRewards memory rewards = userRewards[user];
        return rewards.totalAllocated - rewards.totalClaimed;
    }
    
    /**
     * @dev Get detailed reward info for a user
     * @param user Address of the user
     * @return totalAllocated Total rewards allocated to user
     * @return totalClaimed Total rewards claimed by user
     * @return claimable Current claimable amount
     * @return lastUpdated Last time rewards were updated
     */
    function getUserRewardInfo(address user) external view returns (
        uint256 totalAllocated,
        uint256 totalClaimed,
        uint256 claimable,
        uint256 lastUpdated
    ) {
        UserRewards memory rewards = userRewards[user];
        return (
            rewards.totalAllocated,
            rewards.totalClaimed,
            getClaimableAmount(user),
            rewards.lastUpdated
        );
    }
    
    /**
     * @dev Get contract stats
     * @return totalAllocated_ Total rewards allocated
     * @return totalClaimed_ Total rewards claimed
     * @return contractBalance Current ABC token balance of contract
     * @return batchCount_ Number of batches processed
     */
    function getContractStats() external view returns (
        uint256 totalAllocated_,
        uint256 totalClaimed_,
        uint256 contractBalance,
        uint256 batchCount_
    ) {
        return (
            totalAllocated,
            totalClaimed,
            abcToken.balanceOf(address(this)),
            batchCount
        );
    }
    
    /**
     * @dev Emergency function to withdraw tokens (owner only)
     * @param amount Amount of ABC tokens to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= abcToken.balanceOf(address(this)), "Insufficient balance");
        abcToken.transfer(owner(), amount);
        emit TokensWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Deposit ABC tokens to the contract for reward distribution
     * @param amount Amount of ABC tokens to deposit
     */
    function depositTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        abcToken.transferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}