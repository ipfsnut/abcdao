// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EmarkStakingV2.sol";

contract DeployEmarkV2Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy EMARK staking V2 contract
        EmarkStakingV2 staking = new EmarkStakingV2();
        
        console.log("EMARK Staking V2 deployed at:", address(staking));
        console.log("EMARK Token address:", 0xf87F3ebbF8CaCF321C2a4027bb66Df639a6f4B07);
        
        vm.stopBroadcast();
    }
}