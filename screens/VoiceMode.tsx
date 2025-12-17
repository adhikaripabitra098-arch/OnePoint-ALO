import React, { useEffect, useState } from 'react';
import { Screen, BackButton } from '../components/UI';
import { Mic, MicOff, MoreHorizontal, Sparkles } from 'lucide-react';

interface VoiceProps {
  onNavigate: (screen: string) => void;
  userName: string;
}

export const VoiceModeScreen: React.FC<VoiceProps> = ({ onNavigate, userName }) => {
  const [isListening, setIsListening] = useState(true);
  const [waveHeight, setWaveHeight] = useState([10, 20, 15, 30, 20]);

  // Simulate Audio Waveform
  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
       setWaveHeight(prev => prev.map(() => Math.floor(Math.random() * 60) + 10));
    }, 150);
    return () => clearInterval(interval);
  }, [isListening]);

  return (
    <Screen hidePadding className="bg-black">
      <div className="absolute top-8 left-6 z-50"> {/* Shifted up to top-8 */}
         <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
             <span className="sr-only">Close</span>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
         </button>
      </div>

      <div className="h-full flex flex-col justify-between items-center pt-32 pb-20 px-6">
         <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-[40px] opacity-40 animate-pulse" />
            <h2 className="text-3xl font-bold text-white tracking-tight">I'm listening, {userName.split(' ')[0]}</h2>
            <p className="text-white/50 text-lg font-medium">What can I handle for you?</p>
         </div>

         {/* Visualizer */}
         <div className="h-32 flex items-center justify-center gap-2">
            {isListening ? (
               waveHeight.map((h, i) => (
                  <div 
                    key={i} 
                    className="w-3 bg-white rounded-full transition-all duration-150" 
                    style={{ height: `${h}px`, opacity: 0.8 }} 
                  />
               ))
            ) : (
                <div className="flex gap-2">
                   <div className="w-3 h-3 bg-white/20 rounded-full" />
                   <div className="w-3 h-3 bg-white/20 rounded-full" />
                   <div className="w-3 h-3 bg-white/20 rounded-full" />
                </div>
            )}
         </div>

         {/* Suggestions Pill List */}
         <div className="w-full overflow-x-auto no-scrollbar flex gap-3 px-4 py-2">
            {['Schedule dentist', 'Refund last Uber', 'Cancel Spotify', 'Book flight'].map((s, i) => (
                <button key={i} className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                    <Sparkles size={12} className="text-accent" /> {s}
                </button>
            ))}
         </div>

         {/* Controls */}
         <div className="flex items-center gap-8">
             <button className="p-4 rounded-full bg-[#1A1A1A] text-white/50 hover:text-white transition-colors">
                 <MoreHorizontal size={24} />
             </button>
             
             <button 
               onClick={() => setIsListening(!isListening)}
               className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}
             >
                 {isListening ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-black" />}
             </button>
             
             <div className="w-14" /> {/* Spacer to balance layout */}
         </div>
      </div>
    </Screen>
  );
};