import React, { useState } from 'react';
import { Screen, Button, BackButton } from '../components/UI';
import { ArrowRight, Check, Shield, Zap, Lock, Smartphone } from 'lucide-react';
import { NegotiationStyle, UserPreferences } from '../types';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Splash, 1: Limits, 2: Negotiation
  const [prefs, setPrefs] = useState<UserPreferences>({
    maxSpendingThreshold: 100,
    autoApproveUnder: 25,
    negotiationStyle: NegotiationStyle.NEUTRAL,
    currency: 'USD'
  });

  // Local state strings to manage input without leading zero issues
  const [limitInput, setLimitInput] = useState('100');
  const [approveInput, setApproveInput] = useState('25');

  const handleLimitChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    const cleaned = numeric.replace(/^0+/, '') || (numeric === '0' ? '0' : '');
    setLimitInput(cleaned);
    setPrefs({ ...prefs, maxSpendingThreshold: Number(cleaned) });
  };

  const handleApproveChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    const cleaned = numeric.replace(/^0+/, '') || (numeric === '0' ? '0' : '');
    setApproveInput(cleaned);
    setPrefs({ ...prefs, autoApproveUnder: Number(cleaned) });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(0, s - 1));
  const skipToAuth = () => onComplete(prefs); 

  // --- Step 0: Splash ---
  if (step === 0) {
    return (
      <Screen hidePadding className="relative">
        <div className="h-full min-h-screen flex flex-col justify-between relative z-10 px-6 pt-16 pb-8">
          
          <div className="flex flex-col items-center mt-12 animate-slide-up">
             <div className="p-4 mb-6">
               <div className="w-24 h-24 relative flex items-center justify-center animate-float">
                  <div className="absolute inset-0 border-[3px] border-white/20 rounded-full" />
                  <div className="absolute inset-2 border-[3px] border-white/60 rounded-full" />
                  <div className="w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9)]" />
               </div>
             </div>
             <h1 className="text-[42px] font-[800] text-center tracking-tighter leading-tight mb-4">
               <span className="text-white block">OnePoint</span>
               <span className="text-white/40 text-[28px] font-semibold block mt-1 tracking-normal">Autonomous Life OS</span>
             </h1>
             <p className="text-center text-textMuted font-bold text-[16px] tracking-wide max-w-[260px] leading-relaxed">
               The engine that runs your life so you don't have to.
             </p>
          </div>

          <div className="flex flex-col w-full gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            
            {/* Trust Badges - Updated to be legally accurate */}
            <div className="flex justify-center gap-6 opacity-60">
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-white" />
                <span className="text-[10px] font-semibold tracking-wider text-white">AES-256 ENCRYPTED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Smartphone size={12} className="text-white" />
                <span className="text-[10px] font-semibold tracking-wider text-white">ON-DEVICE PROCESSING</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight}>Get Started</Button>
              {/* Updated: Font matching Get Started (16px, bold, tracking-wide) */}
              <button onClick={skipToAuth} className="w-full h-[56px] flex items-center justify-center font-bold text-[16px] text-white/30 hover:text-white transition-colors tracking-wide">
                Skip Intro
              </button>
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  // --- Step 1: Limits ---
  if (step === 1) {
    return (
      <Screen>
        <div className="mt-20 mb-8 animate-slide-up">
           <h1 className="text-3xl font-bold mb-2">Set Your Limits</h1>
           <p className="text-textMuted text-lg leading-relaxed font-medium">
             OnePoint needs your permission to spend. You're always in control.
           </p>
        </div>

        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Card 1: Max Limit */}
          <div className="relative overflow-hidden group p-6 rounded-[26px] bg-[#0A0A0A] border border-white/10 shadow-xl">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-focus-within:opacity-20 transition-opacity">
               <Shield size={60} />
            </div>
            <h3 className="font-semibold text-xl mb-1 text-white">Approval Threshold</h3>
            <p className="text-sm text-textMuted mb-6 font-medium">Transactions above this require your Face ID.</p>
            <div className="relative border-b border-white/20 focus-within:border-white transition-colors">
              <span className="absolute left-0 bottom-3 text-white font-bold text-4xl">$</span>
              <input 
                type="tel"
                value={limitInput}
                onChange={(e) => handleLimitChange(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-white text-5xl font-bold pl-10 pb-3 outline-none placeholder:text-white/10"
              />
            </div>
          </div>

          {/* Card 2: Auto Approve */}
          <div className="relative overflow-hidden p-6 rounded-[26px] bg-[#0A0A0A] border border-white/10 shadow-xl">
            <div className="absolute right-0 top-0 p-4 opacity-10">
               <Zap size={60} />
            </div>
            <h3 className="font-semibold text-xl mb-1 text-white">Auto-Approve</h3>
            <p className="text-sm text-textMuted mb-6 font-medium">Small tasks handled instantly.</p>
            <div className="relative border-b border-white/20 focus-within:border-white transition-colors">
              <span className="absolute left-0 bottom-3 text-white font-bold text-4xl">$</span>
              <input 
                type="tel"
                value={approveInput}
                onChange={(e) => handleApproveChange(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-white text-5xl font-bold pl-10 pb-3 outline-none placeholder:text-white/10"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 px-6">
          <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight}>Continue</Button>
        </div>
      </Screen>
    );
  }

  // --- Step 2: Negotiation ---
  return (
    <Screen>
      <div className="absolute top-6 left-2 z-50">
        <BackButton onClick={prevStep} />
      </div>

      <div className="mt-20 mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Negotiation Mode</h1>
          <p className="text-textMuted text-lg leading-relaxed font-medium">
            How should your AI agent behave when dealing with support?
          </p>
      </div>

      <div className="space-y-4 animate-slide-up overflow-y-auto max-h-[55vh] pb-24 pr-1" style={{ animationDelay: '0.1s', scrollbarWidth: 'none' }}>
        {Object.values(NegotiationStyle).map((style) => {
          const isSelected = prefs.negotiationStyle === style;
          return (
            <div 
              key={style}
              onClick={() => setPrefs({...prefs, negotiationStyle: style})}
              className={`group p-6 rounded-[24px] cursor-pointer transition-all duration-300 border ${isSelected ? 'bg-white text-black border-white shadow-glow transform scale-[1.02]' : 'bg-[#121212] border-white/5 hover:bg-[#202020] text-white'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold capitalize text-xl mb-1">{style.toLowerCase()}</h3>
                  <p className={`text-sm font-medium ${isSelected ? 'text-gray-600' : 'text-textMuted'}`}>
                    {style === 'FRIENDLY' && 'Polite, collaborative, relationship-focused'}
                    {style === 'NEUTRAL' && 'Professional, balanced, efficient'}
                    {style === 'FIRM' && 'Direct, assertive, no-nonsense'}
                    {style === 'LEGAL' && 'Formal, cites laws, maximum pressure'}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center animate-in zoom-in shrink-0 ml-2">
                    <Check size={16} className="text-white stroke-[3]" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-10 left-0 right-0 px-6 bg-gradient-to-t from-background via-background to-transparent pt-6">
        <Button onClick={() => onComplete(prefs)} fullWidth variant="primary" icon={Check}>Finish Setup</Button>
      </div>
    </Screen>
  );
};