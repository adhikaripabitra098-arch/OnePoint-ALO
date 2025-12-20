import React, { useState, useEffect } from 'react';
import { Screen, Button, BackButton } from '../components/UI';
import { 
  ArrowRight, Check, Shield, Zap, Heart, Target, 
  ShieldAlert, Scale, Camera, MapPin, Bell, Info, Activity
} from 'lucide-react';
import { NegotiationStyle, UserPreferences } from '../types';
import { registerPushNotifications } from '../services/notificationService';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences, mode: 'LOGIN' | 'REGISTER') => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Splash, 1: Limits, 2: Negotiation, 3: Permissions
  const [prefs, setPrefs] = useState<UserPreferences>({
    maxSpendingThreshold: 0,
    autoApproveUnder: 0,
    negotiationStyle: NegotiationStyle.NEUTRAL,
    currency: 'USD'
  });

  // Permission State
  const [permissions, setPermissions] = useState({
    notifications: false,
    location: false,
    camera: false
  });

  // Local state strings to store raw numeric digits.
  const [limitInput, setLimitInput] = useState('');
  const [approveInput, setApproveInput] = useState('');

  const [isShattering, setIsShattering] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
        const timer = setTimeout(() => setIsTransitioning(false), 500);
        return () => clearTimeout(timer);
    }
  }, [isTransitioning]); 

  const formatWithCommas = (val: string) => {
    if (!val) return '0';
    const numeric = val.replace(/[^0-9]/g, '');
    return Number(numeric).toLocaleString('en-US');
  };

  const handleLimitChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    const cleaned = numeric.replace(/^0+/, ''); 
    setLimitInput(cleaned);
    setPrefs({ ...prefs, maxSpendingThreshold: Number(cleaned || '0') });
  };

  const handleApproveChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    const cleaned = numeric.replace(/^0+/, ''); 
    setApproveInput(cleaned);
    setPrefs({ ...prefs, autoApproveUnder: Number(cleaned || '0') });
  };

  const getAgencyStatus = (valueStr: string, type: 'limit' | 'approve') => {
    const val = Number(valueStr || '0');
    const formatted = formatWithCommas(valueStr);
    
    if (type === 'limit') {
      const desc = `Face ID biometric verification required for transactions over $${formatted}`;
      if (val === 0) return { label: 'INITIALIZING', color: 'text-white/60', bg: 'bg-white/5', accent: 'border-white/10', coverage: 0, segments: 0, desc: 'Set a limit to activate security.' };
      if (val < 1000) return { label: 'CONTROLLED', color: 'text-blue-400', bg: 'bg-blue-500/10', accent: 'border-blue-500/30', coverage: 15, segments: 2, desc };
      if (val < 5000) return { label: 'OPTIMIZED', color: 'text-emerald-400', bg: 'bg-emerald-500/10', accent: 'border-emerald-500/30', coverage: 45, segments: 4, desc };
      if (val < 25000) return { label: 'AUTONOMOUS', color: 'text-indigo-400', bg: 'bg-indigo-500/10', accent: 'border-indigo-500/30', coverage: 82, segments: 7, desc };
      return { label: 'SOVEREIGN', color: 'text-amber-400', bg: 'bg-amber-500/10', accent: 'border-amber-500/30', coverage: 98, segments: 10, desc };
    } else {
      const desc = `Instant execution for transactions up to $${formatted}`;
      if (val === 0) return { label: 'INITIALIZING', color: 'text-white/60', bg: 'bg-white/5', accent: 'border-white/10', coverage: 0, segments: 0, desc: 'Enable instant agent capability.' };
      if (val < 200) return { label: 'GUARDED', color: 'text-blue-400', bg: 'bg-blue-500/10', accent: 'border-blue-500/30', coverage: 10, segments: 2, desc };
      if (val < 1000) return { label: 'OPTIMIZED', color: 'text-emerald-400', bg: 'bg-emerald-500/10', accent: 'border-emerald-500/30', coverage: 35, segments: 5, desc };
      if (val < 5000) return { label: 'HIGH AGENCY', color: 'text-indigo-400', bg: 'bg-indigo-500/10', accent: 'border-indigo-500/30', coverage: 70, segments: 8, desc };
      return { label: 'SOVEREIGN', color: 'text-amber-400', bg: 'bg-amber-500/10', accent: 'border-amber-500/30', coverage: 95, segments: 10, desc };
    }
  };

  const nextStep = () => {
    if (step === 0) {
      if (navigator.vibrate) navigator.vibrate(5);
      setIsShattering(true);
      setTimeout(() => {
        setStep(1);
        setIsShattering(false);
      }, 400);
    } else {
      if (navigator.vibrate) navigator.vibrate(10);
      setIsTransitioning(true); 
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (step === 1) {
      setIsShattering(false);
      setStep(0);
    } else {
      setIsTransitioning(true);
      setStep(s => Math.max(0, s - 1));
    }
  };
  
  const finishSetup = (mode: 'LOGIN' | 'REGISTER' = 'REGISTER') => {
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    onComplete(prefs, mode); 
  };

  const requestPermission = async (type: 'notifications' | 'location' | 'camera') => {
    if (navigator.vibrate) navigator.vibrate(5);
    try {
      switch (type) {
        case 'notifications':
          const notifResult = await Notification.requestPermission();
          if (notifResult === 'granted') {
             setPermissions(p => ({...p, notifications: true}));
             await registerPushNotifications();
          }
          break;
        case 'location':
          navigator.geolocation.getCurrentPosition(
            () => setPermissions(p => ({...p, location: true})),
            (err) => console.warn('Location denied', err.message)
          );
          break;
        case 'camera':
           try {
             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
             setPermissions(p => ({...p, camera: true}));
             stream.getTracks().forEach(t => t.stop());
           } catch (err) {
             console.warn("Camera denied", err);
           }
           break;
      }
    } catch (e) {
       console.error("Permission error:", e);
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        const limitStatus = getAgencyStatus(limitInput, 'limit');
        const approveStatus = getAgencyStatus(approveInput, 'approve');

        return (
          <div className={`flex flex-col animate-slide-up w-full shrink-0 transform-gpu pt-6 pb-0 ${isTransitioning ? 'pointer-events-none' : ''}`}>
            <div className="shrink-0 mb-4">
              <BackButton 
                onClick={prevStep} 
                className="[&>span]:text-[18px] [&>svg]:w-[29px] [&>svg]:h-[29px]"
              />
            </div>
            
            <div className="shrink-0 mb-8 px-1">
              <h1 className="text-4xl font-bold mb-2 tracking-tight">Financial Trust</h1>
              <p className="text-white/60 text-xl leading-relaxed font-medium">
                Establish the sovereign perimeter for your Agent's execution.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { label: 'Security Tier 01', title: 'Verification Limit', input: limitInput, handler: handleLimitChange, status: limitStatus, icon: Shield },
                { label: 'Security Tier 02', title: 'Auto-approve', input: approveInput, handler: handleApproveChange, status: approveStatus, icon: Zap }
              ].map((card, idx) => (
                <div key={idx} className="relative overflow-hidden group p-7 pb-5 rounded-[32px] bg-white/[0.03] border border-white/10 transition-all duration-500 shadow-2xl">
                  {/* Autonomy Meter */}
                  <div className="absolute top-0 left-0 right-0 h-1 flex gap-1 px-4 pt-1">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 h-full rounded-full transition-all duration-700 ${i < card.status.segments ? (card.status.segments === 10 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-white/80') : 'bg-white/5'}`} 
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-5 mt-2">
                    <div className="flex flex-col">
                      <div className={`px-4 py-1.5 rounded-full ${card.status.bg} border ${card.status.accent} flex items-center backdrop-blur-sm transition-colors duration-500 inline-flex w-fit`}>
                        <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${card.status.color}`}>{card.status.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <Activity size={10} className="text-white/20" />
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">Life Coverage: {card.status.coverage}%</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{card.label}</div>
                  </div>
                  
                  <div className="absolute right-[-10px] top-[10px] p-6 opacity-5 group-focus-within:opacity-10 transition-opacity">
                    <card.icon size={120} />
                  </div>

                  <h3 className="font-bold text-2xl mb-1 text-white">{card.title}</h3>
                  <p className="text-base mb-12 font-medium text-white/60 leading-snug min-h-[56px] flex items-start">
                    {card.status.desc}
                  </p>
                  
                  <div className="relative border-b border-white/10 flex items-center pb-4 transition-colors focus-within:border-white/40">
                    <span className={`font-black text-6xl mr-2 transform -translate-y-1.5 transition-colors ${card.status.segments === 10 ? 'text-amber-400' : 'text-white'}`}>$</span>
                    <input 
                      type="tel"
                      value={card.input === '' ? '' : formatWithCommas(card.input)}
                      onChange={(e) => card.handler(e.target.value)}
                      placeholder="0"
                      className={`flex-1 bg-transparent text-6xl font-black outline-none placeholder:text-white/5 min-w-0 tracking-tight transition-colors ${card.status.segments === 10 ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'text-white'}`}
                      autoComplete="off"
                      disabled={isTransitioning}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        const personaConfig = {
          [NegotiationStyle.FRIENDLY]: {
            label: 'COLLABORATIVE',
            icon: Heart,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            accent: 'border-emerald-500/30',
            desc: 'Polite, relationship-focused, and collaborative.',
            sample: '"Hi! I noticed a small discrepancy in my bill. Could we look into a refund? Thanks!"'
          },
          [NegotiationStyle.NEUTRAL]: {
            label: 'PROFESSIONAL',
            icon: Target,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            accent: 'border-blue-500/30',
            desc: 'Professional, efficient, and balanced approach.',
            sample: '"Automated system audit identified a $12.50 overcharge. Requesting credit adjustment."'
          },
          [NegotiationStyle.FIRM]: {
            label: 'ASSERTIVE',
            icon: ShieldAlert,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            accent: 'border-indigo-500/30',
            desc: 'Direct, assertive, and maximum efficiency.',
            sample: '"My client has been overcharged. I require an immediate correction and credit update."'
          },
          [NegotiationStyle.LEGAL]: {
            label: 'SOVEREIGN',
            icon: Scale,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            accent: 'border-amber-500/30',
            desc: 'Formal, cites statutes, and maximum pressure.',
            sample: '"Under consumer protection statutes, this unauthorized charge is being disputed. Ref: OP-92."'
          }
        };

        return (
          <div className={`flex flex-col animate-slide-up w-full shrink-0 transform-gpu pt-6 pb-0 ${isTransitioning ? 'pointer-events-none' : ''}`}>
            <div className="shrink-0 mb-4">
              <BackButton 
                onClick={prevStep} 
                className="[&>span]:text-[18px] [&>svg]:w-[29px] [&>svg]:h-[29px]"
              />
            </div>
            <div className="shrink-0 mb-8 px-1">
              <h1 className="text-4xl font-bold mb-2 tracking-tight">Agent Persona</h1>
              <p className="text-white/60 text-xl leading-relaxed font-medium">
                How should OnePoint communicate on your behalf?
              </p>
            </div>
            
            <div className="space-y-5">
              {Object.values(NegotiationStyle).map((style) => {
                const config = personaConfig[style];
                const isSelected = prefs.negotiationStyle === style;
                const Icon = config.icon;

                return (
                  <div 
                    key={style}
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(5);
                      setPrefs({...prefs, negotiationStyle: style});
                    }}
                    className={`relative overflow-hidden group p-6 pb-5 rounded-[32px] cursor-pointer transition-all duration-500 border-2 ${isSelected ? `bg-white text-black border-white shadow-[0_20px_50px_rgba(255,255,255,0.15)]` : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-4 py-1.5 rounded-full ${isSelected ? 'bg-black/5 border-black/10' : `${config.bg} border ${config.accent}`} flex items-center backdrop-blur-sm transition-colors duration-500`}>
                        <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isSelected ? 'text-black' : config.color}`}>{config.label}</span>
                      </div>
                      {isSelected && (
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center animate-in zoom-in shrink-0">
                          <Check size={16} className="text-white stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-black/5 text-black' : 'bg-white/5 text-white/40'}`}>
                        <Icon size={28} strokeWidth={isSelected ? 2.5 : 2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-bold text-2xl mb-1 capitalize ${isSelected ? 'text-black' : 'text-white'}`}>{style.toLowerCase()}</h3>
                        <p className={`text-base font-medium leading-relaxed ${isSelected ? 'text-black/60 mb-2' : 'text-white/40 mb-0'}`}>
                          {config.desc}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-1 p-4 pb-3.5 rounded-[20px] bg-black/[0.04] border border-black/5 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-1.5">
                           <Info size={12} className="text-black/40" />
                           <span className="text-[9px] font-black tracking-widest uppercase text-black/40">Communication Protocol</span>
                        </div>
                        <p className="text-sm font-bold italic text-black/80 leading-relaxed">
                          {config.sample}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 3:
        const permissionConfig = [
          { 
            id: 'notifications', 
            icon: Bell, 
            label: 'Remote Alerts', 
            desc: 'Critical intervention and approval requests.', 
            active: permissions.notifications, 
            color: 'text-blue-400', 
            bg: 'bg-blue-500/10', 
            accent: 'border-blue-500/30',
            protocol: 'P-NOTIF-01'
          },
          { 
            id: 'location', 
            icon: MapPin, 
            label: 'Spatial Agency', 
            desc: 'Geofencing for automated pickups and local services.', 
            active: permissions.location, 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-500/10', 
            accent: 'border-emerald-500/30',
            protocol: 'P-SPAT-02'
          },
          { 
            id: 'camera', 
            icon: Camera, 
            label: 'Visual Capture', 
            desc: 'Receipt scanning and visual environment processing.', 
            active: permissions.camera, 
            color: 'text-amber-400', 
            bg: 'bg-amber-500/10', 
            accent: 'border-amber-500/30',
            protocol: 'P-VIS-03'
          }
        ];

        return (
          <div className={`flex flex-col animate-slide-up w-full shrink-0 transform-gpu pt-6 pb-0 ${isTransitioning ? 'pointer-events-none' : ''}`}>
            <div className="shrink-0 mb-4">
              <BackButton 
                onClick={prevStep} 
                className="[&>span]:text-[18px] [&>svg]:w-[29px] [&>svg]:h-[29px]"
              />
            </div>
            
            <div className="shrink-0 mb-8 px-1">
              <h1 className="text-4xl font-bold mb-2 tracking-tight">System Access</h1>
              <p className="text-white/60 text-xl leading-relaxed font-medium">
                Initialize hardware protocols for full autonomy.
              </p>
            </div>

            <div className="space-y-6 pb-12">
              {permissionConfig.map((item) => {
                const Icon = item.icon;
                const statusLabel = item.active ? 'ACTIVE' : 'OFFLINE';
                const statusColor = item.active ? item.color : 'text-white/40';
                const statusBg = item.active ? item.bg : 'bg-white/5';
                const statusAccent = item.active ? item.accent : 'border-white/10';

                return (
                  <div key={item.id} className="relative overflow-hidden group p-7 pb-6 rounded-[32px] bg-white/[0.03] border border-white/10 transition-all duration-500 shadow-2xl">
                    <div className="flex items-center justify-between mb-5">
                      <div className={`px-4 py-1.5 rounded-full ${statusBg} border ${statusAccent} flex items-center backdrop-blur-sm transition-colors duration-500`}>
                        <span className={`text-[11px] font-black tracking-[0.2em] uppercase ${statusColor}`}>{statusLabel}</span>
                      </div>
                      <div className="text-[11px] font-bold text-white/20 uppercase tracking-widest">{item.protocol}</div>
                    </div>
                    
                    <div className="absolute right-[-10px] top-[-10px] p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Icon size={120} />
                    </div>

                    <h3 className="font-bold text-2xl mb-1 text-white">{item.label}</h3>
                    <p className="text-base mb-10 font-medium text-white/60 leading-relaxed min-h-[48px]">
                      {item.desc}
                    </p>

                    <button 
                      onClick={() => requestPermission(item.id as any)}
                      className={`w-full h-[52px] rounded-full font-black text-sm uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 ${
                        item.active 
                        ? `${item.bg} ${item.color} border ${item.accent} border-opacity-50` 
                        : 'bg-white text-black active:scale-95 shadow-[0_10px_20px_rgba(255,255,255,0.1)]'
                      }`}
                    >
                      {item.active ? (
                        <>
                          <Check size={18} strokeWidth={3} />
                          Authorized
                        </>
                      ) : (
                        `Initialize ${item.label.split(' ')[0]}`
                      )}
                    </button>
                  </div>
                );
              })}
              
              <p className="text-sm text-center text-white/30 pt-2 px-6 font-medium leading-relaxed italic">
                 "Hardware handshake required for legal sovereign execution."
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (step === 0) {
    const splashAnimationClass = isShattering ? 'animate-shatter' : 'animate-slide-up';
    return (
      <div className={`fixed inset-0 h-full w-full bg-[#050505] flex flex-col justify-between z-[100] pt-16 pb-8 overflow-hidden transform-gpu will-change-[transform,opacity,filter] ${splashAnimationClass}`}>
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1E3A8A]/20 to-transparent blur-[80px] pointer-events-none z-0" />
        <div className="flex flex-col items-center flex-1 justify-start pt-32 relative z-10">
          <div className="p-4 mb-10">
            <div className="w-32 h-32 relative flex items-center justify-center animate-float transform-gpu">
                <div className="absolute inset-0 border-[2px] border-white/10 rounded-full" />
                <div className="absolute inset-4 border-[1px] border-white/25 rounded-full" />
                <div className="w-8 h-8 bg-white rounded-full shadow-[0_0_60px_rgba(255,255,255,1),0_0_20px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-[58px] font-[800] text-center tracking-[-0.03em] leading-none mb-1">
              <span className="text-white">OnePoint</span>
            </h1>
            <div className="flex items-center justify-center gap-2 shimmer-text font-bold text-[20px] tracking-[0.25em] uppercase">
              <span>Autonomous</span>
              <span>Life OS</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full px-8 relative z-10 space-y-6 mb-16 transform-gpu">
          <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight} className="h-16 text-lg shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
            Get Started
          </Button>
          <div className="text-[16px] font-bold text-white/40 text-center tracking-tight">
            Already authenticated? <button onClick={() => finishSetup('LOGIN')} className="text-white hover:text-white/80 transition-colors border-b border-white/30 pb-[1.5px] leading-none ml-1">Log In</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Screen hidePadding={true} className="relative bg-[#050505]">
      <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1E3A8A]/20 to-transparent blur-[80px] pointer-events-none z-0" />
      <div className="relative z-10 flex flex-col h-full max-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar pt-14 pb-4 overscroll-contain transform-gpu px-6">
          <div key={`step-${step}`} className="flex flex-col items-center w-full">
            {renderStepContent()}
          </div>
        </div>
        <div className="shrink-0 pb-12 pt-6 px-6 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent z-20">
          <div className="flex justify-center items-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-6 bg-white opacity-100' : 'w-1.5 bg-white/20 opacity-50'}`} />
            ))}
          </div>
          <Button 
            onClick={step < 3 ? nextStep : () => finishSetup()} 
            fullWidth 
            variant="primary" 
            icon={step < 3 ? ArrowRight : Check}
            className={step === 1 ? 'text-[17px]' : ''}
          >
            {step < 3 ? 'Continue' : 'Finish Setup'}
          </Button>
        </div>
      </div>
    </Screen>
  );
};
