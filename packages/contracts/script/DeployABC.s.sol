// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ABCStakingV2.sol";

contract DeployABCScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ABC staking V2 contract
        ABCStakingV2 staking = new ABCStakingV2();
        
        console.log("=== ABC DAO DEPLOYMENT ===");
        console.log("ABC Staking V2 deployed at:", address(staking));
        console.log("ABC Token address (UPDATE REQUIRED):", address(staking.ABC_TOKEN()));
        console.log("Deployer address:", msg.sender);
        console.log("Block timestamp:", block.timestamp);
        console.log("========================");
        
        vm.stopBroadcast();
    }
}