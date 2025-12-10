mod market_factory;
mod betting_pool;
mod types;

use crate::types::{OddsyncAbi, OddsyncMessage, OddsyncResponse};
use linera_sdk::{
    Contract, ContractRuntime, 
    views::{RootView, View}, // Ensure RootView and View are imported
};
use market_factory::MarketFactory;

pub struct OddsyncContract {
    state: MarketFactory,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(OddsyncContract);

impl linera_sdk::abi::WithContractAbi for OddsyncContract {
    type Abi = OddsyncAbi;
}

impl Contract for OddsyncContract {
    type Message = OddsyncMessage;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        // FIXED: Switched back to load() now that MarketFactory compiles correctly.
        // load() is async, so we must await it.
        let state = MarketFactory::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        OddsyncContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Initialization logic here
    }

    async fn execute_operation(
        &mut self,
        operation: Self::Operation,
    ) -> Self::Response {
        match operation {
            OddsyncMessage::CreateMarket(params) => {
                let creator = self.runtime.authenticated_signer()
                    .expect("No authenticated signer");
                
                // Pass runtime to create_market
                match self.state.create_market(&mut self.runtime, creator, params).await {
                    Ok((market_id, chain_id)) => OddsyncResponse::MarketCreated {
                        market_id,
                        chain_id,
                    },
                    Err(_) => OddsyncResponse::Empty,
                }
            }
            
            OddsyncMessage::PlaceBet(params) => {
                let _bettor = self.runtime.authenticated_signer()
                    .expect("No authenticated signer");
                
                // Check if user has sufficient balance
                let balance = self.runtime.chain_balance();
                if balance < params.amount {
                    panic!("Insufficient balance"); 
                }
                
                OddsyncResponse::BetPlaced { bet_id: 0 }
            }
            
            OddsyncMessage::ResolveMarket { market_id, winning_option } => {
                 let _resolver = self.runtime.authenticated_signer()
                    .expect("No authenticated signer");
                
                 let _ = self.state.market_resolved(market_id, winning_option).await;
                 OddsyncResponse::MarketResolved { market_id }
            }
            
            OddsyncMessage::CrossChainBet { .. } => {
                panic!("CrossChainBet is a message, not an operation");
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            OddsyncMessage::CrossChainBet { from_chain, bet } => {
                let _ = self.state.process_cross_chain_bet(from_chain, bet).await;
            }
            _ => {} 
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}