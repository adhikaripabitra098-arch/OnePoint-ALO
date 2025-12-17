import React, { useState, useEffect } from 'react';
import { Screen, Button, BackButton } from '../components/UI';
import { ArrowRight, Check, Shield, Zap, Lock, Smartphone, Camera, MapPin, Bell } from 'lucide-react';
import { NegotiationStyle, UserPreferences } from '../types';
import { registerPushNotifications } from '../services/notificationService';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences, mode: 'LOGIN' | 'REGISTER') => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Splash, 1: Limits, 2: Negotiation, 3: Permissions
  const [prefs, setPrefs] = useState<UserPreferences>({
    maxSpendingThreshold: 100,
    autoApproveUnder: 25,
    negotiationStyle: NegotiationStyle.NEUTRAL,
    currency: 'USD'
  });

  // Permission State
  const [permissions, setPermissions] = useState({
    notifications: false,
    location: false,
    camera: false
  });

  // Local state strings to manage input without leading zero issues
  const [limitInput, setLimitInput] = useState('100');
  const [approveInput, setApproveInput] = useState('25');

  // Prevent ghost clicks/focus during step transitions
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
        const timer = setTimeout(() => setIsTransitioning(false), 500);
        return () => clearTimeout(timer);
    }
  }, [step]); 

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

  const nextStep = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setIsTransitioning(true); 
    setStep(s => s + 1);
  };

  const prevStep = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setIsTransitioning(true);
    setStep(s => Math.max(0, s - 1));
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
          if (!('Notification' in window)) {
             alert("Notifications are not supported on this device.");
             return;
          }
          try {
            const notifResult = await Notification.requestPermission();
            if (notifResult === 'granted') {
               setPermissions(p => ({...p, notifications: true}));
               await registerPushNotifications();
            } else {
               console.warn("Notifications denied by user.");
            }
          } catch (e) {
            console.warn("Notification request failed", e);
          }
          break;
          
        case 'location':
          if (!('geolocation' in navigator)) {
             alert("Geolocation is not supported.");
             return;
          }
          navigator.geolocation.getCurrentPosition(
            () => setPermissions(p => ({...p, location: true})),
            (err) => {
              console.warn('Location access denied/failed:', err.message);
            },
            { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
          );
          break;
          
        case 'camera':
           if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              alert("Camera access requires a secure connection (HTTPS).");
              return;
           }
           try {
             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
             setPermissions(p => ({...p, camera: true}));
             stream.getTracks().forEach(t => t.stop());
           } catch (err: any) {
             console.warn("Camera access denied or failed:", err);
           }
           break;
      }
    } catch (e: any) {
       console.error("Permission request system error:", e);
    }
  };

  // --- Render Content Based on Step ---
  const renderContent = () => {
    switch(step) {
      case 0:
        return (
          // Splash Container - FIXED SCROLLING & SMOOTHNESS
          <div key="splash" className="fixed inset-0 h-full w-full bg-[#050505] flex flex-col justify-between z-50 pt-16 pb-8 overflow-hidden animate-slide-up will-change-[transform,opacity]">
            
            {/* RESTORED BACKGROUND BLOB */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1E3A8A]/20 to-transparent blur-[80px] pointer-events-none z-0" />

            <div className="flex flex-col items-center mt-12 flex-1 justify-center relative z-10">
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
            </div>

            <div className="flex flex-col w-full px-5 relative z-10">
              <div className="w-full space-y-4 mb-10">
                <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight}>Get Started</Button>
                
                <div className="w-full h-[56px] flex items-center justify-center gap-1.5">
                  <span className="text-sm text-white/60 font-medium">Already have an account?</span>
                  <button 
                    onClick={() => finishSetup('LOGIN')}
                    className="text-sm font-bold text-white hover:text-white/80 transition-colors cursor-pointer underline decoration-white/30 underline-offset-2"
                  >
                    Log In
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-6 pb-2 opacity-40">
                <div className="flex items-center gap-1.5">
                  <Lock size={10} className="text-white" />
                  <span className="text-[9px] tracking-widest text-white uppercase font-bold">AES-256 Encrypted</span>
                </div>
                <div className="w-px h-3 bg-white/30" />
                <div className="flex items-center gap-1.5">
                  <Smartphone size={10} className="text-white" />
                  <span className="text-[9px] tracking-widest text-white uppercase font-bold">On-Device AI</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          // Fixed Viewport Layout - Matches Auth Screen
          // absolute inset-0 ensures full height without nested scrollbars
          <div key="step1" className="absolute inset-0 z-10">
            <div className="h-full w-full max-w-md mx-auto flex flex-col">
              {/* pt-20 px-6 pb-6 matches Auth exactly */}
              <div className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20 px-6 pb-6 animate-slide-up will-change-[transform,opacity] ${isTransitioning ? 'pointer-events-none' : ''}`}>
                
                <div className="mb-4">
                   <BackButton onClick={prevStep} />
                </div>

                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">Set Your Limits</h1>
                  <p className="text-white/60 text-lg leading-relaxed font-medium">
                    Define the autonomy level for your AI agent. You retain full control.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="relative overflow-hidden group p-6 rounded-[26px] bg-[#0A0A0A] border border-white/20 shadow-xl">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-focus-within:opacity-20 transition-opacity">
                      <Shield size={60} />
                    </div>
                    <h3 className="font-semibold text-xl mb-1 text-white">Approval Threshold</h3>
                    <p className="text-sm text-white/60 mb-6 font-medium">Transactions above this require Face ID.</p>
                    
                    <div className="relative border-b border-white/20 flex items-center pb-3">
                      <span className="text-white font-bold text-5xl mr-1">$</span>
                      <input 
                        type="tel"
                        value={limitInput}
                        onChange={(e) => handleLimitChange(e.target.value)}
                        placeholder="0"
                        className="flex-1 bg-transparent text-white text-5xl font-bold outline-none placeholder:text-white/10 min-w-0"
                        autoComplete="off"
                        disabled={isTransitioning}
                      />
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-6 rounded-[26px] bg-[#0A0A0A] border border-white/20 shadow-xl">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                      <Zap size={60} />
                    </div>
                    <h3 className="font-semibold text-xl mb-1 text-white">Auto-Approve</h3>
                    <p className="text-sm text-white/60 mb-6 font-medium">Transactions up to this amount are handled instantly.</p>
                    
                    <div className="relative border-b border-white/20 flex items-center pb-3">
                      <span className="text-white font-bold text-5xl mr-1">$</span>
                      <input 
                        type="tel"
                        value={approveInput}
                        onChange={(e) => handleApproveChange(e.target.value)}
                        placeholder="0"
                        className="flex-1 bg-transparent text-white text-5xl font-bold outline-none placeholder:text-white/10 min-w-0"
                        autoComplete="off"
                        disabled={isTransitioning}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight}>Continue</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          // Fixed Viewport Layout - Matches Auth Screen
          <div key="step2" className="absolute inset-0 z-10">
            <div className="h-full w-full max-w-md mx-auto flex flex-col">
              <div className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20 px-6 pb-6 animate-slide-up will-change-[transform,opacity] ${isTransitioning ? 'pointer-events-none' : ''}`}>
                 
                <div className="mb-4">
                   <BackButton onClick={prevStep} />
                </div>

                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">Agent Persona</h1>
                  <p className="text-white/60 text-lg leading-relaxed font-medium">
                    How should OnePoint communicate with third parties on your behalf?
                  </p>
                </div>

                <div className="space-y-4">
                  {Object.values(NegotiationStyle).map((style) => {
                    const isSelected = prefs.negotiationStyle === style;
                    return (
                      <div 
                        key={style}
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(5);
                          setPrefs({...prefs, negotiationStyle: style});
                        }}
                        className={`group p-6 rounded-[24px] cursor-pointer transition-all duration-300 w-full box-border ${isSelected ? 'bg-white text-black border-2 border-black' : 'bg-[#0A0A0A] border border-white/20 hover:bg-[#1a1a1a] text-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <h3 className="font-bold capitalize text-xl mb-1 whitespace-nowrap">{style.toLowerCase()}</h3>
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-gray-600' : 'text-white/60'}`}>
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

                <div className="mt-8">
                  <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight}>Next</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          // Fixed Viewport Layout - Matches Auth Screen
          <div key="step3" className="absolute inset-0 z-10">
            <div className="h-full w-full max-w-md mx-auto flex flex-col">
              <div className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20 px-6 pb-6 animate-slide-up will-change-[transform,opacity] ${isTransitioning ? 'pointer-events-none' : ''}`}>
                
                <div className="mb-4">
                   <BackButton onClick={prevStep} />
                </div>

                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2 tracking-tight">System Access</h1>
                  <p className="text-white/60 text-lg leading-relaxed font-medium">
                    Grant OnePoint access to your device hardware to enable autonomous features.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { 
                      id: 'notifications', 
                      icon: Bell, 
                      label: 'Notifications', 
                      desc: 'Critical alerts & approvals', 
                      active: permissions.notifications,
                      color: 'text-blue-400',
                      bg: 'bg-blue-500/20'
                    },
                    { 
                      id: 'location', 
                      icon: MapPin, 
                      label: 'Location', 
                      desc: 'Automated pickups & services', 
                      active: permissions.location,
                      color: 'text-green-400',
                      bg: 'bg-green-500/20'
                    },
                    { 
                      id: 'camera', 
                      icon: Camera, 
                      label: 'Camera', 
                      desc: 'Receipt scanning & vision', 
                      active: permissions.camera,
                      color: 'text-red-400',
                      bg: 'bg-red-500/20'
                    }
                  ].map((item: any) => (
                    <div key={item.id} className="p-5 rounded-[24px] bg-[#0A0A0A] border border-white/20 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.bg}`}>
                                <item.icon size={22} className={item.color} />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-0.5">{item.label}</h3>
                                <p className="text-sm text-white/60 font-medium">{item.desc}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => requestPermission(item.id)}
                            disabled={item.active}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${item.active ? 'bg-green-500/20 text-green-400' : 'bg-white text-black active:scale-95'}`}
                        >
                            {item.active ? 'Allowed' : 'Allow'}
                        </button>
                    </div>
                  ))}

                  <p className="text-sm text-center text-white/30 pt-4 px-6 font-medium">
                     You can modify these permissions later in your device settings.
                  </p>
                </div>

                <div className="mt-8 pt-4">
                  <Button onClick={() => finishSetup()} fullWidth variant="primary" icon={Check}>Finish Setup</Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Screen hidePadding={false} className="relative">
      {renderContent()}
    </Screen>
  );
};