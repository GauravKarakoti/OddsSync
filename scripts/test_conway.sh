#!/bin/bash

# Test OddsSync on Conway Testnet

echo "🧪 Testing OddsSync deployment..."

# 1. Test GraphQL endpoint
echo "1. Testing GraphQL endpoint..."
curl -s -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"query { markets { market_id description total_bets } }"}' | jq .

# 2. Test market creation
echo "2. Testing market creation..."
curl -s -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"mutation { createMarket(input: { description: \"Test Market\", options: [\"Yes\", \"No\"], initial_liquidity: \"100\" }) { market_id chain_id } }"}' | jq .

# 3. Test real-time subscriptions
echo "3. Testing WebSocket connection..."
curl -s -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"subscription { liveOdds(marketId: 1) { option_index odds } }"}' | jq .

# 4. Check chain status
echo "4. Checking chain status..."
linera wallet show --chain-id "$CHAIN_ID"

echo "✅ Testing complete!"