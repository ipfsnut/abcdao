#!/bin/bash

# ABC DAO Complete Deployment Script
# This script deploys the ABC staking contract and updates all frontend addresses

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art Header
echo -e "${BLUE}"
echo "    ___    ____  ______   ____  ___    ____ "
echo "   /   |  / __ )/ ____/  / __ )/   |  / __ \\"
echo "  / /| | / __  / /      / __  / /| | / / / /"
echo " / ___ |/ /_/ / /___   / /_/ / ___ |/ /_/ / "
echo "/_/  |_/_____/\____/  /_____/_/  |_|\____/  "
echo ""
echo "Complete Deployment System"
echo -e "${NC}"

# Function to print status messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate Ethereum address
validate_address() {
    if [[ $1 =~ ^0x[a-fA-F0-9]{40}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Pre-flight checks
print_status "Running pre-flight checks..."

# Check required commands
REQUIRED_COMMANDS=("forge" "node" "npm")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command_exists "$cmd"; then
        print_error "$cmd is not installed or not in PATH"
        exit 1
    fi
done

print_success "All required commands are available"

# Check for required files
REQUIRED_FILES=(
    "packages/contracts/foundry.toml"
    "packages/contracts/script/DeployABCFixed.s.sol"
    "packages/contracts/src/ABCStakingV2Fixed.sol"
    "packages/frontend/lib/contracts.ts"
    "scripts/update-addresses.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required file not found: $file"
        exit 1
    fi
done

print_success "All required files are present"

# Check for environment variables
if [[ -z "$PRIVATE_KEY" ]]; then
    print_error "PRIVATE_KEY environment variable is not set"
    print_status "Please set it with: export PRIVATE_KEY=your_private_key"
    exit 1
fi

print_success "Environment variables are set"

# Get ABC token address from user
echo ""
print_status "ABC Token Address Configuration"
echo "Please provide the ABC token contract address:"
read -p "ABC Token Address: " ABC_TOKEN_ADDRESS

if ! validate_address "$ABC_TOKEN_ADDRESS"; then
    print_error "Invalid ABC token address format"
    exit 1
fi

print_success "ABC token address validated: $ABC_TOKEN_ADDRESS"

# Confirm current network
echo ""
print_warning "This will deploy to Base Mainnet using the private key in PRIVATE_KEY"
print_warning "Make sure you have enough ETH for gas fees"
echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deployment cancelled"
    exit 0
fi

# Update ABC token address in contract
print_status "Updating ABC token address in smart contract..."

CONTRACT_FILE="packages/contracts/src/ABCStakingV2Fixed.sol"
BACKUP_FILE="${CONTRACT_FILE}.backup-$(date +%Y%m%d-%H%M%S)"

# Create backup
cp "$CONTRACT_FILE" "$BACKUP_FILE"
print_success "Backup created: $BACKUP_FILE"

# Update the token address
sed -i.tmp "s/IERC20(0x[a-fA-F0-9]\{40\})/IERC20($ABC_TOKEN_ADDRESS)/g" "$CONTRACT_FILE"
rm "${CONTRACT_FILE}.tmp" 2>/dev/null || true

print_success "ABC token address updated in smart contract"

# Deploy the smart contract
echo ""
print_status "Deploying ABC Staking V2 contract to Base Mainnet..."

cd packages/contracts

# Run the deployment
DEPLOY_OUTPUT=$(forge script script/DeployABCFixed.s.sol --rpc-url base --broadcast --verify 2>&1)
DEPLOY_RESULT=$?

echo "$DEPLOY_OUTPUT"

if [[ $DEPLOY_RESULT -ne 0 ]]; then
    print_error "Smart contract deployment failed"
    # Restore backup
    cp "$BACKUP_FILE" "$CONTRACT_FILE"
    print_status "Contract file restored from backup"
    exit 1
fi

# Extract the deployed contract address
ABC_STAKING_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o "ABC Staking V2 Fixed deployed at: 0x[a-fA-F0-9]\{40\}" | cut -d' ' -f7)

if [[ -z "$ABC_STAKING_ADDRESS" ]]; then
    print_error "Could not extract deployed contract address from output"
    print_error "Please check the deployment logs above"
    exit 1
fi

print_success "ABC Staking V2 deployed at: $ABC_STAKING_ADDRESS"

# Go back to root directory
cd ../..

# Update frontend addresses
echo ""
print_status "Updating frontend contract addresses..."

node scripts/update-addresses.js \
    --abc-token="$ABC_TOKEN_ADDRESS" \
    --abc-staking="$ABC_STAKING_ADDRESS"

if [[ $? -ne 0 ]]; then
    print_error "Failed to update frontend addresses"
    exit 1
fi

print_success "Frontend addresses updated successfully"

# Deployment summary
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo ""
echo "=== DEPLOYMENT SUMMARY ==="
echo "ABC Token Address:    $ABC_TOKEN_ADDRESS"
echo "ABC Staking Address:  $ABC_STAKING_ADDRESS"
echo "Timestamp:           $(date)"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Restart your frontend development server:"
echo "   cd packages/frontend && npm run dev"
echo ""
echo "2. Test the ABC staking functionality:"
echo "   - Connect wallet to Base mainnet"
echo "   - Approve ABC tokens for staking"
echo "   - Stake some ABC tokens"
echo "   - Send ETH to staking contract for rewards"
echo "   - Claim rewards to verify system works"
echo ""
echo "3. When ready, deploy frontend to production"
echo ""
echo "=== IMPORTANT NOTES ==="
echo "- Backup files created with timestamp for easy rollback"
echo "- Smart contract is verified on Base mainnet"
echo "- All frontend references now point to ABC contracts"
echo ""

# Optional: Start frontend automatically
read -p "Start frontend development server now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting frontend development server..."
    cd packages/frontend
    npm run dev
fi

print_success "ABC DAO deployment workflow completed successfully!"