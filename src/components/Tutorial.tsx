import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

interface TutorialProps {
  onDismiss: () => void;
  open: boolean;
}

export const Tutorial: React.FC<TutorialProps> = ({ onDismiss, open }) => {
  const [step, setStep] = useState(0);
  
  const tutorialSteps = [
    {
      title: 'Welcome to FlashCatch!',
      content: 'Experience the speed difference between traditional 2-second blocks and 200-millisecond Flashblocks on Base Sepolia through this interactive game.',
      image: '🎮',
    },
    {
      title: 'Catch Falling Blocks',
      content: 'Move the catcher at the bottom of the screen to catch falling blocks. Blue blocks are standard (2s) blocks, and orange blocks are Flashblocks (200ms).',
      image: '🧱',
    },
    {
      title: 'Submit a Transaction',
      content: 'Try submitting a test transaction to see how much faster it confirms in Flashblocks compared to standard blocks. Watch for the green block containing your transaction!',
      image: '💸',
    },
    {
      title: 'Track Your Stats',
      content: 'The stats dashboard shows you real-time metrics about block production, confirmation times, and your score.',
      image: '📊',
    },
  ];
  
  const currentStep = tutorialSteps[step];
  
  const nextStep = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      onDismiss();
    }
  };
  
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent 
        className="p-0 border-0 shadow-none bg-transparent"
        onEscapeKeyDown={onDismiss}
        onInteractOutside={onDismiss}
      >
        <DialogTitle className="sr-only">{currentStep.title}</DialogTitle>
        <Card className="w-full max-w-md mx-auto bg-white border-slate-200 shadow-xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400"></div>
          
          <CardContent className="p-8 pt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="text-6xl mb-6 bg-gradient-to-br from-blue-50 to-orange-50 p-6 rounded-full shadow-md relative overflow-hidden flex items-center justify-center">
                  <div className="relative z-10">{currentStep.image}</div>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-slate-800 text-center">{currentStep.title}</h2>
                <p className="text-center mb-6 text-slate-600 leading-relaxed max-w-sm">{currentStep.content}</p>
              </motion.div>
            </AnimatePresence>
          </CardContent>
          
          <CardFooter className="flex justify-between p-8 pt-0">
            <button
              className={`px-5 py-2 rounded-lg transition-all duration-200 ${
                step > 0 ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm' : 'bg-slate-50 opacity-50 cursor-not-allowed text-slate-400 border border-slate-200'
              }`}
              onClick={prevStep}
              disabled={step === 0}
            >
              Back
            </button>
            
            <div className="flex space-x-2">
              {tutorialSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    i === step ? 'bg-gradient-to-r from-blue-400 to-orange-400 scale-125' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-orange-400 hover:from-blue-600 hover:to-orange-500 text-white font-medium transition-all duration-200 shadow-sm"
              onClick={nextStep}
            >
              {step < tutorialSteps.length - 1 ? 'Next' : 'Start Playing'}
            </button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default Tutorial; 