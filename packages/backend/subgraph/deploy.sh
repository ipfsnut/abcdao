#!/bin/bash

# ABC Staking Subgraph Deployment Script

set -e

echo "🚀 ABC Staking Subgraph Deployment"
echo "=================================="

# Check if Graph CLI is installed
if ! command -v graph &> /dev/null; then
    echo "❌ Graph CLI not found. Installing..."
    npm install -g @graphprotocol/graph-cli
fi

# Check if we're in the right directory
if [ ! -f "subgraph.yaml" ]; then
    echo "❌ subgraph.yaml not found. Make sure you're in the subgraph directory."
    exit 1
fi

# Get deploy key if not provided
if [ -z "$DEPLOY_KEY" ]; then
    echo "📝 Please enter your deploy key from The Graph Studio:"
    read -s DEPLOY_KEY
fi

# Get subgraph slug if not provided
if [ -z "$SUBGRAPH_SLUG" ]; then
    echo "📝 Please enter your subgraph slug (e.g., abc-staking):"
    read SUBGRAPH_SLUG
fi

echo ""
echo "1️⃣ Authenticating with The Graph Studio..."
graph auth --studio $DEPLOY_KEY

echo "2️⃣ Building subgraph..."
npm run build

echo "3️⃣ Deploying to Studio..."
graph deploy --studio $SUBGRAPH_SLUG

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Next steps:"
echo "1. Check your subgraph in Studio: https://thegraph.com/studio/"
echo "2. Wait for sync to complete"
echo "3. Test queries in the Playground"
echo "4. Update backend .env with your subgraph URL"
echo ""
echo "🔗 Your subgraph URL will be:"
echo "https://api.studio.thegraph.com/query/[YOUR_ID]/$SUBGRAPH_SLUG/[VERSION]"