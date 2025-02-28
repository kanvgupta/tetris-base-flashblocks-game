import React from 'react';
import { motion } from 'framer-motion';
import { CatcherState } from '@/types';

interface CatcherProps {
  catcher: CatcherState;
  height: number;
  gameHeight: number;
}

const Catcher: React.FC<CatcherProps> = ({ catcher, height, gameHeight }) => {
  return (
    <motion.div
      className="absolute rounded-lg shadow-lg"
      style={{
        left: catcher.x,
        bottom: 10,
        width: catcher.width,
        height: height,
        background: 'linear-gradient(to right, #3b82f6, #f97316)',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(249, 115, 22, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/2 h-2 bg-white/30 rounded-full"></div>
      </div>
    </motion.div>
  );
};

export default Catcher; 