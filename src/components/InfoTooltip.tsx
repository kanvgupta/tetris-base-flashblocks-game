import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoTooltipProps {
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  
  const facts = [
    "Flashblocks are 10x faster than standard blocks, with a 200ms block time.",
    "Faster blocks mean quicker transaction confirmations and a better user experience.",
    "Base Sepolia is a testnet for the Base blockchain, which is built on Ethereum's layer 2 scaling solution.",
    "Flashblocks technology was developed by Flashbots to improve blockchain efficiency.",
    "Traditional blocks on Base have a 2-second block time, which is already faster than Ethereum's ~12 seconds.",
    "The WebSocket API allows developers to stream real-time block updates from the Flashblocks endpoint.",
  ];
  
  // Rotate through facts every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prevIndex) => (prevIndex + 1) % facts.length);
      setIsVisible(true);
      
      // Hide after 7 seconds
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 7000);
      
      return () => clearTimeout(timeout);
    }, 10000);
    
    // Show first fact after 3 seconds
    const initialTimeout = setTimeout(() => {
      setIsVisible(true);
      
      // Hide after 7 seconds
      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 7000);
      
      return () => clearTimeout(hideTimeout);
    }, 3000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [facts.length]);
  
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute bottom-full mb-4 p-4 bg-white rounded-lg shadow-md text-slate-700 text-sm max-w-xs border border-slate-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="font-bold mb-2 text-blue-500">Did You Know?</div>
            <p className="leading-relaxed">{facts[factIndex]}</p>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white border-r border-b border-slate-200" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        className="bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm transition-colors duration-200 border border-blue-100"
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Show information"
      >
        ?
      </button>
    </div>
  );
};

export default InfoTooltip; 