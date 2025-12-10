mod graphql;

use crate::graphql::resolvers::{MutationRoot, QueryRoot}; 
use async_graphql::{EmptySubscription, Schema};
use linera_sdk::{
    Service, ServiceRuntime, 
};
use std::sync::Arc;
use linera_sdk::serde_json;
use linera_sdk::views::View; // View trait is needed for load()

use contract::market_factory::MarketFactory;
use contract::types::OddsyncAbi;

pub struct OddsyncService {
    state: Arc<MarketFactory>,
}

linera_sdk::service!(OddsyncService);

impl linera_sdk::abi::WithServiceAbi for OddsyncService {
    type Abi = OddsyncAbi;
}

impl Service for OddsyncService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        // Use load() instead of pre_load(), await the result, and pass context by value
        let state = MarketFactory::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
            
        OddsyncService { state: Arc::new(state) }
    }

    async fn handle_query(&self, query: String) -> String {
        let schema = Schema::build(
            QueryRoot,
            MutationRoot,
            EmptySubscription,
        )
        .data(self.state.clone()) 
        .finish();

        let result = schema.execute(query).await;
        serde_json::to_string(&result).unwrap_or_else(|e| format!("Error: {}", e))
    }
}