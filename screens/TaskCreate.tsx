import React, { useState } from 'react';
import { Screen, Button, Card, Input } from '../components/UI';
import { X, Mic, Image as ImageIcon, Sparkles, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { parseTaskInput } from '../services/geminiService';
import { authenticateBiometrics } from '../services/biometricService';
import { Task, TaskStatus, TaskType, UserPreferences } from '../types';

interface TaskCreateProps {
  onClose: () => void;
  onCreate: (task: Task) => void;
  userPreferences: UserPreferences | null;
}

export const TaskCreate: React.FC<TaskCreateProps> = ({ onClose, onCreate, userPreferences }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<{title: string, type: TaskType, summary: string, cost: number} | null>(null);
  
  // States for Security Check
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    // Pass user preferences to the AI service
    const result = await parseTaskInput(input, userPreferences);
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
    
    // DEFAULT PREFERENCES IF NULL
    const hardLimit = userPreferences?.maxSpendingThreshold || 100;
    const softLimit = userPreferences?.autoApproveUnder || 25;
    
    let initialStatus = TaskStatus.CREATED;
    let requiresAuth = false;

    // --- SPENDING LIMIT LOGIC ---
    // Rule 1: High Value -> Requires Biometric Auth NOW
    if (analysis.cost > hardLimit) {
      requiresAuth = true;
    } 
    // Rule 2: Low Value -> Auto Approve
    else if (analysis.cost > 0 && analysis.cost <= softLimit) {
      initialStatus = TaskStatus.IN_PROGRESS;
    }
    // Rule 3: Medium Value -> Waiting Approval
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
       // If successful, we can auto-approve it because the user just auth'd it
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

      <div className="flex-1 p-6 flex flex-col">
        {!analysis ? (
          <>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Get a refund from Amazon for order #123..."
                className="w-full h-32 bg-surfaceHighlight/50 border border-white/5 rounded-2xl p-4 text-lg outline-none resize-none placeholder:text-textMuted font-medium"
                autoFocus
              />
            </div>
            
            <div className="mt-4">
               <label className="text-xs font-semibold text-textMuted uppercase tracking-wider ml-1 mb-2 block">Quick Add</label>
               <div className="grid grid-cols-2 gap-3">
                 <button className="h-24 bg-surfaceHighlight/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-surfaceHighlight/50 transition-colors">
                    <ImageIcon className="text-primary" />
                    <span className="text-sm font-medium">Upload Image</span>
                 </button>
                 <button className="h-24 bg-surfaceHighlight/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-surfaceHighlight/50 transition-colors">
                    <Mic className="text-blue-400" />
                    <span className="text-sm font-medium">Voice Note</span>
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
          <Button onClick={handleAnalyze} fullWidth disabled={!input}>
            Create Task
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