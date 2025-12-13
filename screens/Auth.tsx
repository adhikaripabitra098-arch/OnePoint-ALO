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
    <div className="mb-10 mt-20 px-6">
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
                   Welcome to OnePoint. These Terms of Service ("Terms") constitute a legally binding agreement between you and OnePoint Inc. ("OnePoint", "we", "us", or "our").
                   By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
                   <br/><br/>
                   <strong>IMPORTANT NOTICE:</strong> These Terms contain a <LegalLink to="DISPUTES">mandatory arbitration provision</LegalLink> and a waiver of class action rights which affect your legal rights. Please read them carefully.
                 </p>
               </div>

               <LegalSection title="1. Eligibility & Accounts" icon={UserIcon}>
                  <p>
                    You must be at least <LegalLink to="AGE">16 years of age</LegalLink> to operate this Service. If you are between the ages of 16 and 18 (or the age of majority in your jurisdiction), you represent that you have legal parental consent to use the Service.
                  </p>
                  <p>
                    You are solely responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use. 
                    See <LegalLink to="ACCOUNT_SECURITY">Account Security</LegalLink> for detailed security protocols.
                  </p>
               </LegalSection>

               <LegalSection title="2. The Autonomous Service" icon={Activity}>
                  <p>
                    OnePoint utilizes advanced generative artificial intelligence to execute tasks on your behalf. By using the Service, you acknowledge the inherent risks of AI, including 
                    <LegalLink to="HALLUCINATIONS">hallucinations</LegalLink>, bias, and unpredictability.
                  </p>
                  <p>
                    You retain full responsibility for the actions of your Agents. Review our detailed <LegalLink to="AI_LIMITATIONS">AI Limitations & Disclaimers</LegalLink> before authorizing high-value tasks.
                  </p>
               </LegalSection>

               <LegalSection title="3. Financial Terms" icon={CreditCard}>
                  <p>
                    You authorize OnePoint to instruct third-party payment processors to charge your linked funding sources for approved transactions. All payments are subject to our <LegalLink to="PAID_SERVICES">Paid Services Terms</LegalLink>.
                  </p>
                  <p>
                    You are responsible for configuring <LegalLink to="SPENDING">Spending Limits</LegalLink>. We are not liable for authorized transactions that you later regret or that result in overdraft fees.
                  </p>
               </LegalSection>

               <LegalSection title="4. Acceptable Use" icon={ShieldAlert}>
                  <p>
                    You agree not to misuse the Service. This includes, but is not limited to, using AI agents for harassment, fraud, illegal activities, or platform manipulation.
                    See the full list of <LegalLink to="PROHIBITED">Prohibited Conduct</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="5. Intellectual Property" icon={Copyright}>
                  <p>
                    We grant you a limited, non-exclusive license to use the App. We retain all rights to our proprietary AI models, orchestration logic, and code.
                    See <LegalLink to="IP_RIGHTS">Intellectual Property Rights</LegalLink> and <LegalLink to="DMCA">DMCA Copyright Policy</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="6. Liability & Indemnification" icon={Scale}>
                  <p>
                    You agree to hold OnePoint harmless from claims arising from your use of the Service.
                    See <LegalLink to="INDEMNIFICATION">Indemnification</LegalLink> and <LegalLink to="LIABILITY">Limitation of Liability</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="7. Dispute Resolution" icon={Gavel}>
                  <p>
                    All disputes shall be resolved via binding individual arbitration. You waive your right to a jury trial.
                    See <LegalLink to="DISPUTES">Arbitration & Class Action Waiver</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="8. Termination" icon={PowerOff}>
                   <p>
                     We reserve the right to suspend or terminate your account at our sole discretion.
                     See <LegalLink to="TERMINATION">Termination Policy</LegalLink>.
                   </p>
               </LegalSection>

               <LegalSection title="9. Governing Law" icon={Globe}>
                   <p>
                     These terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
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
                   Your autonomy relies on privacy. At OnePoint, we believe you should own your data. This comprehensive policy details every data point we collect, why we collect it, and the strict limits we place on its use.
                 </p>
               </div>

               <LegalSection title="1. Information We Collect" icon={Database}>
                  <p>
                    We collect data you explicitly provide (Account Data) and data generated by your usage (Telemetry). We practice data minimization.
                    Review the exhaustive list in <LegalLink to="DATA_TYPES">Data Collection Categories</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="2. Biometric Data" icon={Fingerprint}>
                  <p>
                    OnePoint is "Local-First". Your biometric data is processed exclusively within your device's 
                    <LegalLink to="SECURE_ENCLAVE">Secure Enclave</LegalLink> and is never transmitted to our servers. We never possess your face data.
                  </p>
               </LegalSection>

               <LegalSection title="3. How We Use Information" icon={Info}>
                  <p>
                    We use data to operate agents, prevent fraud, and improve model accuracy via anonymized training.
                    See <LegalLink to="DATA_USAGE">Data Usage & AI Training</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="4. Sharing & Disclosure" icon={Users}>
                  <p>
                    <strong>We do not sell your personal data.</strong> We share data only with necessary <LegalLink to="PROVIDERS">Subprocessors</LegalLink> 
                    or when compelled by law. See <LegalLink to="LEGAL_REQUESTS">Law Enforcement Requests</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="5. Data Security" icon={LockKeyhole}>
                  <p>
                    We employ enterprise-grade encryption (AES-256) at rest and TLS 1.3 in transit.
                    See <LegalLink to="SECURITY_MEASURES">Security Measures</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="6. Retention & Deletion" icon={FileText}>
                  <p>
                    We retain data only as long as necessary. You have the right to request deletion at any time.
                    See <LegalLink to="RETENTION">Data Retention Policy</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="7. International Transfers" icon={Globe}>
                  <p>
                    Data may be processed in the United States. We utilize Standard Contractual Clauses for transfers.
                    See <LegalLink to="INTERNATIONAL">International Data Transfers</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="8. Your Rights" icon={Scale}>
                  <p>
                    You have specific rights under GDPR, CCPA, and other regional laws, including the right to access and export your data.
                    See <LegalLink to="RIGHTS">Your Privacy Rights</LegalLink>.
                  </p>
               </LegalSection>

               <LegalSection title="9. Cookies & Tracking" icon={Cookie}>
                  <p>
                     We are a tracker-free platform. We do not use third-party advertising cookies.
                     See <LegalLink to="COOKIES">Cookie Policy</LegalLink>.
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
                <p>AI Agents are authorized to enter into binding contracts (bookings, purchases) on your behalf. Individuals under 16 generally lack the legal capacity to form such contracts, making these transactions voidable and creating liability risks.</p>
              </div>
              
              <div className="bg-surfaceHighlight/20 p-5 rounded-2xl border border-white/5">
                <h3 className="text-white font-bold text-lg mb-2">2. Data Protection (GDPR-K / COPPA)</h3>
                <p>We do not knowingly collect data from children under 13. If we discover an account belongs to a user under 13, it will be terminated immediately and all data expunged.</p>
              </div>
              
              <div className="bg-surfaceHighlight/20 p-5 rounded-2xl border border-white/5">
                <h3 className="text-white font-bold text-lg mb-2">3. Parental Consent</h3>
                <p>If you are between 16 and 18 years of age (or the age of majority in your jurisdiction), you represent and warrant that you possess the legal consent of your parent or guardian to access and use the Service. Your parent or guardian must read and agree to these Terms on your behalf.</p>
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
                 <p>You agree to use a strong, unique password for your OnePoint account. We hash all passwords using SHA-256 with individual salts before storage. We cannot recover your raw password; if lost, it must be reset via email validation.</p>
               </LegalSection>

               <LegalSection title="Device Security" icon={ShieldCheck}>
                 <p>Since OnePoint processes sensitive financial and personal tasks, you agree to keep your device operating system updated and secured with a passcode or biometric lock. You must not use OnePoint on a rooted or jailbroken device, as this compromises the <LegalLink to="SECURE_ENCLAVE">Secure Enclave</LegalLink> protection.</p>
               </LegalSection>

               <LegalSection title="Notification of Breach" icon={Siren}>
                 <p>You must notify us immediately at security@onepoint.ai if you believe your account has been compromised. We are not liable for any loss or damage arising from your failure to comply with the above requirements.</p>
               </LegalSection>
             </div>
           </>
         );

      case 'PAID_SERVICES':
         return (
            <>
              <LegalPageHeader title="Paid Services Terms" />
              <div className="px-6 pb-24 space-y-8 text-gray-300 text-sm leading-relaxed">
                 <p>Certain advanced features of OnePoint (such as autonomous negotiation, premium agent routes, and extended context windows) require payment.</p>

                 <LegalSection title="Subscription & Credits" icon={BadgeDollarSign}>
                    <p><strong>Subscriptions:</strong> Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. You can manage subscriptions in your Apple ID or Google Play settings.</p>
                    <p><strong>AI Credits:</strong> Credits purchased for AI tasks are non-refundable and expire after 12 months of inactivity. They have no cash value and cannot be transferred.</p>
                 </LegalSection>

                 <LegalSection title="Transaction Authorization" icon={CheckSquare}>
                    <p>When you assign a task with a monetary cost (e.g., "Buy a ticket"), you grant OnePoint a limited power of attorney to execute that transaction using your stored payment method, up to your specified <LegalLink to="SPENDING">Spending Limit</LegalLink>.</p>
                 </LegalSection>

                 <LegalSection title="Refund Policy" icon={FileText}>
                    <p><strong>Service Failures:</strong> If an AI Agent fails to execute a task due to a technical error on our platform, we will refund any AI Credits used for that specific task.</p>
                    <p><strong>Third-Party Results:</strong> We do not refund AI Credits if the Agent successfully executes the attempt but the outcome is negative (e.g., the airline refused the refund request). You pay for the <em>labor</em> of the Agent, not the guaranteed outcome.</p>
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
                  Generative AI models are probabilistic, not deterministic. They construct answers based on statistical likelihood, not fact-checking databases.
                </div>
              </div>
              
              <h3 className="text-white font-bold text-xl mt-6">What is a Hallucination?</h3>
              <p>A "hallucination" occurs when an AI model generates content that is nonsensical or unfaithful to the provided source content. For example, an Agent might confidently state that a flight is refundable when it is non-refundable, or invent a phone number for a business.</p>
              
              <h3 className="text-white font-bold text-xl mt-6">Allocation of Risk</h3>
              <p>By using OnePoint, you explicitly accept the risk that the AI may provide incorrect information. <strong>OnePoint is not liable for financial losses incurred due to your reliance on hallucinated data.</strong></p>
              
              <h3 className="text-white font-bold text-xl mt-6">Mitigation Strategies</h3>
              <ul className="list-disc pl-5 space-y-3">
                 <li>We implement "Grounding" techniques to verify AI outputs against real-world APIs where possible.</li>
                 <li>We enforce "Human-in-the-Loop" for transactions exceeding your set threshold.</li>
                 <li><strong>You must verify critical details</strong> (dates, prices, legal terms) before final confirmation of any high-value action.</li>
              </ul>
            </div>
          </>
        );

      case 'AI_LIMITATIONS':
        return (
          <>
            <LegalPageHeader title="AI Limitations" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>Our autonomous agents are powerful but not infallible. You acknowledge the following technological limitations:</p>
               
               <div className="space-y-4">
                 <div className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Context Windows</strong>
                    <p>The AI has a limited "memory" (context window). In very long negotiation threads, it may "forget" details provided at the beginning of the conversation. It is best to keep tasks concise.</p>
                 </div>
                 <div className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Temporal Awareness</strong>
                    <p>Unless explicitly connected to a real-time tool (like a calendar API), the AI model's knowledge is cut off at its training date. It may not know about events happening <em>today</em> unless provided in the prompt.</p>
                 </div>
                 <div className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Bias & Safety Filters</strong>
                    <p>AI models can reflect biases present in their training data. Additionally, safety filters may occasionally trigger false positives, refusing to execute legitimate tasks that vaguely resemble prohibited content.</p>
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
              <p>OnePoint provides tools to control AI spending, but you are the ultimate authority. You are responsible for configuring these settings correctly.</p>
              
              <h3 className="text-white font-bold text-xl mt-6">1. Soft Limit (Auto-Approve)</h3>
              <p>Transactions below this threshold are executed immediately without user intervention. By setting this limit > $0, you explicitly authorize OnePoint to initiate charges up to this amount per transaction. <strong>Use caution.</strong></p>
              
              <h3 className="text-white font-bold text-xl mt-6">2. Hard Limit (Threshold)</h3>
              <p>Transactions exceeding this amount require explicit biometric approval. The AI will pause execution and send a push notification. If you do not approve within 24 hours, the task will time out.</p>
              
              <h3 className="text-white font-bold text-xl mt-6">3. Overdrafts</h3>
              <p>OnePoint is not responsible for overdraft fees or insufficient fund penalties charged by your bank if an authorized transaction exceeds your available balance.</p>
            </div>
          </>
        );

      case 'INDEMNIFICATION':
         return (
           <>
             <LegalPageHeader title="Indemnification" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <p>You agree to defend, indemnify, and hold harmless OnePoint, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to:</p>
                <ul className="list-disc pl-5 space-y-3">
                   <li>Your violation of these Terms of Service.</li>
                   <li>Your use of the Service, including any use of the App's content, services, and products other than as expressly authorized.</li>
                   <li>Any content you provide (User Inputs).</li>
                   <li>Actions taken by AI Agents acting on your explicit instructions which result in harm to third parties (e.g., instructing an Agent to harass a vendor).</li>
                   <li>Your failure to secure your account or device.</li>
                </ul>
             </div>
           </>
         );

      case 'PROHIBITED':
        return (
          <>
            <LegalPageHeader title="Prohibited Conduct" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>You agree NOT to use the Service for any of the following activities. Violation results in immediate <LegalLink to="TERMINATION">Termination</LegalLink>.</p>
               <ul className="space-y-4">
                 <li className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                    <strong className="text-red-200 block text-lg mb-1">Illegal Activity</strong>
                    Buying illegal goods, money laundering, evasion of sanctions, or any activity that violates local, state, or federal laws.
                 </li>
                 <li className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                    <strong className="text-red-200 block text-lg mb-1">Harassment & Abuse</strong>
                    Using Agent negotiation capabilities to DDOs, spam, harass, or threaten customer service representatives or individuals.
                 </li>
                 <li className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                    <strong className="text-red-200 block text-lg mb-1">Platform Abuse</strong>
                    Reverse engineering the App, scraping data, attempting to circumvent API rate limits, or introducing viruses/malware.
                 </li>
                 <li className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                    <strong className="text-red-200 block text-lg mb-1">Harmful Generation</strong>
                    Prompting the AI to generate hate speech, sexually explicit content, self-harm instructions, or disinformation.
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
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL ONEPOINT OR ITS AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
              </div>
              <p>OnePoint's total liability for any claim arising out of or relating to these Terms or the use of the Service is limited to the greater of $100 USD or the amount paid by you to OnePoint in the 12 months preceding the event giving rise to the claim.</p>
              <p>Some jurisdictions do not allow the exclusion of certain warranties, so some of these exclusions may not apply to you.</p>
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
                   <p>You and OnePoint agree to resolve any claims relating to these Terms or the Service through final and binding arbitration, rather than in court. The arbitration will be conducted by the American Arbitration Association (AAA) under its rules.</p>
                </div>
                
                <h3 className="text-white font-bold text-xl mt-6">Class Action Waiver</h3>
                <p className="p-4 border border-white/10 rounded-xl bg-white/5">
                  YOU AND ONEPOINT AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE ACTION.
                </p>
                
                <h3 className="text-white font-bold text-xl mt-6">Exceptions</h3>
                <p>You or OnePoint may assert claims, if they qualify, in small claims court in the United States county where you live or work.</p>
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
                <p>These Terms shall be governed by and defined following the laws of the <strong>State of Delaware, United States</strong>, which is the international standard for corporate law. OnePoint and yourself irrevocably consent that the courts of Delaware shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms. We acknowledge that if you are a consumer based in the EU/UK, mandatory local consumer protection laws may still apply to you.</p>
             </div>
           </>
         );

      case 'IP_RIGHTS':
        return (
          <>
            <LegalPageHeader title="Intellectual Property" />
            <div className="px-6 pb-24 space-y-8 text-gray-300 text-sm leading-relaxed">
               <LegalSection title="Your Content" icon={UserIcon}>
                 <p>You retain ownership of the tasks, inputs, and data you provide to OnePoint ("User Content"). You grant OnePoint a worldwide, royalty-free, sublicensable, and transferable license to use, host, store, cache, reproduce, publish, display, distribute, and modify your User Content <strong>solely for the purposes of operating, improving, and providing the Service.</strong></p>
               </LegalSection>

               <LegalSection title="Our Content" icon={Copyright}>
                 <p>OnePoint, the OnePoint logo, our AI orchestration logic, prompt engineering techniques, and visual design are trademarks or trade dress of OnePoint Inc. You may not use them without our prior written permission. The Service contains proprietary content protected by copyright, patent, trademark, and trade secret laws.</p>
               </LegalSection>

               <LegalSection title="Feedback" icon={MessageSquare}>
                 <p>If you choose to submit comments, ideas, or feedback, you agree that we are free to use them without any restriction or compensation to you.</p>
               </LegalSection>
            </div>
          </>
        );

      case 'DMCA':
         return (
           <>
             <LegalPageHeader title="DMCA Copyright Policy" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <p>We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on the Service infringes on the copyright or other intellectual property rights of any person.</p>
                <h3 className="text-white font-bold text-xl mt-6">Filing a Notice</h3>
                <p>If you are a copyright owner and believe your work has been copied in a way that constitutes copyright infringement, please submit your claim via email to legal@onepoint.ai, with the subject line: "Copyright Infringement".</p>
                <p>Your notice must include:</p>
                <ul className="list-disc pl-5 space-y-2">
                   <li>An electronic or physical signature of the person authorized to act.</li>
                   <li>A description of the copyrighted work that you claim has been infringed.</li>
                   <li>A description of where the material is located on the App.</li>
                   <li>Your address, telephone number, and email address.</li>
                </ul>
             </div>
           </>
         );

      case 'TERMINATION':
        return (
          <>
            <LegalPageHeader title="Termination" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>We believe in the right to exit. You may terminate your relationship with OnePoint at any time.</p>
               
               <h3 className="text-white font-bold text-xl mt-6">Termination by You</h3>
               <p>You can delete your account at any time via the Settings menu. Deletion is irreversible. See <LegalLink to="RETENTION">Data Retention</LegalLink> for what happens to your data.</p>
               
               <h3 className="text-white font-bold text-xl mt-6">Termination by Us</h3>
               <p>We may suspend or terminate your access to OnePoint at any time, for any reason, without notice, including if we reasonably believe:</p>
               <ul className="list-disc pl-5 space-y-2">
                 <li>You have violated these Terms.</li>
                 <li>You create risk or possible legal exposure for us.</li>
                 <li>Our provision of the services to you is no longer commercially viable.</li>
               </ul>
               <p>Upon termination, your license to use the Service ends immediately.</p>
            </div>
          </>
        );

      // --- PRIVACY DETAIL PAGES ---

      case 'DATA_TYPES':
        return (
           <>
            <LegalPageHeader title="Data Collection Types" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>We classify collected data into four distinct tiers based on sensitivity:</p>
               <ul className="space-y-4">
                 <li className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Tier 1: Identity</strong>
                    <span className="text-xs">Email, Name, Phone Number, Encrypted Password Hash. <strong>Necessary</strong> for account management and security.</span>
                 </li>
                 <li className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Tier 2: Operational</strong>
                    <span className="text-xs">Task descriptions, prompts sent to AI, timestamps, completion status, negotiated outcomes. <strong>Necessary</strong> for service delivery.</span>
                 </li>
                 <li className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Tier 3: Financial</strong>
                    <span className="text-xs">Transaction logs, current balance, spending limit settings. <strong>Note:</strong> We do NOT store full credit card numbers; these are tokenized by Stripe.</span>
                 </li>
                 <li className="bg-surfaceHighlight/20 p-5 rounded-xl border border-white/5">
                    <strong className="block text-white text-lg mb-2">Tier 4: Telemetry</strong>
                    <span className="text-xs">IP Address, OS Version, Device Model, Crash Logs. Used for debugging, fraud prevention, and security auditing.</span>
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
               <p>The Secure Enclave is a dedicated hardware subsystem in modern devices (iPhone, Pixel, Samsung) isolated from the main processor. It functions as a "Black Box" for cryptographic operations.</p>
               <h3 className="text-white font-bold text-xl mt-6">Authentication Flow</h3>
               <ol className="list-decimal pl-5 space-y-4">
                 <li><strong>Request:</strong> OnePoint requests authentication for a sensitive action (e.g., spending limit override).</li>
                 <li><strong>Local Scan:</strong> Your device activates its biometric sensor (FaceID/TouchID).</li>
                 <li><strong>Hardware Verify:</strong> The sensor data is sent directly to the Secure Enclave. The operating system and our App never see the raw image data.</li>
                 <li><strong>Sign:</strong> If the biometric matches the stored template, the Enclave signs a cryptographic token.</li>
                 <li><strong>Result:</strong> OnePoint receives only this "True/False" token to authorize the action.</li>
               </ol>
               <p className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 font-medium text-center">
                 <strong>Guarantee:</strong> We cannot access, view, export, or steal your facial data or fingerprints.
               </p>
            </div>
          </>
        );

      case 'LEGAL_REQUESTS':
         return (
           <>
             <LegalPageHeader title="Law Enforcement" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <div className="flex items-center gap-4 mb-4">
                   <Siren size={32} className="text-red-400" />
                   <h3 className="font-bold text-xl text-white">Government Requests</h3>
                </div>
                <p>OnePoint cares deeply about user privacy, but we must operate within the law. We may disclose your information if we believe it is reasonably necessary to:</p>
                <ul className="list-disc pl-5 space-y-2">
                   <li>Comply with a law, regulation, valid legal process, or governmental request (e.g., search warrants, court orders, subpoenas).</li>
                   <li>Protect the safety of any person from death or serious bodily injury.</li>
                   <li>Address fraud, security, or technical issues.</li>
                   <li>Protect OnePoint's rights or property.</li>
                </ul>
                <p>We will attempt to notify you of such requests via email unless prohibited by law or if we believe it would endanger others or impede an investigation.</p>
             </div>
           </>
         );

      case 'SECURITY_MEASURES':
         return (
           <>
             <LegalPageHeader title="Security Measures" />
             <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
                <p>We employ a "Defense in Depth" strategy to protect your data. Security is not a feature; it is the foundation of our architecture.</p>
                
                <div className="space-y-4">
                  <div className="border border-white/10 rounded-xl p-5 bg-white/5">
                     <div className="flex items-center gap-3 mb-3 text-white font-bold text-lg">
                        <Lock size={20} className="text-accent" />
                        <span>Encryption at Rest</span>
                     </div>
                     <p className="text-sm text-gray-300">All database volumes are encrypted using AES-256. Sensitive fields (like API keys) are doubly encrypted at the application layer before they ever touch the database.</p>
                  </div>
                  
                  <div className="border border-white/10 rounded-xl p-5 bg-white/5">
                     <div className="flex items-center gap-3 mb-3 text-white font-bold text-lg">
                        <Globe size={20} className="text-accent" />
                        <span>Encryption in Transit</span>
                     </div>
                     <p className="text-sm text-gray-300">All network traffic utilizes TLS 1.3 (Transport Layer Security). We enforce HSTS (HTTP Strict Transport Security) to prevent downgrade attacks.</p>
                  </div>

                  <div className="border border-white/10 rounded-xl p-5 bg-white/5">
                     <div className="flex items-center gap-3 mb-3 text-white font-bold text-lg">
                        <ShieldCheck size={20} className="text-accent" />
                        <span>Access Control</span>
                     </div>
                     <p className="text-sm text-gray-300">Employee access to user data is strictly limited on a "need to know" basis and protected by multi-factor authentication and hardware keys (YubiKeys).</p>
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
               <p>We use your data for the following specific purposes:</p>
               <ul className="list-disc pl-5 space-y-2">
                 <li><strong>Service Delivery:</strong> Processing your inputs to generate AI responses and execute tasks.</li>
                 <li><strong>Transactional Communications:</strong> Sending receipts, booking confirmations, and security alerts.</li>
                 <li><strong>Fraud Prevention:</strong> Analyzing transaction patterns to detect anomalies (e.g., a sudden $5,000 charge in a foreign country).</li>
                 <li><strong>Support:</strong> Responding to your questions and resolving issues.</li>
               </ul>
               
               <h3 className="text-white font-bold text-xl mt-6">AI Training (RLHF)</h3>
               <p>We use <strong>Reinforcement Learning from Human Feedback (RLHF)</strong>. When you correct an agent or rate a task, that signal is used to update the model weights to make the AI smarter.</p>
               <div className="bg-surfaceHighlight/30 p-4 rounded-xl border border-white/10 mt-2">
                 <strong className="text-white block mb-1">Privacy Guarantee</strong>
                 <p className="text-xs text-gray-400">We strip Personally Identifiable Information (PII) before using any interaction data for model training. We do not use your private financial transaction details (e.g., credit card numbers) to train general models.</p>
               </div>
            </div>
          </>
        );

      case 'PROVIDERS':
        return (
          <>
            <LegalPageHeader title="Service Providers" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
              <p>We utilize the following subprocessors. Each has been vetted for security compliance (SOC 2 Type II).</p>
              <ul className="space-y-4">
                 <li className="bg-white/5 p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-white text-lg">Google Cloud</strong>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-textMuted uppercase font-bold">AI & Compute</span>
                    </div>
                    <span className="text-sm text-gray-400">Provides Gemini models and serverless infrastructure. Data region: US-Central.</span>
                 </li>
                 <li className="bg-white/5 p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-white text-lg">Supabase</strong>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-textMuted uppercase font-bold">Database</span>
                    </div>
                    <span className="text-sm text-gray-400">PostgreSQL database provider. Stores encrypted user profiles.</span>
                 </li>
                 <li className="bg-white/5 p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-white text-lg">Stripe</strong>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-textMuted uppercase font-bold">Payments</span>
                    </div>
                    <span className="text-sm text-gray-400">PCI-DSS Level 1 Provider. Handles all credit card tokenization and processing.</span>
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
               <p>We practice "Data Minimization". We keep data only as long as required.</p>
               <ul className="list-disc pl-5 space-y-3">
                 <li><strong>Active Accounts:</strong> We retain data for the life of the account to provide history and context to the AI.</li>
                 <li><strong>Deleted Accounts:</strong> When you request deletion, we continuously wipe data from our active database within 30 days. Backup archives are purged within 90 days.</li>
                 <li><strong>Financial Records:</strong> We are legally required to retain transaction logs for 7 years to comply with IRS and anti-money laundering regulations. These records are kept in cold storage and restricted access.</li>
               </ul>
            </div>
          </>
        );

      case 'INTERNATIONAL':
        return (
          <>
            <LegalPageHeader title="International Transfers" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>OnePoint is headquartered in the United States. Information we collect may be transferred to, stored, and processed in the US.</p>
               <h3 className="text-white font-bold text-xl mt-6">GDPR Compliance</h3>
               <p>If you are accessing the service from the European Economic Area (EEA), we utilize Standard Contractual Clauses (SCCs) approved by the European Commission to legitimize data transfers, ensuring your data is protected to European standards.</p>
            </div>
          </>
        );

      case 'COOKIES':
        return (
          <>
            <LegalPageHeader title="Cookie Policy" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>We are a tracker-free platform. We do not use third-party advertising pixels (like the Facebook Pixel) or cross-site tracking cookies. We do not sell your browsing history.</p>
               <h3 className="text-white font-bold text-xl mt-6">Essential Storage</h3>
               <p>We use Local Storage and Session Storage strictly for essential functionality:</p>
               <ul className="list-disc pl-5 space-y-2">
                 <li><strong>Authentication:</strong> Keeping you logged in securely (JWT tokens).</li>
                 <li><strong>Preferences:</strong> Remembering your theme and UI settings.</li>
                 <li><strong>Security:</strong> Storing cryptographic nonces to prevent CSRF attacks.</li>
               </ul>
            </div>
          </>
        );

      case 'RIGHTS':
        return (
          <>
            <LegalPageHeader title="Your Privacy Rights" />
            <div className="px-6 pb-24 space-y-6 text-gray-300 text-sm leading-relaxed">
               <p>You have the following rights regarding your personal data:</p>
               <div className="space-y-4 mt-6">
                  <div className="flex gap-4 p-4 border border-white/5 rounded-xl bg-white/5">
                     <FileText size={24} className="text-accent shrink-0" />
                     <div>
                        <strong className="block text-white text-lg">Right to Access</strong>
                        Request a copy of all data we hold about you (JSON format). You can download your data archive from Settings.
                     </div>
                  </div>
                  <div className="flex gap-4 p-4 border border-white/5 rounded-xl bg-white/5">
                     <FileWarning size={24} className="text-accent shrink-0" />
                     <div>
                        <strong className="block text-white text-lg">Right to Rectification</strong>
                        Correct inaccurate or incomplete data.
                     </div>
                  </div>
                  <div className="flex gap-4 p-4 border border-white/5 rounded-xl bg-white/5">
                     <AlertTriangle size={24} className="text-accent shrink-0" />
                     <div>
                        <strong className="block text-white text-lg">Right to Erasure</strong>
                        Request permanent deletion of your account and data ("Right to be Forgotten").
                     </div>
                  </div>
               </div>
               <p className="mt-8 text-sm text-textMuted text-center">To exercise these rights, navigate to Settings > Report an Issue, or email privacy@onepoint.ai.</p>
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
           {/* Legal Header with Back Button */}
           <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-50 flex items-end pb-4 px-6 pointer-events-none">
              <button 
                 onClick={popLegal}
                 className="flex items-center gap-2 text-white active:opacity-50 transition-opacity pointer-events-auto"
              >
                 <div className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center border border-white/10 shadow-lg backdrop-blur-md">
                    <ChevronLeft size={24} />
                 </div>
                 <span className="font-bold text-lg drop-shadow-md">Back</span>
              </button>
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
                 className="text-sm font-bold text-white hover:text-gray-200 transition-colors tracking-wide"
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
                className="text-sm text-white font-bold hover:text-white/80 transition-colors"
             >
                Register
             </button>
          </div>
        )}

      </div>
    </Screen>
  );
};