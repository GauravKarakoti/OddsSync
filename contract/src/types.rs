use linera_sdk::base::{
    Amount, ApplicationId, ChainId, Owner, Timestamp, ContractAbi, ServiceAbi
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MarketInfo {
    pub market_id: u64,
    pub chain_id: ChainId,
    pub description: String,
    pub creator: Owner,
    pub options: Vec<String>,
    pub liquidity: Amount,
    pub total_bets: Amount,
    pub created_at: Timestamp,
    pub resolved_at: Option<Timestamp>,
    pub winning_option: Option<u32>,
    pub is_active: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Bet {
    pub bettor: Owner,
    pub amount: Amount,
    pub option_index: u32,
    pub placed_at: Timestamp,
    pub market_id: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MarketCreationParams {
    pub description: String,
    pub options: Vec<String>,
    pub initial_liquidity: Amount,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct BetParams {
    pub market_id: u64,
    pub option_index: u32,
    pub amount: Amount,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum OddsyncMessage {
    CreateMarket(MarketCreationParams),
    PlaceBet(BetParams),
    ResolveMarket { market_id: u64, winning_option: u32 },
    CrossChainBet { from_chain: ChainId, bet: Bet },
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum OddsyncResponse {
    MarketCreated { market_id: u64, chain_id: ChainId },
    BetPlaced { bet_id: u64 },
    MarketResolved { market_id: u64 },
    Error(String),
}

#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Debug, Serialize, Deserialize)]
pub struct OddsyncAbi;

impl ContractAbi for OddsyncAbi {
    type Parameters = ();
    type InitializationArgument = ();
    type Operation = OddsyncMessage;
    type Response = OddsyncResponse;
}

impl ServiceAbi for OddsyncAbi {
    type Query = String;
    type QueryResponse = String;
}