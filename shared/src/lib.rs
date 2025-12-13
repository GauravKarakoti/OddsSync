pub mod market_factory;
pub mod types;

#[cfg(all(feature = "contract", feature = "service"))]
compile_error!("CRITICAL ERROR: Both 'contract' and 'service' features are enabled in 'shared'. This causes the Service binary to include prohibited Contract code (RootView/save). Check your dependencies and cargo clean.");