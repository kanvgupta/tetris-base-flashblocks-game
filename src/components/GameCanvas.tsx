import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Block from './Block';
import Catcher from './Catcher';
import { GameBlock, CatcherState } from '@/types';

interface GameCanvasProps {
  standardBlocks: GameBlock[];
  flashBlocks: GameBlock[];
  catcher: CatcherState;
  gameWidth: number;
  gameHeight: number;
  catcherHeight: number;
  standardBlockColor: string;
  flashBlockColor: string;
  onCatcherMove: (x: number) => void;
}

// Define particle type
interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  standardBlocks,
  flashBlocks,
  catcher,
  gameWidth,
  gameHeight,
  catcherHeight,
  standardBlockColor,
  flashBlockColor,
  onCatcherMove,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isTouching, setIsTouching] = useState(false);
  
  // Handle mouse movement for desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      onCatcherMove(x - catcher.width / 2);
    };
    
    const currentCanvas = canvasRef.current;
    
    if (currentCanvas) {
      currentCanvas.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (currentCanvas) {
        currentCanvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [catcher.width, onCatcherMove]);
  
  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true);
    handleTouchMove(e);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canvasRef.current || !isTouching) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    
    onCatcherMove(x - catcher.width / 2);
  };
  
  const handleTouchEnd = () => {
    setIsTouching(false);
  };
  
  // Particle effects for caught blocks
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Track previously caught blocks to avoid duplicate particles
  const caughtBlocksRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    // Check for newly caught blocks
    const newCaughtStandard = standardBlocks.filter(block => 
      block.caught && !caughtBlocksRef.current.has(block.id)
    );
    
    const newCaughtFlash = flashBlocks.filter(block => 
      block.caught && !caughtBlocksRef.current.has(block.id)
    );
    
    // Add newly caught blocks to the set
    newCaughtStandard.forEach(block => caughtBlocksRef.current.add(block.id));
    newCaughtFlash.forEach(block => caughtBlocksRef.current.add(block.id));
    
    if (newCaughtStandard.length > 0 || newCaughtFlash.length > 0) {
      const timestamp = Date.now();
      const newParticles: Particle[] = [
        ...newCaughtStandard.map((block, index) => ({
          id: `particle-${block.id}-${timestamp}-${index}`,
          x: block.x + block.width / 2,
          y: block.y + block.height / 2,
          color: standardBlockColor,
        })),
        ...newCaughtFlash.map((block, index) => ({
          id: `particle-${block.id}-${timestamp}-${index}`,
          x: block.x + block.width / 2,
          y: block.y + block.height / 2,
          color: flashBlockColor,
        })),
      ];
      
      // Create multiple particles per block for a better effect
      const extraParticles: Particle[] = [];
      for (const block of [...newCaughtStandard, ...newCaughtFlash]) {
        for (let i = 0; i < 5; i++) {
          extraParticles.push({
            id: `particle-extra-${block.id}-${timestamp}-${i}`,
            x: block.x + Math.random() * block.width,
            y: block.y + Math.random() * block.height,
            color: block.isFlashBlock ? flashBlockColor : standardBlockColor,
          });
        }
      }
      
      setParticles(prev => [...prev, ...newParticles, ...extraParticles]);
      
      // Remove particles after animation
      setTimeout(() => {
        setParticles(prev => 
          prev.filter(p => !newParticles.some(np => np.id === p.id) && !extraParticles.some(ep => ep.id === p.id))
        );
      }, 1000);
    }
  }, [standardBlocks, flashBlocks, standardBlockColor, flashBlockColor]);
  
  return (
    <motion.div
      ref={canvasRef}
      className="relative overflow-hidden rounded-lg bg-gradient-to-b from-gray-900 to-black border-2 border-gray-700 shadow-lg shadow-blue-900/20"
      style={{ 
        width: gameWidth, 
        height: gameHeight,
        maxWidth: '100%',
        margin: '0 auto'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background grid lines */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`grid-col-${i}`} className="border-r border-gray-800" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`grid-row-${i}`} className="border-b border-gray-800" />
        ))}
      </div>
      
      {/* Game area indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-orange-500 opacity-70"></div>
      
      {/* Render standard blocks */}
      {standardBlocks.map(block => (
        <Block key={block.id} block={block} color={standardBlockColor} />
      ))}
      
      {/* Render flash blocks */}
      {flashBlocks.map(block => (
        <Block key={block.id} block={block} color={flashBlockColor} />
      ))}
      
      {/* Render particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: 4,
            height: 4,
            backgroundColor: particle.color,
          }}
          initial={{ scale: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30],
            y: [0, Math.random() * 40 - 20, Math.random() * 60 - 30],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1 }}
        />
      ))}
      
      {/* Render catcher */}
      <Catcher catcher={catcher} height={catcherHeight} gameHeight={gameHeight} />
      
      {/* Mobile instructions */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-white text-xs opacity-70 pointer-events-none bg-black/30 py-1">
        Move paddle to catch falling blocks
      </div>
    </motion.div>
  );
};

export default GameCanvas; 