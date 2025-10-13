#!/bin/bash

# ABC DAO Configurable Deployment Script
# Reads from config.json and deploys with appropriate token addresses

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Install with: brew install jq"
    exit 1
fi

# Read configuration
CONFIG_FILE="packages/contracts/config.json"
if [[ ! -f "$CONFIG_FILE" ]]; then
    print_error "Config file not found: $CONFIG_FILE"
    exit 1
fi

# Get deployment mode
DEPLOYMENT_MODE=$(jq -r '.deployment.mode' "$CONFIG_FILE")
NETWORK="base"

print_status "Deployment Configuration"
echo "Mode: $DEPLOYMENT_MODE"
echo "Network: $NETWORK"

# Get token addresses based on mode
if [[ "$DEPLOYMENT_MODE" == "testing" ]]; then
    ABC_TOKEN_ADDRESS=$(jq -r ".networks.$NETWORK.tokens.ABC_TOKEN.address" "$CONFIG_FILE")
    TOKEN_SYMBOL=$(jq -r ".networks.$NETWORK.tokens.ABC_TOKEN.symbol" "$CONFIG_FILE")
    TOKEN_NAME=$(jq -r ".networks.$NETWORK.tokens.ABC_TOKEN.name" "$CONFIG_FILE")
    print_warning "TESTING MODE: Using $TOKEN_SYMBOL ($TOKEN_NAME) as ABC token"
elif [[ "$DEPLOYMENT_MODE" == "production" ]]; then
    ABC_TOKEN_ADDRESS=$(jq -r '.production.ABC_TOKEN.address' "$CONFIG_FILE")
    TOKEN_SYMBOL=$(jq -r '.production.ABC_TOKEN.symbol' "$CONFIG_FILE")
    TOKEN_NAME=$(jq -r '.production.ABC_TOKEN.name' "$CONFIG_FILE")
    
    if [[ "$ABC_TOKEN_ADDRESS" == "TO_BE_UPDATED" ]]; then
        print_error "Production ABC token address not set in config.json"
        print_status "Please update .production.ABC_TOKEN.address with the real ABC token address"
        exit 1
    fi
    print_status "PRODUCTION MODE: Using real $TOKEN_SYMBOL token"
else
    print_error "Invalid deployment mode: $DEPLOYMENT_MODE"
    print_status "Must be 'testing' or 'production'"
    exit 1
fi

WETH_ADDRESS=$(jq -r ".networks.$NETWORK.tokens.WETH.address" "$CONFIG_FILE")

print_status "Token Configuration"
echo "ABC Token: $ABC_TOKEN_ADDRESS ($TOKEN_SYMBOL)"
echo "WETH Token: $WETH_ADDRESS"
echo ""

# Validate addresses
if [[ ! $ABC_TOKEN_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_error "Invalid ABC token address: $ABC_TOKEN_ADDRESS"
    exit 1
fi

if [[ ! $WETH_ADDRESS =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    print_error "Invalid WETH address: $WETH_ADDRESS"
    exit 1
fi

# Check environment
if [[ -z "$PRIVATE_KEY" ]]; then
    print_error "PRIVATE_KEY environment variable is not set"
    exit 1
fi

# Confirm deployment
print_warning "This will deploy to Base Mainnet with the above configuration"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deployment cancelled"
    exit 0
fi

# Set environment variables for the deployment script
export ABC_TOKEN_ADDRESS
export WETH_ADDRESS

print_status "Deploying ABC Staking V2 Fixed with configured addresses..."

cd packages/contracts

# Deploy the contract
DEPLOY_OUTPUT=$(forge script script/DeployABCConfigurable.s.sol --rpc-url base --broadcast --verify 2>&1)
DEPLOY_RESULT=$?

echo "$DEPLOY_OUTPUT"

if [[ $DEPLOY_RESULT -ne 0 ]]; then
    print_error "Deployment failed"
    exit 1
fi

# Extract deployed address
ABC_STAKING_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o "ABC Staking V2 Fixed deployed at: 0x[a-fA-F0-9]\{40\}" | cut -d' ' -f7)

if [[ -z "$ABC_STAKING_ADDRESS" ]]; then
    print_error "Could not extract deployed contract address"
    exit 1
fi

print_success "Contract deployed at: $ABC_STAKING_ADDRESS"

# Go back to root
cd ../..

# Update frontend configuration
print_status "Updating frontend configuration..."

node scripts/update-addresses.js \
    --abc-token="$ABC_TOKEN_ADDRESS" \
    --abc-staking="$ABC_STAKING_ADDRESS"

# Update config with deployed address
jq ".networks.$NETWORK.contracts.ABC_STAKING = \"$ABC_STAKING_ADDRESS\"" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

print_success "Deployment completed successfully!"
echo ""
echo "=== DEPLOYMENT SUMMARY ==="
echo "Mode: $DEPLOYMENT_MODE"
echo "ABC Token ($TOKEN_SYMBOL): $ABC_TOKEN_ADDRESS"
echo "WETH Token: $WETH_ADDRESS"  
echo "ABC Staking: $ABC_STAKING_ADDRESS"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Test staking with $TOKEN_SYMBOL tokens"
echo "2. Test ETH and WETH reward distribution"
echo "3. When ready for production, update config.json:"
echo "   - Set .deployment.mode to 'production'"
echo "   - Set .production.ABC_TOKEN.address to real ABC address"
echo "   - Redeploy with this script"