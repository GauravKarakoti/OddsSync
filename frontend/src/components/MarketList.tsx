import { useState, useEffect } from 'react';
import { gql, useQuery, useSubscription } from '@apollo/client';
import MarketCard from './MarketCard';
import MarketFilters from './MarketFilters';
import LoadingSpinner from './LoadingSpinner';

const GET_MARKETS = gql`
    query GetMarkets(
        $skip: Int
        $first: Int
        $sortBy: MarketSort
        $filter: MarketFilter
    ) {
        markets(
            skip: $skip
            first: $first
            sortBy: $sortBy
            filter: $filter
        ) {
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
`;

const MARKETS_SUBSCRIPTION = gql`
    subscription MarketsUpdate {
        marketsUpdate {
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
        }
    }
`;

export default function MarketList({ isConnected }: any) {
    const [markets, setMarkets] = useState([]);
    const [filters, setFilters] = useState({
        category: 'all',
        status: 'active',
        sortBy: 'liquidity_desc',
        search: ''
    });
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;

    const { loading, error, data, refetch } = useQuery(GET_MARKETS, {
        variables: {
            skip: (page - 1) * itemsPerPage,
            first: itemsPerPage,
            ...buildFilterVariables(filters)
        },
        fetchPolicy: 'cache-and-network'
    });

    // Real-time subscription
    const { data: subscriptionData } = useSubscription(MARKETS_SUBSCRIPTION);

    // Update markets on subscription data
    useEffect(() => {
        if (subscriptionData?.marketsUpdate) {
            const { type, market } = subscriptionData.marketsUpdate;
            
            setMarkets((prevMarkets: any) => {
                switch (type) {
                    case 'CREATED':
                        return [market, ...prevMarkets];
                    case 'UPDATED':
                        return prevMarkets.map((m: any) => 
                            m.marketId === market.marketId ? market : m
                        );
                    case 'RESOLVED':
                        return prevMarkets.filter((m: any) => 
                            m.marketId !== market.marketId
                        );
                    default:
                        return prevMarkets;
                }
            });
        }
    }, [subscriptionData]);

    // Update markets from query data
    useEffect(() => {
        if (data?.markets) {
            setMarkets(data.markets);
        }
    }, [data]);

    // Build filter variables for GraphQL query
    function buildFilterVariables(filters: any) {
        const variables: any = {};
        
        switch (filters.status) {
            case 'active':
                variables.filter = { isActive: true };
                break;
            case 'resolved':
                variables.filter = { isActive: false };
                break;
        }

        switch (filters.sortBy) {
            case 'liquidity_desc':
                variables.sortBy = 'LIQUIDITY_DESC';
                break;
            case 'bets_desc':
                variables.sortBy = 'BETS_DESC';
                break;
            case 'created_desc':
                variables.sortBy = 'CREATED_DESC';
                break;
            case 'odds_volatility':
                variables.sortBy = 'ODDS_VOLATILITY';
                break;
        }

        if (filters.search) {
            variables.filter = {
                ...variables.filter,
                search: filters.search
            };
        }

        return variables;
    }

    // Handle filter changes
    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        setPage(1);
    };

    // Handle bet placed callback
    const handleBetPlaced = (betData: any) => {
        // Refetch markets to update totals
        refetch();
    };

    // Calculate total pages
    const totalPages = data ? Math.ceil(data.marketsCount / itemsPerPage) : 1;

    if (loading && markets.length === 0) {
        return <LoadingSpinner message="Loading markets..." />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-400 text-xl mb-4">⚠️ Error loading markets</div>
                <div className="text-gray-400">{error.message}</div>
                <button 
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">🎯 Live Prediction Markets</h1>
                    <p className="text-gray-400">
                        Real-time betting on Linera Testnet Conway
                        <span className="ml-2 px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                            {data?.marketsCount || 0} markets active
                        </span>
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm text-gray-400">Real-time updates</span>
                    </div>
                    <button 
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <MarketFilters 
                filters={filters} 
                onChange={handleFilterChange}
            />

            {/* Markets Grid */}
            {markets.length === 0 ? (
                <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
                    <div className="text-gray-400 text-xl mb-2">No markets found</div>
                    <p className="text-gray-500">Create the first market or try different filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {markets.map((market: any) => (
                        <MarketCard 
                            key={market.marketId}
                            market={market}
                            onBetPlaced={handleBetPlaced}
                            isConnected={isConnected}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                    >
                        ← Previous
                    </button>
                    
                    <div className="flex space-x-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-10 h-10 rounded-lg transition-all ${
                                        page === pageNum
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Stats Footer */}
            <div className="pt-6 border-t border-gray-800">
                <div className="text-sm text-gray-500 text-center">
                    All markets run on Linera microchains • Sub-second finality • Real-time odds updates
                    <br />
                    Connected to Testnet Conway • Powered by Linera SDK 0.15.7
                </div>
            </div>
        </div>
    );
}