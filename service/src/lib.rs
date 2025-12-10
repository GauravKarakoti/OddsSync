mod graphql; // Declare the graphql module so we can use resolvers/schema

// Fix import: assume QueryRoot/MutationRoot are in schema.rs inside the graphql module
use crate::graphql::schema::{MutationRoot, QueryRoot}; 
use async_graphql::{EmptySubscription, Schema};
use linera_sdk::{
    Service, ServiceRuntime, 
    views::{View, RootView}, 
    serde_json
};
use std::sync::Arc;

// Import types from the contract crate
use contract::market_factory::MarketFactory;
use contract::types::OddsyncAbi;

pub struct OddsyncService {
    state: MarketFactory,
}

// Use the macro at the top level, NOT as an attribute on the impl
linera_sdk::service!(OddsyncService);

impl linera_sdk::abi::WithServiceAbi for OddsyncService {
    type Abi = OddsyncAbi;
}

impl Service for OddsyncService {
    type Parameters = ();

    // New signature uses ServiceRuntime
    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MarketFactory::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        OddsyncService { state }
    }

    async fn handle_query(&self, query: String) -> String {
        let schema = Schema::build(
            QueryRoot,
            MutationRoot,
            EmptySubscription,
        )
        // Clone the state to pass it to the GraphQL context
        // MarketFactory (a View) is typically cheap to clone (handle copy)
        .data(self.state.clone())
        .finish();

        let result = schema.execute(query).await;
        serde_json::to_string(&result).unwrap_or_else(|e| format!("Error: {}", e))
    }
}