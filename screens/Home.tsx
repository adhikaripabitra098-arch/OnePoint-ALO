import React, { useState, useEffect, useMemo } from 'react';
import { Screen } from '../components/UI';
import { Task, TaskStatus, TaskType, Suggestion, PredictiveAlert, UserPreferences, NegotiationStyle } from '../types';
import { 
  Sparkles, Clock, AlertCircle, CheckCircle, Plus, 
  Bell, TrendingUp, Zap, Bot, Search,
  ArrowUpRight, Mic, Camera, X,
  Brain, ArrowRight, Briefcase
} from 'lucide-react';

interface HomeProps {
  tasks: Task[];
  balance: number;
  credits: number;
  userName: string;
  userPreferences: UserPreferences | null;
  onNavigate: (screen: string) => void;
  onCreateTask: (task: Task) => void;
  onOpenAssistant: (mode?: 'DEFAULT' | 'VOICE' | 'REFUND' | 'SCAN') => void;
  onUpdatePreferences: (prefs: UserPreferences) => void;
}

// --- SUB-COMPONENTS ---

const TimelineStep: React.FC<{ label: string; time: string; status: 'DONE' | 'CURRENT' | 'PENDING'; isLast?: boolean }> = ({ label, time, status, isLast }) => {
  const color = status === 'DONE' ? 'bg-green-500' : status === 'CURRENT' ? 'bg-blue-500' : 'bg-white/20';
  const textColor = status === 'PENDING' ? 'text-white/30' : 'text-white/90';
  
  return (
    <div className="flex gap-4 relative">
      {!isLast && (
        <div className={`absolute left-[5px] top-[20px] bottom-[-4px] w-[2px] ${status === 'DONE' ? 'bg-green-500/30' : 'bg-white/10'}`} />
      )}
      <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${color} ${status === 'CURRENT' ? 'animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]' : ''}`} />
      <div className="pb-6">
        <p className={`text-sm font-medium leading-none mb-1 ${textColor}`}>{label}</p>
        <p className="text-[10px] text-textMuted font-mono">{time}</p>
      </div>
    </div>
  );
};

const TaskListItem: React.FC<{ task: Task }> = ({ task }) => {
  const [expanded, setExpanded] = useState(false);

  // Status Colors & Icons
  const statusConfig = {
    [TaskStatus.CREATED]: { color: 'bg-gray-500', icon: Clock, label: 'Created' },
    [TaskStatus.IN_PROGRESS]: { color: 'bg-blue-500', icon: Zap, label: 'Processing' },
    [TaskStatus.WAITING_APPROVAL]: { color: 'bg-yellow-500', icon: AlertCircle, label: 'Approval' },
    [TaskStatus.COMPLETED]: { color: 'bg-green-500', icon: CheckCircle, label: 'Done' },
    [TaskStatus.REFUNDED]: { color: 'bg-purple-500', icon: ArrowUpRight, label: 'Refunded' },
    [TaskStatus.FAILED]: { color: 'bg-red-500', icon: X, label: 'Failed' },
  };

  const config = statusConfig[task.status] || statusConfig[TaskStatus.CREATED];
  const StatusIcon = config.icon;

  // Exact Match: Create Account Page Card Style
  // bg-white/[0.03] border-white/10
  const cardStyle = "bg-white/[0.03] border-white/10";

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className={`group relative ${cardStyle} border-b hover:bg-white/[0.06] transition-colors duration-200 first:rounded-t-[28px] last:rounded-b-[28px] last:border-b-0 p-5 cursor-pointer overflow-hidden backdrop-blur-sm`}
    >
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center text-white/50 font-bold text-lg shadow-inner">
             {task.vendor ? task.vendor[0].toUpperCase() : task.title[0].toUpperCase()}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-[#151515] flex items-center justify-center ${config.color}`}>
             <StatusIcon size={12} className="text-white" strokeWidth={3} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-semibold text-[16px] text-white truncate leading-tight tracking-tight">{task.title}</h4>
            {task.estimatedCost > 0 && (
              <span className="text-sm font-mono whitespace-nowrap ml-2 font-bold tracking-tight">
                ${task.estimatedCost}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-textMuted truncate pr-4 leading-snug">{task.description}</p>
            <span className="text-[11px] text-white/30 font-semibold tracking-wide uppercase">
               {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Today'}
            </span>
          </div>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${expanded ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
        <div className="overflow-hidden min-h-0">
           <div className="p-5 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
             <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-textMuted flex items-center gap-2">
                  <Bot size={12} /> Agent Log
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                    task.status === TaskStatus.COMPLETED ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse' : 
                    'bg-white/5 border-white/10 text-white/50'
                }`}>
                    {task.status.replace('_', ' ')}
                </span>
             </div>
             
             <div className="pl-1">
                <TimelineStep 
                  label="Task Analyzed & Created" 
                  time={new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  status="DONE" 
                />
                <TimelineStep 
                  label={`Vendor Identified: ${task.vendor || 'AI Processing...'}`} 
                  time="Auto" 
                  status={task.vendor ? "DONE" : "PENDING"} 
                />
                
                {task.status === TaskStatus.IN_PROGRESS && (
                   <TimelineStep label="Negotiating with Vendor..." time="Just now" status="CURRENT" isLast />
                )}
             </div>

             <div className="flex gap-3 pt-2 mt-4 border-t border-white/5">
                <button className="flex-1 h-10 rounded-xl bg-white/5 text-xs font-bold text-white uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/5">
                  View Details
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Home Screen ---

export const HomeScreen: React.FC<HomeProps> = ({ tasks, balance, credits, userName, userPreferences, onNavigate, onCreateTask, onOpenAssistant, onUpdatePreferences }) => {
  const [greeting, setGreeting] = useState('');
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search Bar Dynamic Placeholder State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  
  // Infinite Suggestions Pool
  const placeholders = useMemo(() => [
    "Ask OnePoint to negotiate internet bill...",
    "Scan a receipt for expenses...",
    "Find a refund for my Uber ride...",
    "Book a table for two tonight...",
    "Cancel my gym subscription...",
    "Dispute a charge on my card...",
    "Schedule a dentist appointment...",
    "Compare flight prices to London...",
    "Track my Amazon package...",
    "Renew my car insurance...",
    "Lower my phone bill...",
    "Find a plumber nearby..."
  ], []);

  // Common Card Style from Auth Page
  const commonCardStyle = "bg-white/[0.03] border border-white/10";

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening");
  }, []);

  // Smoother, Slower Animation Logic
  useEffect(() => {
    const interval = setInterval(() => {
      // Slow Fade out (1s)
      setFadeOpacity(0);
      
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        // Slow Fade in (1s)
        setFadeOpacity(1);
      }, 800); // Wait for fade out almost complete
      
    }, 5000); // 5 seconds readable time

    return () => clearInterval(interval);
  }, [placeholders]);

  useEffect(() => {
     const newAlerts: PredictiveAlert[] = [];
     const newSuggestions: Suggestion[] = [];

     const approvalTasks = tasks.filter(t => t.status === TaskStatus.WAITING_APPROVAL);
     if (approvalTasks.length > 0) {
        newAlerts.push({
           id: 'alert-approval',
           title: 'Approval Required',
           message: `${approvalTasks.length} high-value transaction${approvalTasks.length > 1 ? 's' : ''} paused.`,
           type: 'WARNING',
           date: new Date(),
           actionLabel: 'Review'
        });
     }
     if (balance < 50 && balance > 0) {
        newAlerts.push({
           id: 'alert-balance',
           title: 'Low Balance',
           message: 'Wallet balance low. Auto-payments may fail.',
           type: 'INFO',
           date: new Date(),
           actionLabel: 'Top Up'
        });
     }
     if (tasks.length === 0) {
        newSuggestions.push({
            id: 'sug-onboard-2',
            title: 'Lower Your Bills',
            description: 'Negotiate subscriptions automatically.',
            type: TaskType.NEGOTIATION,
            impact: 'HIGH',
            savings: 120
         });
     }

     setAlerts(newAlerts);
     setSuggestions(newSuggestions);
  }, [tasks, balance]); 

  // Direct Navigation Handlers
  const handleQuickAction = (action: string) => {
    switch(action) {
       case 'NEW':
          // Keep as modal for generic new task
          onOpenAssistant('DEFAULT');
          break;
       case 'REFUND':
          onNavigate('refund');
          break;
       case 'VOICE':
          onNavigate('voice');
          break;
       case 'SCAN':
          onNavigate('scan');
          break;
       default:
          onOpenAssistant('DEFAULT');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Intelligent Font Scaling for Username
  const getNameSize = (name: string) => {
    // UPDATED: Larger baseline sizes
    if (name.length > 20) return 'text-xl';
    if (name.length > 15) return 'text-2xl';
    if (name.length > 10) return 'text-3xl';
    return 'text-4xl'; // Standard short names are now 4xl
  };

  return (
    <Screen hidePadding>
      {/* 1. Header Layout */}
      <div className="flex flex-col px-6 mt-16 mb-6 animate-slide-up relative z-20">
        
        {/* TOP LINE: Greeting (White) */}
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{greeting},</h1>
        
        {/* SECOND LINE: Username (Transparent) + Notification (Right aligned) */}
        <div className="flex items-center justify-between w-full min-w-0">
            {/* Name flipped transparency, No Dots, Dynamic Scale */}
            <h2 className={`${getNameSize(userName)} font-bold text-white/50 tracking-tight leading-tight whitespace-nowrap overflow-visible min-w-0 flex-1 pr-4`}>
              {userName}
            </h2>

            <div className="flex items-center gap-3 shrink-0">
                <button 
                    onClick={() => onOpenAssistant()} 
                    className="w-10 h-10 rounded-full bg-[#0A0A0A] border border-white/20 flex items-center justify-center relative active:bg-white/10 transition-colors backdrop-blur-md shadow-lg"
                >
                    <Bell size={18} className="text-white/80" />
                    {alerts.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-black shadow-glow"></span>}
                </button>
            </div>
        </div>
      </div>

      {/* 2. Semantic Search Bar with Fading Suggestions - MATCHES AUTH INPUT STYLE */}
      <div className="px-6 mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative group">
           <Sparkles size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-white transition-colors z-10" />
           <div className="relative w-full h-14">
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className={`w-full h-full ${commonCardStyle} rounded-[22px] pl-12 pr-6 text-base font-medium text-white focus:bg-white/[0.08] outline-none transition-all shadow-lg absolute inset-0 z-0`}
               />
               {/* Animated Placeholder Overlay */}
               {!searchQuery && (
                  <span 
                    className="absolute left-12 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none transition-opacity duration-700 ease-in-out font-medium truncate right-6"
                    style={{ opacity: fadeOpacity }}
                  >
                    {placeholders[placeholderIndex]}
                  </span>
               )}
           </div>
           
           {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-textMuted hover:text-white z-10">
                  <X size={16} />
              </button>
           )}
        </div>
      </div>

      <div className="px-5 pb-36 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        
        {/* 3. Mini Dashboard / Metrics */}
        <div className="grid grid-cols-2 gap-4">
           {/* Wallet Card - Matches Auth Input Style */}
           <div 
             onClick={() => onNavigate('wallet')}
             className={`col-span-1 ${commonCardStyle} rounded-[28px] p-6 relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer aspect-square flex flex-col justify-between group shadow-xl`}
           >
              {/* Dollar Sign Layout - FLIPPED TRANSPARENCY */}
              <div className="flex items-center gap-1">
                 <span className="text-[12px] font-bold text-white/40">$</span>
                 <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Balance</p>
              </div>
              <div className="relative z-10">
                <div className="flex items-start gap-0.5 mt-2">
                    {/* Dollar Sign: Opaque & Bold */}
                    <span className="text-2xl font-bold text-white mt-1">$</span>
                    {/* Amount: Transparent & Medium Weight */}
                    <h2 className="text-4xl font-medium text-white/60 tracking-tight">{balance.toLocaleString()}</h2>
                </div>
                <div className="mt-2 px-2.5 py-1 bg-green-500/10 rounded-full text-[10px] font-bold text-green-400 inline-flex items-center gap-1 w-auto border border-green-500/20">
                   <TrendingUp size={10} /> +2.4%
                </div>
              </div>
           </div>

           {/* Credits / Status Card - KEPT WHITE (Special) */}
           <div className="col-span-1 bg-white text-black border border-white/20 rounded-[28px] p-6 relative overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.05)] active:scale-[0.98] transition-transform cursor-pointer aspect-square flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-5 opacity-10">
                 <Zap size={48} className="text-black" />
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black">
                   <Brain size={16} />
                 </div>
                 <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Auto Credits</p>
              </div>
              <div>
                 <h2 className="text-3xl font-bold text-black tracking-tight mb-1">{credits}</h2>
                 <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-black/60 bg-black/5 px-2 py-1 rounded-md border border-black/5">
                       {tasks.filter(t => t.status === TaskStatus.COMPLETED).length} Done
                    </span>
                 </div>
              </div>
           </div>
        </div>

        {/* 4. Predictive Alerts - Matches Auth Input Style */}
        {alerts.length > 0 && (
           <div className="overflow-visible">
             <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} /> Insights
                </h3>
             </div>
             <div className="flex overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar gap-4 snap-x snap-mandatory">
                {alerts.map(alert => (
                   <div key={alert.id} className={`min-w-[280px] p-5 ${commonCardStyle} rounded-[26px] relative overflow-hidden group snap-center shadow-xl`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alert.type === 'WARNING' ? 'bg-red-500' : 'bg-accent'}`} />
                      <div className="flex justify-between items-start mb-2 pl-2">
                         <h4 className="font-bold text-white text-lg tracking-tight">{alert.title}</h4>
                         <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider bg-white/5 px-2 py-1 rounded">{alert.date.toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-textMuted pl-2 mb-4 leading-relaxed font-medium">{alert.message}</p>
                      {alert.actionLabel && (
                         <button 
                           onClick={() => onOpenAssistant()}
                           className="ml-2 text-xs font-bold text-white bg-white/10 px-4 py-2.5 rounded-full hover:bg-white/20 transition-colors flex items-center gap-2"
                         >
                           {alert.actionLabel} <ArrowRight size={12} />
                         </button>
                      )}
                   </div>
                ))}
             </div>
           </div>
        )}

        {/* 5. Quick Actions Grid */}
        <div>
           <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest">Quick Actions</h3>
           </div>
           <div className="grid grid-cols-4 gap-4">
              {[
                // New Box: WHITE (Same as Auto Credits - Distinct)
                { label: 'New', icon: Plus, action: 'NEW', color: 'bg-white text-black hover:bg-gray-200 shadow-glow' },
                // Others: Match Auth Input Style (Glass)
                { label: 'Refund', icon: ArrowUpRight, action: 'REFUND', color: `${commonCardStyle} text-white hover:bg-white/10` },
                { label: 'Scan', icon: Camera, action: 'SCAN', color: `${commonCardStyle} text-white hover:bg-white/10` },
                { label: 'Voice', icon: Mic, action: 'VOICE', color: `${commonCardStyle} text-white hover:bg-white/10` },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                   <button 
                     onClick={() => handleQuickAction(item.action)}
                     className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg active:scale-90 transition-all duration-300 ${item.color}`}
                   >
                      <item.icon size={26} strokeWidth={2.5} />
                   </button>
                   <span className="text-[11px] font-semibold text-textMuted/80 tracking-wide">{item.label}</span>
                </div>
              ))}
           </div>
        </div>

        {/* 6. AI Suggestions - Matches Auth Input Style */}
        {suggestions.length > 0 && (
           <div>
             <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest">Recommended</h3>
             </div>
             <div className="flex flex-col gap-3">
                {suggestions.slice(0, 2).map(s => (
                   <div key={s.id} onClick={() => onOpenAssistant()} className={`flex items-center justify-between p-5 rounded-[26px] ${commonCardStyle} active:scale-[0.99] transition-transform cursor-pointer shadow-xl hover:bg-white/5`}>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                            <Sparkles size={20} />
                         </div>
                         <div>
                            <h4 className="font-bold text-base text-white mb-0.5 tracking-tight">{s.title}</h4>
                            <p className="text-xs text-textMuted font-medium">{s.description}</p>
                         </div>
                      </div>
                      {s.savings ? (
                         <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg whitespace-nowrap border border-green-500/20">
                            +${s.savings}
                         </span>
                      ) : (
                         <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                            <ArrowRight size={14} />
                         </div>
                      )}
                   </div>
                ))}
             </div>
           </div>
        )}

        {/* 7. Real-Time Task Feed - Matches Auth Input Style */}
        <div>
           <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest">Recent Activity</h3>
              <button className="text-[10px] font-bold text-accent hover:text-white transition-colors uppercase tracking-wider">View All</button>
           </div>
           
           <div className={`${commonCardStyle} rounded-[32px] overflow-hidden shadow-xl`}>
             <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-textMuted">Timeline</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
             </div>
             
             {filteredTasks.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                     <Briefcase size={24} className="text-white/30" />
                   </div>
                   <div>
                       <p className="text-white font-bold text-lg">All Caught Up</p>
                       <p className="text-textMuted text-sm font-medium mt-1">OnePoint is standing by for tasks.</p>
                   </div>
                   <button onClick={() => onOpenAssistant()} className="px-6 py-2 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                      Create Task
                   </button>
                </div>
             ) : (
                <div className="divide-y divide-white/5">
                    {filteredTasks.map(task => (
                        <TaskListItem key={task.id} task={task} />
                    ))}
                </div>
             )}
           </div>
        </div>

      </div>
    </Screen>
  );
};