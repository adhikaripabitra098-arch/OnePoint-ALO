import React, { useState, useRef, useEffect } from 'react';
import { Screen, Button, Card, Input } from '../components/UI';
import { X, Mic, Image as ImageIcon, Sparkles, Loader2, ShieldCheck, AlertTriangle, Trash2, StopCircle } from 'lucide-react';
import { parseTaskInput } from '../services/geminiService';
import { authenticateBiometrics } from '../services/biometricService';
import { Task, TaskStatus, TaskType, UserPreferences } from '../types';

interface TaskCreateProps {
  onClose: () => void;
  onCreate: (task: Task) => void;
  userPreferences: UserPreferences | null;
}

// Helper to access Web Speech API (Browser native)
// NOTE: For Production Release (App Store), replace this with a real API like OpenAI Whisper or Google Cloud Speech if you need cross-browser support beyond Chrome/Safari.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const TaskCreate: React.FC<TaskCreateProps> = ({ onClose, onCreate, userPreferences }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<{title: string, type: TaskType, summary: string, cost: number} | null>(null);
  
  // Media State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Security Check State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- Image Handling ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- Voice Handling ---
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser environment. Please type your request.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };


  const handleAnalyze = async () => {
    if (!input.trim() && !selectedImage) return;
    
    setIsProcessing(true);
    // Pass text AND image to the updated Gemini Service
    const result = await parseTaskInput(input, userPreferences, selectedImage);
    
    setAnalysis({
      title: result.title,
      type: result.type,
      summary: result.summary,
      cost: result.estimatedCost
    });
    setIsProcessing(false);
  };

  const handleCreate = async () => {
    if (!analysis) return;
    
    const hardLimit = userPreferences?.maxSpendingThreshold || 100;
    const softLimit = userPreferences?.autoApproveUnder || 25;
    
    let initialStatus = TaskStatus.CREATED;
    let requiresAuth = false;

    // --- SPENDING LIMIT LOGIC ---
    if (analysis.cost > hardLimit) {
      requiresAuth = true;
    } 
    else if (analysis.cost > 0 && analysis.cost <= softLimit) {
      initialStatus = TaskStatus.IN_PROGRESS;
    }
    else if (analysis.cost > softLimit) {
      initialStatus = TaskStatus.WAITING_APPROVAL;
    }

    if (requiresAuth) {
       setIsAuthenticating(true);
       setAuthError(null);
       const result = await authenticateBiometrics('OnePoint User');
       setIsAuthenticating(false);

       if (!result.success) {
         setAuthError("Authorization Failed: High-value transactions require Face ID.");
         return; 
       }
       initialStatus = TaskStatus.IN_PROGRESS;
    }
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: analysis.title,
      description: analysis.summary,
      type: analysis.type,
      status: initialStatus,
      estimatedCost: analysis.cost,
      confidenceScore: 0.9,
      createdAt: new Date(),
    };
    
    onCreate(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
      <div className="p-4 flex justify-between items-center border-b border-white/5">
        <div className="w-10"></div>
        <h2 className="font-bold text-lg">New Task</h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-surfaceHighlight flex items-center justify-center">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col overflow-y-auto">
        {!analysis ? (
          <>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "e.g., Get a refund from Amazon for order #123..."}
                className={`w-full h-32 bg-surfaceHighlight/50 border ${isListening ? 'border-red-500/50 animate-pulse' : 'border-white/5'} rounded-2xl p-4 text-lg outline-none resize-none placeholder:text-textMuted font-medium transition-all`}
                autoFocus
              />
              {isListening && (
                 <div className="absolute top-4 right-4 text-red-500 animate-pulse">
                    <Mic size={20} fill="currentColor" />
                 </div>
              )}
            </div>
            
            {/* Image Preview */}
            {selectedImage && (
              <div className="mt-4 relative rounded-2xl overflow-hidden border border-white/10 h-40 bg-black/40 group">
                <img src={selectedImage} alt="Upload preview" className="w-full h-full object-cover opacity-80" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 rounded-full text-xs font-medium text-white backdrop-blur-md">
                   Image attached
                </div>
              </div>
            )}
            
            <div className="mt-4">
               <label className="text-xs font-semibold text-textMuted uppercase tracking-wider ml-1 mb-2 block">Quick Add</label>
               <div className="grid grid-cols-2 gap-3">
                 {/* HIDDEN FILE INPUT */}
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                 />
                 
                 <button 
                   onClick={triggerFileInput}
                   className="h-24 bg-surfaceHighlight/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-surfaceHighlight/50 active:scale-[0.98] transition-all"
                 >
                    <ImageIcon className="text-primary" />
                    <span className="text-sm font-medium">Upload Image</span>
                 </button>
                 
                 <button 
                   onClick={toggleListening}
                   className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-surfaceHighlight/50 active:scale-[0.98] transition-all ${isListening ? 'bg-red-500/20 border border-red-500/50' : 'bg-surfaceHighlight/30'}`}
                 >
                    {isListening ? (
                       <StopCircle className="text-red-500 animate-pulse" />
                    ) : (
                       <Mic className="text-blue-400" />
                    )}
                    <span className="text-sm font-medium">{isListening ? 'Stop Recording' : 'Voice Note'}</span>
                 </button>
               </div>
            </div>

            <div className="mt-6 p-4 bg-[#00D6C3]/10 border border-[#00D6C3]/20 rounded-2xl flex gap-3">
               <Sparkles className="text-primary flex-shrink-0 mt-0.5" size={20} />
               <p className="text-sm text-primary/90 leading-relaxed font-medium">
                 OnePoint AI (Gemini) will analyze your request and apply your {userPreferences?.negotiationStyle || 'NEUTRAL'} negotiation style.
               </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-2">
               <Sparkles size={16} className="text-primary" />
               <span className="text-sm font-semibold text-primary">AI Analysis Complete</span>
             </div>
             
             <Card className="bg-surfaceHighlight/20 border-primary/30">
                <div className="text-sm text-textMuted uppercase tracking-wide mb-1">{analysis.type}</div>
                <h2 className="text-xl font-bold mb-2">{analysis.title}</h2>
                <p className="text-textMuted mb-4 font-medium">{analysis.summary}</p>
                {analysis.cost > 0 && (
                   <div className="flex items-center gap-2">
                     <div className="inline-block px-3 py-1 bg-surface rounded-lg text-sm font-mono border border-white/10">
                       Est. Cost: ${analysis.cost}
                     </div>
                     {analysis.cost > (userPreferences?.maxSpendingThreshold || 100) && (
                        <div className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                          <ShieldCheck size={12} /> Exceeds Limit
                        </div>
                     )}
                   </div>
                )}
             </Card>

             <p className="text-xs text-center text-textMuted mt-4 font-medium">
               {analysis.cost > (userPreferences?.maxSpendingThreshold || 100) 
                  ? "Biometric authentication required due to high cost." 
                  : "OnePoint will now take over. You will be notified of any approvals needed."}
             </p>
             
             {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-200 text-sm">
                   <AlertTriangle size={16} /> {authError}
                </div>
             )}
          </div>
        )}
      </div>

      <div className="p-6 bg-surfaceHighlight/10 border-t border-white/5">
        {isProcessing ? (
           <Button disabled fullWidth className="opacity-80">
             <Loader2 className="animate-spin mr-2" /> Analyzing...
           </Button>
        ) : !analysis ? (
          <Button onClick={handleAnalyze} fullWidth disabled={!input && !selectedImage}>
            {input || selectedImage ? "Analyze" : "Describe Task"}
          </Button>
        ) : (
          <Button onClick={handleCreate} fullWidth icon={Sparkles} disabled={isAuthenticating}>
            {isAuthenticating ? (
              <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Verifying...</span>
            ) : analysis.cost > (userPreferences?.maxSpendingThreshold || 100) ? "Authorize & Execute" : "Confirm & Execute"}
          </Button>
        )}
      </div>
    </div>
  );
};