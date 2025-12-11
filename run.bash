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
rustup target add wasm32-unknown-unknown

# Build Contract and Service SEPARATELY to prevent feature unification
cargo build --release --target wasm32-unknown-unknown -p contract
cargo build --release --target wasm32-unknown-unknown -p service

# --- 3. Publish and Create Application ---
echo "Deploying OddsSync..."
linera publish-and-create \
  target/wasm32-unknown-unknown/release/contract.wasm \
  target/wasm32-unknown-unknown/release/service.wasm \
  --json-argument '{"name":"Test Sports Event"}'

# --- 4. Run the Service ---
echo "Starting GraphQL Service on port 8081..."
linera service --port 8081