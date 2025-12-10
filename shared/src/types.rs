use linera_sdk::linera_base_types::{AccountOwner, Amount, ChainId, Timestamp};
use linera_sdk::views::ViewError;
use serde::{Deserialize, Serialize};
use linera_sdk::abi::{ContractAbi, ServiceAbi};
use async_graphql::{SimpleObject, ComplexObject}; // Added async_graphql traits

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
#[graphql(complex)] // Indicates we are adding custom field resolvers below
pub struct MarketInfo {
    pub market_id: u64,
    #[graphql(skip)] // Skip raw ChainId, we expose it via complex object below
    pub chain_id: ChainId,
    pub description: String,
    #[graphql(skip)]
    pub creator: AccountOwner,
    pub options: Vec<String>,
    #[graphql(skip)]
    pub liquidity: Amount,
    #[graphql(skip)]
    pub total_bets: Amount,
    #[graphql(skip)]
    pub created_at: Timestamp,
    #[graphql(skip)]
    pub resolved_at: Option<Timestamp>,
    pub winning_option: Option<u32>,
    pub is_active: bool,
}

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
    Empty,
}

#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Debug, Serialize, Deserialize)]
pub struct OddsyncAbi;

impl ContractAbi for OddsyncAbi {
    type Operation = OddsyncMessage;
    type Response = OddsyncResponse;
}

impl ServiceAbi for OddsyncAbi {
    type Query = String;
    type QueryResponse = String;
}