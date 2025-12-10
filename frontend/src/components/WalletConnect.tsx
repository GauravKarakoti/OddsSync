import { useState, useEffect } from 'react';
import { Wallet, LogOut, Copy, ExternalLink, Check } from 'lucide-react';

// Mock wallet connection for Conway testnet
const CONWAY_TESTNET_CONFIG = {
    networkId: 'conway-testnet',
    chainId: '0x4c4e', // Conway testnet chain ID
    rpcUrl: 'https://rpc.testnet-conway.linera.net',
    explorerUrl: 'https://explorer.testnet-conway.linera.net',
    faucetUrl: 'https://faucet.testnet-conway.linera.net'
};

export default function WalletConnect() {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState('');
    const [balance, setBalance] = useState('0.00');
    const [network, setNetwork] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Mock wallet connection for demo
    const mockWallets = [
        { name: 'Dynamic Wallet', icon: '🔄' },
        { name: 'MetaMask', icon: '🦊' },
        { name: 'WalletConnect', icon: '⚡' },
        { name: 'Coinbase Wallet', icon: '🔷' }
    ];

    // Mock connect function
    const connectWallet = async (walletName: any) => {
        setIsConnecting(true);
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock address for Conway testnet
        const mockAddress = `0x${Array.from({length: 40}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('')}`;
        
        const mockBalance = (Math.random() * 1000).toFixed(2);
        
        setAddress(mockAddress);
        setBalance(mockBalance);
        setNetwork('Conway Testnet');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Store in localStorage for demo
        localStorage.setItem('oddsync_wallet', JSON.stringify({
            address: mockAddress,
            balance: mockBalance,
            network: 'Conway Testnet',
            connectedAt: new Date().toISOString()
        }));
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('walletConnected', {
            detail: { address: mockAddress }
        }));
    };

    // Disconnect wallet
    const disconnectWallet = () => {
        setAddress('');
        setBalance('0.00');
        setNetwork('');
        setIsConnected(false);
        localStorage.removeItem('oddsync_wallet');
        
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
    };

    // Copy address to clipboard
    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // View in explorer
    const viewInExplorer = () => {
        window.open(`${CONWAY_TESTNET_CONFIG.explorerUrl}/address/${address}`, '_blank');
    };

    // Get test tokens from faucet
    const getTestTokens = () => {
        window.open(CONWAY_TESTNET_CONFIG.faucetUrl, '_blank');
    };

    // Check for existing connection on mount
    useEffect(() => {
        const saved = localStorage.getItem('oddsync_wallet');
        if (saved) {
            try {
                const walletData = JSON.parse(saved);
                setAddress(walletData.address);
                setBalance(walletData.balance);
                setNetwork(walletData.network);
                setIsConnected(true);
            } catch (e) {
                localStorage.removeItem('oddsync_wallet');
            }
        }
    }, []);

    return (
        <div className="relative">
            {!isConnected ? (
                // Connect Button
                <div className="relative group">
                    <button
                        onClick={() => (document as any).getElementById('walletModal').classList.remove('hidden')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                    >
                        <Wallet className="w-5 h-5" />
                        <span>Connect Wallet</span>
                    </button>
                    
                    {/* Wallet Modal */}
                    <div id="walletModal" className="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
                                    <button
                                        onClick={() => (document as any).getElementById('walletModal').classList.add('hidden')}
                                        className="p-2 hover:bg-gray-800 rounded-lg"
                                    >
                                        <span className="text-gray-400 text-2xl">×</span>
                                    </button>
                                </div>
                                
                                <p className="text-gray-400 mb-6">
                                    Connect your wallet to start betting on Conway Testnet
                                </p>
                                
                                <div className="space-y-3">
                                    {mockWallets.map(wallet => (
                                        <button
                                            key={wallet.name}
                                            onClick={() => {
                                                connectWallet(wallet.name);
                                                (document as any).getElementById('walletModal').classList.add('hidden');
                                            }}
                                            disabled={isConnecting}
                                            className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-200 group"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{wallet.icon}</span>
                                                <div className="text-left">
                                                    <div className="font-medium text-white">{wallet.name}</div>
                                                    <div className="text-sm text-gray-400">Connect to Conway Testnet</div>
                                                </div>
                                            </div>
                                            {isConnecting ? (
                                                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                                            ) : (
                                                <div className="text-gray-400 group-hover:text-purple-400">→</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="text-sm text-gray-400">
                                        <div className="flex items-center mb-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                            Conway Testnet Network
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Make sure your wallet is connected to Conway Testnet.
                                            Get test tokens from the faucet if needed.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Connected State
                <div className="group">
                    <button className="flex items-center space-x-3 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-800 hover:border-purple-500 transition-all duration-300">
                        <div className="text-left">
                            <div className="text-sm text-gray-400">{network}</div>
                            <div className="font-medium text-white">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-sm">
                                ${balance}
                            </div>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="p-4">
                            {/* Wallet Info */}
                            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-xs text-gray-400 mb-1">Connected Wallet</div>
                                <div className="flex items-center justify-between">
                                    <div className="font-mono text-sm text-white">
                                        {address.slice(0, 10)}...{address.slice(-8)}
                                    </div>
                                    <button
                                        onClick={copyAddress}
                                        className="p-1 hover:bg-gray-700 rounded"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Balance */}
                            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-xs text-gray-400 mb-1">Balance</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-bold text-white">${balance}</div>
                                    <button
                                        onClick={getTestTokens}
                                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white"
                                    >
                                        Get Test Tokens
                                    </button>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="space-y-2">
                                <button
                                    onClick={viewInExplorer}
                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                        <span className="text-white">View in Explorer</span>
                                    </div>
                                    <div className="text-gray-400">↗</div>
                                </button>
                                
                                <button
                                    onClick={disconnectWallet}
                                    className="w-full flex items-center justify-between p-3 hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <LogOut className="w-4 h-4 text-red-400" />
                                        <span className="text-red-400">Disconnect</span>
                                    </div>
                                </button>
                            </div>
                            
                            {/* Network Info */}
                            <div className="mt-4 pt-4 border-t border-gray-800">
                                <div className="text-xs text-gray-400">
                                    <div className="flex items-center mb-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                        Connected to Conway Testnet
                                    </div>
                                    <div className="text-gray-500">
                                        RPC: {CONWAY_TESTNET_CONFIG.rpcUrl.slice(8, 20)}...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Click outside to close dropdown */}
            {isConnected && (
                <div 
                    className="fixed inset-0 z-40 hidden"
                    id="dropdownBackdrop"
                    onClick={() => {
                        // Handle click outside
                    }}
                ></div>
            )}
        </div>
    );
}