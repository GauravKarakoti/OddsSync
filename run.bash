#!/usr/bin/env bash

set -eu

# Check for jq
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed."
    exit 1
fi

# --- 1. Start Local Network ---
eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

# Configure wallet to use the local faucet (Port 8080)
export LINERA_FAUCET_URL=http://localhost:8080
linera wallet init --faucet="$LINERA_FAUCET_URL"

echo "Requesting chain..."
CHAIN_INFO=($(linera wallet request-chain --faucet="$LINERA_FAUCET_URL"))
CHAIN_ID=${CHAIN_INFO[0]}
echo "Using Chain ID: $CHAIN_ID"

# --- 2. Build OddsSync ---
echo "Building OddsSync..."
rustup target add wasm32-unknown-unknown

# Build Contract and Service SEPARATELY
cargo build --release --target wasm32-unknown-unknown -p contract
cargo build --release --target wasm32-unknown-unknown -p service

echo "Deploying OddsSync..."
# Capture the Application ID
APP_INFO=($(linera publish-and-create \
  target/wasm32-unknown-unknown/release/contract.wasm \
  target/wasm32-unknown-unknown/release/service.wasm \
  --json-argument '{"name":"Test Sports Event"}'))

APP_ID=${APP_INFO[0]}
echo "App Deployed with ID: $APP_ID"

# --- 4. Submit Operation (Step 2 Implementation) ---
echo "Submitting CreateMarket operation via Client..."

# Start service temporarily in background on port 8081
linera service --port 8081 &
SERVICE_PID=$!

# Wait for service to be ready
echo "Waiting for service to start..."
while ! curl -s http://localhost:8081/ > /dev/null; do
    sleep 1
done

# Define the CreateMarket operation payload (Matches OddssyncMessage::CreateMarket)
# Note: This is sent to the SYSTEM API (Chain Endpoint), not the App API.
OPERATION_JSON=$(cat <<EOF
{
  "CreateMarket": {
    "description": "Champions League Final",
    "options": ["Real Madrid", "Dortmund"],
    "initial_liquidity": "1000"
  }
}
EOF
)

# Escape quotes for the JSON string inside the GraphQL query
ESC_OP=$(echo "$OPERATION_JSON" | jq -c . | sed 's/"/\\"/g')

# Submit the operation block
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{ \"query\": \"mutation { executeOperation(applicationId: \\\"$APP_ID\\\", operation: $ESC_OP) }\" }" \
  "http://localhost:8081/chains/$CHAIN_ID" > /dev/null

echo -e "\nOperation submitted! Market created."

# Stop the background service
kill $SERVICE_PID
wait $SERVICE_PID 2>/dev/null || true

# --- 5. Run the Service (Foreground) ---
echo "Starting GraphQL Service on port 8081..."
echo "Access GraphiQL at http://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID"
linera service --port 8081