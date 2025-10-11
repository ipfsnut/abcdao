// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ABCMembership is ReentrancyGuard, Ownable, Pausable {
    
    // Membership tracking
    mapping(address => bool) public isMember;
    uint256 public totalMembers;
    
    // Staking contract to receive ETH
    address payable public stakingContract;
    
    // Constants
    uint256 public constant MEMBERSHIP_FEE = 0.002 ether; // ~$5 at current ETH prices
    
    // Events
    event MembershipPurchased(address indexed member);
    event StakingContractUpdated(address indexed newContract);
    event FundsForwarded(uint256 amount);
    
    constructor(address payable _stakingContract) Ownable(msg.sender) {
        stakingContract = _stakingContract;
    }
    
    // Purchase lifetime membership with ETH
    function purchaseMembership() external payable nonReentrant whenNotPaused {
        require(msg.value >= MEMBERSHIP_FEE, "Insufficient payment");
        require(!isMember[msg.sender], "Already a member");
        
        // Grant membership
        isMember[msg.sender] = true;
        totalMembers++;
        
        // Forward ETH to staking contract for distribution to stakers
        stakingContract.transfer(msg.value);
        
        emit MembershipPurchased(msg.sender);
        emit FundsForwarded(msg.value);
    }
    
    // Grant free membership (owner only)
    function grantMembership(address _member) external onlyOwner {
        require(!isMember[_member], "Already a member");
        
        isMember[_member] = true;
        totalMembers++;
        
        emit MembershipPurchased(_member);
    }
    
    // Batch grant memberships
    function grantMembershipBatch(address[] calldata _members) external onlyOwner {
        for (uint256 i = 0; i < _members.length; i++) {
            if (!isMember[_members[i]]) {
                isMember[_members[i]] = true;
                totalMembers++;
                emit MembershipPurchased(_members[i]);
            }
        }
    }
    
    // Update staking contract address
    function updateStakingContract(address payable _newStakingContract) external onlyOwner {
        require(_newStakingContract != address(0), "Invalid address");
        stakingContract = _newStakingContract;
        emit StakingContractUpdated(_newStakingContract);
    }
    
    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency withdrawal (only if staking contract fails)
    function emergencyWithdraw() external onlyOwner {
        require(paused(), "Must be paused for emergency withdrawal");
        payable(owner()).transfer(address(this).balance);
    }
    
    // View functions
    function getMembershipStatus(address _address) external view returns (bool) {
        return isMember[_address];
    }
    
    function getTotalMembers() external view returns (uint256) {
        return totalMembers;
    }
    
    function getMembershipFee() external pure returns (uint256) {
        return MEMBERSHIP_FEE;
    }
}