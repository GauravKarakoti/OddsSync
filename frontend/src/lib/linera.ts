// Linera Conway Testnet SDK Integration
import { ethers } from 'ethers';

// Conway Testnet Configuration
export const CONWAY_TESTNET = {
    CHAIN_ID: '0x4c4e', // Conway testnet
    CHAIN_NAME: 'Linera Conway Testnet',
    RPC_URL: 'https://rpc.testnet-conway.linera.net',
    EXPLORER_URL: 'https://explorer.testnet-conway.linera.net',
    FAUCET_URL: 'https://faucet.testnet-conway.linera.net',
    NATIVE_CURRENCY: {
        name: 'LINERA',
        symbol: 'LIN',
        decimals: 18
    }
};

// ABI for Oddssync Contract
export const Oddssync_ABI = [
    // Core Functions
    "function createMarket(string description, string[] options, uint256 initialLiquidity) returns (uint256 marketId, address marketChain)",
    "function placeBet(uint256 marketId, uint256 optionIndex, uint256 amount) returns (uint256 betId)",
    "function resolveMarket(uint256 marketId, uint256 winningOption)",
    "function addLiquidity(uint256 marketId, uint256 amount)",
    
    // View Functions
    "function getMarket(uint256 marketId) view returns (tuple(uint256 marketId, address chainId, string description, address creator, string[] options, uint256 liquidity, uint256 totalBets, uint256 createdAt, uint256 resolvedAt, uint256 winningOption, bool isActive))",
    "function getMarketOdds(uint256 marketId) view returns (tuple(uint256 optionIndex, uint256 odds, uint256 totalAmount)[] odds)",
    "function getUserBets(address user) view returns (tuple(uint256 betId, uint256 marketId, uint256 optionIndex, uint256 amount, uint256 placedAt, bool resolved, uint256 payout)[] bets)",
    
    // Events
    "event MarketCreated(uint256 indexed marketId, address indexed creator, string description, address marketChain)",
    "event BetPlaced(uint256 indexed marketId, address indexed bettor, uint256 betId, uint256 optionIndex, uint256 amount, uint256 timestamp)",
    "event MarketResolved(uint256 indexed marketId, uint256 winningOption, uint256 totalPayout, uint256 timestamp)",
    "event LiquidityAdded(uint256 indexed marketId, address indexed provider, uint256 amount, uint256 timestamp)",
    "event OddsUpdated(uint256 indexed marketId, tuple(uint256 optionIndex, uint256 odds, uint256 totalAmount)[] newOdds, uint256 timestamp)"
];

