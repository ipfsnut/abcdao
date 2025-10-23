// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ABC DAO Membership NFT - October 2025
 * @dev Fixed ERC721 NFT with proper metadata handling for OpenSea compatibility
 * Each token has unique metadata but all use the same artwork (for now)
 */
contract ABCMembership is ERC721, Ownable, Pausable, ReentrancyGuard {
    
    // Constants
    uint256 public constant MINT_PRICE = 0.002 ether;
    address public constant TREASURY = 0xBE6525b767cA8D38d169C93C8120c0C0957388B8;
    
    // State variables
    string private _metadataBaseURI;
    uint256 private _tokenIdCounter;
    
    // Events
    event MembershipMinted(address indexed member, uint256 indexed tokenId);
    event MetadataBaseURIUpdated(string newBaseURI);
    
    /**
     * @dev Constructor sets name, symbol, and metadata base URI
     * Base URI should point to folder containing individual token metadata files
     */
    constructor() 
        ERC721("ABC DAO Membership October 2025", "ABCMEM") 
        Ownable(msg.sender) 
    {
        // This will be updated to point to our IPFS folder with individual metadata files
        _metadataBaseURI = "https://crimson-bright-wallaby-267.mypinata.cloud/ipfs/";
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
     * @dev Returns the token URI for a given token ID
     * This is the key fix - returns individual metadata files
     * tokenURI(0) -> baseURI + "0"
     * tokenURI(1) -> baseURI + "1"
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // Ensure token exists
        
        string memory baseURI = _metadataBaseURI;
        return bytes(baseURI).length > 0 ? 
            string(abi.encodePacked(baseURI, _toString(tokenId))) : "";
    }
    
    /**
     * @dev Get total number of tokens minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
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
     * @dev Get the token ID for a member (if they own one)
     * Returns the first token they own, or reverts if they don't own any
     */
    function getMemberTokenId(address member) external view returns (uint256) {
        require(balanceOf(member) > 0, "Not a member");
        
        // Find first token owned by this member
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) == member) {
                return i;
            }
        }
        
        revert("No token found"); // Should never reach here if balanceOf > 0
    }
    
    // === ADMIN FUNCTIONS ===
    
    /**
     * @dev Update metadata base URI (owner only)
     * This should point to IPFS folder containing individual token metadata
     * @param newBaseURI New base URI (should end with /)
     */
    function setMetadataBaseURI(string calldata newBaseURI) external onlyOwner {
        _metadataBaseURI = newBaseURI;
        emit MetadataBaseURIUpdated(newBaseURI);
    }
    
    /**
     * @dev Get current metadata base URI (for transparency)
     */
    function getMetadataBaseURI() external view returns (string memory) {
        return _metadataBaseURI;
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
    
    /**
     * @dev Convert uint256 to string (internal utility)
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}