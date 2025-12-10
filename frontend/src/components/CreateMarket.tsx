import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { Plus, X, DollarSign, Hash, Clock } from 'lucide-react';

const CREATE_MARKET_MUTATION = gql`
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
`;

const CATEGORIES = [
    'Sports',
    'Esports',
    'Politics',
    'Finance',
    'Entertainment',
    'Technology',
    'Crypto',
    'Weather',
    'Other'
];

const RESOLUTION_TIMES = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '3d', label: '3 Days' },
    { value: '7d', label: '7 Days' },
    { value: 'event', label: 'Event-based' }
];

export default function CreateMarket({ onMarketCreated, isConnected }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createMarket] = useMutation(CREATE_MARKET_MUTATION);

    // Form state
    const [formData, setFormData] = useState({
        description: '',
        category: 'Sports',
        options: ['', ''],
        initialLiquidity: '100',
        resolutionTime: '24h',
        minBet: '1',
        maxBet: '1000',
        feePercentage: '2.5'
    });

    const [errors, setErrors]: any = useState({});

    // Validate form
    const validateForm = () => {
        const newErrors: any = {};
        
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length > 200) {
            newErrors.description = 'Description too long (max 200 chars)';
        }

        const validOptions = formData.options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
            newErrors.options = 'At least 2 options are required';
        }

        const liquidity = parseFloat(formData.initialLiquidity);
        if (isNaN(liquidity) || liquidity < 10 || liquidity > 100000) {
            newErrors.initialLiquidity = 'Liquidity must be between $10 and $100,000';
        }

        const minBet = parseFloat(formData.minBet);
        const maxBet = parseFloat(formData.maxBet);
        if (minBet >= maxBet) {
            newErrors.minBet = 'Min bet must be less than max bet';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleInputChange = (field: any, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev: any) => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    // Handle option change
    const handleOptionChange = (index: any, value: any) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData(prev => ({
            ...prev,
            options: newOptions
        }));
    };

    // Add new option
    const addOption = () => {
        if (formData.options.length < 10) {
            setFormData(prev => ({
                ...prev,
                options: [...prev.options, '']
            }));
        }
    };

    // Remove option
    const removeOption = (index: any) => {
        if (formData.options.length > 2) {
            const newOptions = formData.options.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                options: newOptions
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        
        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createMarket({
                variables: {
                    description: formData.description,
                    options: formData.options.filter(opt => opt.trim() !== ''),
                    initialLiquidity: formData.initialLiquidity,
                    category: formData.category,
                    resolutionTime: formData.resolutionTime,
                    minBet: formData.minBet,
                    maxBet: formData.maxBet
                }
            });

            if (result.data.createMarket) {
                alert(`Market created successfully! Market ID: ${result.data.createMarket.marketId}`);
                
                // Reset form
                setFormData({
                    description: '',
                    category: 'Sports',
                    options: ['', ''],
                    initialLiquidity: '100',
                    resolutionTime: '24h',
                    minBet: '1',
                    maxBet: '1000',
                    feePercentage: '2.5'
                });
                
                setIsOpen(false);
                onMarketCreated && onMarketCreated(result.data.createMarket);
            }
        } catch (error: any) {
            console.error('Market creation error:', error);
            alert(`Market creation failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate estimated fees
    const estimatedFee = (parseFloat(formData.initialLiquidity) * 0.025).toFixed(2);
    const totalCost = (parseFloat(formData.initialLiquidity) + parseFloat(estimatedFee)).toFixed(2);

    return (
        <>
            {/* Create Market Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-bold transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
                <Plus className="w-5 h-5" />
                <span>Create Market</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Create New Market</h2>
                                <p className="text-gray-400 mt-1">
                                    Launch a real-time prediction market on Linera Conway
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Market Description */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Market Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="e.g., 'Who will score the next goal in Manchester United vs Liverpool?'"
                                    className={`w-full h-24 p-3 bg-gray-800 border ${
                                        errors.description ? 'border-red-500' : 'border-gray-700'
                                    } rounded-lg text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                                )}
                                <p className="mt-1 text-sm text-gray-400">
                                    Be specific and clear. Max 200 characters.
                                </p>
                            </div>

                            {/* Category and Resolution Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        {CATEGORIES.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        <Clock className="inline-block w-4 h-4 mr-2" />
                                        Resolution Time
                                    </label>
                                    <select
                                        value={formData.resolutionTime}
                                        onChange={(e) => handleInputChange('resolutionTime', e.target.value)}
                                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        {RESOLUTION_TIMES.map(time => (
                                            <option key={time.value} value={time.value}>
                                                {time.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Options */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-white">
                                        Options *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addOption}
                                        disabled={formData.options.length >= 10}
                                        className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
                                    >
                                        + Add Option
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                                        placeholder={`Option ${index + 1}`}
                                                        className={`w-full pl-10 pr-10 p-3 bg-gray-800 border ${
                                                            errors.options ? 'border-red-500' : 'border-gray-700'
                                                        } rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                                    />
                                                    {formData.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(index)}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded"
                                                        >
                                                            <X className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.options && (
                                    <p className="mt-1 text-sm text-red-400">{errors.options}</p>
                                )}
                                <p className="mt-2 text-sm text-gray-400">
                                    At least 2 options required. Max 10 options.
                                </p>
                            </div>

                            {/* Liquidity and Bet Limits */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        <DollarSign className="inline-block w-4 h-4 mr-2" />
                                        Initial Liquidity *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.initialLiquidity}
                                            onChange={(e) => handleInputChange('initialLiquidity', e.target.value)}
                                            className={`w-full pl-8 p-3 bg-gray-800 border ${
                                                errors.initialLiquidity ? 'border-red-500' : 'border-gray-700'
                                            } rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                            min="10"
                                            max="100000"
                                            step="10"
                                        />
                                    </div>
                                    {errors.initialLiquidity && (
                                        <p className="mt-1 text-sm text-red-400">{errors.initialLiquidity}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Min Bet
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.minBet}
                                            onChange={(e) => handleInputChange('minBet', e.target.value)}
                                            className={`w-full pl-8 p-3 bg-gray-800 border ${
                                                errors.minBet ? 'border-red-500' : 'border-gray-700'
                                            } rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                            min="0.01"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Max Bet
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.maxBet}
                                            onChange={(e) => handleInputChange('maxBet', e.target.value)}
                                            className="w-full pl-8 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            min="1"
                                            step="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="text-sm font-medium text-white mb-3">Cost Breakdown</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Initial Liquidity</span>
                                        <span className="text-white">${formData.initialLiquidity}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Platform Fee (2.5%)</span>
                                        <span className="text-white">${estimatedFee}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-700">
                                        <div className="flex justify-between font-medium">
                                            <span className="text-white">Total Cost</span>
                                            <span className="text-xl text-white">${totalCost}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    required
                                    className="mt-1 w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-400">
                                    I agree to the terms of service and confirm that this market complies with
                                    applicable laws. I understand that creating markets with malicious intent
                                    may result in loss of funds and account suspension.
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-6 py-3 border border-gray-700 hover:border-gray-600 rounded-xl text-gray-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isConnected}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                                        isConnected && !isSubmitting
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                                        : 'bg-gray-800 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                                            <span>Creating Market...</span>
                                        </div>
                                    ) : !isConnected ? (
                                        'Connect Wallet to Create'
                                    ) : (
                                        `Create Market ($${totalCost})`
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}