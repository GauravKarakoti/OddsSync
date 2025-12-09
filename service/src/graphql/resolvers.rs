use crate::graphql::schema::*;
use async_graphql::{Context, Object, Result};
use linera_sdk::views::View;
use std::sync::Arc;

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Get all active markets
    async fn markets(&self, ctx: &Context<'_>) -> Result<Vec<Market>> {
        let state = ctx.data::<Arc<dyn View>>()?;
        // Implementation to fetch markets from state
        Ok(vec![])
    }

    /// Get market by ID
    async fn market(&self, ctx: &Context<'_>, market_id: u64) -> Result<Option<Market>> {
        let state = ctx.data::<Arc<dyn View>>()?;
        // Implementation to fetch specific market
        Ok(None)
    }

    /// Get bets for a user
    async fn my_bets(&self, ctx: &Context<'_>, address: String) -> Result<Vec<Bet>> {
        let state = ctx.data::<Arc<dyn View>>()?;
        // Implementation to fetch user bets
        Ok(vec![])
    }

    /// Get real-time odds for a market
    async fn live_odds(&self, ctx: &Context<'_>, market_id: u64) -> Result<Vec<Odds>> {
        let state = ctx.data::<Arc<dyn View>>()?;
        // Implementation to calculate live odds
        Ok(vec![])
    }
}

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// Create a new prediction market
    async fn create_market(
        &self,
        ctx: &Context<'_>,
        input: CreateMarketInput,
    ) -> Result<MarketCreationResult> {
        let operation = OddsyncMessage::CreateMarket(MarketCreationParams {
            description: input.description,
            options: input.options,
            initial_liquidity: input.initial_liquidity.parse()
                .map_err(|e| format!("Invalid amount: {}", e))?,
        });

        // Send operation to contract
        let result = ctx
            .data::<linera_sdk::ServiceContext>()?
            .send_operation(Box::new(operation))
            .await
            .map_err(|e| format!("Failed to create market: {:?}", e))?;

        Ok(MarketCreationResult {
            market_id: 0, // Extract from result
            chain_id: "".to_string(),
            transaction_hash: format!("{:?}", result),
        })
    }

    /// Place a bet on a market
    async fn place_bet(
        &self,
        ctx: &Context<'_>,
        input: PlaceBetInput,
    ) -> Result<BetPlacedResult> {
        let operation = OddsyncMessage::PlaceBet(BetParams {
            market_id: input.market_id,
            option_index: input.option_index,
            amount: input.amount.parse()
                .map_err(|e| format!("Invalid amount: {}", e))?,
        });

        let result = ctx
            .data::<linera_sdk::ServiceContext>()?
            .send_operation(Box::new(operation))
            .await
            .map_err(|e| format!("Failed to place bet: {:?}", e))?;

        Ok(BetPlacedResult {
            bet_id: 0,
            transaction_hash: format!("{:?}", result),
            new_odds: vec![],
        })
    }

    /// Resolve a market (market creator only)
    async fn resolve_market(
        &self,
        ctx: &Context<'_>,
        market_id: u64,
        winning_option: u32,
    ) -> Result<MarketResolution> {
        let operation = OddsyncMessage::ResolveMarket {
            market_id,
            winning_option,
        };

        let result = ctx
            .data::<linera_sdk::ServiceContext>()?
            .send_operation(Box::new(operation))
            .await
            .map_err(|e| format!("Failed to resolve market: {:?}", e))?;

        Ok(MarketResolution {
            market_id,
            winning_option,
            total_payout: "0".to_string(),
            resolved_at: Utc::now(),
        })
    }
}