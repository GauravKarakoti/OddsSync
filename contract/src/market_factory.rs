use crate::types::{MarketInfo, MarketCreationParams};
use linera_sdk::{
    base::{Amount, ApplicationId, ChainId, Owner, WithContractAbi},
    views::{View, MapView, RootView},
    Contract, ViewState,
};
use std::sync::Arc;

#[derive(RootView, ViewState)]
#[view(context = "linera_sdk::views::ViewContext")]
pub struct MarketFactory {
    // Chain ID -> Market Info
    pub markets: MapView<ChainId, MarketInfo>,
    // Market ID -> Chain ID
    pub market_chains: MapView<u64, ChainId>,
    pub next_market_id: u64,
}

impl MarketFactory {
    pub async fn create_market(
        &mut self,
        creator: Owner,
        params: MarketCreationParams,
    ) -> Result<(u64, ChainId), String> {
        // Generate new market ID
        let market_id = self.next_market_id;
        self.next_market_id += 1;
        
        // Create a new microchain for this market
        // This is a system operation in Conway testnet
        let new_chain_id = self.spawn_microchain(creator).await?;
        
        let market_info = MarketInfo {
            market_id,
            chain_id: new_chain_id,
            description: params.description.clone(),
            creator,
            options: params.options,
            liquidity: params.initial_liquidity,
            total_bets: Amount::ZERO,
            created_at: self.context().system_time(),
            resolved_at: None,
            winning_option: None,
            is_active: true,
        };
        
        // Store market info
        self.markets.insert(&new_chain_id, market_info)?;
        self.market_chains.insert(&market_id, new_chain_id)?;
        
        Ok((market_id, new_chain_id))
    }
    
    async fn spawn_microchain(&self, owner: Owner) -> Result<ChainId, String> {
        // In Conway testnet, we use create_application_with_parameters
        // to spawn new permissioned microchains
        let operation = linera_sdk::base::RawOutgoingMessage::System(
            linera_sdk::base::SystemOperation::RequestCommittee {
                validators: vec![owner],
            },
        );
        
        // Send system message to create new chain
        self.context()
            .send_message(Box::new(operation))
            .await
            .map_err(|e| format!("Failed to spawn microchain: {:?}", e))?;
        
        // In practice, we'd get the chain ID from the system response
        // For now, we simulate by generating a deterministic ID
        Ok(ChainId::from(0u128.wrapping_add(self.next_market_id as u128)))
    }
    
    pub async fn get_market(&self, market_id: u64) -> Option<MarketInfo> {
        if let Some(chain_id) = self.market_chains.get(&market_id) {
            self.markets.get(&chain_id).await
        } else {
            None
        }
    }
}