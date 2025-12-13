import React, { useState } from 'react';
import { Screen, Card, BackButton } from '../components/UI';
import { Zap, Mail, Calendar, MessageSquare, ShoppingBag } from 'lucide-react';

interface IntegrationsProps {
  onNavigate: (screen: string) => void;
}

export const IntegrationsScreen: React.FC<IntegrationsProps> = ({ onNavigate }) => {
  const integrations = [
    { name: 'Gmail', icon: Mail, status: 'Connected', desc: 'Receipt parsing & refunds' },
    { name: 'Calendar', icon: Calendar, status: 'Connected', desc: 'Scheduling & reminders' },
    { name: 'WhatsApp', icon: MessageSquare, status: 'Not Connected', desc: 'Operator communication' },
    { name: 'Amazon', icon: ShoppingBag, status: 'Not Connected', desc: 'Order tracking' },
  ];

  return (
    <Screen>
      <div className="absolute top-12 left-6 z-50">
        <BackButton onClick={() => onNavigate('home')} />
      </div>

      <div className="mt-32 mb-6 animate-slide-up">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-textMuted mt-1 font-medium">Connect your digital life to OnePoint.</p>
      </div>

      <div className="space-y-4 pb-24 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {integrations.map((item, idx) => (
          <Card key={idx} className="flex items-center justify-between p-4" glassLevel="sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <item.icon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">{item.name}</h3>
                <p className="text-xs text-textMuted font-medium">{item.desc}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Connected' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-textMuted'}`}>
              {item.status}
            </div>
          </Card>
        ))}
        
        <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent border border-white/10 text-center">
           <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
             <Zap size={24} fill="black" />
           </div>
           <h3 className="font-bold text-lg mb-2">More coming soon</h3>
           <p className="text-sm text-white/70 font-medium">
             We are adding new service partners every week to automate more of your life.
           </p>
        </div>
      </div>
    </Screen>
  );
};