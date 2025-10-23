-- Add NFT membership support to database schema
-- Adds token ID tracking for membership NFTs

-- Add NFT membership fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nft_token_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nft_mint_tx_hash VARCHAR(66);

-- Add NFT membership fields to memberships table  
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS nft_token_id VARCHAR(50);
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS original_minter VARCHAR(42);

-- Add index for faster NFT token lookups
CREATE INDEX IF NOT EXISTS idx_users_nft_token_id ON users(nft_token_id);
CREATE INDEX IF NOT EXISTS idx_memberships_nft_token_id ON memberships(nft_token_id);

-- Add comments to document the purpose and transfer policy
COMMENT ON COLUMN users.nft_token_id IS 'Token ID for ABC DAO membership NFT originally minted by this user (October 2025 collection)';
COMMENT ON COLUMN users.nft_mint_tx_hash IS 'Transaction hash of the original NFT mint that granted membership';
COMMENT ON COLUMN memberships.nft_token_id IS 'Token ID for ABC DAO membership NFT (October 2025 collection)';
COMMENT ON COLUMN memberships.original_minter IS 'Wallet address that originally minted the NFT (membership is tied to minter, not current holder)';

-- Optional: Update existing users to indicate legacy membership type
-- UPDATE users SET entry_context = 'legacy_eth_payment' WHERE membership_status = 'paid' AND nft_token_id IS NULL;