import React, { useState } from 'react';
import { Screen, Button, Input, BackButton } from '../components/UI';
import { User } from '../types';
import { Mail, User as UserIcon, Lock, ArrowRight, AlertCircle, ScanFace, Info, Loader2, Eye, EyeOff, Square, CheckSquare, X, ShieldCheck } from 'lucide-react';
import { authenticateBiometrics } from '../services/biometricService';

interface AuthProps {
  onComplete: (user: User) => void;
  onRegister: (email: string, pass: string, name: string) => Promise<boolean>;
  onLogin: (email: string, pass: string) => Promise<User | null>;
  onBack: () => void;
}

export const AuthScreen: React.FC<AuthProps> = ({ onComplete, onRegister, onLogin, onBack }) => {
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Legal & Consent State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showLegal, setShowLegal] = useState<'TOS' | 'PRIVACY' | null>(null);
  const [isLegalLoading, setIsLegalLoading] = useState(false);

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
      
      const cleanEmail = email.trim();
      const cleanName = name.trim();

      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));

      if (isRegister) {
        if (!cleanName) throw new Error("Please enter your name.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        
        // LEGAL: Mandatory check
        if (!agreedToTerms) throw new Error("You must agree to the Terms of Service to continue.");

        const success = await onRegister(cleanEmail, password, cleanName);
        if (success) {
           onComplete({ name: cleanName, email: cleanEmail });
        } else {
           throw new Error("User already exists with this email.");
        }

      } else {
        const user = await onLogin(cleanEmail, password);
        if (user) {
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
      setNotification("Biometric authentication is not available during account creation.");
      return;
    }

    setIsScanning(true);
    const targetUser = email || 'OnePoint User';
    const result = await authenticateBiometrics(targetUser);
    setIsScanning(false);

    if (result.success) {
       const user = email ? await onLogin(email, 'mock_pass_bypass') : null;
       onComplete(user || { name: 'User', email: email || 'user@onepoint.ai' });
    } else {
      if (result.error === 'not_setup') {
        setError("Face ID not set up. Please log in with password first.");
      } else if (result.error === 'no_match') {
        setError("Face not recognized.");
      } else {
        setError("Biometric authentication failed.");
      }
    }
  };

  // Smart Forgot Password Logic
  const handleForgotPassword = () => {
    setError(null);
    setNotification(null);

    if (!email) {
      setError("Please enter your Gmail address above so we can send the reset link.");
      return;
    }

    if (!email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }

    // UX Simulation of sending email
    setNotification(`We have sent a password reset link to ${email}. Please check your Gmail.`);
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setNotification(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAgreedToTerms(false);
  };

  const openLegal = (type: 'TOS' | 'PRIVACY') => {
    setShowLegal(type);
    setIsLegalLoading(true);
    // Simulate a secure fetch - shorter duration for snappier feel
    setTimeout(() => {
      setIsLegalLoading(false);
    }, 800);
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
           <p className="text-textMuted text-lg font-medium">
             {isRegister ? "Start your autonomous journey." : "Your personal autonomy engine awaits."}
           </p>
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
            <>
             <Input 
              placeholder="Confirm Password" 
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={20} />}
              rightIcon={showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
             />

             {/* LEGAL CONSENT CHECKBOX */}
             <div className="flex items-start gap-3 px-2 py-3 group">
                <div 
                  className={`mt-0.5 transition-colors cursor-pointer ${agreedToTerms ? 'text-primary' : 'text-textMuted group-hover:text-white'}`}
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                >
                  {agreedToTerms ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                
                <p className="text-[13px] text-textMuted leading-relaxed select-none font-sans font-medium">
                  I agree to the 
                  <span 
                    onClick={() => openLegal('TOS')}
                    className="text-white underline hover:text-accent cursor-pointer mx-1 transition-colors"
                  >
                    Terms of Service (EULA)
                  </span> 
                  and 
                  <span 
                    onClick={() => openLegal('PRIVACY')}
                    className="text-white underline hover:text-accent cursor-pointer mx-1 transition-colors"
                  >
                    Privacy Policy
                  </span>. 
                  I confirm I am at least 16 years old.
                </p>
             </div>
            </>
          )}

          {!isRegister && (
             <div className="flex justify-end px-1">
               <button 
                 onClick={handleForgotPassword}
                 className="text-sm font-bold text-white hover:text-gray-200 transition-colors tracking-wide"
               >
                 Forgot Password?
               </button>
             </div>
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
            {isLoading ? <Loader2 className="animate-spin" /> : (isRegister ? "Create Account" : "Log In")}
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

      {/* 
          LEGAL DOCUMENT VIEWER (MODAL)
          Changes:
          1. EULA Clause (Mandatory for Apple)
          2. AI Disclaimer (Mandatory for Liability)
          3. Contact info (Mandatory for Publishing)
      */}
      {showLegal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-6 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#050505] border border-white/10 rounded-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden h-full max-h-[600px] relative">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0A0A0A] shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="font-bold text-lg text-white tracking-tight">
                  {showLegal === 'TOS' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
              </div>
              <button onClick={() => setShowLegal(null)} className="p-2 hover:bg-white/10 rounded-full text-textMuted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Loading State: Clean, Centered Spinner */}
            {isLegalLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 size={32} className="text-white animate-spin" />
               </div>
            ) : (
              /* Content */
              <div className="p-6 overflow-y-auto text-sm text-textMuted leading-relaxed space-y-4 font-medium animate-in fade-in duration-300">
                {showLegal === 'TOS' ? (
                  <>
                    <p className="text-white/80">Last Updated: {new Date().toLocaleDateString()}</p>
                    
                    <p><strong className="text-white block mb-1">1. End User License Agreement (EULA)</strong>
                    By downloading or using OnePoint, you are granted a limited, non-transferable, revocable license to access and use the App for personal, non-commercial purposes. This license is subject to your compliance with these Terms.</p>

                    <p><strong className="text-white block mb-1">2. AI & Hallucinations (Disclaimer)</strong>
                    OnePoint uses generative artificial intelligence. The AI may occasionally produce incorrect, biased, or misleading information ("hallucinations"). OnePoint does not provide professional financial, legal, or medical advice. <strong className="text-white">You are solely responsible for verifying all AI-suggested actions before execution.</strong></p>

                    <p><strong className="text-white block mb-1">3. Payment & Financial Responsibility</strong>
                    You are financially responsible for all transactions approved by the AI within the spending limits you have configured. OnePoint facilitates instructions to third-party processors but is not a bank. We are not liable for overdrafts resulting from authorized automated transactions.</p>
                    
                    <p><strong className="text-white block mb-1">4. User Content & Conduct</strong>
                    You agree not to use the app to generate illegal, harassing, or fraudulent content. We reserve the right to ban users who violate this policy without refund.</p>
                    
                    <p><strong className="text-white block mb-1">5. Limitation of Liability</strong>
                    To the maximum extent permitted by law, OnePoint and its affiliates shall not be liable for any indirect, incidental, or consequential damages arising from the use of the service.</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/80">Effective Date: {new Date().toLocaleDateString()}</p>
                    
                    <p><strong className="text-white block mb-1">1. Data Minimization</strong>
                    We only collect data necessary to function: your email (for account recovery), name, and task descriptions. Biometric data is stored exclusively on your device's Secure Enclave.</p>

                    <p><strong className="text-white block mb-1">2. Third-Party Processors</strong>
                    To provide AI services, anonymized text prompts may be sent to our AI partners (e.g., Google Gemini, OpenAI). We do not sell your personal data to advertisers.</p>

                    <p><strong className="text-white block mb-1">3. Right to Delete</strong>
                    You have the absolute right to delete your account and all associated data at any time via the Settings menu. This action is irreversible.</p>

                    <p><strong className="text-white block mb-1">4. Contact Us</strong>
                    For privacy concerns or to report an issue, please contact our Data Protection Officer at <span className="text-white">support@onepoint.ai</span>.</p>

                    <p><strong className="text-white block mb-1">5. Security</strong>
                    We use AES-256 encryption for data at rest. However, no method of transmission over the Internet is 100% secure.</p>
                  </>
                )}
              </div>
            )}
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-[#0A0A0A] shrink-0">
              <Button onClick={() => setShowLegal(null)} fullWidth variant="primary" className="h-12 text-sm" disabled={isLegalLoading}>
                I Understand & Agree
              </Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
};