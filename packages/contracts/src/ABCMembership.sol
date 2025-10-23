// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ABC DAO Membership NFT - October 2025
 * @dev ERC721 NFT representing ABC DAO membership for October 2025
 * Simple mint-for-ETH contract with funds sent directly to treasury
 */
contract ABCMembership is ERC721, ERC721Enumerable, Ownable, Pausable, ReentrancyGuard {
    
    // Constants
    uint256 public constant MINT_PRICE = 0.002 ether;
    address public constant TREASURY = 0xBE6525b767cA8D38d169C93C8120c0C0957388B8;
    
    // State variables
    string private _baseTokenURI;
    uint256 private _tokenIdCounter;
    
    // Events
    event MembershipMinted(address indexed member, uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);
    
    /**
     * @dev Constructor sets name, symbol, and metadata URI
     * All tokens point to the same October 2025 membership metadata
     */
    constructor() 
        ERC721("ABC DAO Membership October 2025", "ABCMEM") 
        Ownable(msg.sender) 
    {
        _baseTokenURI = "https://crimson-bright-wallaby-267.mypinata.cloud/ipfs/bafkreigh6utl4k5vecx5zlmst63im3mdzowcihkawmdu7ghwfestje74q4";
    }
    
    /**
     * @dev Mint membership NFT for 0.002 ETH
     * Sends payment directly to treasury wallet
     */
    function mint() external payable nonReentrant whenNotPaused {
        require(msg.value == MINT_PRICE, "Incorrect payment amount");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Mint NFT to sender
        _mint(msg.sender, tokenId);
        
        // Send payment to treasury
        payable(TREASURY).transfer(msg.value);
        
        emit MembershipMinted(msg.sender, tokenId);
    }
    
    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance  
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Check if an address owns a membership NFT
     * @param member Address to check
     * @return true if address owns at least one membership NFT
     */
    function isMember(address member) external view returns (bool) {
        return balanceOf(member) > 0;
    }
    
    /**
     * @dev Get the token ID for a member's first NFT
     * @param member Address to check
     * @return tokenId of first NFT owned (0 if none owned)
     */
    function getMemberTokenId(address member) external view returns (uint256) {
        require(balanceOf(member) > 0, "Not a member");
        return tokenOfOwnerByIndex(member, 0);
    }
    
    // === ADMIN FUNCTIONS ===
    
    /**
     * @dev Update base URI for token metadata (owner only)
     * @param newBaseURI New base URI
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }
    
    /**
     * @dev Pause minting (owner only)
     * Used when transitioning to next month's membership NFT
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause minting (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal of any stuck ETH (owner only)
     * Should not be needed since payments go directly to treasury
     */
    function emergencyWithdraw() external onlyOwner {
        require(address(this).balance > 0, "No funds to withdraw");
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Grant free membership NFT (owner only)
     * @param to Address to receive NFT
     */
    function grantMembership(address to) external onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _mint(to, tokenId);
        emit MembershipMinted(to, tokenId);
    }
    
    /**
     * @dev Batch grant free memberships (owner only)
     * @param recipients Array of addresses to receive NFTs
     */
    function grantMembershipBatch(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _mint(recipients[i], tokenId);
            emit MembershipMinted(recipients[i], tokenId);
        }
    }
}