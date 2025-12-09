# OddsSync: Real-Time Prediction Markets
OddsSync is a decentralized sports betting platform built on Linera Testnet Conway. It demonstrates how microchains enable prediction markets with instant, congestion-free trading and resolution.

## ⚙️ Prerequisites
- **Linera CLI:** Installed and configured for Testnet Conway.
- **Rust Toolchain:** `rustup` and the `wasm32-unknown-unknown` target.
- **A Wallet:** MetaMask, Phantom, or any wallet supported by Dynamic integration on Conway.

## 🚀 Quick Start
Follow these steps to deploy and interact with OddsSync on Linera's Testnet Conway.

### 1. Initialize Your Developer Environment
First, claim a microchain and get test tokens from the Conway faucet:
```bash
# Initialize wallet and request a chain from the Conway testnet faucet
linera wallet init --faucet https://faucet.testnet-conway.linera.net
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
```

### 2. Build the Application
Compile the OddsSync smart contracts to WebAssembly:
```bash
# Navigate to the project directory
cd oddsync

# Build the contract and service
cargo build --release --target wasm32-unknown-unknown
```
The compiled `.wasm` files will be in `../target/wasm32-unknown-unknown/release/`.

### 3. Publish to Your Chain
Deploy the application to your microchain on the testnet:
```bash
# Publish the application bytecode and create an instance
linera publish-and-create \
  ../target/wasm32-unknown-unknown/release/oddsync_{contract,service}.wasm \
  --json-arguments '{"name":"Test Sports Event"}' \
  --chain-id <YOUR_CHAIN_ID>
```
Replace `<YOUR_CHAIN_ID>` with the ID shown by `linera wallet show`.

### 4. Run the GraphQL Service
Start a local service to query your application and interact with its API:
```bash
# Expose a GraphQL endpoint on port 8080
linera service --port 8080
```
Open `http://localhost:8080` in your browser to access the GraphiQL interface.

### 5. Interact with the Application
In the GraphiQL interface, you can:
  - **Query active markets:** `query { markets { id description } }`
  - **Create a new market:** Use the `createMarket` mutation.
  - **Place a bet:** Use the `placeBet` mutation (this will trigger a cross-chain message to the market's microchain).

## 🔗 Testing Cross-Chain Interaction
1. Create a market. This action spawns a new **permissioned microchain** dedicated to that market.
2. From your GraphiQL interface (connected to your user/wallet chain), send a `placeBet` message to the new market's chain ID.
3. Use `linera sync` and query the market's state to see your bet reflected instantly.

## 🧠 Integrating the AI Market Maker (Optional)
To run the AI agent component:
  1. Get an API key from Atoma Network.
  2. Configure the agent service with your Linera wallet and the Atoma SDK.
  3. Start the service. It will monitor designated markets and automatically adjust liquidity pools.

## 📁 Project Structure
```text
oddsync/
├── src/
│   ├── contract.rs   # Core logic: market creation, betting, resolution.
│   ├── service.rs    # GraphQL queries and mutations.
│   └── lib.rs
├── Cargo.toml
└── README.md
```

## 🆘 Need Help?
- Join the **Linera Discord** and use the `#buildathon` or `#developer-support` channels.
- Check the official **Linera Developer Docs**.
- Review the **Testnet Conway announcement** for specific features and faucet details.
