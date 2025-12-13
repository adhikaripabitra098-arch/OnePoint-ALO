import React from 'react';
import { Home, Zap, Wallet, Settings, Plus } from 'lucide-react';

interface NavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onFabClick: () => void;
}

export const BottomNavigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate, onFabClick }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'integrations', icon: Zap, label: 'Integrations' },
    { id: 'spacer', icon: null, label: '' }, 
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Bottom Nav Container */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F1115]/95 backdrop-blur-xl border-t border-white/5 pb-safe-bottom z-50">
        <div className="max-w-md mx-auto px-2 flex justify-between items-end h-[70px] pb-3 relative">
          
          {tabs.map((tab) => {
             if (tab.id === 'spacer') return <div key="spacer" className="w-[60px]" />; // Spacer for FAB

             const Icon = tab.icon!;
             const isActive = currentScreen === tab.id;
             
             return (
               <button 
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center justify-end w-16 h-12 gap-1 transition-all duration-300 ${isActive ? 'text-primary' : 'text-[#565A63] hover:text-white/60'}`}
               >
                 <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300 mb-0.5" />
                 <span className={`text-[10px] font-semibold tracking-tight transition-opacity duration-300 leading-none ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                   {tab.label}
                 </span>
               </button>
             );
          })}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-[40px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <button 
          onClick={onFabClick}
          className="w-[64px] h-[64px] bg-white text-black rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(255,255,255,0.3)] pointer-events-auto active:scale-90 hover:scale-105 transition-all duration-300 border-4 border-[#0F1115]"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
};