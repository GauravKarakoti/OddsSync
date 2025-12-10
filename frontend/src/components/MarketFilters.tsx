import { useState } from 'react';
import { Search, Filter, TrendingUp, Clock, DollarSign } from 'lucide-react';

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'sports', label: 'Sports' },
    { value: 'esports', label: 'Esports' },
    { value: 'politics', label: 'Politics' },
    { value: 'finance', label: 'Finance' },
    { value: 'entertainment', label: 'Entertainment' }
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active Markets', icon: TrendingUp },
    { value: 'resolved', label: 'Resolved', icon: Clock },
    { value: 'high_liquidity', label: 'High Liquidity', icon: DollarSign }
];

const SORT_OPTIONS = [
    { value: 'liquidity_desc', label: 'Liquidity (High to Low)' },
    { value: 'bets_desc', label: 'Total Bets (High to Low)' },
    { value: 'created_desc', label: 'Newest First' },
    { value: 'odds_volatility', label: 'High Volatility' }
];

export default function MarketFilters({ filters, onChange }: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key: any, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
    };

    const applyFilters = () => {
        onChange(localFilters);
    };

    const resetFilters = () => {
        const defaultFilters = {
            category: 'all',
            status: 'active',
            sortBy: 'liquidity_desc',
            search: ''
        };
        setLocalFilters(defaultFilters);
        onChange(defaultFilters);
    };

    return (
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <Filter className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Market Filters</h3>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                >
                    {isExpanded ? 'Hide Filters' : 'Show Filters'}
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={localFilters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Search markets by description or ID..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={localFilters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {CATEGORIES.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Status
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map(option => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handleFilterChange('status', option.value)}
                                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                                localFilters.status === option.value
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Sort By
                            </label>
                            <select
                                value={localFilters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quick Filter Chips */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-400 mr-2">Quick Filters:</span>
                        {[
                            { label: 'Under 1.5x Odds', value: 'low_odds' },
                            { label: 'Ending Soon', value: 'ending_soon' },
                            { label: 'High Volume', value: 'high_volume' },
                            { label: 'New Markets', value: 'new' }
                        ].map(filter => (
                            <button
                                key={filter.value}
                                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-300 transition-colors"
                                onClick={() => {
                                    // Apply quick filter logic
                                }}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Filter Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Active Filters Display */}
            <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(localFilters).map(([key, value]) => {
                    if (!value || value === 'all' || value === 'liquidity_desc') return null;
                    
                    let label: any = value;
                    if (key === 'status') {
                        label = STATUS_OPTIONS.find(o => o.value === value)?.label || value;
                    } else if (key === 'sortBy') {
                        label = SORT_OPTIONS.find(o => o.value === value)?.label || value;
                    } else if (key === 'category') {
                        label = CATEGORIES.find(c => c.value === value)?.label || value;
                    }

                    return (
                        <div
                            key={key}
                            className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-full text-sm"
                        >
                            <span className="text-gray-400 capitalize">{key}:</span>
                            <span className="text-white">{label}</span>
                            <button
                                onClick={() => handleFilterChange(key, 
                                    key === 'status' ? 'active' :
                                    key === 'sortBy' ? 'liquidity_desc' :
                                    key === 'category' ? 'all' : ''
                                )}
                                className="ml-1 text-gray-400 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}