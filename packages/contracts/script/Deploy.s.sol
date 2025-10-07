// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ABCToken.sol";
import "../src/ABCStaking.sol";
import "../src/ABCGovernance.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ABC Token
        ABCToken token = new ABCToken();
        console.log("ABC Token deployed at:", address(token));
        
        // Deploy Staking Contract
        ABCStaking staking = new ABCStaking(address(token));
        console.log("Staking Contract deployed at:", address(staking));
        
        // Deploy Governance Contract
        ABCGovernance governance = new ABCGovernance(address(token), payable(address(staking)));
        console.log("Governance Contract deployed at:", address(governance));
        
        // Transfer initial tokens to governance treasury (10% of supply)
        uint256 treasuryAmount = 100_000_000 * 10**18; // 100M tokens
        token.transfer(address(governance), treasuryAmount);
        console.log("Transferred", treasuryAmount / 10**18, "ABC to treasury");
        
        vm.stopBroadcast();
    }
}