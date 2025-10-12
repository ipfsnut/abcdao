// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EmarkStaking.sol";

contract DeployEmarkScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy EMARK staking contract
        EmarkStaking staking = new EmarkStaking();
        
        console.log("EMARK Staking deployed at:", address(staking));
        console.log("EMARK Token address:", 0xf87F3ebbF8CaCF321C2a4027bb66Df639a6f4B07);
        
        vm.stopBroadcast();
    }
}