use crate::types::{MarketInfo, MarketCreationParams};
use linera_sdk::{
    linera_base_types::{Amount, ChainId, Owner},
    views::{MapView, RootView, View, ViewStorageContext},
    ContractRuntime,
};
use crate::OddsyncContract;

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = "ViewStorageContext")]
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
        runtime: &mut ContractRuntime<OddsyncContract>,
        creator: Owner,
        params: MarketCreationParams,
    ) -> Result<(u64, ChainId), String> {
        // Generate new market ID
        let market_id = self.next_market_id;
        self.next_market_id += 1;
        
        // In a real scenario, you might send a message to create a chain here.
        // For this fix, we use the simulated ID generation you provided.
        // To make it unique-ish, we mix the current chain ID.
        // Note: exact arithmetic for ChainId generation isn't standard, 
        // so we just mock it for compilation.
        let new_chain_id = ChainId::from(runtime.chain_id().0.wrapping_add(market_id.into())); 
        
        let market_info = MarketInfo {
            market_id,
            chain_id: new_chain_id,
            description: params.description.clone(),
            creator,
            options: params.options,
            liquidity: params.initial_liquidity,
            total_bets: Amount::ZERO,
            created_at: runtime.system_time(), // Use runtime for time
            resolved_at: None,
            winning_option: None,
            is_active: true,
        };
        
        // Store market info
        self.markets.insert(&new_chain_id, market_info)
            .map_err(|e| e.to_string())?;
        self.market_chains.insert(&market_id, new_chain_id)
             .map_err(|e| e.to_string())?;
        
        Ok((market_id, new_chain_id))
    }
    
    pub async fn get_market(&self, market_id: u64) -> Option<MarketInfo> {
        if let Ok(Some(chain_id)) = self.market_chains.get(&market_id).await {
            self.markets.get(&chain_id).await.unwrap_or(None)
        } else {
            None
        }
    }
    
     pub async fn market_resolved(&mut self, market_id: u64, winning_option: u32) -> Result<(), String> {
         if let Ok(Some(chain_id)) = self.market_chains.get(&market_id).await {
            if let Ok(Some(mut market)) = self.markets.get(&chain_id).await {
                 market.is_active = false;
                 market.winning_option = Some(winning_option);
                 // resolved_at would ideally be set here using runtime time if passed
                 self.markets.insert(&chain_id, market).map_err(|e| e.to_string())?;
            }
         }
         Ok(())
     }
     
     // Placeholder for cross chain logic
     pub async fn process_cross_chain_bet(&mut self, _from_chain: ChainId, _bet: crate::types::Bet) -> Result<(), String> {
         Ok(())
     }
}