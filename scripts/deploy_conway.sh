#!/bin/bash

# OddsSync Deployment Script for Linera Testnet Conway
# SDK Version: 0.15.5

set -e

echo "🚀 Deploying OddsSync to Linera Testnet Conway..."

# Configuration
CONTRACT_WASM="target/wasm32-unknown-unknown/release/contract.wasm"
SERVICE_WASM="target/wasm32-unknown-unknown/release/service.wasm"
FAUCET_URL="https://faucet.testnet-conway.linera.net"
RPC_URL="https://rpc.testnet-conway.linera.net"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check if linera CLI is installed
    if ! command -v linera &> /dev/null; then
        echo -e "${RED}Error: linera CLI not found. Please install it first.${NC}"
        exit 1
    fi
    
    # Check version
    LINERA_VERSION=$(linera --version | cut -d' ' -f2)
    if [[ "$LINERA_VERSION" != "0.15.5" ]]; then
        echo -e "${YELLOW}Warning: Using linera version $LINERA_VERSION, expected 0.15.5${NC}"
    fi
    
    # Check if Rust is installed
    if ! command -v rustc &> /dev/null; then
        echo -e "${RED}Error: Rust not found. Please install Rust first.${NC}"
        exit 1
    fi
    
    # Check for wasm32 target
    if ! rustup target list | grep wasm32-unknown-unknown | grep installed &> /dev/null; then
        echo "Installing wasm32-unknown-unknown target..."
        rustup target add wasm32-unknown-unknown
    fi
    
    echo -e "${GREEN}✓ Prerequisites satisfied${NC}"
}

# Function to build contracts
build_contracts() {
    echo "🏗️  Building contracts..."
    
    # Optimize release build for Conway testnet
    export RUSTFLAGS='-C link-arg=-s'
    
    # Build with release profile optimized for size
    cargo build --release --target wasm32-unknown-unknown \
        --manifest-path=contract/Cargo.toml
    
    cargo build --release --target wasm32-unknown-unknown \
        --manifest-path=service/Cargo.toml
    
    # Optimize WASM size using wasm-opt
    if command -v wasm-opt &> /dev/null; then
        echo "Optimizing WASM binaries..."
        wasm-opt -Oz -o "${CONTRACT_WASM}.opt" "$CONTRACT_WASM"
        wasm-opt -Oz -o "${SERVICE_WASM}.opt" "$SERVICE_WASM"
        mv "${CONTRACT_WASM}.opt" "$CONTRACT_WASM"
        mv "${SERVICE_WASM}.opt" "$SERVICE_WASM"
        
        CONTRACT_SIZE=$(stat -f%z "$CONTRACT_WASM" 2>/dev/null || stat -c%s "$CONTRACT_WASM")
        SERVICE_SIZE=$(stat -f%z "$SERVICE_WASM" 2>/dev/null || stat -c%s "$SERVICE_WASM")
        echo -e "${GREEN}✓ WASM optimization complete${NC}"
        echo "  Contract size: $((CONTRACT_SIZE / 1024)) KB"
        echo "  Service size: $((SERVICE_SIZE / 1024)) KB"
    else
        echo -e "${YELLOW}Warning: wasm-opt not found, skipping optimization${NC}"
    fi
}

# Function to initialize wallet and get test tokens
setup_wallet() {
    echo "💰 Setting up wallet..."
    
    # Initialize wallet with Conway faucet
    if [ ! -f ~/.local/share/linera/wallet.json ]; then
        echo "Initializing new wallet..."
        linera wallet init --faucet "$FAUCET_URL"
    fi
    
    # Request a chain from the Conway testnet
    echo "Requesting testnet chain..."
    CHAIN_INFO=$(linera wallet request-chain --faucet "$FAUCET_URL" --json)
    CHAIN_ID=$(echo "$CHAIN_INFO" | jq -r '.chain_id')
    
    if [ -z "$CHAIN_ID" ] || [ "$CHAIN_ID" = "null" ]; then
        echo -e "${RED}Error: Failed to get chain ID${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Wallet setup complete${NC}"
    echo "  Chain ID: $CHAIN_ID"
    
    # Export for use in other functions
    export CHAIN_ID
}

