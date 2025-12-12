use crate::types::{MarketInfo, MarketCreationParams};
use linera_views::views::RootView;
use linera_views::map_view::MapView;
use linera_views::register_view::RegisterView;
use linera_views::context::Context;
use linera_base::{
    identifiers::{AccountOwner, ChainId},
    crypto::CryptoHash,
    data_types::{Amount, Timestamp},
};

// Make the struct generic over C (the Context)
#[derive(RootView)]
pub struct MarketFactory<C> {
    pub markets: MapView<C, ChainId, MarketInfo>,
    pub market_chains: MapView<C, u64, ChainId>,
    pub next_market_id: RegisterView<C, u64>,
}

impl<C> MarketFactory<C>
where
    C: Context + Send + Sync + Clone + 'static,
    linera_views::ViewError: From<C::Error>,
{
    // GATE THIS FUNCTION
    #[cfg(feature = "contract")] 
    pub async fn create_market(
        &mut self,
        timestamp: Timestamp,
        creator: AccountOwner,
        params: MarketCreationParams,
    ) -> Result<(u64, ChainId), String> {
        let market_id = *self.next_market_id.get();
        self.next_market_id.set(market_id + 1);
        
        let mut bytes = [0u8; 32];
        let id_bytes = market_id.to_le_bytes();
        bytes[0..8].copy_from_slice(&id_bytes);
        
        let new_chain_id = ChainId(CryptoHash::from(bytes));
        
        let market_info = MarketInfo {
            market_id,
            chain_id: new_chain_id,
            description: params.description.clone(),
            creator,
            options: params.options,
            liquidity: params.initial_liquidity,
            total_bets: Amount::ZERO,
            created_at: timestamp,
            resolved_at: None,
            winning_option: None,
            is_active: true,
        };
        
        self.markets.insert(&new_chain_id, market_info)
            .map_err(|e| e.to_string())?;
        self.market_chains.insert(&market_id, new_chain_id)
             .map_err(|e| e.to_string())?;
        
        Ok((market_id, new_chain_id))
    }
    
    // Read-only methods are safe for both
    pub async fn get_market(&self, market_id: u64) -> Option<MarketInfo> {
        if let Ok(Some(chain_id)) = self.market_chains.get(&market_id).await {
            self.markets.get(&chain_id).await.unwrap_or(None)
        } else {
            None
        }
    }
    
    // GATE THIS FUNCTION
    #[cfg(feature = "contract")]
    pub async fn market_resolved(&mut self, market_id: u64, winning_option: u32) -> Result<(), String> {
         if let Ok(Some(chain_id)) = self.market_chains.get(&market_id).await {
            if let Ok(Some(mut market)) = self.markets.get(&chain_id).await {
                 market.is_active = false;
                 market.winning_option = Some(winning_option);
                 self.markets.insert(&chain_id, market).map_err(|e| e.to_string())?;
            }
         }
         Ok(())
    }
     
    // GATE THIS FUNCTION
    #[cfg(feature = "contract")]
    pub async fn process_cross_chain_bet(&mut self, _from_chain: ChainId, _bet: crate::types::Bet) -> Result<(), String> {
         Ok(())
    }
}