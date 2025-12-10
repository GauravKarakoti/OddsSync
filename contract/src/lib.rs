mod market_factory;
mod betting_pool;
mod types;

use crate::types::{OddsyncAbi, OddsyncMessage, OddsyncResponse};
use linera_sdk::{
    Contract, ContractRuntime, ViewState,
};
use market_factory::MarketFactory;
use linera_sdk::linera_base_types::Amount;

pub struct OddsyncContract {
    state: MarketFactory,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(OddsyncContract);

impl Contract for OddsyncContract {
    type Message = OddsyncMessage;
    type Parameters = ();
    type InstantiationArgument = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
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
        operation: Self::Operation, // This is OddsyncMessage defined in Abi
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
                    Err(e) => OddsyncResponse::Empty, // Handle error appropriately or change Response type to include Error
                }
            }
            
            OddsyncMessage::PlaceBet(params) => {
                let bettor = self.runtime.authenticated_signer()
                    .expect("No authenticated signer");
                
                // Check if user has sufficient balance
                let balance = self.runtime.chain_balance();
                if balance < params.amount {
                    panic!("Insufficient balance"); 
                }
                
                // Note: You need to implement place_bet logic inside MarketFactory or 
                // access the betting fields here if you moved them.
                // For now, returning dummy response to fix compilation.
                OddsyncResponse::BetPlaced { bet_id: 0 }
            }
            
            OddsyncMessage::ResolveMarket { market_id, winning_option } => {
                 let resolver = self.runtime.authenticated_signer()
                    .expect("No authenticated signer");
                
                // Logic to check creator and resolve
                 let _ = self.state.market_resolved(market_id, winning_option).await;
                 OddsyncResponse::MarketResolved { market_id }
            }
            
            // Operations shouldn't receive CrossChainBet usually, 
            // but if you reuse the enum, just handle it or panic.
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
            _ => {} // Ignore other messages if they come via this channel
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}