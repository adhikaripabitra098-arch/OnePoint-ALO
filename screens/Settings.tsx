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
  
  const [editingLimit, setEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState('');
  const [editingNegotiation, setEditingNegotiation] = useState(false);
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
    const result = await registerBiometrics('OnePoint User');
    if (result === true) {
      setSetupStatus('success');
      setTimeout(() => { setBioEnabled(true); setIsSettingUpBio(false); setSetupStatus('idle'); }, 1500);
    } else {
      if (result === 'iframe_blocked') setSetupStatus('iframe_error');
      else if (result === 'no_hardware') setSetupStatus('no_hardware');
      else if (result === 'no_hardware_simulatable') setSetupStatus('no_hardware_simulatable');
      else setSetupStatus('failed');
    }
  };

  const confirmDelete = async () => {
    setDeleteStep('PROCESSING');
    await onDeleteAccount();
  };

  const negotiationDisplay = userPreferences?.negotiationStyle 
    ? userPreferences.negotiationStyle.charAt(0) + userPreferences.negotiationStyle.slice(1).toLowerCase() 
    : 'Neutral';

  return (
    <Screen>
      <div className="absolute top-8 left-6 z-50"><BackButton onClick={() => onNavigate('home')} /></div>
      <div className="mt-24 mb-6"><h1 className="text-2xl font-bold">Settings</h1></div>
      <div className="space-y-6 pb-24 animate-slide-up">
        <div>
          <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider ml-2 mb-2">Account</h4>
          <div className="rounded-[20px] overflow-hidden">
             <SettingsItem icon={User} label="Profile" />
             <SettingsItem icon={ScanFace} label="Biometric Login" toggle toggleValue={bioEnabled} onClick={handleBioToggle} />
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider ml-2 mb-2">Controls</h4>
          <div className="rounded-[20px] overflow-hidden">
             <SettingsItem icon={Shield} label="Spending Threshold" value={userPreferences ? `$${userPreferences.maxSpendingThreshold}` : '$100'} />
             <SettingsItem icon={Zap} label="Auto-Approve Under" value={userPreferences ? `$${userPreferences.autoApproveUnder}` : '$25'} />
             <SettingsItem icon={Shield} label="Negotiation Style" value={negotiationDisplay} />
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider ml-2 mb-2">Support & Legal</h4>
          <div className="rounded-[20px] overflow-hidden">
             <SettingsItem icon={HelpCircle} label="Help Center" />
             <SettingsItem icon={FileText} label="Terms of Use" />
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider ml-2 mb-2">Danger Zone</h4>
          <div className="rounded-[20px] overflow-hidden">
             <SettingsItem icon={Trash2} label="Delete Account" isDestructive onClick={() => setIsDeleting(true)} />
             <SettingsItem icon={LogOut} label="Sign Out" isDestructive onClick={onLogout} />
          </div>
        </div>
        <div className="text-center pt-4 pb-2 opacity-50">
          <p className="text-xs font-bold text-textMuted">OnePoint v1.0.0 Stable</p>
          <p className="text-[10px] text-textMuted mt-1">Engineered Globally for the World</p>
        </div>
      </div>
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in">
           <div className="w-full max-w-sm bg-[#1A1A1A] border border-red-500/30 rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl relative">
              {deleteStep === 'CONFIRM' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6"><AlertTriangle size={32} className="text-red-500" /></div>
                  <h2 className="text-xl font-bold mb-2 text-white">Delete Account?</h2>
                  <p className="text-textMuted text-sm mb-6 font-medium leading-relaxed">This action is <span className="text-white font-bold">permanent</span>. All your data will be wiped.</p>
                  <div className="w-full space-y-3"><Button onClick={confirmDelete} fullWidth className="bg-red-600 border-none">Yes, Delete Everything</Button><Button onClick={() => setIsDeleting(false)} fullWidth variant="secondary">Cancel</Button></div>
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
    </Screen>
  );
};