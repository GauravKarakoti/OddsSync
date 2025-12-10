use crate::graphql::{MutationRoot, QueryRoot};
use async_graphql::{EmptySubscription, Schema};
use linera_sdk::{Service, ViewState};
use std::sync::Arc;
use linera_sdk::serde_json;

pub struct OddsyncService {
    state: Arc<dyn linera_sdk::views::View>,
}

impl OddsyncService {
    pub fn new(state: Arc<dyn linera_sdk::views::View>) -> Self {
        Self { state }
    }
}

#[linera_sdk::service]
impl Service for OddsyncService {
    type Abi = contract::OddsyncAbi;
    type State = Arc<dyn linera_sdk::views::View>;
    type Parameters = ();

    async fn new(state: Self::State, _parameters: ()) -> Self {
        Self::new(state)
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