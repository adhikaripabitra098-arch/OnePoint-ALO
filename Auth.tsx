import React, { useState } from 'react';
import { Screen, Button, Input, BackButton } from '../components/UI';
import { User } from '../types';
import { Mail, User as UserIcon, Lock, ArrowRight, AlertCircle, ScanFace, Info, Loader2, Eye, EyeOff } from 'lucide-react';
import { authenticateBiometrics } from '../services/biometricService';

interface AuthProps {
  onComplete: (user: User) => void;
  onRegister: (email: string, pass: string, name: string) => boolean;
  onLogin: (email: string, pass: string) => User | null;
  onBack: () => void;
}

export const AuthScreen: React.FC<AuthProps> = ({ onComplete, onRegister, onLogin, onBack }) => {
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuth = async () => {
    setError(null);
    setNotification(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Please fill in all fields.");
      }

      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));

      if (isRegister) {
        if (!name) {
          throw new Error("Please enter your name.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        
        const success = onRegister(email, password, name);
        if (success) {
           onComplete({ name, email });
        } else {
           throw new Error("User already exists with this email.");
        }

      } else {
        const user = onLogin(email, password);
        if (user) {
          // Pass the real user object retrieved from storage
          onComplete(user); 
        } else {
          throw new Error("Invalid email or password.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometric = async () => {
    setError(null);
    setNotification(null);

    if (isRegister) {
      setNotification("Biometric authentication is not available during account creation. You can enable Face ID in Settings after your first successful login.");
      return;
    }

    setIsScanning(true);
    
    // Attempt local biometric auth
    const targetUser = email || 'OnePoint User';
    const result = await authenticateBiometrics(targetUser);
    
    setIsScanning(false);

    if (result.success) {
       // Mock Login Success via Biometrics - In a real app we would fetch the user associated with this bio credential
       // For this demo we'll try to find the user by email if entered, otherwise default
       const user = email ? onLogin(email, 'mock_pass_bypass') : null;
       onComplete(user || { name: 'User', email: email || 'user@onepoint.ai' });
    } else {
      if (result.error === 'not_setup') {
        setError("Face ID not set up. Please log in with password and enable it in Settings.");
      } else if (result.error === 'no_match') {
        setError("Face not recognized. Please try again.");
      } else {
        setError("Biometric authentication failed or was cancelled.");
      }
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setNotification(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <Screen>
       <div className="absolute top-6 left-2 z-50">
          <BackButton onClick={onBack} />
        </div>

      <div className="flex-1 flex flex-col pt-24 pb-10 overflow-y-auto no-scrollbar animate-slide-up">
        
        {/* Header */}
        <div className="mb-6 px-1">
           <h1 className="text-3xl font-bold mb-2 tracking-tight">{isRegister ? "Create Account" : "Welcome Back"}</h1>
           <p className="text-textMuted text-lg font-medium">Your personal autonomy engine awaits.</p>
        </div>

        <div className="space-y-4 mb-4">
          {isRegister && (
             <Input 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon size={20} />}
             />
          )}
          <Input 
            placeholder="Email Address" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={20} />}
          />
          <Input 
            placeholder="Password" 
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={20} />}
            rightIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            onRightIconClick={() => setShowPassword(!showPassword)}
          />
          {isRegister && (
             <Input 
              placeholder="Confirm Password" 
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              rightIcon={showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
             />
          )}
        </div>

        {/* Notifications Area */}
        <div className="min-h-[50px] mb-4 flex flex-col justify-end">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          {notification && (
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-start gap-3 text-blue-100 text-sm animate-in fade-in slide-in-from-top-2">
              <Info size={18} className="text-accent mt-0.5 shrink-0" />
              <span className="font-medium">{notification}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Button onClick={handleAuth} fullWidth variant="primary" icon={ArrowRight} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : (isRegister ? "Sign Up" : "Log In")}
          </Button>
          
          <Button 
            onClick={handleBiometric} 
            fullWidth 
            variant="glass" 
            className={`border-primary/20 text-primary hover:bg-primary/5 transition-all ${isScanning ? 'bg-primary/10' : ''}`}
            disabled={isScanning || isLoading}
          >
            {isScanning ? (
              <span className="flex items-center gap-3 animate-pulse font-medium">
                 <Loader2 size={20} className="animate-spin" /> 
                 Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2 font-medium">
                <ScanFace size={20} /> 
                {isRegister ? "Enable Face ID" : "Log in with Face ID"}
              </span>
            )}
          </Button>
        </div>
        
        <div className="mt-8 text-center pb-8">
          <p className="text-sm text-textMuted font-medium">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={toggleMode}
              className="ml-2 text-white font-bold hover:underline tracking-wide"
            >
              {isRegister ? "Log In" : "Register"}
            </button>
          </p>
        </div>

      </div>
    </Screen>
  );
};