import { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery, useMutation } from '@apollo/client';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

// GraphQL client for Conway testnet
const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql', // Linera GraphQL endpoint
  cache: new InMemoryCache(),
});

// GraphQL queries
const GET_MARKETS = gql`
  query GetMarkets {
    markets {
      market_id
      description
      options
      liquidity
      total_bets
      is_active
      odds {
        option_index
        option_name
        odds
        total_bet
      }
    }
  }
`;

const GET_LIVE_ODDS = gql`
  subscription LiveOdds($marketId: ID!) {
    liveOdds(marketId: $marketId) {
      option_index
      odds
      timestamp
    }
  }
`;

const CREATE_MARKET = gql`
  mutation CreateMarket($input: CreateMarketInput!) {
    createMarket(input: $input) {
      market_id
      chain_id
      transaction_hash
    }
  }
`;

const PLACE_BET = gql`
  mutation PlaceBet($input: PlaceBetInput!) {
    placeBet(input: $input) {
      bet_id
      transaction_hash
      new_odds
    }
  }
`;

function MarketList() {
  const { loading, error, data, subscribeToMore } = useQuery(GET_MARKETS);
  const [createMarket] = useMutation(CREATE_MARKET);
  const [placeBet] = useMutation(PLACE_BET);

  const [newMarket, setNewMarket] = useState({
    description: '',
    options: ['', ''],
    liquidity: '100'
  });

  useEffect(() => {
    // Subscribe to real-time updates
    if (data?.markets) {
      data.markets.forEach((market: any) => {
        subscribeToMore({
          document: GET_LIVE_ODDS,
          variables: { marketId: market.market_id },
          updateQuery: (prev, { subscriptionData }) => {
            if (!subscriptionData.data) return prev;
            return {
              ...prev,
              markets: prev.markets.map((m: any) => 
                m.market_id === market.market_id 
                  ? { ...m, odds: subscriptionData.data.liveOdds }
                  : m
              )
            };
          }
        });
      });
    }
  }, [data, subscribeToMore]);

  const handleCreateMarket = async () => {
    try {
      await createMarket({
        variables: {
          input: {
            description: newMarket.description,
            options: newMarket.options.filter(opt => opt.trim() !== ''),
            initial_liquidity: newMarket.liquidity
          }
        },
        refetchQueries: [{ query: GET_MARKETS }]
      });
      setNewMarket({ description: '', options: ['', ''], liquidity: '100' });
    } catch (err) {
      console.error('Error creating market:', err);
    }
  };

  const handlePlaceBet = async (marketId: any, optionIndex: any, amount: any) => {
    try {
      await placeBet({
        variables: {
          input: {
            market_id: marketId,
            option_index: optionIndex,
            amount: amount
          }
        }
      });
      alert('Bet placed successfully!');
    } catch (err) {
      console.error('Error placing bet:', err);
    }
  };

  if (loading) return <div>Loading markets...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎯 OddsSync - Real-Time Betting</h1>
      
      {/* Create Market Form */}
      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Create New Market</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Market description (e.g., 'Next Goal Scorer: Messi vs Ronaldo')"
            className="w-full p-2 rounded bg-gray-800"
            value={newMarket.description}
            onChange={(e) => setNewMarket({...newMarket, description: e.target.value})}
          />
          {newMarket.options.map((option, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Option ${index + 1}`}
              className="w-full p-2 rounded bg-gray-800"
              value={option}
              onChange={(e) => {
                const newOptions = [...newMarket.options];
                newOptions[index] = e.target.value;
                setNewMarket({...newMarket, options: newOptions});
              }}
            />
          ))}
          <button
            onClick={() => setNewMarket({...newMarket, options: [...newMarket.options, '']})}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            + Add Option
          </button>
          <input
            type="number"
            placeholder="Initial liquidity"
            className="w-full p-2 rounded bg-gray-800"
            value={newMarket.liquidity}
            onChange={(e) => setNewMarket({...newMarket, liquidity: e.target.value})}
          />
          <button
            onClick={handleCreateMarket}
            className="px-6 py-2 bg-green-600 rounded font-bold"
          >
            Create Market
          </button>
        </div>
      </div>

      {/* Markets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.markets.map((market: any) => (
          <div key={market.market_id} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2">{market.description}</h3>
            <div className="space-y-2 mb-4">
              {market.odds.map((odd: any, idx: any) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{market.options[odd.option_index]}</span>
                  <div className="text-right">
                    <div className="font-bold">{odd.odds.toFixed(2)}x</div>
                    <div className="text-sm text-gray-400">${odd.total_bet}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Bet amount"
                className="flex-1 p-2 rounded bg-gray-700"
                defaultValue="10"
              />
              <button
                onClick={() => handlePlaceBet(market.market_id, 0, "10")}
                className="px-4 py-2 bg-purple-600 rounded"
              >
                Bet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="min-h-screen bg-gray-950 text-white">
        <header className="p-4 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold">ODDS SYNC</div>
            <div className="text-sm px-2 py-1 bg-green-900 rounded">Conway Testnet</div>
          </div>
          <DynamicWidget />
        </header>
        <main>
          <MarketList />
        </main>
      </div>
    </ApolloProvider>
  );
}

export default App;