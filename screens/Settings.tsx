import React, { useState, useEffect } from 'react';
import { Screen, Card, Button, BackButton } from '../components/UI';
import { User, Bell, Shield, Trash2, LogOut, ChevronRight, ScanFace, CheckCircle, XCircle, AlertTriangle, ExternalLink, Zap, Check, Loader2, HelpCircle, FileText, Download } from 'lucide-react';
import { registerBiometrics, enableSimulation } from '../services/biometricService';
import { storageService } from '../services/storageService';
import { UserPreferences, NegotiationStyle } from '../types';

interface SettingsProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
  onNavigate: (screen: string) => void;
  userPreferences: UserPreferences | null;
  onUpdatePreferences: (prefs: UserPreferences) => void;
}

const SettingsItem: React.FC<{ 
  icon: any, 
  label: string, 
  value?: string, 
  isDestructive?: boolean, 
  toggle?: boolean, 
  toggleValue?: boolean, 
  onClick?: () => void 
}> = ({ icon: Icon, label, value, isDestructive, toggle, toggleValue, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-4 ${isDestructive ? 'text-danger' : 'text-white'} cursor-pointer active:bg-white/5 transition-colors first:rounded-t-[20px] last:rounded-b-[20px] border-b border-white/5 last:border-none bg-surfaceHighlight/30`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDestructive ? 'bg-danger/10' : 'bg-primary/10'}`}>
        <Icon size={16} className={isDestructive ? 'text-danger' : 'text-primary'} />
      </div>
      <span className="font-medium text-[15px]">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs text-textMuted font-medium">{value}</span>}
      {toggle ? (
         <div className={`w-10 h-6 rounded-full relative transition-colors ${toggleValue ? 'bg-primary' : 'bg-white/20'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${toggleValue ? 'right-1' : 'left-1'}`} />
         </div>
      ) : (
         <ChevronRight size={16} className="text-textMuted opacity-50" />
      )}
    </div>
  </div>
);

