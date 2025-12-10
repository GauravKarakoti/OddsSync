use crate::types::{Bet, BetParams};
use linera_sdk::{
    linera_base_types::{Amount, AccountOwner, Timestamp}, // Changed Owner to AccountOwner
    views::{MapView, ViewStorageContext},
};
use std::collections::HashMap;

pub struct BettingPool {
    // Market ID -> Total bets per option
    pub market_bets: MapView<u64, HashMap<u32, Amount>>,
    // User -> List of their bets
    pub user_bets: MapView<AccountOwner, Vec<Bet>>, // Changed key to AccountOwner
    // Bet ID -> Bet details
    pub all_bets: MapView<u64, Bet>,
    pub next_bet_id: u64,
}

impl BettingPool {
    pub async fn place_bet(
        &mut self,
        bettor: AccountOwner, // Changed to AccountOwner
        params: BetParams,
        timestamp: Timestamp,
    ) -> Result<u64, String> {
        let bet_id = self.next_bet_id;
        self.next_bet_id += 1;
        
        let bet = Bet {
            bettor,
            amount: params.amount,
            option_index: params.option_index,
            placed_at: timestamp,
            market_id: params.market_id,
        };
        
        // Update market bets
        let mut market_bets = self.market_bets
            .get(&params.market_id)
            .await
            .map_err(|e| e.to_string())?
            .unwrap_or_default();
        
        let option_total = market_bets
            .entry(params.option_index)
            .or_insert(Amount::ZERO);
            
        // Fix: try_add returns Result, so we use map_err instead of ok_or
        *option_total = option_total.try_add(params.amount).map_err(|_| "Amount overflow")?;
        
        self.market_bets.insert(&params.market_id, market_bets)
            .map_err(|e| e.to_string())?;
        
        // Update user bets
        let mut user_bets = self.user_bets
            .get(&bettor)
            .await
             .map_err(|e| e.to_string())?
            .unwrap_or_default();
        user_bets.push(bet.clone());
        self.user_bets.insert(&bettor, user_bets)
             .map_err(|e| e.to_string())?;
        
        // Store bet
        self.all_bets.insert(&bet_id, bet)
             .map_err(|e| e.to_string())?;
        
        Ok(bet_id)
    }
}