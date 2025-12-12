mod graphql;

use crate::graphql::resolvers::{MutationRoot, QueryRoot}; 
use async_graphql::{EmptySubscription, Schema};
use linera_sdk::{
    Service, ServiceRuntime, 
};
use std::sync::Arc;
use linera_sdk::serde_json;
use linera_sdk::views::{View, ViewStorageContext};
use linera_sdk::abi::ServiceAbi;

use shared::market_factory::MarketFactory;

pub struct OddssyncService {
    state: Arc<MarketFactory<ViewStorageContext>>,
}

pub struct OddssyncAbi;

impl ServiceAbi for OddssyncAbi {
    type Query = String;
    type QueryResponse = String;
}

linera_sdk::service!(OddssyncService);

impl linera_sdk::abi::WithServiceAbi for OddssyncService {
    type Abi = OddssyncAbi;
}

impl Service for OddssyncService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
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