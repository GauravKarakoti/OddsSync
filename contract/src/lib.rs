mod betting_pool;       // Keep private if not needed by service, or make pub

use shared::types::{OddssyncMessage, OddssyncResponse}; 
use linera_sdk::{
    Contract, ContractRuntime, 
    views::{RootView, ViewStorageContext}, // ViewStorageContext is usually in views
};
use linera_sdk::abi::ContractAbi;
use shared::market_factory::MarketFactory;
use linera_sdk::views::View;

pub struct OddssyncContract {
    state: MarketFactory<ViewStorageContext>,
    runtime: ContractRuntime<Self>,
}

// Define the ABI struct LOCALLY so we can implement the trait for it
pub struct OddssyncAbi;

impl ContractAbi for OddssyncAbi {
    type Operation = OddssyncMessage;
    type Response = OddssyncResponse;
}

linera_sdk::contract!(OddssyncContract);

impl linera_sdk::abi::WithContractAbi for OddssyncContract {
    type Abi = OddssyncAbi;
}

impl Contract for OddssyncContract {
    type Message = OddssyncMessage;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        // FIX: Use `load` instead of `pre_load`. 
        // `load` initializes the view structure from storage.
        let state = MarketFactory::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
            
        OddssyncContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Initialization logic here
    }

    async fn execute_operation(
        &mut self,
        operation: Self::Operation,
    ) -> Self::Response {
        match operation {
            OddssyncMessage::CreateMarket(params) => {
                let creator = self.runtime.authenticated_signer()
                    .expect("No authenticated signer");
                
                let timestamp = self.runtime.system_time();
                
                match self.state.create_market(timestamp, creator, params).await {
                    Ok((market_id, chain_id)) => OddssyncResponse::MarketCreated {
                        market_id,
                        chain_id,
                    },
                    Err(_) => OddssyncResponse::Empty,
                }
            }
            OddssyncMessage::PlaceBet(params) => {
                let _bettor = self.runtime.authenticated_signer()
                    .expect("No authenticated signer");
                
                let balance = self.runtime.chain_balance();
                if balance < params.amount {
                    panic!("Insufficient balance"); 
                }
                
                OddssyncResponse::BetPlaced { bet_id: 0 }
            }
            OddssyncMessage::ResolveMarket { market_id, winning_option } => {
                 let _resolver = self.runtime.authenticated_signer()
                    .expect("No authenticated signer");
                
                 let _ = self.state.market_resolved(market_id, winning_option).await;
                 OddssyncResponse::MarketResolved { market_id }
            }
            OddssyncMessage::CrossChainBet { .. } => {
                panic!("CrossChainBet is a message, not an operation");
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            OddssyncMessage::CrossChainBet { from_chain, bet } => {
                let _ = self.state.process_cross_chain_bet(from_chain, bet).await;
            }
            _ => {} 
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}