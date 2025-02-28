'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { useStats } from '@/hooks/useStats';
import GameCanvas from '@/components/GameCanvas';
import Stats from '@/components/Stats';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TransactionForm from '@/components/TransactionForm';

export default function Home() {
  // Game state
  const {
    gameState,
    standardBlocks,
    flashBlocks,
    catcher,
    gameWidth,
    gameHeight,
    moveCatcher,
    submitTransaction,
    CATCHER_HEIGHT,
    STANDARD_BLOCK_COLOR,
    FLASH_BLOCK_COLOR,
  } = useGameState();
  
  // Stats
  const stats = useStats(
    standardBlocks,
    flashBlocks,
    gameState.standardConfirmationTime,
    gameState.flashConfirmationTime
  );
  
  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Force re-render on resize
      // The useGameState hook will handle the actual resizing
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-2 md:p-4 bg-gradient-to-b from-slate-50 via-slate-100 to-white text-slate-800 overflow-x-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-100 blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-orange-100 blur-3xl opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full bg-purple-100 blur-3xl opacity-60"></div>
      </div>
      
      <header className="w-full max-w-2xl mb-2 flex flex-col sm:flex-row justify-between items-center gap-2 relative z-10">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-400 to-orange-400">
            FlashCatch
          </h1>
          <p className="text-xs md:text-sm text-slate-600 mt-0.5">
            Experience the 10x speed of Flashblocks on Base Sepolia
          </p>
        </div>
      </header>
      
      {/* Game Instructions - Collapsible */}
      <motion.div 
        className="w-full max-w-2xl mb-2 overflow-hidden relative z-10"
        initial={{ height: 'auto' }}
        animate={{ height: showInstructions ? 'auto' : '36px' }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
        >
          <div 
            className="p-2 flex justify-between items-center cursor-pointer bg-gradient-to-r from-slate-50 to-white"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            <h2 className="text-base font-semibold text-slate-700">Game Instructions</h2>
            <button className="text-slate-400 hover:text-slate-700 transition-colors">
              {showInstructions ? '▲' : '▼'}
            </button>
          </div>
          
          {showInstructions && (
            <motion.div 
              className="px-3 pb-3 text-slate-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-1.5 shadow-sm"></span>
                  <span className="text-xs">Standard blocks (2s)</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1.5 shadow-sm"></span>
                  <span className="text-xs">Flash blocks (200ms)</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-1.5 shadow-sm"></span>
                  <span className="text-xs">Your transaction</span>
                </div>
              </div>
              
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <h3 className="font-medium mb-0.5 text-blue-500 text-xs">Controls:</h3>
                  <p className="text-xs">
                    <strong>Desktop:</strong> Move your mouse to control the paddle.<br />
                    <strong>Mobile:</strong> Touch and drag to move.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <h3 className="font-medium mb-0.5 text-orange-500 text-xs">Objective:</h3>
                  <p className="text-xs">
                    Catch falling blocks with the paddle and submit a test transaction to see how much faster it confirms in Flashblocks!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <div className="w-full max-w-2xl flex flex-col lg:flex-row gap-2 relative z-10">
        <motion.div 
          className="flex-1 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <GameCanvas
              standardBlocks={standardBlocks}
              flashBlocks={flashBlocks}
              catcher={catcher}
              gameWidth={gameWidth}
              gameHeight={gameHeight}
              catcherHeight={CATCHER_HEIGHT}
              standardBlockColor={STANDARD_BLOCK_COLOR}
              flashBlockColor={FLASH_BLOCK_COLOR}
              onCatcherMove={moveCatcher}
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="w-full lg:w-64 flex flex-col gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Stats stats={stats} gameState={gameState} />
          
          {gameState.userTransactionHash ? (
            <div className="w-full bg-green-50 rounded-lg p-4 border border-green-200 text-center">
              <p className="text-green-700 text-sm font-medium mb-1">Transaction Sent</p>
              <p className="text-xs text-green-600 truncate">
                {gameState.userTransactionHash.substring(0, 10)}...
                {gameState.userTransactionHash.substring(gameState.userTransactionHash.length - 10)}
              </p>
            </div>
          ) : (
            <Card className="w-full border-slate-200 shadow-md bg-white overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400"></div>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-slate-800">Submit Transaction</CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                <TransactionForm 
                  onSubmit={submitTransaction}
                  disabled={false}
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
      
      <footer className="mt-3 text-center text-xs text-slate-500 relative z-10 w-full max-w-2xl px-1 pb-2">
        <p>
          Built for the Base Flashblocks Builder Side Quest at ETHDenver 2024
        </p>
        <p className="mt-0.5">
          <a
            href="https://github.com/yourusername/flashcatch"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
