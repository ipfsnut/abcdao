#!/bin/bash

# Manual verification of ABCRewardsV2 contract
CONTRACT_ADDRESS="0x03CD0F799B4C04DbC22bFAAd35A3F36751F3446c"
CONSTRUCTOR_ARGS="0000000000000000000000005c0872b790bb73e2b3a9778db6e7704095624b07"

echo "🔍 Verifying ABCRewardsV2 contract..."
echo "Contract: $CONTRACT_ADDRESS"
echo "Constructor Args: $CONSTRUCTOR_ARGS"
echo ""

# Try with flat file approach
echo "📋 Creating flattened source..."
forge flatten src/ABCRewardsV2.sol > ABCRewardsV2_flattened.sol

echo "✅ Flattened source created: ABCRewardsV2_flattened.sol"
echo ""
echo "🌐 Manual verification steps:"
echo "1. Go to: https://basescan.org/address/$CONTRACT_ADDRESS#code"
echo "2. Click 'Verify and Publish'"
echo "3. Select 'Solidity (Single file)'"
echo "4. Compiler version: 0.8.20"
echo "5. License: MIT"
echo "6. Upload: ABCRewardsV2_flattened.sol"
echo "7. Constructor Args: $CONSTRUCTOR_ARGS"
echo ""
echo "📂 Flattened file ready for manual upload!"