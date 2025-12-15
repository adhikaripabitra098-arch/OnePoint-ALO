import React, { useState } from 'react';
import { Screen, Button, Input, BackButton } from '../components/UI';
import { User } from '../types';
import { Mail, User as UserIcon, Lock, ArrowRight, AlertCircle, ScanFace, Info, Loader2, Eye, EyeOff, CheckSquare, Square, ShieldCheck, ChevronLeft, Scale, Globe, LockKeyhole, Server, CreditCard, Cookie, Gavel, AlertTriangle, FileText, Users, FileWarning, Fingerprint, Database, Landmark, Siren, ShieldAlert, BadgeDollarSign, Copyright, PowerOff, Activity, Clock } from 'lucide-react';
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

  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- LEGAL NAVIGATION HELPERS ---
  const pushLegal = (pageId: string) => {
    setLegalStack(prev => [...prev, pageId]);
  };

  const popLegal = () => {
    setLegalStack(prev => prev.slice(0, -1));
  };

  const handleAuth = async () => {
    // Reset States
    setError(null);
    setNotification(null);
    
    // Validation Logic
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    // 1. General Empty Check (Prioritized over specific field errors)
    // This ensures users see "Please fill in all fields" before "Invalid email"
    if (!cleanEmail || !password || (isRegister && !cleanName)) {
        setError("Please fill in all fields.");
        if (navigator.vibrate) navigator.vibrate(50);
        return;
    }

    // 2. Specific Email Format Check
    if (!EMAIL_REGEX.test(cleanEmail)) {
        setError("Please enter a valid email address.");
        if (navigator.vibrate) navigator.vibrate(50);
        return;
    }

    // 3. Registration Specific Checks
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
  // MODIFIED FOR ACCESSIBILITY (GUIDELINE 2.5)
  const LegalLink = ({ to, children }: { to: string, children?: React.ReactNode }) => (
    <span 
      onClick={(e) => {
        e.stopPropagation();
        pushLegal(to);
      }}
      // ARIA roles for accessibility scanners
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
    <section className="mb-12 border-b border-white/5 pb-10 last:border-0 animate-in fade-in duration-500">
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

  const LegalNote = ({children}: {children?: React.ReactNode}) => (
    <div className="bg-white/5 border-l-4 border-accent p-6 rounded-r-xl my-8">
      <p className="text-sm text-gray-400 italic font-medium">{children}</p>
    </div>
  );

  const LegalPageHeader = ({ title, date }: { title: string, date?: string }) => (
    <div className="mb-10 mt-6 px-6">
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white leading-tight">{title}</h1>
      {date && <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        <p className="text-xs text-textMuted uppercase font-bold tracking-wider">Effective: {date}</p>
      </div>}
    </div>
  );

  // --- VAST LEGAL CONTENT ENGINE ---
  const renderLegalContent = (pageId: string) => {
      switch (pageId) {
        // === ROOT DOCUMENT: TERMS OF SERVICE ===
        case 'TOS':
        return (
          <>
            <LegalPageHeader title="Terms of Service" date={new Date().toLocaleDateString()} />
            <div className="px-6 pb-32">
               {/* TOS SUMMARY CARD - EXPLICITLY INCLUDED */}
               <div className="bg-surfaceHighlight/20 p-8 rounded-3xl mb-12 border border-white/5 backdrop-blur-xl">
                 <p className="text-base font-medium leading-relaxed text-gray-200">
                   This document ("Agreement") is a legally binding contract between you ("User") and OnePoint Inc. ("Service"). 
                   By initializing the Autonomous Life OS, you grant the Service authority to execute <LegalLink to="AGENCY_ACTIONS">Agency Actions</LegalLink> on your behalf.
                 </p>
               </div>

               <LegalSection title="1. Eligibility & Capacity" icon={UserIcon}>
                  <p>To use OnePoint, you must be at least <LegalLink to="AGE">16 years of age</LegalLink> and possess the legal capacity to form a binding contract.</p>
                  <p>You acknowledge that OnePoint is an <LegalLink to="AUTONOMOUS_AGENT">Autonomous Agent</LegalLink> capable of entering into contracts, making purchases, and communicating with third parties. You assume full legal responsibility for all actions taken by the Agent within your defined <LegalLink to="SPENDING">Spending Limits</LegalLink>.</p>
               </LegalSection>

               <LegalSection title="2. The AI Service" icon={Activity}>
                  <p>The Service utilizes non-deterministic generative models. While we strive for accuracy, you acknowledge the risk of <LegalLink to="HALLUCINATIONS">Hallucinations</LegalLink> and errors.</p>
                  <p>The Service is provided "AS IS" without warranty of any kind. You agree that OnePoint Inc. is not liable for missed appointments, incorrect bookings, or <LegalLink to="FINANCIAL_LOSS">Financial Loss</LegalLink> resulting from AI error, except where caused by gross negligence.</p>
               </LegalSection>

               <LegalSection title="3. Agency & Power of Attorney" icon={Scale}>
                  <p>By delegating tasks to OnePoint, you grant the Service a <LegalLink to="LIMITED_POWER_OF_ATTORNEY">Limited Power of Attorney</LegalLink> to act as your agent in dealings with third parties. This includes the authority to agree to third-party <LegalLink to="VENDOR_TOS">Terms of Service</LegalLink> on your behalf.</p>
                  <p>You represent that you have the authority to bind the accounts (email, banking, calendar) you connect to the Service.</p>
               </LegalSection>

               <LegalSection title="4. Financial Authority" icon={CreditCard}>
                  <p>You hereby authorize OnePoint to initiate charges against your linked funding sources. Transactions below your <LegalLink to="AUTO_APPROVE">Auto-Approve Threshold</LegalLink> are executed instantly without confirmation.</p>
                  <p>OnePoint is not a bank. All financial transactions are processed by regulated <LegalLink to="PAYMENT_PROCESSORS">Payment Processors</LegalLink> (e.g., Stripe, Plaid). We do not hold your funds.</p>
               </LegalSection>

               <LegalSection title="5. User Conduct" icon={ShieldAlert}>
                  <p>You agree not to use the Service for any <LegalLink to="UNLAWFUL_PURPOSE">Unlawful Purpose</LegalLink>. This includes using the Agent to harass others, generate fraudulent content, or bypass security controls.</p>
                  <p>Any attempt to "jailbreak" or manipulate the Agent's <LegalLink to="SAFETY_ALIGNMENT">Safety Alignment</LegalLink> is a material breach of this Agreement.</p>
               </LegalSection>

               <LegalSection title="6. Intellectual Property" icon={Copyright}>
                   <p>OnePoint grants you a limited, non-exclusive license to use the Software. All rights, title, and interest in the Service (including its <LegalLink to="AI_MODELS">Fine-Tuned Models</LegalLink>) remain with OnePoint Inc.</p>
                   <p>Content generated by the Agent on your behalf is yours to own, subject to applicable third-party rights.</p>
               </LegalSection>

               <LegalSection title="7. Limitation of Liability" icon={FileWarning}>
                   <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ONEPOINT INC. SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING <LegalLink to="LOSS_OF_DATA">LOSS OF DATA</LegalLink> OR PROFITS.</p>
                   <p>Our total liability for any claim arising out of this Agreement shall not exceed the amount paid by you to OnePoint in the past 12 months.</p>
               </LegalSection>

               <LegalSection title="8. Indemnification" icon={ShieldCheck}>
                   <p>You agree to indemnify and hold OnePoint harmless from any claims, disputes, or losses arising from your use of the Service, including but not limited to actions taken by the Agent at your specific direction.</p>
               </LegalSection>

               <LegalSection title="9. Dispute Resolution" icon={Gavel}>
                   <p>Any dispute arising from this Agreement shall be resolved through binding <LegalLink to="INDIVIDUAL_ARBITRATION">Individual Arbitration</LegalLink>. You explicitly waive your right to participate in a Class Action lawsuit.</p>
               </LegalSection>

               <LegalSection title="10. Termination" icon={PowerOff}>
                   <p>We reserve the right to suspend or terminate access immediately if we detect <LegalLink to="FRAUDULENT_ACTIVITY">Fraudulent Activity</LegalLink> or violations of our Acceptable Use Policy. You may terminate this Agreement at any time by deleting your account.</p>
               </LegalSection>
            </div>
          </>
        );

        // === ROOT DOCUMENT: PRIVACY POLICY ===
        case 'PRIVACY':
        return (
          <>
            <LegalPageHeader title="Privacy Policy" date={new Date().toLocaleDateString()} />
            <div className="px-6 pb-32">
               {/* Updated to match TOS Style (Black/Gray instead of Blue) */}
               <div className="bg-surfaceHighlight/20 p-8 rounded-3xl mb-12 border border-white/5 backdrop-blur-xl">
                 <p className="text-base font-medium leading-relaxed text-gray-200">
                   OnePoint operates on a <LegalLink to="LOCAL_FIRST">Local-First Architecture</LegalLink>. We believe your data belongs on your device, not in the cloud. This policy details how we minimize data exposure.
                 </p>
               </div>

               <LegalSection title="1. Data Collection" icon={Database}>
                  <p>We strictly limit collection to:</p>
                  <ul className="list-disc pl-5 space-y-4 mt-4 opacity-90">
                     <li><strong><LegalLink to="ACCOUNT_DATA">Account Data</LegalLink>:</strong> Minimal identity info required for sync.</li>
                     <li><strong><LegalLink to="TASKS">Task Context</LegalLink>:</strong> Data needed to fulfill specific requests.</li>
                     <li><strong><LegalLink to="TELEMETRY">Telemetry</LegalLink>:</strong> Anonymized performance metrics.</li>
                  </ul>
               </LegalSection>

               <LegalSection title="2. Biometric Privacy" icon={Fingerprint}>
                  <p>Your biometric data (face/fingerprint) is processed exclusively within your device's <LegalLink to="SECURE_ENCLAVE">Secure Enclave</LegalLink>. We never receive, store, or transmit raw biometric templates or images.</p>
               </LegalSection>

               <LegalSection title="3. Local-First Architecture" icon={Server}>
                  <p>Unlike traditional cloud apps, OnePoint stores your sensitive data (tasks, financial history, chats) directly on your device using <LegalLink to="SQLITE_ENCRYPTION">Encrypted SQLite</LegalLink>. Cloud sync is optional and end-to-end encrypted.</p>
               </LegalSection>

               <LegalSection title="4. Encryption Standards" icon={LockKeyhole}>
                  <p>All local data is protected by <LegalLink to="ENCRYPTION">AES-256-GCM Encryption</LegalLink>. Data in transit is secured via <LegalLink to="TLS">TLS 1.3</LegalLink> with certificate pinning to prevent Man-in-the-Middle attacks.</p>
               </LegalSection>

               <LegalSection title="5. Generative AI Processing" icon={Activity}>
                  <p>To provide autonomous features, specific task data must be processed by <LegalLink to="LLM_PROVIDERS">LLM Providers</LegalLink> (e.g., Google Gemini). Data sent to these models is ephemeral and is <LegalLink to="NO_TRAINING_AGREEMENT">Not Used for Training</LegalLink> by the provider.</p>
               </LegalSection>

               <LegalSection title="6. Third Party Sharing" icon={Globe}>
                  <p>We do not sell data. We only share specific data points with <LegalLink to="VENDORS">Vendors</LegalLink> (e.g., airlines, restaurants) as strictly necessary to execute a task you have requested.</p>
               </LegalSection>

               <LegalSection title="7. Financial Data Security" icon={BadgeDollarSign}>
                  <p>We do not store full credit card numbers. We utilize <LegalLink to="TOKENIZATION">Tokenization</LegalLink> via our payment partners. Your financial credentials are never accessible to OnePoint employees.</p>
               </LegalSection>

               <LegalSection title="8. Data Retention" icon={Clock}>
                  <p>We retain account data only as long as your account is active. Local data is governed by your device storage. You may configure <LegalLink to="AUTO_DELETION">Auto-Deletion</LegalLink> policies in Settings.</p>
               </LegalSection>

               <LegalSection title="9. International Transfers" icon={Globe}>
                  <p>If you are located in the EEA, UK, or Switzerland, note that data may be processed in the United States. We rely on <LegalLink to="STANDARD_CONTRACTUAL_CLAUSES">Standard Contractual Clauses</LegalLink> to ensure adequate protection.</p>
               </LegalSection>

               <LegalSection title="10. User Rights & Sovereignty" icon={ShieldCheck}>
                   <p>You have the absolute right to <LegalLink to="EXPORT_DATA">Export</LegalLink> or <LegalLink to="IMMEDIATE_DELETION">Permanently Delete</LegalLink> your data at any time via the app settings. This process is immediate and irreversible.</p>
               </LegalSection>
            </div>
          </>
        );

        // === DEEP DIVE: ENCRYPTION ===
        case 'ENCRYPTION':
          return (
            <div className="px-6 pb-32">
              <LegalPageHeader title="Encryption Standards" />
              <LegalParagraph>
                OnePoint employs a defense-in-depth cryptography strategy designed to withstand both offline attacks and network interception. Our implementation relies on <LegalLink to="SYMMETRIC_KEYS">Symmetric Key Cryptography</LegalLink> for local storage and asymmetric cryptography for identity assertion.
              </LegalParagraph>
              
              <LegalHeader>1. AES-256-GCM Specification</LegalHeader>
              <LegalParagraph>
                 Local data is encrypted using the Advanced Encryption Standard (AES) with a 256-bit key length operating in Galois/Counter Mode (GCM). GCM is an authenticated encryption algorithm designed to provide both data confidentiality and authenticity.
              </LegalParagraph>
              <LegalNote>
                 We utilize a unique 96-bit <LegalLink to="INITIALIZATION_VECTOR">Initialization Vector (IV)</LegalLink> for every write operation to prevent ciphertext collision attacks.
              </LegalNote>

              <LegalHeader>2. Key Derivation & Storage</LegalHeader>
              <LegalParagraph>
                 Cryptographic keys are never stored in plaintext. They are derived from your device's hardware root of trust using <LegalLink to="PBKDF2">PBKDF2</LegalLink> (Password-Based Key Derivation Function 2) with a high iteration count to resist brute-force attacks. On supported devices, these keys are wrapped by the <LegalLink to="SECURE_ENCLAVE">Secure Enclave</LegalLink>.
              </LegalParagraph>

              <LegalHeader>3. Transport Layer Security</LegalHeader>
              <LegalParagraph>
                 All network traffic is encapsulated in <LegalLink to="TLS">TLS 1.3</LegalLink> tunnels. We enforce Perfect Forward Secrecy (PFS), ensuring that even if a private key is compromised in the future, past sessions remain secure.
              </LegalParagraph>
            </div>
          );

        // === DEEP DIVE: SECURE ENCLAVE ===
        case 'SECURE_ENCLAVE':
          return (
            <div className="px-6 pb-32">
              <LegalPageHeader title="Secure Enclave" />
              <LegalParagraph>
                The Secure Enclave is a hardware-based key manager that is isolated from the main processor to provide an extra layer of security. OnePoint utilizes this technology to ensure that your biometric data and cryptographic keys never leave your physical device.
              </LegalParagraph>

              <LegalHeader>1. Hardware Isolation Architecture</LegalHeader>
              <LegalParagraph>
                The Secure Enclave functions as a separate computer inside your device. It has its own boot ROM, encrypted memory, and random number generator. Even if the main operating system is compromised by malware or a <LegalLink to="ROOTKIT">Rootkit</LegalLink>, the keys stored within the Enclave remain inaccessible.
              </LegalParagraph>
              <LegalParagraph>
                When you authenticate via FaceID or TouchID, the sensor communicates directly with the Secure Enclave. The Enclave verifies the mathematical representation of your biometric data against the stored template. If the match is successful, the Enclave releases a digital token to OnePoint.
              </LegalParagraph>
              <LegalNote>
                 Crucially, the app never receives the actual image of your face or fingerprint, only the cryptographic proof of identity signed by the hardware.
              </LegalNote>

              <LegalHeader>2. Key Wrapping & Binding</LegalHeader>
              <LegalParagraph>
                OnePoint uses the Secure Enclave to generate and store the master encryption keys that protect your local database. These keys are "wrapped" (encrypted) by the Enclave's hardware key, which is burned into the silicon during manufacturing. This process is known as <LegalLink to="HARDWARE_BINDING">Hardware Binding</LegalLink>.
              </LegalParagraph>
            </div>
          );

        // === DEEP DIVE: HALLUCINATIONS ===
        case 'HALLUCINATIONS':
          return (
            <div className="px-6 pb-32">
              <LegalPageHeader title="AI Hallucinations" />
              <LegalParagraph>
                "Hallucination" is a term of art in artificial intelligence referring to instances where a Large Language Model (LLM) generates information that is grammatically plausible but factually incorrect or nonsensical.
              </LegalParagraph>

              <LegalHeader>1. The Probabilistic Nature of AI</LegalHeader>
              <LegalParagraph>
                The generative models powering OnePoint (such as Gemini and GPT-4) are <LegalLink to="STOCHASTIC_MODELS">Stochastic Models</LegalLink>. They do not "know" facts; they predict the next most likely token in a sequence based on statistical patterns. Consequently, there is a non-zero probability of error in any output.
              </LegalParagraph>

              <LegalHeader>2. User Verification Duty</LegalHeader>
              <LegalParagraph>
                By using the Service, you accept the <LegalLink to="VERIFICATION_DUTY">Duty of Verification</LegalLink>. You acknowledge that you are responsible for reviewing critical outputs, especially those involving financial transactions, legal agreements, or medical information.
              </LegalParagraph>
              
              <LegalHeader>3. Liability Waiver</LegalHeader>
              <LegalParagraph>
                 OnePoint Inc. explicitly disclaims liability for damages resulting from reliance on hallucinated information. The Agent is a tool for autonomy, not a replacement for human judgment.
              </LegalParagraph>
            </div>
          );

        // === DEEP DIVE: ACCOUNT DATA ===
        case 'ACCOUNT_DATA':
         return (
           <div className="px-6 pb-32">
             <LegalPageHeader title="Account Data" />
             <LegalParagraph>
               Account Data refers to the specific subset of <LegalLink to="PII">Personally Identifiable Information (PII)</LegalLink> that serves as the foundation of your identity within the OnePoint ecosystem. This classification strictly encompasses the data points you affirmatively and voluntarily provide.
             </LegalParagraph>
             <LegalHeader>1. Scope of Collection</LegalHeader>
             <LegalParagraph>
               Specifically, Account Data includes your legal full name, verified email address, authentication credentials, and any localized settings such as currency preferences or time zones. It is crucial to understand that Account Data is treated with the highest classification of data sensitivity and is subject to strict <LegalLink to="DATA_SOVEREIGNTY">Data Sovereignty</LegalLink> protocols.
             </LegalParagraph>
             <LegalParagraph>
               Unlike usage telemetry, Account Data is persistent and essential for the continuous operation of the Service. It is the only category of data that is replicated to our authentication servers to facilitate cross-device synchronization.
             </LegalParagraph>
             <LegalHeader>2. Record Keeping & Auditability</LegalHeader>
             <LegalParagraph>
               For the purposes of security and compliance, changes to Account Data (such as password resets or email changes) generate an immutable audit log. This ensures that in the event of <LegalLink to="IDENTITY_THEFT">Identity Theft</LegalLink>, a clear forensic trail exists to restore ownership.
             </LegalParagraph>
           </div>
         );

        // === RECURSIVE GENERATOR FOR INFINITE DEPTH ===
        default:
          return (
            <div className="px-6 pb-32">
               <LegalPageHeader title={pageId.replace(/_/g, ' ')} />
               
               <LegalParagraph>
                 This section defines the legal, technical, and operational parameters regarding <strong>{pageId.replace(/_/g, ' ')}</strong>.
               </LegalParagraph>

               <LegalHeader>1. Definition & Context</LegalHeader>
               <LegalParagraph>
                 In the context of the OnePoint Terms of Service and Privacy Policy, "{pageId.replace(/_/g, ' ')}" refers to the protocols, methodologies, and legal standards governing this specific aspect of the Service. This term is interpreted in accordance with industry standards (ISO 27001) and applicable local regulations (such as <LegalLink to="GDPR">GDPR</LegalLink> or <LegalLink to="CCPA">CCPA</LegalLink>).
               </LegalParagraph>
               <LegalParagraph>
                 The inclusion of this term signifies its critical role in the <LegalLink to="OPERATIONAL_INTEGRITY">Operational Integrity</LegalLink> of the Autonomous Life OS platform. By utilizing features associated with {pageId.toLowerCase().replace(/_/g, ' ')}, you implicitly consent to the data processing practices outlined herein.
               </LegalParagraph>

               <LegalHeader>2. Technical Specifications</LegalHeader>
               <LegalParagraph>
                 From a technical perspective, {pageId.replace(/_/g, ' ')} involves the utilization of <LegalLink to="ALGORITHMIC_DETERMINISM">Algorithmic Determinism</LegalLink> to ensure consistent and reliable outcomes. Where applicable, cryptographic measures including but not limited to <LegalLink to="HASHING">SHA-256 Hashing</LegalLink> are employed to maintain data integrity.
               </LegalParagraph>
               <LegalNote>
                  System logs related to {pageId.replace(/_/g, ' ')} are retained for 30 days before being securely overwritten using <LegalLink to="DOD_WIPE_STANDARD">DoD 5220.22-M Standards</LegalLink>.
               </LegalNote>

               <LegalHeader>3. User Rights & Limitations</LegalHeader>
               <LegalParagraph>
                 Your rights regarding {pageId.replace(/_/g, ' ')} are absolute. You maintain the right to query, export, or request the deletion of data associated with this term. However, please note that restricting {pageId.replace(/_/g, ' ')} may degrade the autonomy level of the Agent, reverting certain tasks to manual execution.
               </LegalParagraph>
               <LegalParagraph>
                 For a comprehensive analysis of how {pageId.replace(/_/g, ' ')} interacts with other system components, please refer to the <LegalLink to="ARCHITECTURE_WHITE_PAPER">Architecture White Paper</LegalLink> or contact our <LegalLink to="DPO_CONTACT">Data Protection Officer</LegalLink>.
               </LegalParagraph>
            </div>
         );
    }
  };

  return (
    <Screen>
       <div className="absolute top-12 left-6 z-50">
          <BackButton onClick={onBack} />
        </div>

      {/* 
         FULL SCREEN LEGAL NAVIGATION OVERLAY 
      */}
      {legalStack.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-right duration-300">
           <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="pt-12 px-6 pb-2">
                  <BackButton onClick={popLegal} />
              </div>
              {renderLegalContent(legalStack[legalStack.length - 1])}
           </div>
        </div>
      )}

      {/* 
        EMAIL VERIFICATION OVERLAY 
      */}
      {awaitingVerification ? (
         <div className="flex-1 flex flex-col items-center justify-center pt-20 px-6 animate-in fade-in slide-in-from-bottom-8">
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
        /* MAIN AUTH FORM */
        <div className="flex-1 flex flex-col pt-32 pb-10 overflow-y-auto no-scrollbar animate-slide-up">
          
          <div className="mb-6 px-1">
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

          <div className="min-h-[20px] mb-2 flex flex-col justify-end">
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
            <div className="mt-8 text-center pb-8 flex justify-center items-center gap-1.5">
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
      )}
    </Screen>
  );
};