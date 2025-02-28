import React from 'react';
import { motion } from 'framer-motion';
import { GameBlock } from '@/types';

interface BlockProps {
  block: GameBlock;
  color: string;
}

const Block: React.FC<BlockProps> = ({ block, color }) => {
  // Don't render if the block is caught
  if (block.caught) return null;
  
  // Calculate opacity based on transaction count
  const opacity = Math.min(0.3 + (block.transactionCount * 0.05), 1);
  
  // Check if this block contains the user's transaction (with case-insensitive comparison)
  const hasUserTransaction = block.details?.transactions.some(tx => {
    if (!tx.isUserTransaction && tx.hash && window.userTxHash) {
      // Try direct case-insensitive comparison as a backup
      return tx.hash.toLowerCase() === window.userTxHash.toLowerCase();
    }
    return tx.isUserTransaction;
  }) || false;
  
  // Add debug logging for transactions
  if (block.isFlashBlock && block.details && block.details.transactions && block.details.transactions.length > 0) {
    // Log once every few seconds to avoid flooding the console
    const shouldLog = Math.random() < 0.1; 
    if (shouldLog) {
      console.log(`Flash block ${block.blockNumber} has ${block.details.transactions.length} transactions`);
      
      // Check for user transactions and log them
      const userTxs = block.details.transactions.filter(tx => tx.isUserTransaction);
      if (userTxs.length > 0) {
        console.log(`Found user transaction in flash block ${block.blockNumber}:`, userTxs.map(tx => tx.hash));
      }
    }
  }
  
  // Determine border color based on block type and user transaction
  const borderColor = hasUserTransaction 
    ? 'rgba(34, 197, 94, 0.8)' // Green border for user transaction
    : block.isFlashBlock 
      ? 'rgba(251, 146, 60, 0.7)' 
      : 'rgba(96, 165, 250, 0.7)';
  
  // Determine glow color based on block type and user transaction
  const glowColor = hasUserTransaction 
    ? 'rgba(34, 197, 94, 0.4)' // Green glow for user transaction
    : block.isFlashBlock 
      ? 'rgba(251, 146, 60, 0.3)' 
      : 'rgba(96, 165, 250, 0.3)';
  
  // Determine background color based on user transaction
  const backgroundColor = hasUserTransaction 
    ? 'rgba(34, 197, 94, 0.7)' // Green background for user transaction
    : color;
  
  return (
    <motion.div
      className="absolute rounded-lg flex items-center justify-center text-slate-700 text-xs font-mono"
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        backgroundColor: backgroundColor,
        opacity: opacity,
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 12px ${glowColor}`,
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: opacity, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
        <div className="text-[8px] truncate w-full text-center font-bold">
          {block.blockNumber}
        </div>
        <div className="text-[6px] truncate w-full text-center opacity-80">
          {block.transactionCount} tx
        </div>
        {hasUserTransaction && (
          <div className="text-[6px] font-bold mt-1 bg-white text-green-600 px-1 rounded-sm">
            YOUR TX
          </div>
        )}
      </div>
      
      {/* Visual indicator for transaction count */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 bg-white"
        style={{ 
          width: `${Math.min(block.transactionCount * 5, 100)}%`,
          opacity: 0.6
        }}
      />
    </motion.div>
  );
};

export default Block; 