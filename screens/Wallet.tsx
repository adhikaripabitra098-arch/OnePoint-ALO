import React, { useState } from 'react';
import { Screen, Card, Button, BackButton } from '../components/UI';
import { Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { WalletTransaction } from '../types';

interface WalletProps {
  balance: number;
  transactions: WalletTransaction[];
  onNavigate: (screen: string) => void;
}

export const WalletScreen: React.FC<WalletProps> = ({ balance, transactions, onNavigate }) => {
  return (
    <Screen>
      <div className="absolute top-12 left-6 z-50">
        <BackButton onClick={() => onNavigate('home')} />
      </div>

      <div className="mt-32 mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold">Wallet</h1>
      </div>

      <Card className="bg-[#2A2E36] mb-8 py-8 text-center relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <p className="text-textMuted text-sm mb-2 font-medium">Available Balance</p>
        <h1 className="text-5xl font-bold tracking-tight mb-2">${balance.toFixed(2)}</h1>
        <p className="text-primary text-sm font-medium">50 credits available</p>
      </Card>

      <Button fullWidth icon={Plus} className="mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>Top Up</Button>

      <h3 className="font-bold text-lg mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>Recent Transactions</h3>
      
      <div className="space-y-4 pb-24 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-textMuted font-medium">
            No transactions yet
          </div>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-2">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.isCredit ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white'}`}>
                   {tx.isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                 </div>
                 <div>
                   <p className="font-bold">{tx.title}</p>
                   <p className="text-xs text-textMuted font-medium">{tx.date.toLocaleDateString()}</p>
                 </div>
               </div>
               <span className={`font-mono font-bold ${tx.isCredit ? 'text-green-400' : 'text-white'}`}>
                 {tx.isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
               </span>
            </div>
          ))
        )}
      </div>
    </Screen>
  );
};