mod graphql;

use crate::graphql::resolvers::{MutationRoot, QueryRoot}; 
use async_graphql::{EmptySubscription, Schema};
use linera_sdk::{
    Service, ServiceRuntime, 
};
use std::sync::Arc;
use linera_sdk::serde_json;
use linera_sdk::views::View; // View trait is needed for load()

use shared::market_factory::MarketFactory;
use shared::types::OddssyncAbi;

pub struct OddssyncService {
    state: Arc<MarketFactory>,
}

linera_sdk::service!(OddssyncService);

impl linera_sdk::abi::WithServiceAbi for OddssyncService {
    type Abi = OddssyncAbi;
}

impl Service for OddssyncService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        // Use load() instead of pre_load(), await the result, and pass context by value
        let state = MarketFactory::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
            
        OddssyncService { state: Arc::new(state) }
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