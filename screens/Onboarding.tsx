import React, { useState } from 'react';
import { Screen, Button, BackButton } from '../components/UI';
import { ArrowRight, Check, Shield, Zap, Lock, Smartphone, Camera, MapPin, Bell } from 'lucide-react';
import { NegotiationStyle, UserPreferences } from '../types';

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
    setStep(s => s + 1);
  };

  const prevStep = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setStep(s => Math.max(0, s - 1));
  };
  
  const finishSetup = (mode: 'LOGIN' | 'REGISTER' = 'REGISTER') => {
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    onComplete(prefs, mode); 
  };

  const requestPermission = async (type: 'notifications' | 'location' | 'camera') => {
    if (navigator.vibrate) navigator.vibrate(5);
    
    switch (type) {
        case 'notifications':
            if ('Notification' in window) {
                try {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    setPermissions(p => ({...p, notifications: true}));
                  } else if (permission === 'denied') {
                    alert('Notifications are blocked. Please enable them in your device settings.');
                  }
                } catch (e) {
                  console.error("Notification Error:", e);
                }
            }
            break;
        case 'location':
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    () => setPermissions(p => ({...p, location: true})),
                    (err) => {
                      console.log('Location denied', err);
                      if (err.code === 1) alert('Location access denied. Please enable it in settings.');
                    }
                );
            }
            break;
        case 'camera':
             try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setPermissions(p => ({...p, camera: true}));
                stream.getTracks().forEach(track => track.stop());
             } catch(e) {
                 console.log("Camera denied");
                 alert('Camera access is required for receipts. Please allow access.');
             }
             break;
    }
  };

  // --- Render Content Based on Step ---
  const renderContent = () => {
    switch(step) {
      case 0:
        return (
          // Splash Container
          <div className="h-full min-h-screen flex flex-col justify-between relative z-10 pt-16 pb-8">
            <div className="flex flex-col items-center mt-12">
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

            <div className="flex flex-col w-full gap-6">
              {/* Updated font color to text-white/60 to match 'Have an account?' */}
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className="text-white/60" />
                  <span className="text-[10px] tracking-wide text-white/60 uppercase">AES-256 ENCRYPTED</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Smartphone size={12} className="text-white/60" />
                  <span className="text-[10px] tracking-wide text-white/60 uppercase">ON-DEVICE PROCESSING</span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight}>Get Started</Button>
                
                {/* Footer: Non-clickable text + Clickable Action */}
                <div className="w-full h-[56px] flex items-center justify-center gap-1.5">
                  <span className="text-sm text-white/60 font-medium">Have an account?</span>
                  <button 
                    onClick={() => finishSetup('LOGIN')}
                    className="text-sm font-bold text-white hover:text-white/80 transition-colors cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          // Inner Pages Container - Back button at top-12 left-6
          <div className="h-full flex flex-col pt-6">
            <div className="absolute top-12 left-6 z-50">
              <BackButton onClick={prevStep} />
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
              <div className="mt-32 mb-8">
                <h1 className="text-3xl font-bold mb-2">Set Your Limits</h1>
                <p className="text-white/60 text-lg leading-relaxed font-medium">
                  Define the autonomy level for your AI agent. You retain full control.
                </p>
              </div>

              <div className="space-y-6">
                {/* Card 1: Max Limit */}
                <div className="relative overflow-hidden group p-6 rounded-[26px] bg-[#0A0A0A] border border-white/10 shadow-xl transition-all focus-within:border-white/40">
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-focus-within:opacity-20 transition-opacity">
                    <Shield size={60} />
                  </div>
                  <h3 className="font-semibold text-xl mb-1 text-white">Approval Threshold</h3>
                  <p className="text-sm text-white/60 mb-6 font-medium">Transactions above this require Face ID.</p>
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
                <div className="relative overflow-hidden p-6 rounded-[26px] bg-[#0A0A0A] border border-white/10 shadow-xl transition-all focus-within:border-white/40">
                  <div className="absolute right-0 top-0 p-4 opacity-10">
                    <Zap size={60} />
                  </div>
                  <h3 className="font-semibold text-xl mb-1 text-white">Auto-Approve</h3>
                  <p className="text-sm text-white/60 mb-6 font-medium">Transactions up to this amount are handled instantly.</p>
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
            </div>

            <div className="absolute bottom-10 left-6 right-6">
              <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight}>Continue</Button>
            </div>
          </div>
        );

      case 2:
        return (
          // Agent Persona - Back button at top-12 left-6
          <div className="h-full flex flex-col pt-6">
            <div className="absolute top-12 left-6 z-50">
              <BackButton onClick={prevStep} />
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
              <div className="mt-32 mb-6">
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
                      className={`group p-6 rounded-[24px] cursor-pointer transition-all duration-300 border ${isSelected ? 'bg-white text-black border-white shadow-glow transform scale-[1.02]' : 'bg-[#0A0A0A] border-white/10 hover:bg-[#1a1a1a] text-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold capitalize text-xl mb-1">{style.toLowerCase()}</h3>
                          <p className={`text-sm font-medium ${isSelected ? 'text-gray-600' : 'text-white/60'}`}>
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
            </div>

            <div className="absolute bottom-10 left-6 right-6">
              <Button onClick={nextStep} fullWidth variant="primary" icon={ArrowRight}>Next</Button>
            </div>
          </div>
        );

      case 3:
        return (
          // System Access - Back button at top-12 left-6
          <div className="h-full flex flex-col pt-6">
            <div className="absolute top-12 left-6 z-50">
              <BackButton onClick={prevStep} />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
              <div className="mt-32 mb-8">
                <h1 className="text-3xl font-bold mb-2 tracking-tight">System Access</h1>
                <p className="text-white/60 text-lg leading-relaxed font-medium">
                  Grant OnePoint access to your device hardware to enable autonomous features.
                </p>
              </div>

              <div className="space-y-4">
                {/* Permissions Cards */}
                {[
                  { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Critical alerts & approvals', active: permissions.notifications },
                  { id: 'location', icon: MapPin, label: 'Location', desc: 'Automated pickups & services', active: permissions.location },
                  { id: 'camera', icon: Camera, label: 'Camera', desc: 'Receipt scanning & vision', active: permissions.camera }
                ].map((item: any) => (
                  <div key={item.id} className="p-5 rounded-[24px] bg-[#0A0A0A] border border-white/10 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                              <item.icon size={22} className={item.active ? "text-green-400" : "text-white"} />
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
            </div>

            <div className="absolute bottom-10 left-6 right-6 bg-gradient-to-t from-background via-background to-transparent pt-6">
              <Button onClick={() => finishSetup()} fullWidth variant="primary" icon={Check}>Finish Setup</Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Persistent Wrapper
  return (
    <Screen hidePadding={false} className="relative">
      {renderContent()}
    </Screen>
  );
};