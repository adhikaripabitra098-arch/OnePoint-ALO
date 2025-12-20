
import React, { useState, useRef, useEffect } from 'react';
import { Screen, Button, Input, BackButton } from '../components/UI';
import { User } from '../types';
import { Mail, User as UserIcon, Lock, ArrowRight, AlertCircle, ScanFace, Info, Loader2, Eye, EyeOff, CheckSquare, Square, ShieldCheck, ChevronLeft, Scale, Globe, LockKeyhole, Server, CreditCard, Cookie, Gavel, AlertTriangle, FileText, Users, FileWarning, Fingerprint, Database, Landmark, Siren, ShieldAlert, BadgeDollarSign, Copyright, PowerOff, Activity, Clock, X, BookOpen, Terminal, Cpu, Network, Shield, Scale as ScaleIcon, Briefcase, Landmark as Bank, UserCheck, Zap, Download } from 'lucide-react';
import { authenticateBiometrics } from '../services/biometricService';
import { authService } from '../services/authService';

interface AuthProps {
  initialMode?: 'LOGIN' | 'REGISTER';
  onComplete: (user: User) => void;
  onRegister: (email: string, pass: string, name: string) => Promise<boolean>;
  onLogin: (email: string, pass: string) => Promise<User | null>;
  onBack: () => void;
}

