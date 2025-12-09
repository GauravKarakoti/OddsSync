use crate::types::{Bet, BetParams};
use linera_sdk::{
    base::{Amount, Owner, Timestamp},
    views::{MapView, View},
};
use std::collections::HashMap;

pub struct BettingPool {
    // Market ID -> Total bets per option
    pub market_bets: MapView<u64, HashMap<u32, Amount>>,
    // User -> List of their bets
    pub user_bets: MapView<Owner, Vec<Bet>>,
    // Bet ID -> Bet details
    pub all_bets: MapView<u64, Bet>,
    pub next_bet_id: u64,
}

impl BettingPool {
    pub async fn place_bet(
        &mut self,
        bettor: Owner,
        params: BetParams,
    ) -> Result<u64, String> {
        let bet_id = self.next_bet_id;
        self.next_bet_id += 1;
        
        let bet = Bet {
            bettor,
            amount: params.amount,
            option_index: params.option_index,
            placed_at: self.context().system_time(),
            market_id: params.market_id,
        };
        
        // Update market bets
        let mut market_bets = self.market_bets
            .get(&params.market_id)
            .await
            .unwrap_or_default();
        
        let option_total = market_bets
            .entry(params.option_index)
            .or_insert(Amount::ZERO);
        *option_total = option_total
            .checked_add(params.amount)
            .ok_or("Amount overflow")?;
        
        self.market_bets.insert(&params.market_id, market_bets)?;
        
        // Update user bets
        let mut user_bets = self.user_bets
            .get(&bettor)
            .await
            .unwrap_or_default();
        user_bets.push(bet.clone());
        self.user_bets.insert(&bettor, user_bets)?;
        
        // Store bet
        self.all_bets.insert(&bet_id, bet)?;
        
        Ok(bet_id)
    }
    
    pub async fn calculate_odds(&self, market_id: u64, option_index: u32) -> Option<f64> {
        if let Some(market_bets) = self.market_bets.get(&market_id).await {
            let total: Amount = market_bets.values().sum();
            let option_bets = market_bets.get(&option_index).copied().unwrap_or(Amount::ZERO);
            
            if total > Amount::ZERO && option_bets > Amount::ZERO {
                // Simple AMM-style odds calculation
                // For simplicity: odds = total / option_bets
                let total_u64: u64 = total.try_into().ok()?;
                let option_u64: u64 = option_bets.try_into().ok()?;
                return Some(total_u64 as f64 / option_u64 as f64);
            }
        }
        None
    }
}