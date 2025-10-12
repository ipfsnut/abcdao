// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ABCToken.sol";
import "../src/ABCStaking.sol";

contract TestUser {
    receive() external payable {}
}

contract ABCStakingTest is Test {
    ABCToken public token;
    ABCStaking public staking;
    
    TestUser public alice;
    TestUser public bob; 
    TestUser public charlie;
    
    uint256 public constant INITIAL_BALANCE = 1000 * 10**18;
    
    function setUp() public {
        // Deploy contracts
        token = new ABCToken();
        staking = new ABCStaking(address(token));
        
        // Deploy test users
        alice = new TestUser();
        bob = new TestUser();
        charlie = new TestUser();
        
        // Give test users some tokens
        token.transfer(address(alice), INITIAL_BALANCE);
        token.transfer(address(bob), INITIAL_BALANCE);
        token.transfer(address(charlie), INITIAL_BALANCE);
        
        // Approve staking contract
        vm.prank(address(alice));
        token.approve(address(staking), type(uint256).max);
        
        vm.prank(address(bob));
        token.approve(address(staking), type(uint256).max);
        
        vm.prank(address(charlie));
        token.approve(address(staking), type(uint256).max);
    }
    
    function testStakeTokens() public {
        uint256 stakeAmount = 100 * 10**18;
        
        vm.prank(address(alice));
        staking.stake(stakeAmount);
        
        // Check Alice's stake
        (uint256 amount, , , ) = staking.stakes(address(alice));
        assertEq(amount, stakeAmount);
        
        // Check total staked
        assertEq(staking.totalStaked(), stakeAmount);
        
        // Check voting power
        assertEq(staking.getVotingPower(address(alice)), stakeAmount);
        
        // Check token balance
        assertEq(token.balanceOf(address(alice)), INITIAL_BALANCE - stakeAmount);
        assertEq(token.balanceOf(address(staking)), stakeAmount);
    }
    
    function testMultipleStakers() public {
        uint256 aliceStake = 100 * 10**18;
        uint256 bobStake = 200 * 10**18;
        
        vm.prank(address(alice));
        staking.stake(aliceStake);
        
        vm.prank(address(bob));
        staking.stake(bobStake);
        
        assertEq(staking.totalStaked(), aliceStake + bobStake);
        assertEq(staking.getVotingPower(address(alice)), aliceStake);
        assertEq(staking.getVotingPower(address(bob)), bobStake);
    }
    
    function testETHRewardsDistribution() public {
        uint256 aliceStake = 100 * 10**18;
        uint256 bobStake = 200 * 10**18;
        uint256 ethReward = 3 ether;
        
        // Stake tokens
        vm.prank(address(alice));
        staking.stake(aliceStake);
        
        vm.prank(address(bob));
        staking.stake(bobStake);
        
        // Send ETH rewards to contract
        vm.deal(address(this), ethReward);
        (bool success,) = payable(address(staking)).call{value: ethReward}("");
        require(success, "ETH transfer failed");
        
        // Check pending rewards (Alice should get 1/3, Bob should get 2/3)
        uint256 aliceExpected = (ethReward * aliceStake) / (aliceStake + bobStake);
        uint256 bobExpected = (ethReward * bobStake) / (aliceStake + bobStake);
        
        assertEq(staking.pendingRewards(address(alice)), aliceExpected);
        assertEq(staking.pendingRewards(address(bob)), bobExpected);
        
        // Alice withdraws
        uint256 aliceBalanceBefore = address(alice).balance;
        vm.deal(address(alice), 0); // Ensure alice starts with 0 ETH
        
        vm.prank(address(alice));
        staking.withdrawRewards();
        
        assertEq(address(alice).balance, aliceExpected);
        assertEq(staking.pendingRewards(address(alice)), 0);
        
        // Bob should still have rewards
        assertEq(staking.pendingRewards(address(bob)), bobExpected);
    }
    
    function testUnstakeWithCooldown() public {
        uint256 stakeAmount = 100 * 10**18;
        
        vm.prank(address(alice));
        staking.stake(stakeAmount);
        
        // Try to unstake immediately (should fail)
        vm.prank(address(alice));
        vm.expectRevert("Cooldown period not met");
        staking.unstake(stakeAmount);
        
        // Fast forward 7 days
        vm.warp(block.timestamp + 7 days);
        
        // Now unstaking should work
        vm.prank(address(alice));
        staking.unstake(stakeAmount);
        
        assertEq(token.balanceOf(address(alice)), INITIAL_BALANCE);
        assertEq(staking.totalStaked(), 0);
    }
    
    function testRewardsAfterNewStaker() public {
        uint256 ethReward = 2 ether;
        
        // Alice stakes first
        vm.prank(address(alice));
        staking.stake(100 * 10**18);
        
        // Send first reward (Alice gets all)
        vm.deal(address(this), ethReward);
        (bool success,) = payable(address(staking)).call{value: ethReward}("");
        require(success, "ETH transfer failed");
        
        assertEq(staking.pendingRewards(address(alice)), ethReward);
        
        // Bob stakes (should not get retroactive rewards)
        vm.prank(address(bob));
        staking.stake(100 * 10**18);
        
        assertEq(staking.pendingRewards(address(alice)), ethReward);
        assertEq(staking.pendingRewards(address(bob)), 0);
        
        // Send second reward (should be split 50/50)
        vm.deal(address(this), ethReward);
        (bool success2,) = payable(address(staking)).call{value: ethReward}("");
        require(success2, "ETH transfer failed");
        
        assertEq(staking.pendingRewards(address(alice)), ethReward + ethReward/2);
        assertEq(staking.pendingRewards(address(bob)), ethReward/2);
    }
    
    function testTotalEarnedTracking() public {
        uint256 stakeAmount = 100 * 10**18;
        uint256 ethReward = 1 ether;
        
        // Alice stakes
        vm.prank(address(alice));
        staking.stake(stakeAmount);
        
        // Send rewards multiple times
        for (uint i = 0; i < 3; i++) {
            vm.deal(address(this), ethReward);
            (bool success,) = payable(address(staking)).call{value: ethReward}("");
            require(success, "ETH transfer failed");
            
            vm.prank(address(alice));
            staking.withdrawRewards();
        }
        
        // Check total earned
        assertEq(staking.getTotalEarned(address(alice)), 3 ether);
    }
    
    function testCannotStakeZero() public {
        vm.prank(address(alice));
        vm.expectRevert("Cannot stake 0");
        staking.stake(0);
    }
    
    function testCannotUnstakeMoreThanStaked() public {
        vm.prank(address(alice));
        staking.stake(50 * 10**18);
        
        vm.warp(block.timestamp + 7 days);
        
        vm.prank(address(alice));
        vm.expectRevert("Insufficient staked amount");
        staking.unstake(100 * 10**18);
    }
    
    function testCannotWithdrawZeroRewards() public {
        vm.prank(address(alice));
        vm.expectRevert("No rewards to claim");
        staking.withdrawRewards();
    }
}