# Function to publish application
publish_application() {
    echo "📦 Publishing OddsSync application..."
    
    if [ -z "$CHAIN_ID" ]; then
        echo -e "${RED}Error: CHAIN_ID not set${NC}"
        exit 1
    fi
    
    # Publish contract and service
    echo "Publishing to chain $CHAIN_ID..."
    
    APPLICATION_ID=$(linera publish-and-create \
        "$CONTRACT_WASM" \
        "$SERVICE_WASM" \
        --json-arguments '{"admin": "0x0000000000000000000000000000000000000000"}' \
        --chain-id "$CHAIN_ID" \
        --json | jq -r '.application_id')
    
    if [ -z "$APPLICATION_ID" ] || [ "$APPLICATION_ID" = "null" ]; then
        echo -e "${RED}Error: Failed to publish application${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Application published successfully${NC}"
    echo "  Application ID: $APPLICATION_ID"
    
    # Export for use in other functions
    export APPLICATION_ID
}

# Function to start GraphQL service
start_service() {
    echo "🌐 Starting GraphQL service..."
    
    if [ -z "$CHAIN_ID" ]; then
        echo -e "${RED}Error: CHAIN_ID not set${NC}"
        exit 1
    fi
    
    # Kill any existing service on port 8080
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    
    # Start service in background
    linera service --port 8080 --chain-id "$CHAIN_ID" > service.log 2>&1 &
    SERVICE_PID=$!
    
    # Wait for service to start
    echo "Waiting for service to start..."
    sleep 5
    
    # Check if service is running
    if curl -s http://localhost:8080 > /dev/null; then
        echo -e "${GREEN}✓ GraphQL service running on http://localhost:8080${NC}"
    else
        echo -e "${RED}Error: Failed to start GraphQL service${NC}"
        cat service.log
        exit 1
    fi
}

# Function to create test market
create_test_market() {
    echo "🎯 Creating test market..."
    
    if [ -z "$APPLICATION_ID" ] || [ -z "$CHAIN_ID" ]; then
        echo -e "${YELLOW}Warning: Cannot create test market (missing IDs)${NC}"
        return
    fi
    
    # Create a test market using GraphQL
    MARKET_CREATION_MUTATION=$(cat <<-EOF
        mutation {
            createMarket(input: {
                description: "Champions League: Next Goal Scorer",
                options: ["Messi", "Ronaldo", "Mbappe"],
                initial_liquidity: "1000"
            }) {
                market_id
                chain_id
                transaction_hash
            }
        }
EOF
    )
    
    RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$MARKET_CREATION_MUTATION\"}" \
        http://localhost:8080/graphql)
    
    if echo "$RESPONSE" | grep -q "market_id"; then
        MARKET_ID=$(echo "$RESPONSE" | jq -r '.data.createMarket.market_id')
        echo -e "${GREEN}✓ Test market created${NC}"
        echo "  Market ID: $MARKET_ID"
        echo "  View at: http://localhost:8080"
    else
        echo -e "${YELLOW}Warning: Test market creation may have failed${NC}"
        echo "Response: $RESPONSE"
    fi
}

# Function to display deployment summary
show_summary() {
    echo ""
    echo "========================================="
    echo "🚀 ODDSSYNC DEPLOYMENT COMPLETE"
    echo "========================================="
    echo ""
    echo "📊 Deployment Details:"
    echo "  Network:    Linera Testnet Conway"
    echo "  SDK:        0.15.5"
    echo "  Chain ID:   $CHAIN_ID"
    
    if [ ! -z "$APPLICATION_ID" ]; then
        echo "  App ID:     $APPLICATION_ID"
    fi
    
    echo ""
    echo "🔗 Endpoints:"
    echo "  GraphQL:    http://localhost:8080"
    echo "  RPC:        $RPC_URL"
    echo "  Faucet:     $FAUCET_URL"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Open http://localhost:8080 in your browser"
    echo "  2. Start the frontend: cd frontend && npm start"
    echo "  3. Connect your wallet using Dynamic integration"
    echo ""
    echo "💡 Test the deployment:"
    echo "  curl -X POST http://localhost:8080/graphql \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"query\":\"query { markets { market_id description } }\"}'"
    echo ""
    echo "⚠️  To stop the service: kill $SERVICE_PID"
    echo "========================================="
}

# Main deployment flow
main() {
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}      OddsSync Conway Deployment        ${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    
    # Execute steps
    check_prerequisites
    build_contracts
    setup_wallet
    publish_application
    start_service
    create_test_market
    show_summary
    
    # Keep service running
    echo -e "\n${YELLOW}GraphQL service is running in the background.${NC}"
    echo "Press Ctrl+C to stop."
    
    wait $SERVICE_PID
}

# Run main function
main "$@"