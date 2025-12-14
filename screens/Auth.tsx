import React, { useState } from 'react';
import { Screen, Button, Input, BackButton } from '../components/UI';
import { User } from '../types';
import { Mail, User as UserIcon, Lock, ArrowRight, AlertCircle, ScanFace, Info, Loader2, Eye, EyeOff, CheckSquare, Square, ShieldCheck, ChevronLeft, Scale, Globe, LockKeyhole, Server, CreditCard, Cookie, Gavel, AlertTriangle, FileText, Users, FileWarning, Fingerprint, Database, Landmark, Siren, ShieldAlert, BadgeDollarSign, Copyright, PowerOff, Activity, MessageSquare } from 'lucide-react';
import { authenticateBiometrics } from '../services/biometricService';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Legal & Consent State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
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
    setError(null);
    setNotification(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Please fill in all fields.");
      }
      
      const cleanEmail = email.trim();
      const cleanName = name.trim();

      // Email Validation
      if (!EMAIL_REGEX.test(cleanEmail)) {
        throw new Error("Please enter a valid email address.");
      }

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
      if (navigator.vibrate) navigator.vibrate(50);
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
      if (navigator.vibrate) navigator.vibrate(50);
      if (result.error === 'not_setup') {
        setError("Face ID not set up. Please log in with password first.");
      } else if (result.error === 'no_match') {
        setError("Face not recognized.");
      } else {
        setError("Biometric authentication failed.");
      }
    }
  };

  const handleForgotPassword = () => {
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

  // --- LEGAL COMPONENTS ---
  const LegalLink = ({ to, children }: { to: string, children?: React.ReactNode }) => (
    <span 
      onClick={() => pushLegal(to)} 
      className="text-accent hover:underline cursor-pointer font-bold mx-0.5"
    >
      {children}
    </span>
  );

  const LegalSection = ({ title, icon: Icon, children }: { title: string, icon?: any, children?: React.ReactNode }) => (
    <section className="mb-10 border-b border-white/5 pb-10 last:border-0 animate-in fade-in duration-500">
      <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-3">
        {Icon && <div className="p-2 rounded-lg bg-white/5"><Icon size={20} className="text-accent" /></div>}
        {title}
      </h3>
      <div className="text-gray-300 text-sm leading-relaxed font-medium space-y-4">
        {children}
      </div>
    </section>
  );

  const LegalPageHeader = ({ title, date }: { title: string, date?: string }) => (
    <div className="mb-10 mt-32 px-6">
      <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-white">{title}</h1>
      {date && <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <p className="text-xs text-textMuted uppercase font-bold tracking-wider">Last Updated: {date}</p>
      </div>}
    </div>
  );

  // --- LEGAL CONTENT RENDERER ---
  const renderLegalContent = (pageId: string) => {
    switch (pageId) {
      // ----------------------------
      // MAIN TERMS OF SERVICE
      // ----------------------------
      case 'TOS':
        return (
          <>
            <LegalPageHeader title="Terms of Service" date={new Date().toLocaleDateString()} />
            <div className="px-6 pb-32">
               <div className="bg-surfaceHighlight/20 p-6 rounded-2xl mb-10 border border-white/5 backdrop-blur-sm">
                 <p className="text-sm font-medium leading-relaxed text-gray-200">
                   Welcome to OnePoint. These Terms of Service ("Terms") constitute a legally binding agreement between you and OnePoint Inc.
                   By accessing or using our Service, you agree to be bound by these Terms.
                   <br/><br/>
                   <strong>IMPORTANT:</strong> These Terms contain a <LegalLink to="DISPUTES">mandatory arbitration provision</LegalLink> and a waiver of class action rights.
                 </p>
               </div>

               <LegalSection title="1. Eligibility & Accounts" icon={UserIcon}>
                  <p>
                    You must be at least <LegalLink to="AGE">16 years of age</LegalLink> to operate this Service. You represent that you have legal parental consent if you are a minor.
                  </p>
                  <p>
                    You are solely responsible for maintaining the confidentiality of your account credentials.
                    See <LegalLink to="ACCOUNT_SECURITY">Account Security</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="2. The Autonomous Service" icon={Activity}>
                  <p>
                    OnePoint utilizes advanced generative artificial intelligence to execute tasks. By using the Service, you acknowledge the inherent risks of AI, including 
                    <LegalLink to="HALLUCINATIONS">hallucinations</LegalLink> and unpredictability.
                  </p>
                  <p>
                    You retain full responsibility for actions taken by Agents. Review our <LegalLink to="AI_LIMITATIONS">AI Limitations</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="3. Financial Terms" icon={CreditCard}>
                  <p>
                    OnePoint operates on a pay-as-you-go credit system. You authorize us to charge your funding source for approved transactions.
                  </p>
                  <p>
                    You are responsible for configuring <LegalLink to="SPENDING">Spending Limits</LegalLink>. See <LegalLink to="PAID_SERVICES">Paid Services & Credits</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="4. Acceptable Use" icon={ShieldAlert}>
                  <p>
                    You agree not to misuse the Service for illegal activities, harassment, or fraud.
                    See <LegalLink to="PROHIBITED">Prohibited Conduct</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="5. Intellectual Property" icon={Copyright}>
                  <p>
                    We grant you a limited, non-exclusive license to use the App. We retain all rights to our proprietary AI models and code.
                    See <LegalLink to="IP_RIGHTS">Intellectual Property Rights</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="6. Liability & Indemnification" icon={Scale}>
                  <p>
                    You agree to hold OnePoint harmless from claims arising from your use of the Service.
                    See <LegalLink to="INDEMNIFICATION">Indemnification</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="7. Dispute Resolution" icon={Gavel}>
                  <p>
                    All disputes shall be resolved via binding individual arbitration.
                    See <LegalLink to="DISPUTES">Arbitration & Class Action Waiver</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="8. Termination" icon={PowerOff}>
                   <p>
                     We reserve the right to suspend or terminate your account at our sole discretion if you violate these terms.
                     See <LegalLink to="TERMINATION">Termination Policy</LegalLink>.
                   </p>
               </LegalSection>

               <LegalSection title="9. Governing Law" icon={Globe}>
                   <p>
                     These terms are governed by the laws of the State of Delaware, United States.
                     See <LegalLink to="GOVERNING_LAW">Governing Law</LegalLink>.
                   </p>
               </LegalSection>
            </div>
          </>
        );

      // ----------------------------
      // MAIN PRIVACY POLICY
      // ----------------------------
      case 'PRIVACY':
        return (
          <>
            <LegalPageHeader title="Privacy Policy" date={new Date().toLocaleDateString()} />
            <div className="px-6 pb-32">
               <div className="bg-surfaceHighlight/20 p-6 rounded-2xl mb-10 border border-white/5 backdrop-blur-sm">
                 <p className="text-sm font-medium leading-relaxed text-gray-200">
                   Your autonomy relies on privacy. At OnePoint, we believe you should own your data. This policy details what we collect and why.
                 </p>
               </div>

               <LegalSection title="1. Information We Collect" icon={Database}>
                  <p>
                    We collect data you explicitly provide (Account Data) and usage data (Telemetry). We practice data minimization.
                    Review <LegalLink to="DATA_TYPES">Data Categories</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="2. Biometric Data" icon={Fingerprint}>
                  <p>
                    OnePoint is "Local-First". Your biometric data is processed exclusively within your device's 
                    <LegalLink to="SECURE_ENCLAVE">Secure Enclave</LegalLink> and is never transmitted to our servers.
                  </p>
               </LegalSection>

               <LegalSection title="3. How We Use Information" icon={Info}>
                  <p>
                    We use data to operate agents, prevent fraud, and improve model accuracy via anonymized training.
                    See <LegalLink to="DATA_USAGE">Data Usage</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="4. Sharing & Disclosure" icon={Users}>
                  <p>
                    <strong>We do not sell your personal data.</strong> We share data only with necessary <LegalLink to="PROVIDERS">Subprocessors</LegalLink> 
                    or when compelled by law. See <LegalLink to="LEGAL_REQUESTS">Law Enforcement Requests</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="5. Security & Retention" icon={LockKeyhole}>
                  <p>
                    We employ AES-256 encryption. We retain data only as long as necessary.
                    See <LegalLink to="SECURITY_MEASURES">Security Measures</LegalLink> and <LegalLink to="RETENTION">Retention Policy</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="6. Your Rights" icon={Scale}>
                  <p>
                    You have rights to access, export, and delete your data.
                    See <LegalLink to="RIGHTS">Your Privacy Rights</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="7. Contact Us" icon={Mail}>
                  <p>
                     For any privacy questions, please contact our Data Protection Officer at:
                     <br/><span className="text-accent font-mono">privacy@onepoint.ai</span>
                  </p>
               </LegalSection>
            </div>
          </>
        );

      // ----------------------------
      // DETAILED LEGAL PAGES
      // ----------------------------

      case 'AGE':
        return (
          <>
            <LegalPageHeader title="Age Requirements" />
            <div className="px-6 pb-24 space-y-8 text-gray-300 text-sm leading-relaxed">
              <p>OnePoint strictly enforces a minimum age of 16. This policy is based on several legal and safety factors:</p>
              
              <div className="bg-surfaceHighlight/20 p-5 rounded-2xl border border-white/5">
                <h3 className="text-white font-bold text-lg mb-2">1. Contractual Capacity</h3>
                <p>AI Agents are authorized to enter into binding contracts (bookings, purchases) on your behalf. Individuals under 16 generally lack the legal capacity to form such contracts.</p>
              </div>
              
              <div className="bg-surfaceHighlight/20 p-5 rounded-2xl border border-white/5">
                <h3 className="text-white font-bold text-lg mb-2">2. Data Protection (COPPA/GDPR-K)</h3>
                <p>We do not knowingly collect data from children under 13. If we discover an account belongs to a user under 13, it will be terminated immediately.</p>
              </div>
            </div>
          </>
        );

      case 'ACCOUNT_SECURITY':
         return (
           <>
             <LegalPageHeader title="Account Security" />
             <div className="px-6 pb-24 space-y-8 text-gray-300 text-sm leading-relaxed">
               <p>Your account security is a shared responsibility. While we employ advanced encryption, you must take steps to secure your access points.</p>

               <LegalSection title="Password Hygiene" icon={Lock}>
                 <p>You agree to use a strong, unique password for your OnePoint account. We hash all passwords using SHA-256 with individual salts before storage.</p>
               </LegalSection>

               <LegalSection title="Device Security" icon={ShieldCheck}>
                 <p>Since OnePoint processes sensitive financial tasks, you agree to keep your device operating system updated and secured with a passcode or biometric lock. Do not use on rooted/jailbroken devices.</p>
               </LegalSection>
             </div>
           </>
         );

      case 'PAID_SERVICES':
         return (
            <>
              <LegalPageHeader title="Credits & Payments" />
              <div className="px-6 pb-24 space-y-8 text-gray-300 text-sm leading-relaxed">
                 <p>OnePoint uses a credit-based system ("AI Credits") to fund autonomous agent operations.</p>

                 <LegalSection title="AI Credits" icon={BadgeDollarSign}>
                    <p><strong>One-Time Purchase:</strong> Credits are purchased as one-time top-ups. We do not currently offer recurring auto-renewing subscriptions.</p>
                    <p><strong>Non-Transferable:</strong> Credits have no monetary value outside the OnePoint ecosystem and cannot be transferred to other users.</p>
                    <p><strong>Expiration:</strong> Credits do not expire as long as your account remains active.</p>
                 </LegalSection>

                 <LegalSection title="Transaction Authorization" icon={CheckSquare}>
                    <p>When you assign a task with a real-world cost (e.g., buying a ticket), you explicitly authorize OnePoint to charge your stored payment method up to your <LegalLink to="SPENDING">Spending Limit</LegalLink>.</p>
                 </LegalSection>

                 <LegalSection title="Refunds" icon={FileText}>
                    <p><strong>Platform Errors:</strong> If an agent fails due to a technical error, credits are refunded automatically.</p>
                    <p><strong>Outcome Not Guaranteed:</strong> We do not refund credits if an agent successfully attempts a task (e.g. negotiation) but the third-party refuses. You pay for the agent's labor, not the result.</p>
                 </LegalSection>
              </div>
            </>
         );

      case 'HALLUCINATIONS':
        return (
          <>
            <LegalPageHeader title="AI Hallucinations" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
              <div className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-200 mb-6 flex gap-4 items-start">
                <AlertCircle size={24} className="shrink-0 mt-1" />
                <div>
                  <strong className="block text-lg mb-1">Critical Warning</strong>
                  Generative AI models are probabilistic. They may generate incorrect information ("hallucinations").
                </div>
              </div>
              
              <h3 className="text-white font-bold text-xl mt-6">Allocation of Risk</h3>
              <p>By using OnePoint, you explicitly accept the risk that the AI may provide incorrect information. <strong>OnePoint is not liable for financial losses incurred due to your reliance on unverified AI outputs.</strong></p>
              
              <h3 className="text-white font-bold text-xl mt-6">Safety Mechanisms</h3>
              <ul className="list-disc pl-5 space-y-3">
                 <li>We implement "Grounding" to verify outputs against real-world APIs.</li>
                 <li>We enforce "Human-in-the-Loop" for high-value transactions.</li>
                 <li><strong>You must verify critical details</strong> (dates, prices) before final confirmation.</li>
              </ul>
            </div>
          </>
        );

      case 'AI_LIMITATIONS':
        return (
          <>
            <LegalPageHeader title="AI Limitations" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>Our autonomous agents are powerful but not infallible. Limitations include:</p>
               
               <div className="space-y-4">
                 <div className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Context Memory</strong>
                    <p>The AI has a limited "memory" window. In very long threads, it may lose track of early details.</p>
                 </div>
                 <div className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Real-Time Knowledge</strong>
                    <p>Unless connected to a live tool, the model's knowledge cutoff may prevent it from knowing about events happening <em>right now</em>.</p>
                 </div>
               </div>
            </div>
          </>
        );

      case 'SPENDING':
        return (
          <>
            <LegalPageHeader title="Spending Limits" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
              <p>OnePoint provides strict controls for AI spending. You are responsible for configuring these correctly in Settings.</p>
              
              <h3 className="text-white font-bold text-xl mt-6">1. Auto-Approve Limit</h3>
              <p>Transactions below this threshold are executed immediately. By setting this > $0, you authorize charges up to this amount.</p>
              
              <h3 className="text-white font-bold text-xl mt-6">2. Approval Threshold</h3>
              <p>Transactions exceeding this amount require explicit biometric approval (Face ID) before execution.</p>
              
              <h3 className="text-white font-bold text-xl mt-6">3. Overdrafts</h3>
              <p>OnePoint is not responsible for bank fees if an authorized transaction exceeds your available funds.</p>
            </div>
          </>
        );

      case 'INDEMNIFICATION':
         return (
           <>
             <LegalPageHeader title="Indemnification" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <p>You agree to defend, indemnify, and hold harmless OnePoint, its affiliates, licensors, and service providers from any claims arising out of:</p>
                <ul className="list-disc pl-5 space-y-3">
                   <li>Your violation of these Terms.</li>
                   <li>Your use of the Service.</li>
                   <li>Actions taken by AI Agents acting on your explicit instructions (e.g. instructing an Agent to harass a vendor).</li>
                </ul>
             </div>
           </>
         );

      case 'PROHIBITED':
        return (
          <>
            <LegalPageHeader title="Prohibited Conduct" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>You agree NOT to use the Service for:</p>
               <ul className="space-y-4">
                 <li className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                    <strong className="text-red-200 block text-lg mb-1">Illegal Activity</strong>
                    Buying illegal goods, money laundering, or sanctions evasion.
                 </li>
                 <li className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                    <strong className="text-red-200 block text-lg mb-1">Harassment</strong>
                    Using Agents to spam, harass, or threaten individuals or customer support.
                 </li>
                 <li className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                    <strong className="text-red-200 block text-lg mb-1">Platform Abuse</strong>
                    Reverse engineering, scraping, or introducing malware.
                 </li>
               </ul>
            </div>
          </>
        );

      case 'LIABILITY':
        return (
          <>
            <LegalPageHeader title="Limitation of Liability" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <p className="uppercase tracking-wide font-bold text-white/90 text-xs mb-3">Required by Law</p>
                <p className="font-bold text-base leading-7">
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, ONEPOINT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
                </p>
              </div>
              <p>OnePoint's total liability is limited to the greater of $100 USD or the amount paid by you to OnePoint in the 12 months preceding the claim.</p>
            </div>
          </>
        );

      case 'DISPUTES':
         return (
           <>
             <LegalPageHeader title="Dispute Resolution" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <div className="p-6 bg-surfaceHighlight rounded-2xl border border-white/10 mb-6">
                   <p className="font-bold text-white text-lg mb-2">Binding Arbitration</p>
                   <p>You and OnePoint agree to resolve any claims through final and binding arbitration, rather than in court. Administered by the AAA.</p>
                </div>
                
                <h3 className="text-white font-bold text-xl mt-6">Class Action Waiver</h3>
                <p className="p-4 border border-white/10 rounded-xl bg-white/5">
                  YOU AGREE TO BRING CLAIMS ONLY IN YOUR INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS ACTION.
                </p>
             </div>
           </>
         );
      
      case 'GOVERNING_LAW':
         return (
           <>
             <LegalPageHeader title="Governing Law" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <Landmark size={32} className="text-white" />
                   </div>
                   <h3 className="font-bold text-2xl text-white">Delaware, USA</h3>
                </div>
                <p>These Terms shall be governed by the laws of the <strong>State of Delaware</strong>, without regard to conflict of law principles. OnePoint and yourself consent to the exclusive jurisdiction of the state and federal courts located in Delaware.</p>
             </div>
           </>
         );

      case 'IP_RIGHTS':
        return (
          <>
            <LegalPageHeader title="Intellectual Property" />
            <div className="px-6 pb-24 space-y-8 text-gray-300 text-sm leading-relaxed">
               <LegalSection title="Your Content" icon={UserIcon}>
                 <p>You retain ownership of your inputs ("User Content"). You grant OnePoint a license to use this content <strong>solely to provide and improve the Service.</strong></p>
               </LegalSection>

               <LegalSection title="Our Content" icon={Copyright}>
                 <p>OnePoint, our AI orchestration logic, and visual design are trademarks of OnePoint Inc.</p>
               </LegalSection>
            </div>
          </>
        );

      case 'DMCA':
         return (
           <>
             <LegalPageHeader title="DMCA Copyright Policy" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <p>We respect intellectual property rights. If you believe your work has been infringed, please contact legal@onepoint.ai.</p>
             </div>
           </>
         );

      case 'TERMINATION':
        return (
          <>
            <LegalPageHeader title="Termination" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <h3 className="text-white font-bold text-xl mt-6">Termination by You</h3>
               <p>You can delete your account at any time via Settings > Danger Zone. This action is irreversible.</p>
               
               <h3 className="text-white font-bold text-xl mt-6">Termination by Us</h3>
               <p>We may suspend or terminate your access if you violate these Terms or create legal risk for us.</p>
            </div>
          </>
        );

      // --- PRIVACY DETAIL PAGES ---

      case 'DATA_TYPES':
        return (
           <>
            <LegalPageHeader title="Data Collection Types" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>We classify collected data into four distinct tiers:</p>
               <ul className="space-y-4">
                 <li className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Tier 1: Identity</strong>
                    <span className="text-xs">Email, Name, Phone (Optional), Password Hash. Necessary for account management.</span>
                 </li>
                 <li className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Tier 2: Operational</strong>
                    <span className="text-xs">Task prompts, timestamps, completion status. Necessary for service delivery.</span>
                 </li>
                 <li className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Tier 3: Financial</strong>
                    <span className="text-xs">Transaction logs, current balance. We do NOT store full credit card numbers (tokenized via Stripe).</span>
                 </li>
                 <li className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Tier 4: Telemetry</strong>
                    <span className="text-xs">Device Model, Crash Logs. Used for debugging.</span>
                 </li>
               </ul>
            </div>
           </>
        );

      case 'SECURE_ENCLAVE':
        return (
          <>
            <LegalPageHeader title="Secure Enclave" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <div className="flex justify-center my-8">
                 <ShieldCheck size={100} className="text-primary opacity-80" />
               </div>
               <p>The Secure Enclave is a dedicated hardware subsystem in modern devices. It functions as a "Black Box" for cryptographic operations.</p>
               <h3 className="text-white font-bold text-xl mt-6">Authentication Flow</h3>
               <ol className="list-decimal pl-5 space-y-4">
                 <li><strong>Request:</strong> OnePoint requests authentication for a sensitive action.</li>
                 <li><strong>Local Verify:</strong> Your device verifies your biometrics (Face/Fingerprint).</li>
                 <li><strong>Sign:</strong> The Enclave signs a cryptographic token if successful.</li>
                 <li><strong>Result:</strong> OnePoint receives only the confirmation token, never the biometric data.</li>
               </ol>
            </div>
          </>
        );

      case 'LEGAL_REQUESTS':
         return (
           <>
             <LegalPageHeader title="Law Enforcement" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <p>We may disclose your information if we believe it is reasonably necessary to:</p>
                <ul className="list-disc pl-5 space-y-2">
                   <li>Comply with a valid legal process (warrants, subpoenas).</li>
                   <li>Protect the safety of any person.</li>
                   <li>Address fraud or security issues.</li>
                </ul>
             </div>
           </>
         );

      case 'SECURITY_MEASURES':
         return (
           <>
             <LegalPageHeader title="Security Measures" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <p>We employ "Defense in Depth":</p>
                <div className="space-y-4">
                  <div className="border border-white/10 rounded-xl p-5 bg-white/5">
                     <div className="flex items-center gap-3 mb-3 text-white font-bold text-lg">
                        <Lock size={20} className="text-accent" />
                        <span>Encryption</span>
                     </div>
                     <p className="text-sm text-gray-300">Data at rest is encrypted via AES-256. Data in transit uses TLS 1.3.</p>
                  </div>
                </div>
             </div>
           </>
         );
      
      case 'DATA_USAGE':
        return (
          <>
            <LegalPageHeader title="Data Usage" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>We use your data to:</p>
               <ul className="list-disc pl-5 space-y-2">
                 <li>Provide the autonomous service.</li>
                 <li>Process transactions and prevent fraud.</li>
                 <li>Improve AI model performance (anonymized only).</li>
               </ul>
               <p className="mt-4 text-xs text-gray-400">We do NOT use your private financial details to train general public models.</p>
            </div>
          </>
        );

      case 'PROVIDERS':
        return (
          <>
            <LegalPageHeader title="Service Providers" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
              <p>We utilize the following vetted subprocessors:</p>
              <ul className="space-y-4">
                 <li className="bg-white/5 p-5 rounded-2xl">
                    <strong className="text-white block">Google Cloud</strong>
                    <span className="text-sm text-gray-400">AI Models & Infrastructure.</span>
                 </li>
                 <li className="bg-white/5 p-5 rounded-2xl">
                    <strong className="text-white block">Supabase</strong>
                    <span className="text-sm text-gray-400">Encrypted Database.</span>
                 </li>
                 <li className="bg-white/5 p-5 rounded-2xl">
                    <strong className="text-white block">Stripe</strong>
                    <span className="text-sm text-gray-400">Payment Processing.</span>
                 </li>
              </ul>
            </div>
          </>
        );

      case 'RETENTION':
        return (
          <>
            <LegalPageHeader title="Data Retention" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>We keep data only as long as required.</p>
               <ul className="list-disc pl-5 space-y-3">
                 <li><strong>Active Accounts:</strong> Retained for the life of the account.</li>
                 <li><strong>Deleted Accounts:</strong> Wiped from active DB within 30 days.</li>
                 <li><strong>Financial Records:</strong> Retained for 7 years (legal requirement).</li>
               </ul>
            </div>
          </>
        );

      case 'INTERNATIONAL':
        return (
          <>
            <LegalPageHeader title="International Transfers" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>OnePoint is headquartered in the United States. Data is processed in the US. We utilize Standard Contractual Clauses (SCCs) for EEA data transfers.</p>
            </div>
          </>
        );

      case 'COOKIES':
        return (
          <>
            <LegalPageHeader title="Cookie Policy" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>We are a tracker-free platform. We use Local Storage strictly for essential functionality (Login session, Preferences).</p>
            </div>
          </>
        );

      case 'RIGHTS':
        return (
          <>
            <LegalPageHeader title="Your Privacy Rights" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>You have the right to Access, Correct, and Delete your data. You can export your data anytime from the Settings menu.</p>
            </div>
          </>
        );

      default:
        return <div className="p-10 text-center text-textMuted">Content not found.</div>;
    }
  };

  return (
    <Screen>
       <div className="absolute top-12 left-6 z-50">
          <BackButton onClick={onBack} />
        </div>

      {/* 
         FULL SCREEN LEGAL NAVIGATION OVERLAY 
         If the stack has items, we render the overlay on top of the auth form.
      */}
      {legalStack.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-right duration-300">
           {/* Back Button fixed OUTSIDE the scroll area */}
           <div className="absolute top-12 left-6 z-50">
               <BackButton onClick={popLegal} />
           </div>

           {/* Legal Content Scroll Area */}
           <div className="flex-1 overflow-y-auto no-scrollbar">
              {renderLegalContent(legalStack[legalStack.length - 1])}
           </div>
        </div>
      )}

      {/* MAIN AUTH SCREEN CONTENT */}
      <div className="flex-1 flex flex-col pt-32 pb-10 overflow-y-auto no-scrollbar animate-slide-up">
        
        {/* Header */}
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
                
                <p className="text-[14px] text-textMuted leading-relaxed select-none font-sans font-medium">
                  I agree to the 
                  <span 
                    onClick={() => pushLegal('TOS')}
                    className="text-white hover:text-accent cursor-pointer mx-1 transition-colors underline decoration-white/30"
                  >
                    Terms of Service
                  </span> 
                  and 
                  <span 
                    onClick={() => pushLegal('PRIVACY')}
                    className="text-white hover:text-accent cursor-pointer mx-1 transition-colors underline decoration-white/30"
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

        {/* Notifications Area */}
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
          
          {/* Biometric Button */}
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
        
        {/* Footer */}
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
    </Screen>
  );
};