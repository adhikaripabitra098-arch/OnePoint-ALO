import React, { useState, useEffect } from 'react';
import { Onboarding } from './screens/Onboarding';
import { AuthScreen } from './screens/Auth';
import { HomeScreen } from './screens/Home';
import { WalletScreen } from './screens/Wallet';
import { SettingsScreen } from './screens/Settings';
import { IntegrationsScreen } from './screens/Integrations';
import { TaskCreate } from './screens/TaskCreate';
import { BottomNavigation } from './components/Navigation';
import { Task, UserPreferences, WalletTransaction, User } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';

export default function App() {
  const [appState, setAppState] = useState<'ONBOARDING' | 'AUTH' | 'MAIN'>('ONBOARDING');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // App Data
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Temporary holder for preferences chosen during Onboarding
  const [tempOnboardingPrefs, setTempOnboardingPrefs] = useState<UserPreferences | null>(null);

  // 1. Check for existing session on mount (Supports both Local and Supabase)
  useEffect(() => {
    const initSession = async () => {
      const sessionUser = await authService.getSession();
      
      if (sessionUser) {
        // User is logged in (either locally or via Supabase)
        setUser(sessionUser);
        await loadUserData(sessionUser.email);
        setAppState('MAIN');
      }

      // If Supabase is active, listen for auth changes in real-time
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

  // Helper to load full data for a logged-in user
  const loadUserData = async (email: string) => {
    // NOTE: For 100% production readiness, this function should also check 
    // if we are online and fetch data from Supabase DB ('tasks' table) instead of storageService.
    // Currently, it uses the local encrypted storage for data privacy.
    const data = await storageService.getUserData(email);
    setTasks(data.tasks);
    setPreferences(data.preferences);
    setBalance(data.balance);
    setTransactions(data.transactions);
  };

  // --- Handlers ---

  const handleOnboardingComplete = (prefs: UserPreferences, mode: 'LOGIN' | 'REGISTER' = 'REGISTER') => {
    setTempOnboardingPrefs(prefs); // Hold these in memory
    setAuthMode(mode);
    setAppState('AUTH');
  };

  const handleBackToOnboarding = () => {
    setAppState('ONBOARDING');
  };

  const handleRegister = async (email: string, pass: string, name: string): Promise<boolean> => {
    // Uses authService which auto-switches to Supabase if keys exist
    const success = await authService.register(email, pass, name);
    
    if (success && tempOnboardingPrefs) {
      // If registration successful, save the onboarding preferences
      // Note: In a full Supabase implementation, we would insert these into a 'profiles' table here.
      const freshData = await storageService.getUserData(email);
      freshData.preferences = tempOnboardingPrefs;
      await storageService.saveUserData(email, freshData);
      
      // Update local state
      setPreferences(tempOnboardingPrefs);
    }
    return success;
  };

  const handleLogin = async (email: string, pass: string): Promise<User | null> => {
    // Uses authService which auto-switches to Supabase if keys exist
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
      // In Supabase mode, we would also: await supabase.from('profiles').update(...)
    }
  };

  const handleTaskCreate = async (newTask: Task) => {
    // 1. Update UI
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    
    // 2. Persist
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

  // --- Render Flow ---

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-white/20 relative">
      
      {/* GLOBAL PERSISTENT BACKGROUND - Prevents flicker */}
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
                onNavigate={setCurrentScreen}
                onCreateTask={handleTaskCreate}
                onOpenAssistant={() => setIsTaskModalOpen(true)}
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

            {/* Navigation */}
            <BottomNavigation 
              currentScreen={currentScreen} 
              onNavigate={setCurrentScreen}
              onFabClick={() => setIsTaskModalOpen(true)}
            />

            {/* Task Modal */}
            {isTaskModalOpen && (
              <TaskCreate 
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