export const AuthScreen: React.FC<AuthProps> = ({ initialMode = 'REGISTER', onComplete, onRegister, onLogin, onBack }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'REGISTER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [legalStack, setLegalStack] = useState<string[]>([]);
  const legalScrollRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (legalScrollRef.current) {
        legalScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [legalStack]);

  const pushLegal = (pageId: string) => setLegalStack(prev => [...prev, pageId]);
  const popLegal = () => legalStack.length <= 1 ? setLegalStack([]) : setLegalStack(prev => prev.slice(0, -1));

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setNotification(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleAuth = async () => {
    setError(null);
    setNotification(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || (isRegister && !name.trim())) {
        setError("Please fill in all fields.");
        return;
    }
    if (isRegister && password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    if (isRegister && !agreedToTerms) {
        setError("You must agree to the Terms of Service.");
        return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const success = await onRegister(cleanEmail, password, name.trim());
        if (success) {
           const user = await onLogin(cleanEmail, password);
           user ? onComplete(user) : setError("Registration successful but login failed.");
        } else {
           throw new Error("Registration failed.");
        }
      } else {
        const user = await onLogin(cleanEmail, password);
        user ? onComplete(user) : setError("Invalid email or password.");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
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
    const result = await authenticateBiometrics(email || 'User');
    setIsScanning(false);
    if (result.success) {
      onComplete({ name: 'User', email: email || 'user@onepoint.ai', id: 'local_user' });
    } else {
      setError(result.error === 'not_setup' ? "Face ID not set up." : "Biometric validation failed.");
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setNotification(null);
    if (!email.trim()) {
      setError("Enter your email to reset password.");
      return;
    }
    try {
      await authService.resetPassword(email);
      setNotification("Password reset email sent.");
    } catch (e: any) {
      setError("Failed to send reset email.");
    }
  };

  const LegalLink = ({ to, children }: { to: string, children?: React.ReactNode }) => (
    <span 
      onClick={(e) => { e.stopPropagation(); pushLegal(to); }} 
      className="text-accent cursor-pointer font-bold underline decoration-accent/40 underline-offset-2 mx-1 transition-colors hover:text-white"
    >
      {children}
    </span>
  );

  const LegalSection = ({ title, icon: Icon, children }: { title: string, icon: any, children?: React.ReactNode }) => (
    <section className="mb-8 border-b border-white/5 pb-8 last:border-0">
      <h3 className="text-white font-bold text-2xl mb-5 flex items-center gap-3">
        {Icon && <div className="p-2 rounded-xl bg-white/5 border border-white/5"><Icon size={20} className="text-accent" /></div>}
        {title}
      </h3>
      <div className="text-gray-300 text-[15px] leading-[1.8] font-medium space-y-4">
        {children}
      </div>
    </section>
  );

  const LegalPageHeader = ({ title, date }: { title: string, date?: string }) => (
    <div className="mb-8">
      <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-white">{title}</h1>
      {date && <p className="text-[11px] text-textMuted uppercase font-bold tracking-[0.2em]">Protocol Version: {date}</p>}
    </div>
  );

  const renderLegalContent = (pageId: string) => {
    switch (pageId) {
      case 'TOS':
        return (
          <>
            <LegalPageHeader title="Terms of Service" date="v3.1.2-ALPHA" />
            <div className="bg-white/5 p-7 rounded-[32px] mb-8 border border-white/10 backdrop-blur-md">
              <p className="text-lg font-semibold leading-relaxed text-white">
                This document ("<LegalLink to="AGREEMENT">Agreement</LegalLink>") establishes a <LegalLink to="BINDING_CONTRACT">binding legal framework</LegalLink> governing the use of the OnePoint <LegalLink to="AUTONOMOUS_LIFE_OS">Autonomous Life OS</LegalLink>. 
                By interacting with this <LegalLink to="SOFTWARE_SUITE">Software Suite</LegalLink>, you grant <LegalLink to="PROXIMAL_AGENCY">Proximal Agency</LegalLink> to the system.
              </p>
            </div>
            
            <LegalSection title="1. Digital Agency & Representation" icon={ScaleIcon}>
                <p>OnePoint acts as your <LegalLink to="DIGITAL_PROXY">Digital Proxy</LegalLink>. You hereby execute a <LegalLink to="LIMITED_POWER_OF_ATTORNEY">Limited Power of Attorney</LegalLink> allowing the <LegalLink to="AUTONOMOUS_AGENT">Autonomous Agent</LegalLink> to engage in <LegalLink to="AGENCY_ACTIONS">Agency Actions</LegalLink>.</p>
                <p>These actions include, but are not limited to, <LegalLink to="NEGOTIATION_PROTOCOLS">Negotiation Protocols</LegalLink>, <LegalLink to="TRANSACTION_EXECUTION">Transaction Execution</LegalLink>, and <LegalLink to="THIRD_PARTY_INTERFACING">Third-Party Interfacing</LegalLink>.</p>
            </LegalSection>

            <LegalSection title="2. Financial Authority" icon={Bank}>
                <p>The User authorizes the Service to initiate <LegalLink to="DEBIT_VECTORS">Debit Vectors</LegalLink> and <LegalLink to="CREDIT_ALLOCATIONS">Credit Allocations</LegalLink> through <LegalLink to="REGULATED_PARTNERS">Regulated Financial Partners</LegalLink>.</p>
                <p>All <LegalLink to="FINANCIAL_TRANSFERS">Financial Transfers</LegalLink> are governed by the <LegalLink to="SPENDING_LIMITS">Spending Limits</LegalLink> and <LegalLink to="APPROVAL_THRESHOLDS">Approval Thresholds</LegalLink> configured during <LegalLink to="PROVISIONING">Provisioning</LegalLink>.</p>
            </LegalSection>

            <LegalSection title="3. Liability & Risk Disclosure" icon={AlertTriangle}>
                <p>The Service utilizes <LegalLink to="NON_DETERMINISTIC_AI">Non-Deterministic AI</LegalLink>. You acknowledge the risk of <LegalLink to="ALGORITHMIC_ERROR">Algorithmic Error</LegalLink> and <LegalLink to="LLM_HALLUCINATION">Model Hallucination</LegalLink>.</p>
                <p>OnePoint Inc. maintains a <LegalLink to="LIABILITY_SHIELD">Liability Shield</LegalLink> against <LegalLink to="INDIRECT_DAMAGES">Indirect Damages</LegalLink> resulting from <LegalLink to="AI_MISINTERPRETATION">AI Misinterpretation</LegalLink> of User commands.</p>
            </LegalSection>

            <LegalSection title="4. Safety Guardrails" icon={Shield}>
                <p>The system is hard-coded with <LegalLink to="ETHICAL_HEURISTICS">Ethical Heuristics</LegalLink> and a <LegalLink to="FAIL_SAFE_KILL_SWITCH">Fail-Safe Kill Switch</LegalLink>. Any attempt to bypass <LegalLink to="SECURITY_LAYERS">Security Layers</LegalLink> results in <LegalLink to="AUTO_TERMINATION">Automatic Termination</LegalLink>.</p>
            </LegalSection>

            <LegalSection title="5. Global Jurisdictional Scope" icon={Globe}>
                <p>This Agreement adheres to <LegalLink to="INTERNATIONAL_LAW">International Statutes</LegalLink> including <LegalLink to="GDPR">GDPR</LegalLink>, <LegalLink to="CCPA">CCPA</LegalLink>, and <LegalLink to="UK_DPA">UK Data Protection Act</LegalLink>.</p>
            </LegalSection>
          </>
        );
      case 'PRIVACY':
        return (
          <>
            <LegalPageHeader title="Privacy Architecture" date="v2.0.4-ENCRYPTED" />
            <div className="bg-white/5 p-7 rounded-[32px] mb-8 border border-white/10 backdrop-blur-md">
              <p className="text-lg font-semibold leading-relaxed text-white">
                OnePoint utilizes a <LegalLink to="LOCAL_FIRST">Local-First Privacy Architecture</LegalLink>. Your <LegalLink to="SOVEREIGN_DATA">Sovereign Data</LegalLink> is never commoditized. 
                We implement <LegalLink to="ZERO_KNOWLEDGE_PRINCIPLES">Zero-Knowledge Principles</LegalLink> to ensure your <LegalLink to="DIGITAL_SOVEREIGNTY">Digital Sovereignty</LegalLink>.
              </p>
            </div>
            
            <LegalSection title="1. Data Residency" icon={Database}>
                <p>Sensitive data is stored exclusively on-device in an <LegalLink to="ENCRYPTED_SQLITE">Encrypted SQLite</LegalLink> container using <LegalLink to="AES_256_GCM">AES-256-GCM</LegalLink>.</p>
            </LegalSection>

            <LegalSection title="2. Biometric Isolation" icon={Fingerprint}>
                <p>Biometric templates reside within the hardware <LegalLink to="SECURE_ENCLAVE">Secure Enclave</LegalLink>. The Service only receives a <LegalLink to="BOOLEAN_TOKEN">Boolean Token</LegalLink> of success.</p>
            </LegalSection>

            <LegalSection title="3. AI Processing Privacy" icon={Activity}>
                <p>Tasks processed via <LegalLink to="EPHEMERAL_COMPUTE">Ephemeral Compute</LegalLink> are governed by <LegalLink to="DATA_USAGE_RESTRICTIONS">Strict Data Usage Restrictions</LegalLink>. Your data is <LegalLink to="NOT_USED_FOR_TRAINING">Not Used for Model Training</LegalLink>.</p>
            </LegalSection>

            <LegalSection title="4. Communication Security" icon={LockKeyhole}>
                <p>All outbound requests are wrapped in <LegalLink to="TLS_1_3">TLS 1.3</LegalLink> and <LegalLink to="E2E_ENCRYPTION">End-to-End Encryption</LegalLink> where supported by the <LegalLink to="VENDORS">Vendors</LegalLink>.</p>
            </LegalSection>

            <LegalSection title="5. Data Portability" icon={Download}>
                <p>Under the <LegalLink to="RIGHT_TO_PORTABILITY">Right to Portability</LegalLink>, you may export your entire <LegalLink to="TASK_HISTORY">Task History</LegalLink> at any time.</p>
            </LegalSection>
          </>
        );
      
      case 'AGREEMENT': return <p className="text-gray-300">A <LegalLink to="LEGAL_INSTRUMENT">Legal Instrument</LegalLink> comprising the totality of <LegalLink to="CONTRACTUAL_OBLIGATIONS">Contractual Obligations</LegalLink> and <LegalLink to="RIGHTS_ASSIGNMENT">Rights Assignment</LegalLink> between the parties.</p>;
      case 'BINDING_CONTRACT': return <p className="text-gray-300">An enforceable <LegalLink to="COVENANT">Covenant</LegalLink> where <LegalLink to="CONSIDERATION">Consideration</LegalLink> is exchanged for <LegalLink to="SERVICE_PROVISION">Service Provision</LegalLink>.</p>;
      case 'AUTONOMOUS_LIFE_OS': return <p className="text-gray-300">An <LegalLink to="INTELLIGENT_SYSTEM">Intelligent System</LegalLink> capable of <LegalLink to="PROACTIVE_ORCHESTRATION">Proactive Orchestration</LegalLink> of real-world events without <LegalLink to="CONTINUOUS_OVERSIGHT">Continuous Oversight</LegalLink>.</p>;
      case 'PROXIMAL_AGENCY': return <p className="text-gray-300">The legal standing where an <LegalLink to="ARTIFICIAL_CONSTRUCT">Artificial Construct</LegalLink> acts with the <LegalLink to="IMPLIED_AUTHORITY">Implied Authority</LegalLink> of its <LegalLink to="PRINCIPAL">Principal</LegalLink>.</p>;
      case 'DIGITAL_PROXY': return <p className="text-gray-300">A <LegalLink to="VIRTUAL_REPRESENTATIVE">Virtual Representative</LegalLink> empowered to execute <LegalLink to="JURIDICAL_ACTS">Juridical Acts</LegalLink> on behalf of a human User.</p>;
      case 'LIMITED_POWER_OF_ATTORNEY': return <p className="text-gray-300">A restricted <LegalLink to="MANDATE">Mandate</LegalLink> granting the Service power to handle <LegalLink to="SPECIFIED_AFFAIRS">Specified Affairs</LegalLink> within <LegalLink to="HARD_CODED_LIMITS">Hard-Coded Limits</LegalLink>.</p>;
      case 'NON_DETERMINISTIC_AI': return <p className="text-gray-300">Probabilistic <LegalLink to="NEURAL_NETWORKS">Neural Networks</LegalLink> whose output varies based on <LegalLink to="LATENT_VARIABLES">Latent Variables</LegalLink> and <LegalLink to="STOCHASTIC_SAMPLING">Stochastic Sampling</LegalLink>.</p>;
      case 'SECURE_ENCLAVE': return <p className="text-gray-300">A hardware-isolated <LegalLink to="CRYPTOGRAPHIC_PROCESSOR">Cryptographic Processor</LegalLink> that keeps <LegalLink to="PRIVATE_KEYS">Private Keys</LegalLink> inaccessible to the <LegalLink to="OPERATING_SYSTEM">Main Operating System</LegalLink>.</p>;
      case 'E2E_ENCRYPTION': return <p className="text-gray-300">A <LegalLink to="COMMUNICATION_PROTOCOL">Communication Protocol</LegalLink> where only the <LegalLink to="END_POINTS">End Points</LegalLink> possess the <LegalLink to="DECRYPTION_MATERIAL">Decryption Material</LegalLink>.</p>;
      case 'LOCAL_FIRST': return <p className="text-gray-300">A software design pattern where the <LegalLink to="AUTHORITATIVE_SOURCE">Authoritative Source</LegalLink> of data resides on the <LegalLink to="CLIENT_DEVICE">Client Device</LegalLink>.</p>;
      case 'ALGORITHMIC_ERROR': return <p className="text-gray-300">A failure in <LegalLink to="LOGIC_PROCESSING">Logic Processing</LegalLink> or <LegalLink to="PATTERN_RECOGNITION">Pattern Recognition</LegalLink> resulting from <LegalLink to="DATA_NOISE">Data Noise</LegalLink>.</p>;
      case 'FAIL_SAFE_KILL_SWITCH': return <p className="text-gray-300">An <LegalLink to="INVIOLABLE_PROTOCOL">Inviolable Protocol</LegalLink> that immediately ceases all <LegalLink to="AGENCY_ACTIONS">Agency Actions</LegalLink> upon <LegalLink to="ANOMALY_DETECTION">Anomaly Detection</LegalLink>.</p>;
      case 'JURISDICTIONAL_COMPLIANCE': return <p className="text-gray-300">The state of adhering to <LegalLink to="STATUTORY_REQUIREMENTS">Statutory Requirements</LegalLink> of a specific <LegalLink to="SOVEREIGN_TERRITORY">Sovereign Territory</LegalLink>.</p>;
      case 'PROVISIONING': return <p className="text-gray-300">The initial <LegalLink to="BOOTSTRAPPING_SEQUENCE">Bootstrapping Sequence</LegalLink> where <LegalLink to="USER_IDENTITY">User Identity</LegalLink> and <LegalLink to="PREFERENCE_VECTORS">Preference Vectors</LegalLink> are established.</p>;
      case 'GDPR': return <p className="text-gray-300">The <LegalLink to="GENERAL_DATA_PROTECTION_REGULATION">General Data Protection Regulation</LegalLink> (EU) 2016/679 governing <LegalLink to="DATA_SENSITIVITY">Data Sensitivity</LegalLink>.</p>;
      
      default:
        return (
          <>
            <LegalPageHeader title={pageId.replace(/_/g, ' ')} />
            <div className="space-y-4">
                <p className="text-gray-300 leading-loose">Detailed definition for <strong className="text-white">{pageId}</strong>: This term is strictly governed by <LegalLink to="INTERNATIONAL_ARBITRATION_RULES">International Arbitration Rules</LegalLink> and <LegalLink to="CYBER_SECURITY_PROTOCOLS">Cyber Security Protocols</LegalLink>.</p>
                <p className="text-gray-400 italic">Accessing deeper layers of this definition requires <LegalLink to="HIGH_LEVEL_CLEARANCE">High-Level Clearance</LegalLink> or <LegalLink to="JURIDICAL_REVIEW">Juridical Review</LegalLink>.</p>
            </div>
          </>
        );
    }
  };

  return (
    <Screen hidePadding={true}>
      {/* RECURSIVE LEGAL OVERLAY */}
      {legalStack.length > 0 ? (
        <div 
          key={`legal-${legalStack[legalStack.length - 1]}`} 
          className="fixed inset-0 z-[100] bg-[#050505] flex flex-col animate-slide-up"
        >
           <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-[#1E3A8A]/30 to-transparent blur-[120px] pointer-events-none z-0" />
           <div className="h-full w-full max-w-md mx-auto flex flex-col z-10 relative">
               <div className="flex-1 overflow-y-auto no-scrollbar pt-20 px-8 pb-12" ref={legalScrollRef}>
                  <div className="mb-6 flex justify-between items-center">
                      <BackButton onClick={popLegal} />
                      {legalStack.length > 1 && (
                        <button onClick={() => setLegalStack([])} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-xl border border-white/5"><X size={24} /></button>
                      )}
                  </div>
                  <div className="animate-slide-up">
                     {renderLegalContent(legalStack[legalStack.length - 1])}
                  </div>
               </div>
           </div>
        </div>
      ) : (
        /* AUTH UI - RESTORED HEADERS */
        <div key={isRegister ? 'reg' : 'log'} className="absolute inset-0 z-10 animate-slide-up">
          <div className="h-full w-full max-w-md mx-auto flex flex-col px-6">
            <div className="flex-1 overflow-y-auto no-scrollbar pt-20 pb-10">
                <div className="mb-4"><BackButton onClick={onBack} /></div>
                <div className="mb-8 relative">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">{isRegister ? "Create Account" : "Welcome Back"}</h1>
                    <p className="text-textMuted text-lg font-medium">{isRegister ? "Start your autonomous journey." : "Your personal autonomy engine awaits."}</p>
                </div>

                <div className="space-y-4 mb-4">
                  {isRegister && <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} leftIcon={<UserIcon size={20} />} />}
                  <Input placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail size={20} />} />
                  <Input placeholder="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<Lock size={20} />} rightIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />} onRightIconClick={() => setShowPassword(!showPassword)} />
                  {isRegister && (
                    <>
                      <Input placeholder="Confirm Password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} leftIcon={<Lock size={20} />} rightIcon={showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />} onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                      <div className="flex items-start gap-3 px-2 py-4 cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                        <div className={`mt-0.5 transition-colors ${agreedToTerms ? 'text-primary' : 'text-textMuted'}`}>{agreedToTerms ? <CheckSquare size={20} /> : <Square size={20} />}</div>
                        <p className="text-[14px] text-textMuted leading-relaxed font-medium">
                          I agree to the <LegalLink to="TOS">Terms of Service</LegalLink> and <LegalLink to="PRIVACY">Privacy Policy</LegalLink>. I confirm I am at least 16 years old.
                        </p>
                      </div>
                    </>
                  )}
                  {!isRegister && <div className="flex justify-end"><button onClick={handleResetPassword} className="text-sm font-bold text-white underline decoration-white/30 underline-offset-4">Forgot Password?</button></div>}
                </div>

                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-slide-up mb-4"><AlertCircle size={18} className="text-red-400 shrink-0" />{error}</div>}
                {notification && <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-start gap-3 text-blue-100 text-sm animate-slide-up mb-4"><Info size={18} className="text-accent shrink-0" />{notification}</div>}

                <div className="flex flex-col gap-4">
                  <Button onClick={handleAuth} fullWidth variant="primary" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : (isRegister ? "Sign Up" : "Log In")}</Button>
                  <button onClick={handleBiometric} className="w-full h-[60px] rounded-full bg-[#0A0A0A] border border-white/20 text-white font-bold flex items-center justify-center gap-3 active:scale-95 transition-all">
                    {isScanning ? <Loader2 size={20} className="animate-spin" /> : <ScanFace size={24} />}
                    {isRegister ? "Enable Face ID" : "Log in with Face ID"}
                  </button>
                </div>
                
                <div className="mt-10 text-center flex justify-center items-center gap-2">
                   <span className="text-sm text-white/50">{isRegister ? "Already have an account?" : "Don't have an account?"}</span>
                   <button onClick={toggleMode} className="text-sm text-white font-bold underline underline-offset-4">{isRegister ? "Log In" : "Register"}</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
};
