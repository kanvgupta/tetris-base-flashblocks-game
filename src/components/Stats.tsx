import React from 'react';
import { motion } from 'framer-motion';
import { StatsState, GameState } from '@/types';

interface StatsProps {
  stats: StatsState;
  gameState: GameState;
}

export const Stats: React.FC<StatsProps> = ({ stats, gameState }) => {
  // Format time in milliseconds to seconds with 2 decimal places
  const formatTime = (time: number | null) => {
    if (time === null) return 'N/A';
    return `${(time / 1000).toFixed(2)}s`;
  };
  
  // Calculate speedup factor
  const speedupFactor = stats.averageStandardConfirmationTime && stats.averageFlashConfirmationTime
    ? (stats.averageStandardConfirmationTime / stats.averageFlashConfirmationTime).toFixed(1)
    : 'N/A';
  
  return (
    <motion.div
      className="bg-white rounded-xl p-6 text-slate-700 shadow-md border border-slate-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold mb-5 text-slate-800">Stats Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100">
          <h3 className="font-bold text-blue-600 mb-3 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
            Standard Blocks
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Blocks/min:</span>
              <span className="font-mono">{stats.standardBlocksPerMinute.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Caught:</span>
              <span className="font-mono">{gameState.standardBlocksCaught}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tx/min:</span>
              <span className="font-mono">{stats.standardTransactionThroughput.toFixed(0)}</span>
            </div>
            {gameState.userTransactionHash && (
              <div className="flex justify-between">
                <span className="text-slate-600">Confirm:</span>
                <span className="font-mono font-bold">{formatTime(gameState.standardConfirmationTime)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg shadow-sm border border-orange-100">
          <h3 className="font-bold text-orange-600 mb-3 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-2"></span>
            Flash Blocks
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Blocks/min:</span>
              <span className="font-mono">{stats.flashBlocksPerMinute.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Caught:</span>
              <span className="font-mono">{gameState.flashBlocksCaught}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tx/min:</span>
              <span className="font-mono">{stats.flashTransactionThroughput.toFixed(0)}</span>
            </div>
            {gameState.userTransactionHash && (
              <div className="flex justify-between">
                <span className="text-slate-600">Confirm:</span>
                <span className="font-mono font-bold">{formatTime(gameState.flashConfirmationTime)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-5 bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Game Score</h3>
          <span className="font-mono text-xl font-bold text-amber-500">{gameState.score}</span>
        </div>
        
        {gameState.userTransactionHash && (
          <motion.div 
            className="mt-4 pt-4 border-t border-slate-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h4 className="font-bold text-green-600 flex items-center mb-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2"></span>
              Your Transaction
            </h4>
            <div className="bg-white p-3 rounded text-xs font-mono break-all mb-3 border border-slate-200">
              {gameState.userTransactionHash}
            </div>
            
            {gameState.flashConfirmationTime && gameState.standardConfirmationTime && (
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <p className="font-bold text-sm text-center text-green-700">
                  Flashblocks is <span className="text-amber-500">{speedupFactor}x</span> faster!
                </p>
                <p className="text-xs text-slate-600 text-center mt-1">
                  (Real-world confirmation time is nearly instant)
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Speedometer visualization */}
      {stats.flashBlocksPerMinute > 0 && (
        <div className="mt-5 bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-bold mb-3 text-slate-700">Speed Comparison</h3>
          <div className="relative h-5 bg-white rounded-full overflow-hidden shadow-inner border border-slate-200">
            <div 
              className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-300 rounded-full"
              style={{ width: `${(stats.standardBlocksPerMinute / (stats.standardBlocksPerMinute + stats.flashBlocksPerMinute)) * 100}%` }}
            />
            <div 
              className="absolute h-full bg-gradient-to-r from-orange-400 to-orange-300 rounded-full"
              style={{ 
                width: `${(stats.flashBlocksPerMinute / (stats.standardBlocksPerMinute + stats.flashBlocksPerMinute)) * 100}%`,
                left: `${(stats.standardBlocksPerMinute / (stats.standardBlocksPerMinute + stats.flashBlocksPerMinute)) * 100}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-3 text-slate-600">
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1"></span>
              <span>Standard (2s)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1"></span>
              <span>Flash (200ms)</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Stats; 