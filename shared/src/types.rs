use linera_base::{
    data_types::{Amount, Timestamp},
    identifiers::{AccountOwner, ChainId},
};
use serde::{Deserialize, Serialize};

#[cfg(feature = "service")]
use async_graphql::{SimpleObject, ComplexObject};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[cfg_attr(feature = "service", derive(SimpleObject))]
#[cfg_attr(feature = "service", graphql(complex))]
pub struct MarketInfo {
    pub market_id: u64,
    #[cfg_attr(feature = "service", graphql(skip))]
    pub chain_id: ChainId,
    pub description: String,
    #[cfg_attr(feature = "service", graphql(skip))]
    pub creator: AccountOwner,
    pub options: Vec<String>,
    #[cfg_attr(feature = "service", graphql(skip))]
    pub liquidity: Amount,
    #[cfg_attr(feature = "service", graphql(skip))]
    pub total_bets: Amount,
    #[cfg_attr(feature = "service", graphql(skip))]
    pub created_at: Timestamp,
    #[cfg_attr(feature = "service", graphql(skip))]
    pub resolved_at: Option<Timestamp>,
    pub winning_option: Option<u32>,
    pub is_active: bool,
}

#[cfg(feature = "service")]
#[ComplexObject]
impl MarketInfo {
    async fn chain_id(&self) -> String {
        self.chain_id.to_string()
    }
    async fn creator(&self) -> String {
        self.creator.to_string()
    }
    async fn liquidity(&self) -> String {
        self.liquidity.to_string()
    }
    async fn total_bets(&self) -> String {
        self.total_bets.to_string()
    }
    async fn created_at(&self) -> u64 {
        self.created_at.micros()
    }
    async fn resolved_at(&self) -> Option<u64> {
        self.resolved_at.map(|t| t.micros())
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Bet {
    pub bettor: AccountOwner,
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
pub enum OddssyncMessage {
    CreateMarket(MarketCreationParams),
    PlaceBet(BetParams),
    ResolveMarket { market_id: u64, winning_option: u32 },
    CrossChainBet { from_chain: ChainId, bet: Bet },
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum OddssyncResponse {
    MarketCreated { market_id: u64, chain_id: ChainId },
    BetPlaced { bet_id: u64 },
    MarketResolved { market_id: u64 },
    Empty,
}

#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Debug, Serialize, Deserialize)]
pub struct OddssyncAbi;