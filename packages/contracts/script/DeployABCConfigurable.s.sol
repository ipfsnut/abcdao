// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ABCStakingV2Fixed.sol";

contract DeployABCConfigurableScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Read token address from environment (set by deployment script)
        address abcTokenAddress = vm.envAddress("ABC_TOKEN_ADDRESS");
        address wethAddress = vm.envAddress("WETH_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ABC staking contract with configured addresses
        ABCStakingV2Fixed staking = new ABCStakingV2Fixed(abcTokenAddress, wethAddress);
        
        console.log("=== ABC DAO CONFIGURABLE DEPLOYMENT ===");
        console.log("ABC Staking V2 Fixed deployed at:", address(staking));
        console.log("ABC Token address:", abcTokenAddress);
        console.log("WETH Token address:", wethAddress);
        console.log("Deployer address:", msg.sender);
        console.log("Block timestamp:", block.timestamp);
        console.log("");
        console.log("=== FIXES APPLIED ===");
        console.log("- Integer underflow protection");
        console.log("- WETH support added");
        console.log("- Separate ETH/WETH reward tracking");
        console.log("- Safe transfer mechanisms");
        console.log("- Configurable token addresses");
        console.log("========================");
        
        vm.stopBroadcast();
    }
}