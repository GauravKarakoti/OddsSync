import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Line } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    type ChartOptions
} from 'chart.js';

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const PLACE_BET_MUTATION = gql`
    mutation PlaceBet($marketId: ID!, $optionIndex: Int!, $amount: String!) {
        placeBet(marketId: $marketId, optionIndex: $optionIndex, amount: $amount) {
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
`;

export default function MarketCard({ market, onBetPlaced, isConnected }: any) {
    const [betAmount, setBetAmount] = useState('10');
    const [selectedOption, setSelectedOption] = useState(0);
    const [oddsHistory, setOddsHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [placeBet] = useMutation(PLACE_BET_MUTATION);

    // Format currency
    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(parseFloat(amount));
    };

    // Calculate potential payout
    const calculatePayout = () => {
        const amount = parseFloat(betAmount) || 0;
        const option = market.odds.find((o: any) => o.optionIndex === selectedOption);
        if (!option) return '0.00';
        return (amount * option.odds).toFixed(2);
    };

    // Handle bet placement
    const handlePlaceBet = async () => {
        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        if (!betAmount || parseFloat(betAmount) <= 0) {
            alert('Please enter a valid bet amount');
            return;
        }

        setIsLoading(true);
        try {
            const result = await placeBet({
                variables: {
                    marketId: market.marketId,
                    optionIndex: selectedOption,
                    amount: betAmount
                }
            });

            if (result.data.placeBet) {
                alert(`Bet placed successfully! TX: ${result.data.placeBet.transactionHash.slice(0, 10)}...`);
                onBetPlaced && onBetPlaced(result.data.placeBet);
                setBetAmount('10');
            }
        } catch (error: any) {
            console.error('Bet placement error:', error);
            alert(`Bet failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Chart data for odds history
    const chartData = {
        labels: oddsHistory.map((_, index) => `-${oddsHistory.length - index - 1}m`),
        datasets: market.odds.map((option: any, idx: any) => ({
            label: market.options[idx],
            data: oddsHistory.map((point: any) => 
                point.odds.find((o: any) => o.optionIndex === idx)?.odds || 1.0
            ),
            borderColor: idx === 0 ? '#4F46E5' : idx === 1 ? '#10B981' : '#F59E0B',
            backgroundColor: idx === 0 ? 'rgba(79, 70, 229, 0.1)' : 
                           idx === 1 ? 'rgba(16, 185, 129, 0.1)' : 
                           'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 2
        }))
    };

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#E5E7EB'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#9CA3AF',
                bodyColor: '#D1D5DB'
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(55, 65, 81, 0.5)'
                },
                ticks: {
                    color: '#9CA3AF'
                }
            },
            y: {
                grid: {
                    color: 'rgba(55, 65, 81, 0.5)'
                },
                ticks: {
                    color: '#9CA3AF'
                },
                beginAtZero: false
            }
        },
        interaction: {
            intersect: false,
            mode: 'nearest' 
        }
    };

    return (
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-800 hover:border-purple-600 transition-all duration-300">
            {/* Market Header */}
            <div className="p-6 border-b border-gray-800">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{market.description}</h3>
                        <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm font-medium">
                                Market ID: {market.marketId}
                            </span>
                            <span className="px-3 py-1 bg-green-900 text-green-200 rounded-full text-sm font-medium">
                                Active
                            </span>
                            {market.chainId && (
                                <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm font-mono">
                                    Chain: {market.chainId.slice(0, 8)}...
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                            {formatCurrency(market.totalBets)}
                        </div>
                        <div className="text-sm text-gray-400">Total Bets</div>
                    </div>
                </div>
            </div>

            {/* Options & Betting Interface */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Options List */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white mb-4">Betting Options</h4>
                        {market.options.map((option: any, index: any) => {
                            const odds = market.odds.find((o: any) => o.optionIndex === index);
                            return (
                                <div 
                                    key={index}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                        selectedOption === index 
                                        ? 'border-purple-600 bg-purple-900/20' 
                                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                                    }`}
                                    onClick={() => setSelectedOption(index)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-4 h-4 rounded-full border-2 ${
                                                    selectedOption === index 
                                                    ? 'border-purple-400 bg-purple-400' 
                                                    : 'border-gray-500'
                                                }`}></div>
                                                <span className="text-white font-medium">{option}</span>
                                            </div>
                                            <div className="ml-7 mt-2 text-sm text-gray-400">
                                                Total Bet: {formatCurrency(odds?.totalAmount || '0')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">
                                                {odds ? odds.odds.toFixed(2) : '1.00'}x
                                            </div>
                                            <div className="text-sm text-gray-400">Payout Multiplier</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Betting Form */}
                    <div className="bg-gray-800/50 rounded-xl p-5">
                        <h4 className="text-lg font-semibold text-white mb-4">Place Your Bet</h4>
                        
                        <div className="space-y-4">
                            {/* Selected Option Display */}
                            <div className="p-3 bg-gray-900 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Selected Option</div>
                                <div className="text-lg font-semibold text-white">
                                    {market.options[selectedOption]}
                                </div>
                            </div>

                            {/* Bet Amount Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Bet Amount (USD)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(e.target.value)}
                                        className="pl-8 w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Enter amount"
                                        min="0.01"
                                        step="0.01"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <span className="text-gray-400">USD</span>
                                    </div>
                                </div>
                                <div className="flex justify-between mt-2">
                                    {[10, 50, 100, 500].map(amount => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setBetAmount(amount.toString())}
                                            className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
                                        >
                                            ${amount}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Potential Payout */}
                            <div className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-800/50">
                                <div className="text-sm text-gray-300 mb-1">Potential Payout</div>
                                <div className="flex justify-between items-center">
                                    <div className="text-2xl font-bold text-white">
                                        ${calculatePayout()}
                                    </div>
                                    <div className="text-sm text-purple-300">
                                        {market.odds.find((o: any) => o.optionIndex === selectedOption)?.odds.toFixed(2)}x
                                    </div>
                                </div>
                            </div>

                            {/* Place Bet Button */}
                            <button
                                onClick={handlePlaceBet}
                                disabled={isLoading || !isConnected}
                                className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-300 ${
                                    isConnected && !isLoading
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                                    : 'bg-gray-800 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                                        Processing...
                                    </div>
                                ) : !isConnected ? (
                                    'Connect Wallet to Bet'
                                ) : (
                                    `Place Bet - $${betAmount}`
                                )}
                            </button>

                            {/* Risk Disclaimer */}
                            <div className="text-xs text-gray-500 text-center mt-2">
                                Odds update in real-time. All bets are final. Only bet what you can afford to lose.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Odds History Chart */}
                {oddsHistory.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <h4 className="text-lg font-semibold text-white mb-4">Odds History (Last 30m)</h4>
                        <div className="h-64">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>
                )}

                {/* Market Statistics */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400">Liquidity</div>
                        <div className="text-xl font-bold text-white">
                            {formatCurrency(market.liquidity)}
                        </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400">Total Bets</div>
                        <div className="text-xl font-bold text-white">{market.totalBetsCount || 0}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400">Created</div>
                        <div className="text-xl font-bold text-white">
                            {new Date(market.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400">Creator</div>
                        <div className="text-xl font-bold text-white font-mono text-sm">
                            {market.creator?.slice(0, 8)}...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}