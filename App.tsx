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

  // 1. Check for existing session on mount
  useEffect(() => {
    const initSession = async () => {
      const session = await storageService.getSession();
      if (session) {
        // Restore user state
        setUser({ name: session.name, email: session.email });
        await loadUserData(session.email);
        setAppState('MAIN');
      }
    };
    initSession();
  }, []);

  // Helper to load full data for a logged-in user
  const loadUserData = async (email: string) => {
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
    const success = await storageService.registerUser(email, pass, name);
    if (success && tempOnboardingPrefs) {
      // If registration successful, immediately save the onboarding preferences to this new account
      const freshData = await storageService.getUserData(email);
      freshData.preferences = tempOnboardingPrefs;
      await storageService.saveUserData(email, freshData);
      // Update local state immediately
      setPreferences(tempOnboardingPrefs);
    }
    return success;
  };

  const handleLogin = async (email: string, pass: string): Promise<User | null> => {
    const user = await storageService.loginUser(email, pass);
    if (user) {
      return { name: user.name, email: user.email };
    }
    return null;
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
    await storageService.logout();
    setUser(null);
    setPreferences(null);
    setTasks([]);
    setCurrentScreen('home');
    setAppState('ONBOARDING');
  };

  // NEW: Handle true deletion of data
  const handleDeleteAccount = async () => {
    if (user) {
      await storageService.deleteUser(user.email);
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