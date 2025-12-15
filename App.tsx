import React, { useState, useEffect } from 'react';
import { Onboarding } from './screens/Onboarding';
import { AuthScreen } from './screens/Auth';
import { HomeScreen } from './screens/Home';
import { WalletScreen } from './screens/Wallet';
import { SettingsScreen } from './screens/Settings';
import { IntegrationsScreen } from './screens/Integrations';
import { TaskCreate } from './screens/TaskCreate';
import { RefundScreen } from './screens/Refund';
import { VoiceModeScreen } from './screens/VoiceMode';
import { ScanScreen } from './screens/Scan';
import { BottomNavigation } from './components/Navigation';
import { Task, UserPreferences, WalletTransaction, User } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';

export default function App() {
  const [appState, setAppState] = useState<'ONBOARDING' | 'AUTH' | 'MAIN'>('ONBOARDING');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [currentScreen, setCurrentScreen] = useState('home');
  
  // Task Modal State (Only for "New" button now)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<'DEFAULT' | 'VOICE' | 'REFUND' | 'SCAN'>('DEFAULT');
  
  // App Data
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [tempOnboardingPrefs, setTempOnboardingPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const initSession = async () => {
      const sessionUser = await authService.getSession();
      
      if (sessionUser) {
        setUser(sessionUser);
        await loadUserData(sessionUser.email);
        setAppState('MAIN');
      }

      if (supabase) {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const newUser = {
              email: session.user.email!,
              name: session.user.user_metadata.full_name || 'User',
              id: session.user.id
            };
            setUser(newUser);
            await loadUserData(newUser.email);
            setAppState('MAIN');
          } else if (event === 'SIGNED_OUT') {
            handleLogout();
          }
        });
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      }
    };
    initSession();
  }, []);

  const loadUserData = async (email: string) => {
    const data = await storageService.getUserData(email);
    setTasks(data.tasks);
    setPreferences(data.preferences);
    setBalance(data.balance);
    setTransactions(data.transactions);
  };

  const handleOnboardingComplete = (prefs: UserPreferences, mode: 'LOGIN' | 'REGISTER' = 'REGISTER') => {
    setTempOnboardingPrefs(prefs); 
    setAuthMode(mode);
    setAppState('AUTH');
  };

  const handleBackToOnboarding = () => {
    setAppState('ONBOARDING');
  };

  const handleRegister = async (email: string, pass: string, name: string): Promise<boolean> => {
    const success = await authService.register(email, pass, name);
    if (success && tempOnboardingPrefs) {
      const freshData = await storageService.getUserData(email);
      freshData.preferences = tempOnboardingPrefs;
      await storageService.saveUserData(email, freshData);
      setPreferences(tempOnboardingPrefs);
    }
    return success;
  };

  const handleLogin = async (email: string, pass: string): Promise<User | null> => {
    return await authService.login(email, pass);
  };

  const handleAuthComplete = async (userData: User) => {
    setUser(userData);
    await loadUserData(userData.email);
    setAppState('MAIN');
  };

  const handleUpdatePreferences = async (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    if (user) {
      const currentData = await storageService.getUserData(user.email);
      currentData.preferences = newPrefs;
      await storageService.saveUserData(user.email, currentData);
    }
  };

  const handleTaskCreate = async (newTask: Task) => {
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    if (user) {
      const currentData = await storageService.getUserData(user.email);
      currentData.tasks = updatedTasks;
      await storageService.saveUserData(user.email, currentData);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setPreferences(null);
    setTasks([]);
    setCurrentScreen('home');
    setAppState('ONBOARDING');
  };

  const handleDeleteAccount = async () => {
    if (user) {
      await authService.deleteAccount(user.id);
      handleLogout();
    }
  };

  const openAssistant = (mode: 'DEFAULT' | 'VOICE' | 'REFUND' | 'SCAN' = 'DEFAULT') => {
    setTaskModalMode(mode);
    setIsTaskModalOpen(true);
  };

  // --- Render Flow ---

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-white/20 relative">
      
      {/* GLOBAL PERSISTENT BACKGROUND */}
      <div className="fixed top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1E3A8A]/20 to-transparent blur-[80px] pointer-events-none z-0" />

      {/* Content Wrapper */}
      <div className="relative z-10">
        {appState === 'ONBOARDING' && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {appState === 'AUTH' && (
          <AuthScreen 
            initialMode={authMode}
            onComplete={handleAuthComplete} 
            onRegister={handleRegister}
            onLogin={handleLogin}
            onBack={handleBackToOnboarding}
          />
        )}

        {appState === 'MAIN' && (
          <>
            {/* Screen Router */}
            {currentScreen === 'home' && (
              <HomeScreen 
                tasks={tasks} 
                balance={balance} 
                credits={150} 
                userName={user?.name || 'User'} 
                userPreferences={preferences}
                onNavigate={setCurrentScreen}
                onCreateTask={handleTaskCreate}
                onOpenAssistant={openAssistant}
                onUpdatePreferences={handleUpdatePreferences}
              />
            )}
            {currentScreen === 'integrations' && (
               <IntegrationsScreen onNavigate={setCurrentScreen} />
            )}
            {currentScreen === 'wallet' && (
              <WalletScreen 
                balance={balance} 
                transactions={transactions} 
                onNavigate={setCurrentScreen}
              />
            )}
            {currentScreen === 'settings' && (
              <SettingsScreen 
                onLogout={handleLogout} 
                onDeleteAccount={handleDeleteAccount}
                onNavigate={setCurrentScreen}
                userPreferences={preferences}
                onUpdatePreferences={handleUpdatePreferences}
              />
            )}
            
            {/* NEW DEDICATED SCREENS */}
            {currentScreen === 'refund' && (
              <RefundScreen onNavigate={setCurrentScreen} transactions={transactions} onCreateTask={handleTaskCreate} />
            )}
            {currentScreen === 'voice' && (
              <VoiceModeScreen onNavigate={setCurrentScreen} userName={user?.name || 'User'} />
            )}
            {currentScreen === 'scan' && (
              <ScanScreen onNavigate={setCurrentScreen} onCreateTask={handleTaskCreate} />
            )}

            {/* Navigation (Hidden on immersive screens like Voice/Scan) */}
            {currentScreen !== 'voice' && currentScreen !== 'scan' && (
              <BottomNavigation 
                currentScreen={currentScreen} 
                onNavigate={setCurrentScreen}
                onFabClick={() => openAssistant('DEFAULT')}
              />
            )}

            {/* Task Modal (Used for "New" only now) */}
            {isTaskModalOpen && (
              <TaskCreate 
                initialMode={taskModalMode}
                onClose={() => setIsTaskModalOpen(false)} 
                onCreate={handleTaskCreate} 
                userPreferences={preferences}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}