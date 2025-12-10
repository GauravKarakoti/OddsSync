mod graphql;

use crate::graphql::resolvers::{MutationRoot, QueryRoot}; 
use async_graphql::{EmptySubscription, Schema};
use linera_sdk::{
    Service, ServiceRuntime, 
};
use std::sync::Arc; // Required for Arc
use linera_sdk::serde_json;
use linera_sdk::views::View;

use contract::market_factory::MarketFactory;
use contract::types::OddsyncAbi;

pub struct OddsyncService {
    state: Arc<MarketFactory>, // Changed to Arc<MarketFactory>
}

linera_sdk::service!(OddsyncService);

impl linera_sdk::abi::WithServiceAbi for OddsyncService {
    type Abi = OddsyncAbi;
}

impl Service for OddsyncService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MarketFactory::pre_load(&runtime.root_view_storage_context())
            .expect("Failed to load state");
        OddsyncService { state: Arc::new(state) } // Wrap loaded state in Arc
    }

    async fn handle_query(&self, query: String) -> String {
        let schema = Schema::build(
            QueryRoot,
            MutationRoot,
            EmptySubscription,
        )
        // This clone now works because Arc is Clone
        .data(self.state.clone()) 
        .finish();

        let result = schema.execute(query).await;
        serde_json::to_string(&result).unwrap_or_else(|e| format!("Error: {}", e))
    }
}