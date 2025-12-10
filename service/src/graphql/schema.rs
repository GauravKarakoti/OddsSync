use async_graphql::*;
use chrono::{DateTime, Utc};
use linera_sdk::base::Owner;
use linera_sdk::linera_base_types::{Amount, ChainId};

#[derive(SimpleObject, Clone, Debug)]
pub struct Market {
    pub market_id: u64,
    pub chain_id: String,
    pub description: String,
    pub creator: String,
    pub options: Vec<String>,
    pub liquidity: String,
    pub total_bets: String,
    pub created_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub winning_option: Option<u32>,
    pub is_active: bool,
    pub odds: Vec<Odds>,
}

#[derive(SimpleObject, Clone, Debug)]
pub struct Odds {
    pub option_index: u32,
    pub option_name: String,
    pub odds: f64,
    pub total_bet: String,
}

#[derive(SimpleObject, Clone, Debug)]
pub struct Bet {
    pub bet_id: u64,
    pub bettor: String,
    pub amount: String,
    pub option_index: u32,
    pub placed_at: DateTime<Utc>,
    pub market_id: u64,
    pub potential_payout: String,
}

#[derive(InputObject, Debug)]
pub struct CreateMarketInput {
    pub description: String,
    pub options: Vec<String>,
    pub initial_liquidity: String,
}

#[derive(InputObject, Debug)]
pub struct PlaceBetInput {
    pub market_id: u64,
    pub option_index: u32,
    pub amount: String,
}

#[derive(SimpleObject, Debug)]
pub struct MarketCreationResult {
    pub market_id: u64,
    pub chain_id: String,
    pub transaction_hash: String,
}

#[derive(SimpleObject, Debug)]
pub struct BetPlacedResult {
    pub bet_id: u64,
    pub transaction_hash: String,
    pub new_odds: Vec<Odds>,
}

#[derive(SimpleObject, Debug)]
pub struct MarketResolution {
    pub market_id: u64,
    pub winning_option: u32,
    pub total_payout: String,
    pub resolved_at: DateTime<Utc>,
}