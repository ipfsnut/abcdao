// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ABC Treasury
 * @dev Receives fees from creator wallet and distributes:
 * - ETH to staking contract for staker rewards
 * - ABC to bot wallet for developer commit rewards
 */
contract ABCTreasury is ReentrancyGuard, Ownable {
    IERC20 public immutable abcToken;
    address public immutable stakingContract;
    address public botWallet;
    
    uint256 public totalEthForwarded;
    uint256 public totalAbcForwarded;
    
    // Events
    event EthForwarded(uint256 amount, address stakingContract);
    event AbcForwarded(uint256 amount, address botWallet);
    event BotWalletUpdated(address newBotWallet);
    
    constructor(
        address _abcToken,
        address _stakingContract,
        address _botWallet
    ) Ownable(msg.sender) {
        require(_abcToken != address(0), "Invalid ABC token");
        require(_stakingContract != address(0), "Invalid staking contract");
        require(_botWallet != address(0), "Invalid bot wallet");
        
        abcToken = IERC20(_abcToken);
        stakingContract = _stakingContract;
        botWallet = _botWallet;
    }
    
    /**
     * @dev Receive ETH from creator wallet and forward to staking contract
     */
    receive() external payable {
        if (msg.value > 0) {
            _forwardEth();
        }
    }
    
    /**
     * @dev Forward any received ABC tokens to bot wallet
     */
    function forwardAbc() external nonReentrant {
        uint256 balance = abcToken.balanceOf(address(this));
        if (balance > 0) {
            _forwardAbc(balance);
        }
    }
    
    /**
     * @dev Emergency function to forward any ABC tokens manually
     */
    function emergencyForwardAbc(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(abcToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        _forwardAbc(amount);
    }
    
    /**
     * @dev Update bot wallet address (emergency use only)
     */
    function updateBotWallet(address _newBotWallet) external onlyOwner {
        require(_newBotWallet != address(0), "Invalid bot wallet");
        botWallet = _newBotWallet;
        emit BotWalletUpdated(_newBotWallet);
    }
    
    /**
     * @dev Internal function to forward ETH to staking contract
     */
    function _forwardEth() internal {
        uint256 amount = address(this).balance;
        totalEthForwarded += amount;
        
        (bool success, ) = stakingContract.call{value: amount}("");
        require(success, "ETH forward failed");
        
        emit EthForwarded(amount, stakingContract);
    }
    
    /**
     * @dev Internal function to forward ABC to bot wallet
     */
    function _forwardAbc(uint256 amount) internal {
        totalAbcForwarded += amount;
        
        bool success = abcToken.transfer(botWallet, amount);
        require(success, "ABC transfer failed");
        
        emit AbcForwarded(amount, botWallet);
    }
    
    /**
     * @dev View function to check ABC balance
     */
    function getAbcBalance() external view returns (uint256) {
        return abcToken.balanceOf(address(this));
    }
    
    /**
     * @dev View function to check ETH balance
     */
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev View function to get total amounts forwarded
     */
    function getTotalForwarded() external view returns (uint256 ethForwarded, uint256 abcForwarded) {
        return (totalEthForwarded, totalAbcForwarded);
    }
}