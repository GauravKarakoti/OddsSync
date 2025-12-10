use crate::types::{MarketInfo, MarketCreationParams};
use linera_sdk::{
    linera_base_types::{Amount, ChainId, AccountOwner, CryptoHash, Timestamp},
    views::{MapView, RegisterView, RootView, ViewStorageContext},
};

#[derive(RootView)]
#[view(context = ViewStorageContext)] 
pub struct MarketFactory {
    // Chain ID -> Market Info
    pub markets: MapView<ChainId, MarketInfo>,

    // Market ID -> Chain ID
    pub market_chains: MapView<u64, ChainId>,

    // RegisterView<u64>
    pub next_market_id: RegisterView<u64>,
}

impl MarketFactory {
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
                 self.markets.insert(&chain_id, market).map_err(|e| e.to_string())?;
            }
         }
         Ok(())
     }
     
     pub async fn process_cross_chain_bet(&mut self, _from_chain: ChainId, _bet: crate::types::Bet) -> Result<(), String> {
         Ok(())
     }
}