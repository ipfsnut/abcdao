// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ABCRewardsV2
 * @dev Simple, clean reward contract for ABC DAO - FIXED VERSION
 * Fixes the token address bug from V1 by using correct ABC token address
 */
contract ABCRewardsV2 is ReentrancyGuard, Ownable, Pausable {
    IERC20 public immutable abcToken;
    
    // User reward tracking
    mapping(address => uint256) public allocated;  // Total allocated to user
    mapping(address => uint256) public claimed;    // Total claimed by user
    
    // Global stats
    uint256 public totalAllocated;
    uint256 public totalClaimed;
    
    // Authorization
    mapping(address => bool) public authorized;
    
    // Events
    event RewardsAllocated(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event AuthorizedUpdated(address indexed account, bool authorized);
    
    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor(address _abcToken) Ownable(msg.sender) {
        require(_abcToken != address(0), "Invalid token address");
        abcToken = IERC20(_abcToken);
        authorized[msg.sender] = true; // Owner is authorized
    }
    
    /**
     * @dev Set authorization for reward allocation
     */
    function setAuthorized(address account, bool _authorized) external onlyOwner {
        authorized[account] = _authorized;
        emit AuthorizedUpdated(account, _authorized);
    }
    
    /**
     * @dev Allocate rewards to multiple users (batch operation)
     */
    function allocateRewardsBatch(
        address[] calldata users, 
        uint256[] calldata amounts
    ) external onlyAuthorized whenNotPaused {
        require(users.length == amounts.length, "Array length mismatch");
        require(users.length > 0, "Empty arrays");
        require(users.length <= 100, "Batch too large");
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 amount = amounts[i];
            
            require(user != address(0), "Invalid user");
            require(amount > 0, "Invalid amount");
            
            allocated[user] += amount;
            totalAllocated += amount;
            
            emit RewardsAllocated(user, amount);
        }
    }
    
    /**
     * @dev Claim available rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        uint256 claimable = getClaimableAmount(msg.sender);
        require(claimable > 0, "No rewards to claim");
        
        uint256 contractBalance = abcToken.balanceOf(address(this));
        require(contractBalance >= claimable, "Insufficient contract balance");
        
        claimed[msg.sender] += claimable;
        totalClaimed += claimable;
        
        // Transfer tokens
        require(abcToken.transfer(msg.sender, claimable), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, claimable);
    }
    
    /**
     * @dev Get claimable amount for user
     */
    function getClaimableAmount(address user) public view returns (uint256) {
        return allocated[user] - claimed[user];
    }
    
    /**
     * @dev Get user reward info (for compatibility with frontend)
     */
    function getUserRewardInfo(address user) external view returns (
        uint256 totalAllocated_,
        uint256 totalClaimed_,
        uint256 claimable,
        uint256 lastUpdated
    ) {
        return (
            allocated[user],
            claimed[user],
            getClaimableAmount(user),
            0 // Not tracking lastUpdated in V2 for simplicity
        );
    }
    
    /**
     * @dev Get contract stats (for compatibility with frontend)
     */
    function getContractStats() external view returns (
        uint256 totalAllocated_,
        uint256 totalClaimed_,
        uint256 contractBalance,
        uint256 userCount
    ) {
        return (
            totalAllocated,
            totalClaimed,
            abcToken.balanceOf(address(this)),
            0 // Not tracking user count in V2 for simplicity
        );
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        uint256 balance = abcToken.balanceOf(address(this));
        require(amount <= balance, "Insufficient balance");
        require(abcToken.transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @dev Pause functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Deposit ABC tokens to the contract
     */
    function depositTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(abcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
    
    /**
     * @dev Get version for tracking
     */
    function version() external pure returns (string memory) {
        return "2.0.0-fixed";
    }
}