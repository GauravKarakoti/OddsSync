import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Conway Testnet Configuration
const CONWAY_CONFIG: any = {
    httpUrl: 'http://localhost:8080/graphql', // Local Linera GraphQL service
    wsUrl: 'ws://localhost:8080/graphql',     // WebSocket for subscriptions
    chainId: 'conway-testnet',
    networkName: 'Linera Conway Testnet'
};

// HTTP link for queries and mutations
const httpLink = createHttpLink({
    uri: CONWAY_CONFIG.httpUrl,
    headers: {
        'Content-Type': 'application/json',
    }
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({
    url: CONWAY_CONFIG.wsUrl,
    connectionParams: () => ({
        // Add auth headers if needed
        authorization: localStorage.getItem('oddssync_token') || null,
    }),
    on: {
        connected: () => console.log('📡 Connected to Conway GraphQL WebSocket'),
        error: (err: any) => console.error('WebSocket error:', err),
        closed: () => console.log('📡 Disconnected from Conway GraphQL WebSocket'),
    },
    shouldRetry: () => true,
    retryAttempts: 10,
    retryWait: async (retries: any) => {
        // Exponential backoff
        return new Promise(resolve => 
            setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 10000))
        );
    }
}));

// Split links based on operation type
const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink
);

// Create Apollo Client
export const apolloClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
        typePolicies: {
            Market: {
                keyFields: ['marketId', 'chainId'],
                fields: {
                    odds: {
                        merge(existing = [], incoming = []) {
                            // Merge odds arrays by optionIndex
                            const merged = [...existing];
                            incoming.forEach((incomingOdd: any) => {
                                const index = merged.findIndex(o => o.optionIndex === incomingOdd.optionIndex);
                                if (index > -1) {
                                    merged[index] = { ...merged[index], ...incomingOdd };
                                } else {
                                    merged.push(incomingOdd);
                                }
                            });
                            return merged;
                        }
                    }
                }
            },
            Query: {
                fields: {
                    markets: {
                        merge(existing, incoming) {
                            return incoming;
                        }
                    }
                }
            }
        }
    }),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'cache-and-network',
            errorPolicy: 'ignore',
        },
        query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
        mutate: {
            errorPolicy: 'all',
        },
    },
});

// GraphQL Queries
export const QUERIES = {
    // Markets
    GET_MARKETS: `
        query GetMarkets($skip: Int, $first: Int, $filter: MarketFilter, $sortBy: MarketSort) {
            markets(skip: $skip, first: $first, filter: $filter, sortBy: $sortBy) {
                marketId
                chainId
                description
                creator
                options
                liquidity
                totalBets
                totalBetsCount
                createdAt
                resolvedAt
                winningOption
                isActive
                odds {
                    optionIndex
                    odds
                    totalAmount
                    lastUpdate
                }
            }
            marketsCount(filter: $filter)
        }
    `,
    
    GET_MARKET_DETAILS: `
        query GetMarketDetails($marketId: ID!) {
            market(marketId: $marketId) {
                marketId
                chainId
                description
                creator
                options
                liquidity
                totalBets
                totalBetsCount
                createdAt
                resolvedAt
                winningOption
                isActive
                odds {
                    optionIndex
                    odds
                    totalAmount
                    lastUpdate
                }
                bets(first: 10) {
                    betId
                    bettor
                    amount
                    optionIndex
                    placedAt
                    potentialPayout
                }
                resolution {
                    resolvedBy
                    resolutionTime
                    oracleData
                    transactionHash
                }
            }
        }
    `,
    
    GET_MY_BETS: `
        query GetMyBets($address: String!, $skip: Int, $first: Int) {
            myBets(address: $address, skip: $skip, first: $first) {
                betId
                marketId
                marketDescription
                optionIndex
                optionName
                amount
                placedAt
                potentialPayout
                status
                resolvedAt
                payoutAmount
                transactionHash
            }
            myBetsCount(address: $address)
        }
    `,
    
    GET_MARKET_HISTORY: `
        query GetMarketHistory($marketId: ID!, $timeRange: String!) {
            marketHistory(marketId: $marketId, timeRange: $timeRange) {
                timestamp
                odds {
                    optionIndex
                    odds
                }
                totalLiquidity
                totalBets
                activeBettors
            }
        }
    `,
    
    GET_STATS: `
        query GetStats {
            stats {
                totalMarkets
                activeMarkets
                totalBets
                totalLiquidity
                totalPayouts
                avgOddsVolatility
                topMarkets {
                    marketId
                    description
                    totalBets
                }
                recentActivity {
                    type
                    timestamp
                    marketId
                    data
                }
            }
        }
    `
};

