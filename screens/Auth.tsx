import React, { useState, useRef, useEffect } from 'react';
import { Screen, Button, Input, BackButton } from '../components/UI';
import { User } from '../types';
import { Mail, User as UserIcon, Lock, ArrowRight, AlertCircle, ScanFace, Info, Loader2, Eye, EyeOff, CheckSquare, Square, ShieldCheck, ChevronLeft, Scale, Globe, LockKeyhole, Server, CreditCard, Cookie, Gavel, AlertTriangle, FileText, Users, FileWarning, Fingerprint, Database, Landmark, Siren, ShieldAlert, BadgeDollarSign, Copyright, PowerOff, Activity, Clock, X, BookOpen, Terminal, Cpu, Network } from 'lucide-react';
import { authenticateBiometrics } from '../services/biometricService';
import { authService } from '../services/authService';

interface AuthProps {
  initialMode?: 'LOGIN' | 'REGISTER';
  onComplete: (user: User) => void;
  onRegister: (email: string, pass: string, name: string) => Promise<boolean>;
  onLogin: (email: string, pass: string) => Promise<User | null>;
  onBack: () => void;
}

// Standard W3C Email Regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const AuthScreen: React.FC<AuthProps> = ({ initialMode = 'REGISTER', onComplete, onRegister, onLogin, onBack }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'REGISTER');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Legal & Consent State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // NEW: Awaiting Email Confirmation State
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  
  // FULL SCREEN LEGAL NAVIGATION STACK
  const [legalStack, setLegalStack] = useState<string[]>([]);
  
  // REF for Auto-Scrolling
  const legalScrollRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- SCROLL TO TOP EFFECT ---
  useEffect(() => {
    if (legalScrollRef.current) {
        legalScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [legalStack]);

  // --- LEGAL NAVIGATION HELPERS ---
  const pushLegal = (pageId: string) => {
    setLegalStack(prev => [...prev, pageId]);
  };

  const popLegal = () => {
    if (legalStack.length <= 1) {
       handleCloseLegal();
    } else {
       setLegalStack(prev => prev.slice(0, -1));
    }
  };
  
  const handleCloseLegal = () => {
     setLegalStack([]);
  };

  const handleAuth = async () => {
    setError(null);
    setNotification(null);
    
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !password || (isRegister && !cleanName)) {
        setError("Please fill in all fields.");
        if (navigator.vibrate) navigator.vibrate(50);
        return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
        setError("Please enter a valid email address.");
        if (navigator.vibrate) navigator.vibrate(50);
        return;
    }

    if (isRegister) {
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            if (navigator.vibrate) navigator.vibrate(50);
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            if (navigator.vibrate) navigator.vibrate(50);
            return;
        }
        if (!agreedToTerms) {
            setError("You must agree to the Terms of Service");
            if (navigator.vibrate) navigator.vibrate(50);
            return;
        }
    }

    setIsLoading(true);

    try {
      if (!process.env.SUPABASE_URL) {
         await new Promise(r => setTimeout(r, 600));
      }

      if (isRegister) {
        const success = await onRegister(cleanEmail, password, cleanName);
        
        if (success) {
           try {
             const user = await onLogin(cleanEmail, password);
             if (user) {
                onComplete(user);
             } else {
                setAwaitingVerification(true);
             }
           } catch (e) {
             setAwaitingVerification(true);
           }
        } else {
           throw new Error("Registration failed. Please try again.");
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
      if (navigator.vibrate) navigator.vibrate(50);
      if (err.message?.includes("User already registered") || err.message?.includes("unique constraint")) {
         setError("This email is already registered. Please log in.");
      } else if (err.message?.includes("Email not confirmed")) {
         setAwaitingVerification(true);
      } else {
         setError(err.message || "Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleAuth();
    }
  };

  const handleBiometric = async () => {
    setError(null);
    setNotification(null);

    if (isRegister) {
      setNotification("Biometric authentication is not available during account creation.");
      return;
    }

    if (!window.PublicKeyCredential) {
       setError("Face ID is not supported in this browser/app view.");
       return;
    }

    setIsScanning(true);
    const targetUser = email || 'OnePoint User';
    const result = await authenticateBiometrics(targetUser);
    setIsScanning(false);

    if (result.success) {
       const user = email ? await onLogin(email, 'mock_pass_bypass') : null;
       onComplete(user || { 
         name: 'User', 
         email: email || 'user@onepoint.ai',
         id: email ? `local_${email}` : 'local_biometric_user'
       });
    } else {
      if (navigator.vibrate) navigator.vibrate(50);
      if (result.error === 'not_setup') {
        setError("Face ID not set up. Please log in with password first.");
      } else if (result.error === 'no_match') {
        setError("Face not recognized.");
      } else if (result.error === 'iframe_blocked' || result.error === 'not_supported') {
        setError("Biometrics not supported in this view. Use password.");
      } else {
        setError("Biometric authentication failed.");
      }
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setNotification(null);

    if (!email) {
      setError("Please enter your Gmail address above so we can send the reset link.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await authService.resetPassword(email);
      setNotification(`We have sent a password reset link to ${email}. Please check your Inbox.`);
    } catch (err: any) {
      setError("Failed to send reset email. " + err.message);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setNotification(null);
    setAwaitingVerification(false);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAgreedToTerms(false);
  };

  // --- LEGAL COMPONENTS ---
  const LegalLink = ({ to, children }: { to: string, children?: React.ReactNode }) => (
    <span 
      onClick={(e) => {
        e.stopPropagation();
        pushLegal(to);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pushLegal(to);
        }
      }}
      className="text-accent hover:text-blue-300 cursor-pointer font-bold mx-0.5 underline decoration-accent/30 underline-offset-2 transition-colors"
    >
      {children}
    </span>
  );

  const LegalSection = ({ title, icon: Icon, children }: { title: string, icon?: any, children?: React.ReactNode }) => (
    <section className="mb-12 border-b border-white/5 pb-10 last:border-0">
      <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-3">
        {Icon && <div className="p-2.5 rounded-xl bg-white/5 border border-white/5"><Icon size={24} className="text-accent" /></div>}
        {title}
      </h3>
      <div className="text-gray-300 text-base leading-loose font-medium space-y-6">
        {children}
      </div>
    </section>
  );

  const LegalParagraph = ({children}: {children?: React.ReactNode}) => (
    <p className="mb-6 text-gray-300 leading-8 text-[15px] font-medium tracking-wide">
      {children}
    </p>
  );

  const LegalHeader = ({children}: {children?: React.ReactNode}) => (
    <h4 className="text-white font-bold text-lg mb-4 mt-10 border-b border-white/10 pb-3 flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-accent rounded-full" />
      {children}
    </h4>
  );

  const LegalPageHeader = ({ title, date }: { title: string, date?: string }) => (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2 tracking-tight">{title}</h1>
      {date && <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        <p className="text-xs text-textMuted uppercase font-bold tracking-wider">Updated: {date}</p>
      </div>}
    </div>
  );

  // --- VAST LEGAL CONTENT ENGINE ---
  const renderLegalContent = (pageId: string) => {
      const Content = (() => {
        switch (pageId) {
          case 'TOS':
          return (
            <>
              <LegalPageHeader title="Terms of Service" date={new Date().toLocaleDateString()} />
              <div>
                 <div className="bg-surfaceHighlight/20 p-8 rounded-3xl mb-12 border border-white/5">
                   <p className="text-base font-medium leading-relaxed text-gray-200">
                     This document ("<LegalLink to="AGREEMENT">Agreement</LegalLink>") constitutes a legally binding <LegalLink to="CONTRACT">contract</LegalLink> between you ("User") and OnePoint Inc. ("<LegalLink to="SERVICE">Service</LegalLink>", "We", "Us"). 
                     By initializing, accessing, or using the <LegalLink to="AUTONOMOUS_LIFE_OS">Autonomous Life OS</LegalLink>, you expressly acknowledge and agree to be bound by the terms contained herein. 
                     If you do not agree to these terms, you must immediately cease all use of the Service.
                   </p>
                 </div>
                 
                 <LegalSection title="1. Introduction & Definitions" icon={BookOpen}>
                    <p>Welcome to OnePoint. The Service is an AI-native autonomy engine designed to execute real-world tasks on your behalf. To ensure clarity, the following definitions apply throughout this Agreement:</p>
                    <ul className="list-disc pl-5 space-y-4 mt-4 opacity-90">
                       <li><strong>"<LegalLink to="AUTONOMOUS_AGENT">Autonomous Agent</LegalLink>"</strong> refers to the AI system capable of making decisions and taking actions without direct human intervention, based on your configured <LegalLink to="PREFERENCES">Preferences</LegalLink>.</li>
                       <li><strong>"<LegalLink to="AGENCY_ACTION">Agency Action</LegalLink>"</strong> means any action taken by the Service on your behalf, including but not limited to booking flights, negotiating refunds, sending emails, or executing financial transactions.</li>
                       <li><strong>"<LegalLink to="HALLUCINATION">Hallucination</LegalLink>"</strong> refers to the phenomenon where Generative AI models may confidently produce factually incorrect or nonsensical information.</li>
                       <li><strong>"<LegalLink to="SPENDING_LIMIT">Spending Limit</LegalLink>"</strong> refers to the hard cap on financial transactions that the Agent is authorized to execute without explicit biometric confirmation.</li>
                    </ul>
                 </LegalSection>

                 <LegalSection title="2. Eligibility & Legal Capacity" icon={UserIcon}>
                    <p>To use OnePoint, you represent and warrant that you are at least <LegalLink to="AGE">16 years of age</LegalLink> (or the age of majority in your <LegalLink to="JURISDICTION">jurisdiction</LegalLink>) and possess the full legal capacity to enter into a <LegalLink to="BINDING_CONTRACT">binding contract</LegalLink>.</p>
                    <p>If you are using the Service on behalf of a legal entity (e.g., a company), you represent that you have the authority to bind that entity to this Agreement. Access to the Service is void where prohibited by applicable law. We verify eligibility through <LegalLink to="DEVICE_ATTESTATION">Device Attestation</LegalLink> and biometric signals.</p>
                 </LegalSection>

                 <LegalSection title="3. The AI Service & Mechanics" icon={Cpu}>
                    <p>The Service utilizes advanced, non-deterministic generative models to interpret your intent and execute tasks. While we utilize state-of-the-art architectures, you acknowledge the inherent risks of AI:</p>
                    <p><strong>3.1 Non-Determinism:</strong> The same input may not always produce the exact same output. The Agent learns and adapts, which introduces <LegalLink to="VARIABILITY">variability</LegalLink>.</p>
                    <p><strong>3.2 Error Rate:</strong> You acknowledge that the Agent may make <LegalLink to="MISTAKES">mistakes</LegalLink>, including but not limited to misinterpreting dates, booking incorrect venues, or misunderstanding negotiation parameters.</p>
                    <p><strong>3.3 User Oversight:</strong> You agree that you are ultimately responsible for reviewing the actions of the Agent. The Service provides tools for <LegalLink to="HUMAN_IN_THE_LOOP">Human-in-the-Loop</LegalLink> <LegalLink to="INTERVENTION">intervention</LegalLink>, and it is your responsibility to utilize them.</p>
                 </LegalSection>

                 <LegalSection title="4. Agency & Power of Attorney" icon={Scale}>
                    <p>By delegating tasks to OnePoint, you grant the Service a <LegalLink to="LIMITED_POWER_OF_ATTORNEY">Limited Power of Attorney</LegalLink> to act as your agent in dealings with <LegalLink to="THIRD_PARTIES">third parties</LegalLink>.</p>
                    <p><strong>4.1 Scope of Authority:</strong> This authority is strictly limited to the tasks you explicitly or implicitly assign to the Agent. It does not grant us the right to <LegalLink to="SELL_PROPERTY">sell your property</LegalLink>, enter into long-term debt obligations (mortgages), or make <LegalLink to="MEDICAL_DECISIONS">medical decisions</LegalLink>.</p>
                    <p><strong>4.2 Binding Effect:</strong> Actions taken by the Agent within the scope of your <LegalLink to="INSTRUCTIONS">instructions</LegalLink> are legally binding upon you. If the Agent books a <LegalLink to="NON_REFUNDABLE">non-refundable</LegalLink> flight at your request, you are liable for the cost.</p>
                    <p><strong>4.3 Third-Party Terms:</strong> The Agent has the authority to agree to standard Terms of Service (<LegalLink to="CLICK_WRAP">click-wrap agreements</LegalLink>) of third-party vendors (e.g., Uber, OpenTable) on your behalf.</p>
                 </LegalSection>

                 <LegalSection title="5. Financial Authority & Transactions" icon={CreditCard}>
                    <p>You hereby authorize OnePoint to initiate charges against your linked funding sources (<LegalLink to="CREDIT_CARDS">credit cards</LegalLink>, <LegalLink to="BANK_ACCOUNTS">bank accounts</LegalLink>) via our <LegalLink to="PAYMENT_PROCESSORS">payment processing partners</LegalLink>.</p>
                    <p><strong>5.1 Auto-Approval:</strong> Transactions below your defined <LegalLink to="AUTO_APPROVE">Auto-Approve Threshold</LegalLink> are executed instantly. You waive the right to <LegalLink to="DISPUTE">dispute</LegalLink> these charges on the basis of "lack of authorization" provided they were executed in service of a requested task.</p>
                    <p><strong>5.2 Insufficient Funds:</strong> You agree to maintain sufficient funds. OnePoint is not liable for overdraft fees, returned check fees, or service interruptions caused by payment failures.</p>
                    <p><strong>5.3 Fraud Monitoring:</strong> We employ <LegalLink to="HEURISTIC_ANALYSIS">heuristic analysis</LegalLink> to detect anomalous spending patterns. We reserve the right to block any transaction that appears fraudulent, even if it is within your limits.</p>
                 </LegalSection>

                 <LegalSection title="6. User Conduct & Acceptable Use" icon={ShieldAlert}>
                    <p>You agree not to use the Service for any <LegalLink to="UNLAWFUL_PURPOSE">Unlawful Purpose</LegalLink>. Prohibited activities include, but are not limited to:</p>
                    <ul className="list-disc pl-5 space-y-4 mt-4 opacity-90">
                        <li><strong>Harassment:</strong> Using the Agent to <LegalLink to="SPAM">spam</LegalLink>, harass, or <LegalLink to="THREATEN">threaten</LegalLink> individuals.</li>
                        <li><strong>Fraud:</strong> Instructing the Agent to generate <LegalLink to="FAKE_DOCUMENTS">fake documents</LegalLink>, <LegalLink to="FALSE_REVIEWS">false reviews</LegalLink>, or deceptive communications.</li>
                        <li><strong>Jailbreaking:</strong> Attempting to manipulate the Agent's safety alignment techniques (RLHF) to produce prohibited content.</li>
                        <li><strong>Reverse Engineering:</strong> Decompiling or attempting to extract the <LegalLink to="MODEL_WEIGHTS">underlying model weights</LegalLink> or <LegalLink to="SOURCE_CODE">source code</LegalLink>.</li>
                    </ul>
                 </LegalSection>

                 <LegalSection title="7. Intellectual Property Rights" icon={Copyright}>
                     <p>OnePoint grants you a limited, non-exclusive, non-transferable, revocable license to use the Software.</p>
                     <p><strong>7.1 Our IP:</strong> All rights, title, and interest in the Service, including the <LegalLink to="UI">UI</LegalLink>, fine-tuned models, <LegalLink to="LOGOS">logos</LegalLink>, and code, remain the exclusive property of OnePoint Inc.</p>
                     <p><strong>7.2 Your Content:</strong> You retain ownership of the data you provide. However, you grant us a <LegalLink to="WORLDWIDE">worldwide</LegalLink>, <LegalLink to="ROYALTY_FREE">royalty-free license</LegalLink> to <LegalLink to="PROCESS">process</LegalLink> this data solely for the purpose of providing the Service. We do not claim ownership of the output generated by the Agent on your behalf.</p>
                 </LegalSection>

                 <LegalSection title="8. Disclaimer of Warranties" icon={FileWarning}>
                     <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT <LegalLink to="WARRANTY">WARRANTY</LegalLink> OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF <LegalLink to="MERCHANTABILITY">MERCHANTABILITY</LegalLink>, FITNESS FOR A PARTICULAR PURPOSE, AND <LegalLink to="NON_INFRINGEMENT">NON-INFRINGEMENT</LegalLink>.</p>
                     <p>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF <LegalLink to="VIRUSES">VIRUSES</LegalLink> OR OTHER HARMFUL <LegalLink to="COMPONENTS">COMPONENTS</LegalLink>.</p>
                 </LegalSection>

                 <LegalSection title="9. Limitation of Liability" icon={AlertTriangle}>
                     <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ONEPOINT INC. SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE <LegalLink to="DAMAGES">DAMAGES</LegalLink>, INCLUDING <LegalLink to="LOSS_OF_DATA">LOSS OF DATA</LegalLink>, USE, <LegalLink to="GOODWILL">GOODWILL</LegalLink>, OR PROFITS.</p>
                     <p>OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE USE OF THE SERVICE SHALL NOT EXCEED THE GREATER OF $100 OR THE AMOUNT PAID BY YOU TO ONEPOINT IN THE PAST 12 MONTHS.</p>
                 </LegalSection>

                 <LegalSection title="10. Indemnification" icon={ShieldCheck}>
                     <p>You agree to indemnify, <LegalLink to="DEFEND">defend</LegalLink>, and <LegalLink to="HOLD_HARMLESS">hold harmless</LegalLink> OnePoint Inc., its officers, directors, employees, and agents from any claims, disputes, demands, liabilities, damages, losses, and costs and expenses, including reasonable legal fees, arising out of or in any way connected with your access to or use of the Service, your violation of these Terms, or your <LegalLink to="INFRINGEMENT">infringement</LegalLink> of any third-party rights.</p>
                 </LegalSection>

                 <LegalSection title="11. Dispute Resolution & Arbitration" icon={Gavel}>
                     <p>Any dispute arising from this Agreement shall be resolved through binding <LegalLink to="INDIVIDUAL_ARBITRATION">Individual Arbitration</LegalLink>. You explicitly waive your right to participate in a Class Action lawsuit or class-wide arbitration.</p>
                     <p>The arbitration will be conducted in the <LegalLink to="ENGLISH">English language</LegalLink> and the seat of arbitration shall be San Francisco, California, unless otherwise agreed. The <LegalLink to="FAA">Federal Arbitration Act</LegalLink> governs the interpretation and enforcement of this dispute resolution provision.</p>
                 </LegalSection>

                 <LegalSection title="12. Termination & Survival" icon={PowerOff}>
                     <p>We reserve the right to <LegalLink to="SUSPEND">suspend</LegalLink> or <LegalLink to="TERMINATE">terminate</LegalLink> access immediately if we detect <LegalLink to="FRAUDULENT_ACTIVITY">Fraudulent Activity</LegalLink> or violations of our Acceptable Use Policy. You may terminate this Agreement at any time by deleting your account via the app settings.</p>
                     <p>Upon termination, your right to use the Service will immediately cease. All provisions of the Terms which by their nature should survive termination shall survive termination, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
                 </LegalSection>

                 <LegalSection title="13. Miscellaneous" icon={FileText}>
                     <p><strong>13.1 Entire Agreement:</strong> These Terms constitute the entire agreement between you and OnePoint regarding the Service.</p>
                     <p><strong>13.2 <LegalLink to="SEVERABILITY">Severability</LegalLink>:</strong> If any provision of these Terms is found to be invalid or unenforceable, that provision will be enforced to the maximum extent permissible, and the other provisions will remain in full force.</p>
                     <p><strong>13.3 <LegalLink to="ASSIGNMENT">Assignment</LegalLink>:</strong> You may not assign these Terms without our prior written consent. We may assign these Terms without restriction.</p>
                 </LegalSection>
              </div>
            </>
          );

          case 'PRIVACY':
          return (
            <>
              <LegalPageHeader title="Privacy Policy" date={new Date().toLocaleDateString()} />
              <div>
                 <div className="bg-surfaceHighlight/20 p-8 rounded-3xl mb-12 border border-white/5">
                   <p className="text-base font-medium leading-relaxed text-gray-200">
                     OnePoint operates on a radical <LegalLink to="LOCAL_FIRST">Local-First Architecture</LegalLink>. We believe your data belongs on your device, not in the cloud. 
                     This Privacy Policy details exactly how we minimize data exposure, encrypt your information, and respect your digital sovereignty.
                     By using the Service, you consent to the practices described herein.
                   </p>
                 </div>
                 
                 <LegalSection title="1. Information We Collect" icon={Database}>
                    <p>We adhere to the principle of Data Minimization. We only collect what is strictly necessary:</p>
                    <ul className="list-disc pl-5 space-y-4 mt-4 opacity-90">
                       <li><strong><LegalLink to="ACCOUNT_DATA">Account Data</LegalLink>:</strong> We collect your <LegalLink to="EMAIL">email address</LegalLink> and <LegalLink to="NAME">name</LegalLink> to establish your <LegalLink to="IDENTITY">identity</LegalLink> and enable multi-device sync (if enabled).</li>
                       <li><strong><LegalLink to="TASKS">Task Context</LegalLink>:</strong> When you create a task, we process the <LegalLink to="TEXT">text</LegalLink>, <LegalLink to="VOICE">voice</LegalLink>, or <LegalLink to="IMAGE">image data</LegalLink> you provide. This data is <LegalLink to="TRANSIENT">transiently processed</LegalLink> by LLMs and stored locally on your device.</li>
                       <li><strong><LegalLink to="USAGE_DATA">Usage Data</LegalLink>:</strong> We collect <LegalLink to="TELEMETRY">anonymized telemetry</LegalLink> (e.g., "App crashed on screen X") to improve stability. This never includes personal content or task details.</li>
                       <li><strong><LegalLink to="DEVICE_INFO">Device Information</LegalLink>:</strong> We collect <LegalLink to="DEVICE_MODEL">device model</LegalLink>, <LegalLink to="OS_VERSION">OS version</LegalLink>, and <LegalLink to="UNIQUE_ID">unique device identifiers</LegalLink> to enforce security policies and prevent fraud.</li>
                    </ul>
                 </LegalSection>
                 
                 <LegalSection title="2. Biometric Privacy & Security" icon={Fingerprint}>
                    <p>Your biometric data (<LegalLink to="FACE_SCAN">face scan</LegalLink>, <LegalLink to="FINGERPRINT">fingerprint</LegalLink>) is the most sensitive data you own. At OnePoint, we treat it with the <LegalLink to="SECURITY">highest level of security</LegalLink>:</p>
                    <p><strong>2.1 Local Processing:</strong> Biometric authentication happens exclusively within your device's <LegalLink to="SECURE_ENCLAVE">Secure Enclave</LegalLink> (iOS) or <LegalLink to="TEE">Trusted Execution Environment</LegalLink> (Android/Windows). We never receive, store, or transmit raw biometric templates or images.</p>
                    <p><strong>2.2 Cryptographic Proof:</strong> When you authenticate, the OS sends us a <LegalLink to="TOKEN">cryptographic token</LegalLink> confirming "User Verified". We only store this token, not your face.</p>
                 </LegalSection>

                 <LegalSection title="3. Local-First Architecture" icon={Server}>
                    <p>Unlike traditional cloud apps that <LegalLink to="HOARD">hoard</LegalLink> your data, OnePoint stores your sensitive data (tasks, financial history, chats) directly on your device using <LegalLink to="SQLITE_ENCRYPTION">Encrypted SQLite</LegalLink>.</p>
                    <p><strong>3.1 Syncing:</strong> Cloud sync is optional. If enabled, your data is encrypted on your device <em>before</em> <LegalLink to="UPLOAD">upload</LegalLink>. We cannot read your synced data (End-to-End Encryption).</p>
                    <p><strong>3.2 Breach Immunity:</strong> Because we don't hold the <LegalLink to="DECRYPTION_KEYS">decryption keys</LegalLink> for your personal data, a breach of our servers would yield only encrypted gibberish to attackers.</p>
                 </LegalSection>

                 <LegalSection title="4. Encryption Standards" icon={LockKeyhole}>
                    <p>We utilize <LegalLink to="MILITARY_GRADE">military-grade</LegalLink> encryption standards throughout the application lifecycle:</p>
                    <p><strong>4.1 Data at Rest:</strong> All local data is protected by <LegalLink to="ENCRYPTION">AES-256-GCM</LegalLink>. Your encryption key is derived from your password using <LegalLink to="PBKDF2">PBKDF2</LegalLink> with <LegalLink to="ITERATIONS">high iteration counts</LegalLink>.</p>
                    <p><strong>4.2 Data in Transit:</strong> All network traffic is secured via <LegalLink to="TLS">TLS 1.3</LegalLink> with <LegalLink to="PINNING">Certificate Pinning</LegalLink> to prevent <LegalLink to="MITM">Man-in-the-Middle attacks</LegalLink>.</p>
                 </LegalSection>

                 <LegalSection title="5. Generative AI Processing" icon={Activity}>
                    <p>To provide autonomous features, specific task data must be processed by <LegalLink to="LLM_PROVIDERS">LLM Providers</LegalLink> (e.g., Google Gemini, OpenAI). This is a necessary trade-off for <LegalLink to="INTELLIGENCE">intelligence</LegalLink>:</p>
                    <p><strong>5.1 Ephemeral Processing:</strong> Data sent to models is "<LegalLink to="STATELESS">stateless</LegalLink>". The model processes the prompt and returns the answer. It does not retain your data in its <LegalLink to="MEMORY">long-term memory</LegalLink>.</p>
                    <p><strong>5.2 No Training:</strong> We have strict enterprise agreements ensuring your data is <LegalLink to="NO_TRAINING_AGREEMENT">Not Used for Training</LegalLink> <LegalLink to="FUTURE_MODELS">future models</LegalLink>. Your inputs do not make the AI smarter for everyone else.</p>
                 </LegalSection>

                 <LegalSection title="6. Third Party Sharing" icon={Globe}>
                    <p>We do not sell data. We never have and never will. We are not an <LegalLink to="AD_TECH">ad-tech company</LegalLink>.</p>
                    <p>We only share specific data points with <LegalLink to="VENDORS">Vendors</LegalLink> (e.g., airlines, restaurants, booking platforms) as strictly necessary to execute a task you have explicitly requested. For example, if you ask us to book a table, we must share your name and <LegalLink to="PHONE">phone number</LegalLink> with the restaurant.</p>
                 </LegalSection>

                 <LegalSection title="7. Financial Data Security" icon={BadgeDollarSign}>
                    <p>We do not store full credit card numbers on our <LegalLink to="SERVERS">servers</LegalLink>. We utilize <LegalLink to="TOKENIZATION">Tokenization</LegalLink> via our regulated payment partners (Stripe/Plaid).</p>
                    <p>Your financial credentials are never accessible to OnePoint employees. All financial data flows directly from your device to the payment processor's secure vault via <LegalLink to="IFRAME">iframe/SDK</LegalLink>, bypassing our <LegalLink to="INFRASTRUCTURE">infrastructure</LegalLink> entirely.</p>
                 </LegalSection>

                 <LegalSection title="8. Data Retention" icon={Clock}>
                    <p>We retain account data only as long as your account is active. Local data is governed by your device storage and can be <LegalLink to="WIPED">wiped</LegalLink> by you at any time.</p>
                    <p>You may configure <LegalLink to="AUTO_DELETION">Auto-Deletion</LegalLink> policies in Settings to automatically purge old task history (e.g., "Delete tasks older than 30 days").</p>
                 </LegalSection>

                 <LegalSection title="9. International Transfers" icon={Network}>
                    <p>If you are located in the EEA, UK, or Switzerland, note that data may be processed in the United States. We rely on <LegalLink to="STANDARD_CONTRACTUAL_CLAUSES">Standard Contractual Clauses</LegalLink> and <LegalLink to="ADEQUACY">adequacy decisions</LegalLink> to ensure adequate protection of your personal data across borders.</p>
                 </LegalSection>

                 <LegalSection title="10. Your Rights (GDPR/CCPA)" icon={ShieldCheck}>
                     <p>Regardless of where you live, we grant you the following rights:</p>
                     <ul className="list-disc pl-5 space-y-4 mt-4 opacity-90">
                         <li><strong><LegalLink to="RIGHT_TO_ACCESS">Right to Access</LegalLink>:</strong> You can request a copy of all data we hold about you.</li>
                         <li><strong><LegalLink to="RIGHT_TO_RECTIFICATION">Right to Rectification</LegalLink>:</strong> You can correct inaccurate data.</li>
                         <li><strong><LegalLink to="RIGHT_TO_DELETION">Right to Deletion</LegalLink>:</strong> You can request total erasure of your account and data ("<LegalLink to="RIGHT_TO_BE_FORGOTTEN">Right to be Forgotten</LegalLink>").</li>
                         <li><strong><LegalLink to="RIGHT_TO_PORTABILITY">Right to Portability</LegalLink>:</strong> You can export your data in a machine-readable JSON format via Settings.</li>
                     </ul>
                 </LegalSection>

                 <LegalSection title="11. Children's Privacy" icon={Users}>
                     <p>The Service is not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have <LegalLink to="INADVERTENTLY">inadvertently collected</LegalLink> such data, we will take steps to delete it immediately.</p>
                 </LegalSection>

                 <LegalSection title="12. Changes to This Policy" icon={Terminal}>
                     <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date". You are advised to review this Privacy Policy periodically for any changes.</p>
                 </LegalSection>

                 <LegalSection title="13. Contact Us" icon={Mail}>
                     <p>If you have any questions about this Privacy Policy, please contact our <LegalLink to="DPO">Data Protection Officer</LegalLink> at privacy@onepoint.ai or via mail at:</p>
                     <p className="mt-4 italic text-white/60">OnePoint Inc.<br/>Attn: Legal Dept<br/>123 Autonomy Way<br/>San Francisco, CA 94107</p>
                 </LegalSection>
              </div>
            </>
          );

          default:
            return (
              <div>
                 <LegalPageHeader title={pageId.replace(/_/g, ' ')} />
                 <LegalParagraph>
                   This section defines the legal, technical, and operational parameters regarding <strong>{pageId.replace(/_/g, ' ')}</strong>.
                   The specific definitions provided here are crucial for understanding the scope of the OnePoint service agreement.
                 </LegalParagraph>
                 <LegalHeader>1. Definition & Context</LegalHeader>
                 <LegalParagraph>
                   In the context of the OnePoint Terms of Service and Privacy Policy, "{pageId.replace(/_/g, ' ')}" refers to the protocols, methodologies, and legal standards governing this specific aspect of the Service.
                   This definition encompasses all related sub-processes and auxiliary systems required to function.
                 </LegalParagraph>
                 <LegalHeader>2. Technical Specifications</LegalHeader>
                 <LegalParagraph>
                   From a technical perspective, {pageId.replace(/_/g, ' ')} involves the utilization of <LegalLink to="ALGORITHMIC_DETERMINISM">Algorithmic Determinism</LegalLink> to ensure consistent and reliable outcomes.
                   We employ state-of-the-art verification methods to ensure compliance with this standard.
                 </LegalParagraph>
                 <LegalHeader>3. Operational Limits</LegalHeader>
                 <LegalParagraph>
                    The operations defined under {pageId.replace(/_/g, ' ')} are subject to strict operational limits to ensure user safety and system integrity.
                    Any deviation from these parameters is logged and audited.
                 </LegalParagraph>
                 <LegalHeader>4. User Implications</LegalHeader>
                 <LegalParagraph>
                    By accepting the Terms, you acknowledge that {pageId.replace(/_/g, ' ')} may impact your usage of the platform. Specifically, it implies a level of automated decision making that is characteristic of <LegalLink to="AGENTIC_WORKFLOWS">Agentic Workflows</LegalLink>.
                 </LegalParagraph>
              </div>
           );
      }
    })();
    // CRITICAL: The key here ensures the animation triggers when switching between legal pages
    return <div key={pageId} className="animate-slide-up will-change-[transform,opacity]">{Content}</div>;
  };

  return (
    <Screen hidePadding={true}>
      {/* 
         FULL SCREEN LEGAL NAVIGATION OVERLAY 
         Fixed Cross Button Logic: only visible if depth > 1
      */}
      {legalStack.length > 0 ? (
        <div key="legal-overlay" className="fixed inset-0 z-[100] bg-[#050505] flex flex-col animate-slide-up will-change-[transform,opacity]">
           {/* REVOLUT-LIKE SPLASH GRADIENT BLOB */}
           <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1E3A8A]/20 to-transparent blur-[80px] pointer-events-none z-0" />
           
           {/* 
              LEGAL CONTENT CONTAINER 
              - pt-20: Shifted up from pt-24
              - px-6: EXACT MATCH with Main Auth Form
              - pb-32: Deep bottom padding for full scrolling of extensive text
           */}
           <div className="h-full w-full max-w-md mx-auto flex flex-col z-10 relative">
               <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20 px-6 pb-32" ref={legalScrollRef}>
                  
                  {/* LEGAL HEADER ALIGNMENT */}
                  <div className="mb-4 flex justify-between items-center">
                      <div className="flex-1">
                         <BackButton onClick={popLegal} />
                      </div>
                      
                      {/* CLOSE BUTTON - Only visible on deep dives (Level > 1) */}
                      {legalStack.length > 1 && (
                        <button 
                          onClick={handleCloseLegal}
                          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                        >
                          <X size={20} />
                        </button>
                      )}
                  </div>
                  
                  {/* CONTENT RENDER */}
                  <div>
                     {renderLegalContent(legalStack[legalStack.length - 1])}
                  </div>
               </div>
           </div>
        </div>
      ) : awaitingVerification ? (
         <div key="verify-overlay" className="flex-1 flex flex-col items-center justify-center pt-20 px-6 animate-in fade-in slide-in-from-bottom-8 will-change-[transform,opacity]">
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
               <Mail size={40} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-center">Check your Inbox</h1>
            <p className="text-textMuted text-center text-lg leading-relaxed mb-8">
               We sent a verification link to <span className="text-white font-bold">{email}</span>.
               <br/><br/>
               Please confirm your email to activate your account and start using OnePoint.
            </p>
            <Button onClick={() => setAwaitingVerification(false)} fullWidth variant="secondary">
               I Verified My Email
            </Button>
            <button onClick={() => setAwaitingVerification(false)} className="mt-6 text-sm text-textMuted hover:text-white transition-colors">
               Back to Login
            </button>
         </div>
      ) : (
        /* 
           MAIN AUTH FORM 
           - absolute inset-0: Forces full height container (Fixes scroll lag)
           - pt-20: Shifted up from pt-24, matches Legal Overlay exactly
           - px-6: Standard side padding
           - pb-6: Minimal bottom padding
           - key prop: CRITICAL for animation switching between Login/Register AND returning from Legal
        */
        <div key={isRegister ? 'reg-mode' : 'login-mode'} className="absolute inset-0 z-10 animate-slide-up will-change-[transform,opacity]">
          <div className="h-full w-full max-w-md mx-auto flex flex-col">
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-20 px-6 pb-6">
              <div className="flex-1 flex flex-col">
                
                {/* BACK BUTTON IN FLOW - SCROLLS WITH PAGE */}
                <div className="mb-4">
                  <BackButton onClick={onBack} />
                </div>

                <div className="mb-6 relative">
                    <div className={`absolute -right-2 top-0 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${password ? 'bg-green-500/10 border-green-500/30 text-green-400 opacity-100' : 'opacity-0'}`}>
                        <div className="flex items-center gap-1.5"><ShieldCheck size={10}/> Encrypted</div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">{isRegister ? "Create Account" : "Welcome Back"}</h1>
                    <p className="text-textMuted text-lg font-medium">
                        {isRegister ? "Start your autonomous journey." : "Your personal autonomy engine awaits."}
                    </p>
                </div>

                <div className="space-y-4 mb-2">
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
                    onKeyDown={handleKeyDown}
                  />
                  <Input 
                    placeholder="Password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock size={20} />}
                    rightIcon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    onRightIconClick={() => setShowPassword(!showPassword)}
                    onKeyDown={handleKeyDown}
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
                      onKeyDown={handleKeyDown}
                     />
                     
                     <div className="flex items-start gap-3 px-2 py-3 group">
                        <div 
                          className={`mt-0.5 transition-colors cursor-pointer ${agreedToTerms ? 'text-primary' : 'text-textMuted group-hover:text-white'}`}
                          onClick={() => setAgreedToTerms(!agreedToTerms)}
                          role="checkbox"
                          aria-checked={agreedToTerms}
                          tabIndex={0}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setAgreedToTerms(!agreedToTerms);
                             }
                          }}
                        >
                          {agreedToTerms ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                        
                        <p className="text-[14px] text-textMuted leading-relaxed select-none font-sans font-medium">
                          I agree to the 
                          <span 
                            onClick={(e) => { e.stopPropagation(); pushLegal('TOS'); }}
                            className="text-white hover:text-accent cursor-pointer mx-1 transition-colors underline decoration-white/30"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pushLegal('TOS'); } }}
                          >
                            Terms of Service
                          </span> 
                          and 
                          <span 
                            onClick={(e) => { e.stopPropagation(); pushLegal('PRIVACY'); }}
                            className="text-white hover:text-accent cursor-pointer mx-1 transition-colors underline decoration-white/30"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pushLegal('PRIVACY'); } }}
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
                         className="text-sm font-bold text-white hover:text-gray-200 transition-colors tracking-wide underline decoration-white/30 underline-offset-2"
                       >
                         Forgot Password?
                       </button>
                     </div>
                  )}
                </div>

                {/* Error/Notification Container - GLASS EFFECT (Transparent) */}
                <div className="min-h-[20px] mb-4 mt-2 flex flex-col justify-end">
                  {error && (
                    <div className="p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-2 shadow-lg relative z-10">
                      <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}
                  
                  {notification && (
                    <div className="p-4 bg-accent/10 backdrop-blur-md border border-accent/20 rounded-2xl flex items-start gap-3 text-blue-100 text-sm animate-in fade-in slide-in-from-top-2 shadow-lg relative z-10">
                      <Info size={18} className="text-accent mt-0.5 shrink-0" />
                      <span className="font-medium">{notification}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={handleAuth} 
                    fullWidth 
                    variant="primary" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                       <Loader2 className="animate-spin" /> 
                    ) : (
                       <div className="flex items-center gap-2">
                          <span>{isRegister ? "Create Account" : "Log In"}</span>
                          <ArrowRight size={20} />
                       </div>
                    )}
                  </Button>
                  
                  <button 
                    onClick={handleBiometric} 
                    disabled={isScanning || isLoading}
                    className={`
                       w-full h-[56px] rounded-full font-bold text-[16px] flex items-center justify-center transition-all duration-300 active:scale-95 disabled:opacity-50
                       bg-[#0A0A0A] border border-white text-white hover:bg-[#1a1a1a] shadow-lg
                       ${isScanning ? 'bg-white/10' : ''}
                    `}
                  >
                    {isScanning ? (
                      <span className="flex items-center gap-3 animate-pulse font-medium">
                         <Loader2 size={20} className="animate-spin" /> 
                         Authenticating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 font-medium">
                        <ScanFace size={20} className={isRegister ? "text-white" : "text-white"} /> 
                        {isRegister ? "Enable Face ID" : "Log in with Face ID"}
                      </span>
                    )}
                  </button>
                </div>
                
                {!isRegister && (
                  <div className="mt-8 text-center pb-2 flex justify-center items-center gap-1.5">
                     <span className="text-sm text-white/60 font-medium">Don't have an account?</span>
                     <button 
                        onClick={toggleMode}
                        className="text-sm text-white font-bold hover:text-white/80 transition-colors underline decoration-white/30 underline-offset-2"
                     >
                        Register
                     </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
};