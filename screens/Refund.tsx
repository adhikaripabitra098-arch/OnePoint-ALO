import React, { useState } from 'react';
import { Screen, BackButton, Button } from '../components/UI';
import { ArrowUpRight, Check, Search, AlertCircle, ShoppingBag, Car, Coffee, Plane } from 'lucide-react';
import { WalletTransaction, Task, TaskStatus, TaskType } from '../types';

interface RefundProps {
  onNavigate: (screen: string) => void;
  transactions: WalletTransaction[];
  onCreateTask: (task: Task) => void;
}

export const RefundScreen: React.FC<RefundProps> = ({ onNavigate, transactions, onCreateTask }) => {
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  
  const handleRequestRefund = () => {
    if (!selectedTx) return;
    const tx = transactions.find(t => t.id === selectedTx);
    
    const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: `Refund: ${tx?.title || 'Unknown Transaction'}`,
        description: `Auto-generated refund request for $${Math.abs(tx?.amount || 0)}.`,
        type: TaskType.REFUND,
        status: TaskStatus.CREATED,
        estimatedCost: 0,
        confidenceScore: 0.95,
        createdAt: new Date(),
    };
    onCreateTask(newTask);
    onNavigate('home');
  };

  const categories = [
    { icon: Car, label: 'Transport' },
    { icon: ShoppingBag, label: 'Retail' },
    { icon: Coffee, label: 'Dining' },
    { icon: Plane, label: 'Travel' },
  ];

  return (
    <Screen>
      <div className="absolute top-8 left-6 z-50"> {/* Shifted up to top-8 */}
        <BackButton onClick={() => onNavigate('home')} />
      </div>

      <div className="mt-24 mb-6 animate-slide-up"> {/* Shifted up to mt-24 */}
        <h1 className="text-3xl font-bold mb-2">Request Refund</h1>
        <p className="text-white/60 text-lg font-medium leading-relaxed">
           Select a recent transaction. OnePoint will negotiate with the merchant automatically.
        </p>
      </div>

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        {categories.map((c, i) => (
           <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                 <c.icon size={20} className="text-white" />
              </div>
              <span className="text-xs text-textMuted font-medium">{c.label}</span>
           </div>
        ))}
      </div>

      <div className="relative mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text" 
            placeholder="Search transactions..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-[20px] h-12 pl-12 pr-4 text-white outline-none focus:bg-white/[0.08] transition-colors"
          />
      </div>

      <div className="flex-1 overflow-y-auto pb-24 space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
         <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Recent Transactions</h3>
         {transactions.filter(t => !t.isCredit).length === 0 ? (
            <div className="p-8 text-center border border-white/10 rounded-[24px] bg-white/[0.03]">
                <AlertCircle className="mx-auto mb-3 text-white/30" size={32} />
                <p className="text-white/60 font-medium">No eligible transactions found.</p>
            </div>
         ) : (
             transactions.filter(t => !t.isCredit).map((tx) => (
                <div 
                  key={tx.id}
                  onClick={() => setSelectedTx(tx.id)}
                  className={`p-5 rounded-[24px] border transition-all cursor-pointer flex items-center justify-between group ${selectedTx === tx.id ? 'bg-white border-white' : 'bg-white/[0.03] border-white/10 hover:bg-white/10'}`}
                >
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedTx === tx.id ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>
                          {selectedTx === tx.id ? <Check size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                          <h3 className={`font-bold text-base ${selectedTx === tx.id ? 'text-black' : 'text-white'}`}>{tx.title}</h3>
                          <p className={`text-xs font-medium ${selectedTx === tx.id ? 'text-black/60' : 'text-white/40'}`}>{tx.date.toLocaleDateString()}</p>
                      </div>
                   </div>
                   <span className={`font-mono font-bold ${selectedTx === tx.id ? 'text-black' : 'text-white'}`}>
                      ${Math.abs(tx.amount).toFixed(2)}
                   </span>
                </div>
             ))
         )}
      </div>

      <div className="absolute bottom-10 left-6 right-6">
          <Button onClick={handleRequestRefund} fullWidth disabled={!selectedTx} icon={ArrowUpRight}>
             Start Refund Process
          </Button>
      </div>
    </Screen>
  );
};