// GraphQL Mutations
export const MUTATIONS = {
    CREATE_MARKET: `
        mutation CreateMarket(
            $description: String!
            $options: [String!]!
            $initialLiquidity: String!
            $category: String
            $resolutionTime: String
            $minBet: String
            $maxBet: String
        ) {
            createMarket(
                description: $description
                options: $options
                initialLiquidity: $initialLiquidity
                category: $category
                resolutionTime: $resolutionTime
                minBet: $minBet
                maxBet: $maxBet
            ) {
                marketId
                chainId
                transactionHash
                timestamp
                market {
                    marketId
                    description
                    options
                    liquidity
                    createdAt
                }
            }
        }
    `,
    
    PLACE_BET: `
        mutation PlaceBet(
            $marketId: ID!
            $optionIndex: Int!
            $amount: String!
        ) {
            placeBet(
                marketId: $marketId
                optionIndex: $optionIndex
                amount: $amount
            ) {
                betId
                transactionHash
                timestamp
                newOdds {
                    optionIndex
                    odds
                    totalAmount
                }
            }
        }
    `,
    
    RESOLVE_MARKET: `
        mutation ResolveMarket(
            $marketId: ID!
            $winningOption: Int!
            $resolutionData: String
        ) {
            resolveMarket(
                marketId: $marketId
                winningOption: $winningOption
                resolutionData: $resolutionData
            ) {
                marketId
                transactionHash
                timestamp
                totalPayout
                winningOption
            }
        }
    `,
    
    ADD_LIQUIDITY: `
        mutation AddLiquidity(
            $marketId: ID!
            $amount: String!
        ) {
            addLiquidity(
                marketId: $marketId
                amount: $amount
            ) {
                transactionHash
                timestamp
                newLiquidity
                feeCharged
            }
        }
    `
};

// GraphQL Subscriptions
export const SUBSCRIPTIONS = {
    MARKET_UPDATES: `
        subscription MarketUpdates($marketIds: [ID!]) {
            marketUpdates(marketIds: $marketIds) {
                type
                market {
                    marketId
                    chainId
                    description
                    options
                    liquidity
                    totalBets
                    totalBetsCount
                    isActive
                    odds {
                        optionIndex
                        odds
                        totalAmount
                        lastUpdate
                    }
                }
                timestamp
            }
        }
    `,
    
    LIVE_ODDS: `
        subscription LiveOdds($marketId: ID!) {
            liveOdds(marketId: $marketId) {
                marketId
                odds {
                    optionIndex
                    odds
                    totalAmount
                }
                timestamp
            }
        }
    `,
    
    BET_PLACED: `
        subscription BetPlaced($marketId: ID!) {
            betPlaced(marketId: $marketId) {
                betId
                bettor
                amount
                optionIndex
                placedAt
                marketId
                newOdds {
                    optionIndex
                    odds
                    totalAmount
                }
            }
        }
    `,
    
    MARKET_RESOLVED: `
        subscription MarketResolved {
            marketResolved {
                marketId
                winningOption
                totalPayout
                resolvedAt
                transactionHash
            }
        }
    `
};

// Helper functions
export const formatCurrency = (amount: any, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(amount));
};

export const formatAddress = (address: any, start = 6, end = 4) => {
    if (!address) return '';
    return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const formatTimeAgo = (timestamp: any) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
};

export const calculatePayout = (betAmount: any, odds: any) => {
    return (parseFloat(betAmount) * parseFloat(odds)).toFixed(2);
};

export const validateBetAmount = (amount: any, minBet = 1, maxBet = 1000) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'Invalid amount';
    if (numAmount < minBet) return `Minimum bet is $${minBet}`;
    if (numAmount > maxBet) return `Maximum bet is $${maxBet}`;
    return null;
};

// Network status
export const checkNetworkStatus = async () => {
    try {
        const response = await fetch(CONWAY_CONFIG.httpUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '{ __schema { types { name } } }' })
        });
        return response.ok;
    } catch (error) {
        console.error('Network check failed:', error);
        return false;
    }
};

// Conway testnet utilities
export const ConwayUtils = {
    getExplorerUrl: (address: any) => `${CONWAY_CONFIG.explorerUrl}/address/${address}`,
    getTransactionUrl: (txHash: any) => `${CONWAY_CONFIG.explorerUrl}/tx/${txHash}`,
    getFaucetUrl: () => CONWAY_CONFIG.faucetUrl,
    
    isValidAddress: (address: any) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    },
    
    getChainInfo: () => ({
        name: CONWAY_CONFIG.networkName,
        chainId: CONWAY_CONFIG.chainId,
        rpcUrl: CONWAY_CONFIG.httpUrl,
        explorer: CONWAY_CONFIG.explorerUrl,
        faucet: CONWAY_CONFIG.faucetUrl
    })
};