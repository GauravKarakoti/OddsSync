#!/usr/bin/env bash

set -eu

# --- 1. Start Local Network ---
eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

# Configure wallet to use the local faucet (Port 8080)
export LINERA_FAUCET_URL=http://localhost:8080
linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# --- 2. Build OddsSync ---
echo "Building OddsSync..."
# Ensure the target is installed (template might have it, but good to be safe)
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown

# --- 3. Publish and Create Application ---
echo "Deploying OddsSync..."
# Note: Using contract.wasm and service.wasm based on Cargo.toml package names
linera publish-and-create \
  target/wasm32-unknown-unknown/release/contract.wasm \
  target/wasm32-unknown-unknown/release/service.wasm \
  --json-argument '{"name":"Test Sports Event"}'

# --- 4. Run the Service ---
echo "Starting GraphQL Service on port 8081..."
# We use port 8081 to avoid conflict with the Faucet on 8080
linera service --port 8081