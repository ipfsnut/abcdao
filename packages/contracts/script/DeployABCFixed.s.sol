// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ABCStakingV2Fixed.sol";

contract DeployABCFixedScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ABC staking V2 FIXED contract  
        address abcTokenAddress = 0xf87F3ebbF8CaCF321C2a4027bb66Df639a6f4B07; // EMARK for testing
        address wethAddress = 0x4200000000000000000000000000000000000006; // Base WETH
        ABCStakingV2Fixed staking = new ABCStakingV2Fixed(abcTokenAddress, wethAddress);
        
        console.log("=== ABC DAO FIXED DEPLOYMENT ===");
        console.log("ABC Staking V2 Fixed deployed at:", address(staking));
        console.log("ABC Token address (UPDATE REQUIRED):", address(staking.ABC_TOKEN()));
        console.log("WETH Token address (Base):", address(staking.WETH()));
        console.log("Deployer address:", msg.sender);
        console.log("Block timestamp:", block.timestamp);
        console.log("");
        console.log("=== FIXES APPLIED ===");
        console.log("- Integer underflow protection");
        console.log("- WETH support added");
        console.log("- Separate ETH/WETH reward tracking");
        console.log("- Safe transfer mechanisms");
        console.log("- Proper unbonding period (7 days)");
        console.log("========================");
        
        vm.stopBroadcast();
    }
}