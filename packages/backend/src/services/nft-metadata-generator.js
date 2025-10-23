import axios from 'axios';
import FormData from 'form-data';

/**
 * NFT Dynamic Metadata Generator
 * 
 * Generates unique metadata for each membership NFT token and uploads to IPFS
 * Supports art rotation and unique attributes per mint
 */

class NFTMetadataGenerator {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
    
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('⚠️ Pinata API keys not configured. NFT metadata uploads will fail.');
    }
  }

  /**
   * Generate metadata for a specific token ID
   */
  generateMetadata(tokenId, memberAddress, mintTimestamp) {
    const mintDate = new Date(mintTimestamp);
    const monthYear = mintDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    const formattedDate = mintDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });

    // Get current art collection (can be rotated monthly)
    const artCollection = this.getCurrentArtCollection(mintDate);
    
    return {
      name: `ABC DAO Membership #${tokenId}`,
      description: `Always Be Coding - Exclusive developer community membership NFT for ${monthYear}. Ship code, earn $ABC rewards, and build the future with ABC DAO.`,
      image: artCollection.imageUrl,
      external_url: "https://abc.epicdylan.com",
      attributes: [
        {
          trait_type: "Membership",
          value: "Green Hat Member"
        },
        {
          trait_type: "Serial Number", 
          value: `#${tokenId}`
        },
        {
          trait_type: "Mint Date",
          value: formattedDate
        },
        {
          trait_type: "Month",
          value: monthYear
        },
        {
          trait_type: "Collection",
          value: artCollection.name
        },
        {
          trait_type: "Minter",
          value: `${memberAddress.slice(0, 6)}...${memberAddress.slice(-4)}`
        }
      ],
      properties: {
        category: "Membership",
        creators: [
          {
            address: "0xBE6525b767cA8D38d169C93C8120c0C0957388B8",
            share: 100
          }
        ],
        tokenId: tokenId,
        mintTimestamp: mintTimestamp,
        originalMinter: memberAddress
      }
    };
  }

  /**
   * Get current art collection based on date
   * This allows for periodic art updates (November 2025, December 2025, etc.)
   */
  getCurrentArtCollection(mintDate) {
    const month = mintDate.getMonth(); // 0-11
    const year = mintDate.getFullYear();
    
    // Default to October 2025 collection for now
    // Future: Add seasonal/monthly variations
    return {
      name: "ABC DAO Genesis - October 2025",
      imageUrl: "https://arweave.net/XGJ9ps9OtQDSRi7ff36KVlvb4W6U7qJVjVPETwzGLhs"
    };
    
    // Future art collections:
    // if (year === 2025 && month === 10) { // November 2025
    //   return {
    //     name: "ABC DAO Genesis - November 2025", 
    //     imageUrl: "https://arweave.net/[NEW_NOVEMBER_HASH]"
    //   };
    // }
  }

  /**
   * Upload metadata to IPFS via Pinata
   */
  async uploadMetadataToIPFS(metadata, tokenId) {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      console.log(`📤 Uploading metadata for token #${tokenId} to IPFS...`);
      
      const formData = new FormData();
      const metadataBlob = Buffer.from(JSON.stringify(metadata, null, 2));
      
      formData.append('file', metadataBlob, {
        filename: tokenId.toString(),
        contentType: 'application/json'
      });
      
      const pinataMetadata = {
        name: `ABC DAO Membership #${tokenId} Metadata`,
        keyvalues: {
          tokenId: tokenId.toString(),
          collection: 'abc-dao-membership',
          type: 'metadata'
        }
      };
      
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
      
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      });
      
      const ipfsHash = response.data.IpfsHash;
      const gatewayUrl = `https://crimson-bright-wallaby-267.mypinata.cloud/ipfs/${ipfsHash}`;
      
      console.log(`✅ Metadata uploaded for token #${tokenId}`);
      console.log(`   IPFS Hash: ${ipfsHash}`);
      console.log(`   Gateway URL: ${gatewayUrl}`);
      
      return {
        ipfsHash,
        gatewayUrl,
        pinataResponse: response.data
      };
      
    } catch (error) {
      console.error(`❌ Failed to upload metadata for token #${tokenId}:`, error.message);
      if (error.response) {
        console.error('Pinata API Error:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Generate and upload metadata for a token
   */
  async processTokenMetadata(tokenId, memberAddress, mintTimestamp = Date.now()) {
    try {
      console.log(`🎨 Generating metadata for token #${tokenId}...`);
      
      // Generate unique metadata
      const metadata = this.generateMetadata(tokenId, memberAddress, mintTimestamp);
      
      // Upload to IPFS
      const uploadResult = await this.uploadMetadataToIPFS(metadata, tokenId);
      
      return {
        tokenId,
        metadata,
        ipfsHash: uploadResult.ipfsHash,
        gatewayUrl: uploadResult.gatewayUrl,
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Failed to process metadata for token #${tokenId}:`, error.message);
      return {
        tokenId,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Create IPFS folder structure for all tokens
   * Updates contract baseURI to point to folder
   */
  async setupTokenFolder() {
    // This would create a folder structure on IPFS
    // For now, individual file uploads work with the current contract setup
    console.log('📁 Token folder structure: Individual file uploads (tokenId as filename)');
  }
}

export { NFTMetadataGenerator };