export const SettingsScreen: React.FC<SettingsProps> = ({ onLogout, onDeleteAccount, onNavigate, userPreferences, onUpdatePreferences }) => {
  const [bioEnabled, setBioEnabled] = useState(false);
  const [isSettingUpBio, setIsSettingUpBio] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'scanning' | 'success' | 'failed' | 'iframe_error' | 'no_hardware' | 'no_hardware_simulatable'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Edit States
  const [editingLimit, setEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState('');
  
  const [editingNegotiation, setEditingNegotiation] = useState(false);

  // Deletion State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'CONFIRM' | 'PROCESSING'>('CONFIRM');

  useEffect(() => {
    const isSet = localStorage.getItem('biometric_setup_OnePoint User') || localStorage.getItem('biometrics_enabled_sim');
    setBioEnabled(!!isSet);
  }, []);

  const handleBioToggle = async () => {
    if (bioEnabled) {
      localStorage.removeItem('biometric_setup_OnePoint User');
      localStorage.removeItem('biometrics_enabled_sim');
      setBioEnabled(false);
      return;
    }

    setIsSettingUpBio(true);
    setSetupStatus('scanning');
    setErrorMessage('');
    
    // Attempt Real Registration
    const result = await registerBiometrics('OnePoint User');
    
    if (result === true) {
      setSetupStatus('success');
      setTimeout(() => {
        setBioEnabled(true);
        setIsSettingUpBio(false);
        setSetupStatus('idle');
      }, 1500);
    } else {
      // Handle Error States
      if (result === 'iframe_blocked') {
        setSetupStatus('iframe_error');
      } else if (result === 'no_hardware') {
        setSetupStatus('no_hardware');
      } else if (result === 'no_hardware_simulatable') {
        setSetupStatus('no_hardware_simulatable');
      } else {
        setSetupStatus('failed');
        if (result === 'cancelled') setErrorMessage("Operation cancelled or timed out.");
        else if (result === 'secure_context_required') setErrorMessage("Face ID requires HTTPS (Secure Context).");
        else setErrorMessage("Unknown error occurred.");
      }
    }
  };

  const handleForceEnable = () => {
    enableSimulation();
    setSetupStatus('success');
    setTimeout(() => {
      setBioEnabled(true);
      setIsSettingUpBio(false);
      setSetupStatus('idle');
    }, 1500);
  };

  const handleDeleteClick = () => {
    setIsDeleting(true);
    setDeleteStep('CONFIRM');
  }

  const confirmDelete = async () => {
    setDeleteStep('PROCESSING');
    await onDeleteAccount(); // This now calls the true delete in App/Storage
    // The App component will redirect to Onboarding automatically after this finishes
  };

  // --- Data Export Feature (GDPR Right to Access) ---
  const handleExportData = async () => {
      // In a real app, you might fetch from a backend. Here we use storageService.
      // We assume the user is logged in, but we need the email. 
      // For this demo, we'll try to get it from session or fallback.
      const session = await storageService.getSession();
      if (!session) {
          alert("Please log in to export data.");
          return;
      }
      
      const userData = await storageService.getUserData(session.email);
      const exportObject = {
          user: session,
          data: userData,
          exportDate: new Date().toISOString(),
          app: "OnePoint"
      };

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OnePoint_Data_Export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  // --- Preference Updates ---
  
  const openLimitEditor = () => {
    setTempLimit(userPreferences?.maxSpendingThreshold.toString() || '100');
    setEditingLimit(true);
  };

  const saveLimit = () => {
    if (userPreferences) {
      onUpdatePreferences({
        ...userPreferences,
        maxSpendingThreshold: Number(tempLimit) || 100
      });
    }
    setEditingLimit(false);
  };

  const saveNegotiation = (style: NegotiationStyle) => {
    if (userPreferences) {
      onUpdatePreferences({
        ...userPreferences,
        negotiationStyle: style
      });
    }
    setEditingNegotiation(false);
  };

  // Capitalize Style for display
  const negotiationDisplay = userPreferences?.negotiationStyle 
    ? userPreferences.negotiationStyle.charAt(0) + userPreferences.negotiationStyle.slice(1).toLowerCase() 
    : 'Neutral';

  return (
    <Screen>
      <div className="absolute top-8 left-6 z-50"> {/* Shifted up to top-8 */}
        <BackButton onClick={() => onNavigate('home')} />
      </div>

      <div className="mt-24 mb-6"> {/* Shifted up to mt-24 */}
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6 pb-24 animate-slide-up">
        <div>
          <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider ml-2 mb-2">Account</h4>
          <div className="rounded-[20px] overflow-hidden">
             <SettingsItem icon={User} label="Profile" />
             <SettingsItem 
                icon={ScanFace} 
                label="Biometric Login" 
                toggle 
                toggleValue={bioEnabled} 
                onClick={handleBioToggle}
             />
             <SettingsItem icon={Download} label="Export Data (JSON)" onClick={handleExportData} />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider ml-2 mb-2">Controls</h4>
          <div className="rounded-[20px] overflow-hidden">
             <SettingsItem 
               icon={Shield} 
               label="Spending Threshold" 
               value={userPreferences ? `$${userPreferences.maxSpendingThreshold}` : '$100'}
               onClick={openLimitEditor}
             />
             <SettingsItem 
               icon={Zap} 
               label="Auto-Approve Under" 
               value={userPreferences ? `$${userPreferences.autoApproveUnder}` : '$25'}
             />
             <SettingsItem 
               icon={Shield} 
               label="Negotiation Style" 
               value={negotiationDisplay}
               onClick={() => setEditingNegotiation(true)}
             />
          </div>
        </div>
        
        {/* Support Section - MANDATORY for App Store Approval */}
        <div>
          <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider ml-2 mb-2">Support & Legal</h4>
          <div className="rounded-[20px] overflow-hidden">
             <SettingsItem icon={HelpCircle} label="Help Center" />
             <SettingsItem icon={FileText} label="Terms of Use (EULA)" />
             <SettingsItem icon={Bell} label="Report an Issue" />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider ml-2 mb-2">Danger Zone</h4>
          <div className="rounded-[20px] overflow-hidden">
             <SettingsItem icon={Trash2} label="Delete Account" isDestructive onClick={handleDeleteClick} />
             <SettingsItem icon={LogOut} label="Sign Out" isDestructive onClick={onLogout} />
          </div>
        </div>
        
        <div className="text-center pt-4 pb-2">
          <p className="text-xs font-bold text-textMuted">OnePoint v1.0.0 (Build 420)</p>
          <p className="text-[10px] text-textMuted/50 mt-1">Engineered in California</p>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in">
           <div className="w-full max-w-sm bg-[#1A1A1A] border border-red-500/30 rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl relative">
              {deleteStep === 'CONFIRM' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-white">Delete Account?</h2>
                  <p className="text-textMuted text-sm mb-6 font-medium leading-relaxed">
                    This action is <span className="text-white font-bold">permanent</span>. All your data, tasks, and preferences will be wiped immediately.
                  </p>
                  
                  <div className="w-full space-y-3">
                    <Button onClick={confirmDelete} fullWidth className="bg-red-600 hover:bg-red-700 text-white border-none">
                       Yes, Delete Everything
                    </Button>
                    <Button onClick={() => setIsDeleting(false)} fullWidth variant="secondary">
                       Cancel
                    </Button>
                  </div>
                </>
              ) : (
                 <>
                   <Loader2 size={40} className="animate-spin text-red-500 mb-4" />
                   <h2 className="text-lg font-bold">Deleting...</h2>
                 </>
              )}
           </div>
        </div>
      )}

      {/* Biometric Setup Modal */}
      {isSettingUpBio && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl relative">
             <button 
                onClick={() => setIsSettingUpBio(false)}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
             >
                <XCircle size={24} />
             </button>

            {setupStatus === 'scanning' && (
              <>
                <div className="w-24 h-24 mb-6 relative">
                   <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                   <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin" />
                   <ScanFace size={40} className="absolute inset-0 m-auto text-primary animate-pulse" />
                </div>
                <h2 className="text-xl font-bold mb-2">Setting up Face ID</h2>
                <p className="text-textMuted text-sm font-medium">Follow your device's instructions...</p>
              </>
            )}

            {setupStatus === 'success' && (
              <>
                <div className="w-24 h-24 mb-6 flex items-center justify-center bg-green-500/20 rounded-full">
                   <CheckCircle size={48} className="text-green-500 animate-in zoom-in duration-300" />
                </div>
                <h2 className="text-xl font-bold mb-2">Face ID Enabled</h2>
                <p className="text-textMuted text-sm font-medium">Biometric login is now active.</p>
              </>
            )}

            {setupStatus === 'iframe_error' && (
              <>
                <div className="w-24 h-24 mb-6 flex items-center justify-center bg-blue-500/20 rounded-full">
                   <Zap size={48} className="text-blue-500 animate-in zoom-in" />
                </div>
                <h2 className="text-xl font-bold mb-2">Browser blocked Face ID</h2>
                <p className="text-textMuted text-sm mb-4 font-medium">
                   This browser view (likely in-app or preview) doesn't support biometrics. Please open in Safari/Chrome.
                </p>
                <div className="w-full space-y-3">
                   <Button onClick={handleForceEnable} fullWidth variant="primary" icon={Zap} className="h-12 text-sm">
                     Enable Demo Mode
                   </Button>
                </div>
              </>
            )}

            {/* Simulated hardware for localhost */}
            {setupStatus === 'no_hardware_simulatable' && (
              <>
                <div className="w-24 h-24 mb-6 flex items-center justify-center bg-yellow-500/20 rounded-full">
                   <Zap size={48} className="text-yellow-500 animate-in zoom-in" />
                </div>
                <h2 className="text-xl font-bold mb-2">Dev Mode Detected</h2>
                <p className="text-textMuted text-sm mb-4 font-medium">
                   No biometric sensor found, but we can simulate it for testing.
                </p>
                <div className="w-full space-y-3">
                   <Button onClick={handleForceEnable} fullWidth variant="primary" icon={Check} className="h-12 text-sm">
                     Enable Simulation
                   </Button>
                </div>
              </>
            )}

            {(setupStatus === 'failed' || setupStatus === 'no_hardware') && (
              <>
                <div className="w-24 h-24 mb-6 flex items-center justify-center bg-red-500/20 rounded-full">
                   <XCircle size={48} className="text-red-500 animate-in zoom-in" />
                </div>
                <h2 className="text-xl font-bold mb-2">Setup Failed</h2>
                <p className="text-textMuted text-sm mb-4 font-medium">
                   {errorMessage || (setupStatus === 'no_hardware' ? "Face ID not available on this device." : "Authentication blocked or cancelled.")}
                </p>
                {errorMessage.includes("HTTPS") && (
                   <p className="text-xs text-textMuted bg-white/5 p-2 rounded mb-2">
                      Make sure you are using a secure <code>https://</code> URL.
                   </p>
                )}
                <div className="w-full space-y-3">
                   <Button onClick={handleForceEnable} fullWidth variant="primary" icon={Zap} className="h-12 text-sm">
                     Enable Demo Mode
                   </Button>
                   <Button onClick={() => setIsSettingUpBio(false)} fullWidth variant="ghost" className="h-10 text-sm">
                     Cancel
                   </Button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Edit Negotiation Modal */}
      {editingNegotiation && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-end md:justify-center p-0 md:p-6 animate-in slide-in-from-bottom-10">
           <div className="w-full max-w-md bg-[#1A1A1A] rounded-t-[32px] md:rounded-[32px] p-6 border-t md:border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Negotiation Style</h3>
                <button onClick={() => setEditingNegotiation(false)}><XCircle className="text-textMuted" /></button>
              </div>
              
              <div className="space-y-3 mb-6">
                {Object.values(NegotiationStyle).map((style) => (
                  <button
                    key={style}
                    onClick={() => saveNegotiation(style)}
                    className={`w-full p-4 rounded-xl flex justify-between items-center transition-colors border-2 ${userPreferences?.negotiationStyle === style ? 'bg-white text-black border-black' : 'bg-white/5 text-white border-transparent hover:bg-white/10'}`}
                  >
                    <span className="font-semibold capitalize">{style.toLowerCase()}</span>
                    {userPreferences?.negotiationStyle === style && <Check size={18} />}
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}
    </Screen>
  );
};