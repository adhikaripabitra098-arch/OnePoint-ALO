import React, { useState, useEffect } from 'react';
import { Screen, Card } from '../components/UI';
import { Task, TaskStatus, TaskType, Suggestion, PredictiveAlert, NegotiationStyle } from '../types';
import { 
  Sparkles, Clock, AlertCircle, CheckCircle, Plus, 
  Bell, TrendingUp, Zap, Bot, Search,
  Wallet, ArrowUpRight, Mic, Camera, X,
  DollarSign, Brain, Check, Circle, ShieldAlert
} from 'lucide-react';

interface HomeProps {
  tasks: Task[];
  balance: number;
  credits: number;
  userName: string;
  onNavigate: (screen: string) => void;
  onCreateTask: (task: Task) => void;
  onOpenAssistant: () => void;
}

// --- Components ---

// Production-Ready Timeline Component
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
    [TaskStatus.IN_PROGRESS]: { color: 'bg-blue-500', icon: Zap, label: 'Running' },
    [TaskStatus.WAITING_APPROVAL]: { color: 'bg-yellow-500', icon: AlertCircle, label: 'Approval' },
    [TaskStatus.COMPLETED]: { color: 'bg-green-500', icon: CheckCircle, label: 'Done' },
    [TaskStatus.REFUNDED]: { color: 'bg-purple-500', icon: ArrowUpRight, label: 'Refunded' },
    [TaskStatus.FAILED]: { color: 'bg-red-500', icon: X, label: 'Failed' },
  };

  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className="group relative bg-[#0A0A0A] border-b border-white/5 hover:bg-[#111] active:bg-[#151515] transition-colors duration-200 first:rounded-t-[24px] last:rounded-b-[24px] last:border-b-0 p-5 cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-5">
        {/* Vendor Logo / Icon Placeholder */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white/50 font-bold text-base">
             {task.vendor ? task.vendor[0].toUpperCase() : task.title[0]}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-[#0A0A0A] flex items-center justify-center ${config.color}`}>
             <StatusIcon size={12} className="text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-semibold text-[16px] text-white truncate leading-tight">{task.title}</h4>
            <span className="text-sm text-textMuted font-mono whitespace-nowrap ml-2">
              {task.estimatedCost > 0 ? `$${task.estimatedCost}` : ''}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-textMuted truncate pr-4 leading-snug">{task.description}</p>
            <span className="text-[11px] text-white/40 font-medium">
               {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Today'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Details - Production Style Timeline */}
      <div className={`grid transition-all duration-300 ease-out ${expanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
        <div className="overflow-hidden min-h-0">
           <div className="p-5 bg-black/40 rounded-2xl border border-white/10">
             
             {/* Dynamic Status Label */}
             <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted flex items-center gap-2">
                  <Bot size={12} /> Agent Activity
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    task.status === TaskStatus.COMPLETED ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse' : 
                    'bg-white/5 border-white/10 text-white/50'
                }`}>
                    {task.status.replace('_', ' ')}
                </span>
             </div>
             
             {/* Visual Timeline (Replacing Text Logs) */}
             <div className="pl-1">
                <TimelineStep 
                  label="Task Analyzed & Created" 
                  time={new Date(task.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  status="DONE" 
                />
                <TimelineStep 
                  label={`Vendor Identified: ${task.vendor || 'Processing...'}`} 
                  time="Auto" 
                  status={task.vendor ? "DONE" : "PENDING"} 
                />
                
                {task.status === TaskStatus.IN_PROGRESS && (
                   <TimelineStep label="Negotiating with Vendor..." time="Just now" status="CURRENT" isLast />
                )}
                
                {task.status === TaskStatus.WAITING_APPROVAL && (
                   <TimelineStep label="Waiting for your approval" time="Action Required" status="CURRENT" isLast />
                )}
                
                {task.status === TaskStatus.COMPLETED && (
                   <>
                     <TimelineStep label="Task Successfully Executed" time="Completed" status="DONE" isLast />
                   </>
                )}
                
                {task.status === TaskStatus.CREATED && (
                    <TimelineStep label="Connecting to API..." time="Pending" status="PENDING" isLast />
                )}
             </div>

             <div className="flex gap-3 pt-2 mt-2 border-t border-white/5">
                <button className="flex-1 h-10 rounded-xl bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                  View Full Details
                </button>
                {task.status === TaskStatus.WAITING_APPROVAL && (
                   <button className="flex-1 h-10 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors">
                     Approve
                   </button>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Home Screen ---

export const HomeScreen: React.FC<HomeProps> = ({ tasks, balance, credits, userName, onNavigate, onCreateTask, onOpenAssistant }) => {
  const [greeting, setGreeting] = useState('');
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. Dynamic Greeting
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning," : hour < 18 ? "Good Afternoon," : "Good Evening,");
  }, []);

  // 2. Real-Time Logic Engine (No Fakes)
  useEffect(() => {
     // Generate Alerts based on REAL task status
     const newAlerts: PredictiveAlert[] = [];
     const newSuggestions: Suggestion[] = [];

     // Logic: Find tasks waiting for approval
     const approvalTasks = tasks.filter(t => t.status === TaskStatus.WAITING_APPROVAL);
     if (approvalTasks.length > 0) {
        newAlerts.push({
           id: 'alert-approval',
           title: 'Approvals Needed',
           message: `${approvalTasks.length} high-value transaction${approvalTasks.length > 1 ? 's' : ''} require authorization.`,
           type: 'WARNING',
           date: new Date(),
           actionLabel: 'Review'
        });
     }

     // Logic: Find failed tasks
     const failedTasks = tasks.filter(t => t.status === TaskStatus.FAILED);
     if (failedTasks.length > 0) {
        newAlerts.push({
           id: 'alert-failed',
           title: 'Task Failed',
           message: `${failedTasks[0].title} could not be completed.`,
           type: 'INFO',
           date: new Date(),
           actionLabel: 'Retry'
        });
     }

     // Logic: Balance Warning
     if (balance < 50 && balance > 0) {
        newAlerts.push({
           id: 'alert-balance',
           title: 'Low Balance',
           message: 'Your wallet balance is running low.',
           type: 'INFO',
           date: new Date(),
           actionLabel: 'Top Up'
        });
     }

     // Logic: Suggestion Engine (Simple Heuristics)
     // If user has no tasks, suggest getting started
     if (tasks.length === 0) {
        newSuggestions.push({
           id: 'sug-onboard-1',
           title: 'Scan a Receipt',
           description: 'Upload a bill to find potential savings.',
           type: TaskType.GENERAL,
           impact: 'MEDIUM'
        });
        newSuggestions.push({
            id: 'sug-onboard-2',
            title: 'Negotiate a Bill',
            description: 'OnePoint can lower your monthly subscriptions.',
            type: TaskType.NEGOTIATION,
            impact: 'HIGH',
            savings: 120
         });
     } else {
        // If user has tasks, maybe suggest clearing history or analysis
        if (tasks.length > 5) {
            newSuggestions.push({
                id: 'sug-clean',
                title: 'Archive Old Tasks',
                description: 'Keep your dashboard clean.',
                type: TaskType.GENERAL,
                impact: 'LOW'
            });
        }
     }

     setAlerts(newAlerts);
     setSuggestions(newSuggestions);

  }, [tasks, balance]); // Re-run whenever tasks or balance changes

  const handleQuickAction = (action: string) => {
    // Pass context to assistant opening
    if (action === 'REFUND') {
       onOpenAssistant();
    } else if (action === 'VOICE') {
       onOpenAssistant();
    } else if (action === 'SCAN') {
       onOpenAssistant();
    } else {
       onOpenAssistant();
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Screen hidePadding>
      {/* 1. Header (Preserved) */}
      <div className="flex justify-between items-center px-6 mt-24 mb-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{greeting}</h1>
          <h2 className="text-3xl font-bold text-white/40 tracking-tight mt-1">{userName}</h2>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative active:bg-white/10 transition-colors">
          <Bell size={18} className="text-white/80" />
          {alerts.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-black"></span>}
        </button>
      </div>

      {/* Semantic Search Bar */}
      <div className="px-6 mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative group">
           <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-white transition-colors" />
           <input 
             type="text" 
             placeholder="Search transactions, tasks, or ask AI..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full h-14 bg-[#0A0A0A] border border-white/20 rounded-full pl-12 pr-6 text-base font-medium text-white placeholder:text-textMuted focus:bg-[#111] outline-none focus:border-white/30 transition-all"
           />
        </div>
      </div>

      <div className="px-5 pb-36 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        
        {/* 2. Main Status Dashboard */}
        <div className="grid grid-cols-2 gap-4">
           {/* Wallet */}
           <div 
             onClick={() => onNavigate('wallet')}
             className="col-span-1 bg-[#0A0A0A] border border-white/20 rounded-[28px] p-6 relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer aspect-square flex flex-col justify-between"
           >
              <div className="absolute top-0 right-0 p-5 opacity-5">
                 <Wallet size={48} className="text-white" />
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-textMuted">
                   <DollarSign size={16} />
                 </div>
                 <p className="text-xs font-bold text-textMuted uppercase tracking-wider">Wallet</p>
              </div>
              <div>
                <div className="flex items-start gap-0.5 mt-2">
                    <span className="text-2xl font-bold text-white/50 mt-1">$</span>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">{balance.toLocaleString()}</h2>
                </div>
                <div className="mt-2 px-2.5 py-1 bg-green-500/10 rounded-full text-[10px] font-bold text-green-400 inline-flex items-center gap-1 w-auto">
                   <TrendingUp size={10} /> +2.4%
                </div>
              </div>
           </div>

           {/* AI Credits */}
           <div className="col-span-1 bg-white text-black border border-white/20 rounded-[28px] p-6 relative overflow-hidden shadow-glow active:scale-[0.98] transition-transform cursor-pointer aspect-square flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-5 opacity-10">
                 <Zap size={48} className="text-black" />
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black">
                   <Brain size={16} />
                 </div>
                 <p className="text-xs font-bold text-black/60 uppercase tracking-wider">Credits</p>
              </div>
              <div>
                 <h2 className="text-3xl font-bold text-black tracking-tight mb-1">{credits}</h2>
                 <span className="text-[10px] font-bold text-black/60 bg-black/5 px-2 py-1 rounded-md">
                   {tasks.filter(t => t.status === TaskStatus.COMPLETED).length} tasks done
                 </span>
              </div>
           </div>
        </div>

        {/* 3. Predictive Alerts - DYNAMIC NOW */}
        {alerts.length > 0 && (
           <div>
             <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider">Insights</h3>
             </div>
             <div className="flex overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar gap-4">
                {alerts.map(alert => (
                   <div key={alert.id} className="min-w-[300px] p-5 bg-[#0A0A0A] border border-white/20 rounded-[26px] relative overflow-hidden group">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alert.type === 'WARNING' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div className="flex justify-between items-start mb-2 pl-2">
                         <h4 className="font-bold text-white text-lg">{alert.title}</h4>
                         <span className="text-xs text-textMuted">{alert.date.toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-textMuted pl-2 mb-4 leading-relaxed">{alert.message}</p>
                      {alert.actionLabel && (
                         <button 
                           onClick={() => onOpenAssistant()}
                           className="ml-2 text-xs font-bold text-white bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
                         >
                           {alert.actionLabel}
                         </button>
                      )}
                   </div>
                ))}
             </div>
           </div>
        )}

        {/* 4. Quick Actions */}
        <div>
           <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider">Quick Actions</h3>
           </div>
           <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'New', icon: Plus, action: 'NEW', color: 'bg-white text-black' },
                { label: 'Refund', icon: ArrowUpRight, action: 'REFUND', color: 'bg-[#0A0A0A] text-white border border-white/20' },
                { label: 'Scan', icon: Camera, action: 'SCAN', color: 'bg-[#0A0A0A] text-white border border-white/20' },
                { label: 'Voice', icon: Mic, action: 'VOICE', color: 'bg-[#0A0A0A] text-white border border-white/20' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                   <button 
                     onClick={() => handleQuickAction(item.action)}
                     className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg active:scale-90 transition-all duration-300 ${item.color}`}
                   >
                      <item.icon size={28} strokeWidth={2.5} />
                   </button>
                   <span className="text-xs font-medium text-textMuted">{item.label}</span>
                </div>
              ))}
           </div>
        </div>

        {/* 5. Suggestions - DYNAMIC */}
        {suggestions.length > 0 && (
           <div>
             <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider">Recommended</h3>
             </div>
             <div className="flex flex-col gap-3">
                {suggestions.slice(0, 2).map(s => (
                   <div key={s.id} onClick={() => onOpenAssistant()} className="flex items-center justify-between p-5 rounded-[24px] bg-[#0A0A0A] border border-white/20 active:scale-[0.99] transition-transform cursor-pointer">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <Sparkles size={20} />
                         </div>
                         <div>
                            <h4 className="font-bold text-base text-white mb-0.5">{s.title}</h4>
                            <p className="text-sm text-textMuted">{s.description}</p>
                         </div>
                      </div>
                      {s.savings && (
                         <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                            Est. Save ${s.savings}
                         </span>
                      )}
                   </div>
                ))}
             </div>
           </div>
        )}

        {/* 6. Task Feed */}
        <div>
           <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider">Recent Activity</h3>
              <button className="text-xs font-bold text-accent hover:text-white transition-colors">See All</button>
           </div>
           
           <div className="bg-[#0A0A0A] rounded-[28px] overflow-hidden border border-white/20 shadow-xl">
             <div className="px-5 py-3 bg-[#111] border-b border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted">Today</span>
             </div>
             
             {filteredTasks.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                   <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                     <Check size={20} className="text-white/30" />
                   </div>
                   <p className="text-textMuted text-sm font-medium">All caught up! No tasks for today.</p>
                </div>
             ) : (
                filteredTasks.map(task => (
                   <TaskListItem key={task.id} task={task} />
                ))
             )}
           </div>
        </div>

      </div>
    </Screen>
  );
};