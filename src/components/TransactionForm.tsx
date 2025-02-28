import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFixedWallet, submitTestTransaction } from '@/lib/blockchain';
import { ethers } from 'ethers';

interface TransactionFormProps {
  onSubmit: (txHash: string) => void;
  disabled: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, disabled }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('');
  
  // Get wallet info on component mount
  useEffect(() => {
    const loadWalletInfo = async () => {
      try {
        const wallet = getFixedWallet();
        setWalletAddress(wallet.address);
        
        // Check if provider exists before using it
        if (wallet.provider) {
          const balance = await wallet.provider.getBalance(wallet.address);
          setWalletBalance(ethers.formatEther(balance));
        } else {
          console.error('Wallet provider is null');
          setWalletBalance('0.0');
        }
      } catch (err) {
        console.error('Error loading wallet info:', err);
        setWalletBalance('0.0');
      }
    };
    
    loadWalletInfo();
  }, []);
  
  const handleSubmitTransaction = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use a predefined test address (Base Sepolia faucet address)
      const testAddress = '0x4200000000000000000000000000000000000006';
      
      // Submit a zero-value transaction using the fixed wallet
      const txHash = await submitTestTransaction(null, testAddress, '0');
      
      onSubmit(txHash);
    } catch (err) {
      console.error('Error submitting transaction:', err);
      setError('Failed to submit transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div
      className="bg-white rounded-xl p-6 text-slate-700 shadow-md border border-slate-200"
    >
      <h2 className="text-xl font-bold mb-3 text-slate-800">
        Submit Test Transaction
      </h2>
      
      <p className="text-sm mb-5 text-slate-600">
        Submit a test transaction to see how much faster it confirms in Flashblocks compared to standard blocks.
      </p>
      
      {walletAddress && (
        <div className="bg-slate-50 p-4 rounded-lg mb-5 text-sm border border-slate-200 shadow-sm">
          <div className="flex flex-col space-y-3">
            <div>
              <span className="text-slate-500 text-xs">Wallet Address:</span>
              <div className="font-mono text-xs bg-white p-2 rounded mt-1 border border-slate-200 truncate">
                {walletAddress}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Balance:</span>
              <span className="font-mono font-bold text-green-600">{parseFloat(walletBalance).toFixed(6)} ETH</span>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div 
          className="bg-red-50 p-4 rounded-lg mb-5 text-sm border border-red-200 text-red-700"
        >
          <div className="flex items-start">
            <span className="text-red-500 mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <button
        className={`w-full py-3 px-4 rounded-lg font-bold shadow-sm ${
          disabled || isLoading
            ? 'bg-slate-100 cursor-not-allowed text-slate-400 border border-slate-200'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border border-blue-400'
        }`}
        onClick={handleSubmitTransaction}
        disabled={disabled || isLoading}
        style={{ minHeight: '48px' }}
      >
        {isLoading ? (
          <span className="inline-flex items-center justify-center">
            <svg className="animate-spin h-4 w-4 text-current opacity-80 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting Transaction...
          </span>
        ) : (
          <span className="inline-block w-full">Submit Zero-Value Transaction</span>
        )}
      </button>
      
      {disabled && (
        <div 
          className="mt-5 bg-amber-50 p-4 rounded-lg text-sm border border-amber-200 text-amber-700"
        >
          <div className="flex items-center">
            <span className="text-amber-500 mr-2">🔍</span>
            <p>
              Transaction submitted! Watch for the <span className="font-bold text-green-600">green block</span> containing your transaction.
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-5 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
        <p className="flex items-center">
          <span className="text-blue-500 mr-1">ℹ️</span>
          This uses a fixed wallet for demonstration purposes.
        </p>
        <p className="mt-1">
          A zero-value transaction will be sent to the Base Sepolia faucet contract.
        </p>
      </div>
    </div>
  );
};

export default TransactionForm; 