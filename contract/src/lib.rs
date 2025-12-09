mod market_factory;
mod betting_pool;
mod types;

use crate::types::{OddsyncAbi, OddsyncMessage, OddsyncResponse};
use async_trait::async_trait;
use linera_sdk::{
    base::{Amount, WithContractAbi},
    Contract, ViewState,
};
use market_factory::MarketFactory;
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum OddsyncError {
    #[error("Invalid market parameters")]
    InvalidParameters,
    #[error("Market not found")]
    MarketNotFound,
    #[error("Insufficient funds")]
    InsufficientFunds,
    #[error("Betting not allowed")]
    BettingNotAllowed,
}

pub struct OddsyncContract {
    state: Arc<MarketFactory>,
}

impl OddsyncContract {
    pub fn new(state: MarketFactory) -> Self {
        Self {
            state: Arc::new(state),
        }
    }
}

#[async_trait]
impl Contract for OddsyncContract {
    type Abi = OddsyncAbi;
    type State = MarketFactory;
    type Message = OddsyncMessage;
    type Response = OddsyncResponse;
    type InstantiationArgument = ();

    async fn instantiate(
        &mut self,
        _argument: Self::InstantiationArgument,
    ) -> Result<(), String> {
        Ok(())
    }

    async fn execute_operation(
        &mut self,
        operation: Self::Message,
    ) -> Result<Self::Response, String> {
        match operation {
            OddsyncMessage::CreateMarket(params) => {
                let creator = self.state.context().authenticated_signer()
                    .ok_or("No authenticated signer")?;
                
                let (market_id, chain_id) = self.state
                    .create_market(creator, params)
                    .await?;
                
                Ok(OddsyncResponse::MarketCreated {
                    market_id,
                    chain_id,
                })
            }
            
            OddsyncMessage::PlaceBet(params) => {
                let bettor = self.state.context().authenticated_signer()
                    .ok_or("No authenticated signer")?;
                
                // Check if user has sufficient balance
                let balance = self.state.context().balance().await;
                if balance < params.amount {
                    return Err("Insufficient balance".to_string());
                }
                
                // Place bet
                let bet_id = self.state.context()
                    .application_call()
                    .await?
                    .place_bet(bettor, params)
                    .await?;
                
                Ok(OddsyncResponse::BetPlaced { bet_id })
            }
            
            OddsyncMessage::ResolveMarket { market_id, winning_option } => {
                // Only market creator can resolve
                let resolver = self.state.context().authenticated_signer()
                    .ok_or("No authenticated signer")?;
                
                if let Some(market) = self.state.get_market(market_id).await {
                    if market.creator != resolver {
                        return Err("Only market creator can resolve".to_string());
                    }
                    
                    // Mark market as resolved
                    self.state.market_resolved(market_id, winning_option).await?;
                    
                    Ok(OddsyncResponse::MarketResolved { market_id })
                } else {
                    Err("Market not found".to_string())
                }
            }
            
            OddsyncMessage::CrossChainBet { from_chain, bet } => {
                // Handle cross-chain bet
                self.state.process_cross_chain_bet(from_chain, bet).await?;
                Ok(OddsyncResponse::BetPlaced { bet_id: 0 }) // Placeholder
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) -> Result<(), String> {
        // Handle incoming messages (cross-chain)
        Ok(())
    }

    async fn store(self) -> Self::State {
        Arc::try_unwrap(self.state).unwrap_or_else(|_| panic!("Failed to store state"))
    }
}