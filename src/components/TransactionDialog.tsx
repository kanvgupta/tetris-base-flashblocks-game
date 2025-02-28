import React from 'react';
import TransactionForm from './TransactionForm';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TransactionDialogProps {
  onDismiss: () => void;
  onSubmit: (txHash: string) => void;
  disabled: boolean;
  open: boolean;
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({ 
  onDismiss, 
  onSubmit,
  disabled,
  open
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent 
        className="p-0 border-0 shadow-none bg-transparent"
        onEscapeKeyDown={onDismiss}
        onInteractOutside={onDismiss}
      >
        <DialogTitle className="sr-only">Submit Transaction</DialogTitle>
        <Card className="w-full max-w-md mx-auto border-slate-200 shadow-xl bg-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400"></div>
          
          <CardHeader className="pt-6">
            <CardTitle className="text-xl text-slate-800">Submit Transaction</CardTitle>
          </CardHeader>
          
          <CardContent>
            <TransactionForm 
              onSubmit={(txHash) => {
                onSubmit(txHash);
                onDismiss();
              }} 
              disabled={disabled} 
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog; 