// Linera SDK Wrapper
export class LineraSDK {
    provider: any;
    signer: any;
    contract: any;
    connected: any;
    contractAddress: any;

    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.connected = false;
        this.contractAddress = null;
    }

    // Initialize with provider
    async init(provider: any) {
        try {
            this.provider = new ethers.BrowserProvider(provider);
            this.signer = await this.provider.getSigner();
            this.connected = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Linera SDK:', error);
            return false;
        }
    }

    // Connect to Oddssync contract
    async connectToContract(contractAddress: any) {
        try {
            this.contractAddress = contractAddress;
            this.contract = new ethers.Contract(
                contractAddress,
                Oddssync_ABI,
                this.signer
            );
            return true;
        } catch (error) {
            console.error('Failed to connect to contract:', error);
            return false;
        }
    }

    // Get chain ID
    async getChainId() {
        try {
            const network = await this.provider.getNetwork();
            return network.chainId.toString();
        } catch (error) {
            return null;
        }
    }

    // Check if connected to Conway testnet
    async isConwayNetwork() {
        const chainId = await this.getChainId();
        return chainId === CONWAY_TESTNET.CHAIN_ID;
    }

    // Switch to Conway testnet
    async switchToConway() {
        try {
            await (window as any).ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONWAY_TESTNET.CHAIN_ID }],
            });
            return true;
        } catch (switchError: any) {
            // If chain is not added, add it
            if (switchError.code === 4902) {
                try {
                    await (window as any).ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: CONWAY_TESTNET.CHAIN_ID,
                            chainName: CONWAY_TESTNET.CHAIN_NAME,
                            rpcUrls: [CONWAY_TESTNET.RPC_URL],
                            nativeCurrency: CONWAY_TESTNET.NATIVE_CURRENCY,
                            blockExplorerUrls: [CONWAY_TESTNET.EXPLORER_URL]
                        }],
                    });
                    return true;
                } catch (addError) {
                    console.error('Failed to add Conway network:', addError);
                    return false;
                }
            }
            return false;
        }
    }

    // Get account balance
    async getBalance() {
        try {
            const address = await this.signer.getAddress();
            const balance = await this.provider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Failed to get balance:', error);
            return '0';
        }
    }

    // Contract Methods
    async createMarket(description: any, options: any, initialLiquidity: any) {
        try {
            const tx = await this.contract.createMarket(
                description,
                options,
                ethers.parseEther(initialLiquidity)
            );
            const receipt = await tx.wait();
            
            // Parse events
            const event = receipt.events?.find((e: any) => e.event === 'MarketCreated');
            if (event) {
                return {
                    marketId: event.args.marketId.toString(),
                    chainId: event.args.marketChain,
                    transactionHash: receipt.transactionHash
                };
            }
            
            return { transactionHash: receipt.transactionHash };
        } catch (error) {
            console.error('Create market error:', error);
            throw error;
        }
    }

    async placeBet(marketId: any, optionIndex: any, amount: any) {
        try {
            const tx = await this.contract.placeBet(
                marketId,
                optionIndex,
                ethers.parseEther(amount)
            );
            const receipt = await tx.wait();
            
            const event = receipt.events?.find((e: any) => e.event === 'BetPlaced');
            if (event) {
                return {
                    betId: event.args.betId.toString(),
                    transactionHash: receipt.transactionHash,
                    timestamp: Date.now()
                };
            }
            
            return { transactionHash: receipt.transactionHash };
        } catch (error) {
            console.error('Place bet error:', error);
            throw error;
        }
    }

    async resolveMarket(marketId: any, winningOption: any) {
        try {
            const tx = await this.contract.resolveMarket(marketId, winningOption);
            const receipt = await tx.wait();
            
            const event = receipt.events?.find((e: any) => e.event === 'MarketResolved');
            if (event) {
                return {
                    transactionHash: receipt.transactionHash,
                    totalPayout: ethers.formatEther(event.args.totalPayout),
                    timestamp: Date.now()
                };
            }
            
            return { transactionHash: receipt.transactionHash };
        } catch (error) {
            console.error('Resolve market error:', error);
            throw error;
        }
    }

    async getMarketDetails(marketId: any) {
        try {
            const market = await this.contract.getMarket(marketId);
            const odds = await this.contract.getMarketOdds(marketId);
            
            return {
                marketId: market.marketId.toString(),
                chainId: market.chainId,
                description: market.description,
                creator: market.creator,
                options: market.options,
                liquidity: ethers.formatEther(market.liquidity),
                totalBets: ethers.formatEther(market.totalBets),
                createdAt: new Date(parseInt(market.createdAt) * 1000),
                resolvedAt: market.resolvedAt > 0 ? new Date(parseInt(market.resolvedAt) * 1000) : null,
                winningOption: market.winningOption.toString(),
                isActive: market.isActive,
                odds: odds.map((o: any) => ({
                    optionIndex: o.optionIndex.toString(),
                    odds: parseFloat(ethers.formatEther(o.odds)),
                    totalAmount: ethers.formatEther(o.totalAmount)
                }))
            };
        } catch (error) {
            console.error('Get market details error:', error);
            throw error;
        }
    }

    async getUserBets(userAddress: any) {
        try {
            const bets = await this.contract.getUserBets(userAddress);
            
            return bets.map((bet: any) => ({
                betId: bet.betId.toString(),
                marketId: bet.marketId.toString(),
                optionIndex: bet.optionIndex.toString(),
                amount: ethers.formatEther(bet.amount),
                placedAt: new Date(parseInt(bet.placedAt) * 1000),
                resolved: bet.resolved,
                payout: ethers.formatEther(bet.payout)
            }));
        } catch (error) {
            console.error('Get user bets error:', error);
            throw error;
        }
    }

    // Event Listeners
    onMarketCreated(callback: any) {
        this.contract.on('MarketCreated', callback);
    }

    onBetPlaced(callback: any) {
        this.contract.on('BetPlaced', callback);
    }

    onMarketResolved(callback: any) {
        this.contract.on('MarketResolved', callback);
    }

    onOddsUpdated(callback: any) {
        this.contract.on('OddsUpdated', callback);
    }

    // Remove all listeners
    removeAllListeners() {
        this.contract.removeAllListeners();
    }

    // Get contract address
    getContractAddress() {
        return this.contractAddress;
    }

    // Check if wallet is connected
    isConnected() {
        return this.connected && this.contract !== null;
    }

    // Disconnect
    disconnect() {
        this.removeAllListeners();
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.connected = false;
        this.contractAddress = null;
    }
}

// Singleton instance
export const lineraSDK = new LineraSDK();

// Helper Functions
export const formatLineraAmount = (amount: any, decimals = 18) => {
    return ethers.formatUnits(amount, decimals);
};

export const parseLineraAmount = (amount: any, decimals = 18) => {
    return ethers.parseUnits(amount, decimals);
};

export const getShortAddress = (address: any) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getExplorerLink = (hash: any, type = 'tx') => {
    return `${CONWAY_TESTNET.EXPLORER_URL}/${type}/${hash}`;
};

// Initialize WebSocket connection for real-time updates
export const initWebSocket = (url: any) => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
        console.log('Connected to Linera WebSocket');
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            // Handle different message types
            switch (data.type) {
                case 'market_update':
                    window.dispatchEvent(new CustomEvent('linera-market-update', {
                        detail: data.payload
                    }));
                    break;
                case 'odds_update':
                    window.dispatchEvent(new CustomEvent('linera-odds-update', {
                        detail: data.payload
                    }));
                    break;
                case 'bet_placed':
                    window.dispatchEvent(new CustomEvent('linera-bet-placed', {
                        detail: data.payload
                    }));
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('Disconnected from Linera WebSocket');
        // Attempt reconnect after delay
        setTimeout(() => initWebSocket(url), 5000);
    };
    
    return ws;
};

// Export utilities
export default {
    CONWAY_TESTNET,
    LineraSDK,
    lineraSDK,
    formatLineraAmount,
    parseLineraAmount,
    getShortAddress,
    getExplorerLink,
    initWebSocket
};