import React, { useState, useEffect } from 'react';
import { Screen, Card, Button } from '../components/UI';
import { Task, TaskStatus, TaskType, TaskRoute, Suggestion } from '../types';
import { 
  Sparkles, Clock, AlertCircle, CheckCircle, Filter, Plus, 
  Bell, TrendingUp, Zap, Bot, User as UserIcon, ChevronRight, 
  MoreHorizontal, Play, Pause, DollarSign, Brain, Search, Briefcase,
  ChevronDown, ChevronUp, Terminal
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

const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const styles = {
    [TaskStatus.CREATED]: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    [TaskStatus.IN_PROGRESS]: "bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse",
    [TaskStatus.WAITING_APPROVAL]: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    [TaskStatus.COMPLETED]: "bg-green-500/20 text-green-300 border-green-500/30",
    [TaskStatus.REFUNDED]: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const RouteBadge: React.FC<{ route?: TaskRoute }> = ({ route }) => {
  if (!route) return null;
  const isAI = route === TaskRoute.AI_AUTOMATED;
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border ${isAI ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-orange-500/10 border-orange-500/20 text-orange-300'}`}>
      {isAI ? <Bot size={12} /> : <Briefcase size={12} />}
      <span>{isAI ? 'AI Agent' : 'Human Op'}</span>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative group cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      {/* Timeline Connector */}
      <div className="absolute left-[19px] top-[60px] bottom-[-20px] w-[2px] bg-white/5 group-last:hidden" />
      
      <Card className={`mb-4 !p-0 overflow-hidden active:scale-[0.99] transition-all duration-200 ${isExpanded ? 'ring-1 ring-white/20 bg-white/[0.08]' : ''}`} glassLevel="sm">
        <div className="p-4 flex gap-4">
          {/* Status Indicator Icon */}
          <div className="relative z-10 shrink-0">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center border bg-[#1A1A1A] ${task.status === TaskStatus.IN_PROGRESS ? 'border-accent shadow-[0_0_15px_rgba(59,130,246,0.3)] text-accent' : 'border-white/10 text-textMuted'}`}>
                {task.status === TaskStatus.COMPLETED ? <CheckCircle size={20} /> : 
                 task.status === TaskStatus.WAITING_APPROVAL ? <AlertCircle size={20} className="text-yellow-400" /> :
                 <Clock size={20} />}
             </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-[16px] text-white truncate pr-2">{task.title}</h4>
              <div className="flex items-center gap-2">
                <StatusBadge status={task.status} />
                {isExpanded ? <ChevronUp size={14} className="text-textMuted" /> : <ChevronDown size={14} className="text-textMuted" />}
              </div>
            </div>
            
            <p className="text-sm text-textMuted mb-3 line-clamp-2 font-medium">{task.description}</p>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <RouteBadge route={task.route} />
                <span className="text-[11px] text-textMuted border-l border-white/10 pl-2 font-medium">
                  Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}
                </span>
              </div>
              
              {task.estimatedCost > 0 && (
                <div className="text-xs font-mono text-white/90 bg-white/5 px-2 py-1 rounded border border-white/5">
                  ${task.estimatedCost}
                </div>
              )}
            </div>

            {/* Progress Bar for In-Progress */}
            {task.status === TaskStatus.IN_PROGRESS && task.progress !== undefined && (
              <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" 
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details - Simulated Agent Logs */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in">
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-green-400/80 space-y-1">
              <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-1 mb-1">
                <Terminal size={10} />
                <span>AGENT LOGS</span>
              </div>
              <p>> Initializing automated agent...</p>
              <p>> Context analyzed: {task.type}</p>
              {task.status === TaskStatus.COMPLETED && <p className="text-green-400">> Task successfully executed.</p>}
              {task.status === TaskStatus.IN_PROGRESS && <p className="animate-pulse">> Negotiating with vendor API...</p>}
              {task.status === TaskStatus.WAITING_APPROVAL && <p className="text-yellow-400">> Paused: Awaiting user signature.</p>}
            </div>
            <div className="flex gap-2 mt-3">
               <button className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors">View Details</button>
               {task.status !== TaskStatus.COMPLETED && (
                 <button className="flex-1 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors">Speed Up</button>
               )}
            </div>
          </div>
        )}
        
        {/* Footer Actions (Optional) */}
        {task.status === TaskStatus.WAITING_APPROVAL && !isExpanded && (
          <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20 flex items-center justify-between">
            <span className="text-xs text-yellow-200 font-medium">Approval Required</span>
            <button 
              onClick={(e) => { e.stopPropagation(); console.log('Review clicked'); }}
              className="text-xs font-bold bg-yellow-500 text-black px-3 py-1 rounded-full active:scale-95 transition-transform"
            >
              Review
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

const SuggestionCard: React.FC<{ suggestion: Suggestion; onClick: (s: Suggestion) => void }> = ({ suggestion, onClick }) => (
  <div 
    onClick={() => onClick(suggestion)}
    className="min-w-[260px] p-4 rounded-[22px] bg-white/[0.03] backdrop-blur-md border border-white/10 mr-3 relative overflow-hidden active:scale-95 transition-transform cursor-pointer group hover:bg-white/[0.06]"
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="bg-primary/20 p-1.5 rounded-lg">
        <Zap size={14} className="text-primary" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Suggestion</span>
    </div>
    <h3 className="font-bold text-sm mb-1 leading-tight group-hover:text-white transition-colors">{suggestion.title}</h3>
    <p className="text-xs text-textMuted mb-3 line-clamp-2 font-medium">{suggestion.description}</p>
    {suggestion.savings && (
      <div className="inline-flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded-full">
        <TrendingUp size={10} />
        Save ${suggestion.savings}
      </div>
    )}
  </div>
);

// --- Main Screen ---

export const HomeScreen: React.FC<HomeProps> = ({ tasks, balance, credits, userName, onNavigate, onCreateTask, onOpenAssistant }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'ACTION'>('ALL');
  const [greeting, setGreeting] = useState('');
  
  // Simulated Real-time Data
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set Greeting with comma
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning," : hour < 18 ? "Good Afternoon," : "Good Evening,");

    // Simulate Fetching Data (Supabase hook placeholder)
    setTimeout(() => {
      setSuggestions([
        { id: '1', title: 'Negotiate Internet Bill', description: 'Xfinity rates increased by 15%. AI can dispute this.', type: TaskType.NEGOTIATION, impact: 'HIGH', savings: 150 },
        { id: '2', title: 'Cancel Gym Membership', description: 'You haven\'t visited Planet Fitness in 2 months.', type: TaskType.GENERAL, impact: 'MEDIUM', savings: 240 },
        { id: '3', title: 'Schedule Dentist', description: 'It\'s been 6 months since your last cleaning.', type: TaskType.BOOKING, impact: 'LOW' }
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    // Instantly turn a suggestion into a task for the demo
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: suggestion.title,
      description: suggestion.description,
      status: TaskStatus.CREATED,
      type: suggestion.type,
      route: TaskRoute.AI_AUTOMATED,
      estimatedCost: 0,
      confidenceScore: 0.95,
      createdAt: new Date(),
    };
    onCreateTask(newTask);
    // Remove from suggestions to show "action taken"
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'ACTIVE') return t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.CREATED;
    if (activeTab === 'ACTION') return t.status === TaskStatus.WAITING_APPROVAL;
    return true;
  });

  const activeCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.CREATED).length;

  return (
    <Screen>
      {/* 1. Header & Notifications - INCREASED TOP MARGIN FOR CAMERA SAFETY */}
      <div className="flex justify-between items-center mt-28 mb-6 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{greeting}</h1>
          <h2 className="text-3xl font-bold text-white/40 tracking-tight mt-1">{userName}</h2>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative active:bg-white/10 transition-colors">
          <Bell size={18} className="text-white/80" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
        </button>
      </div>

      {/* 2. Mini-Dashboard Panel */}
      <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Wallet - Glass Effect - Click to Navigate */}
        <div 
          onClick={() => onNavigate('wallet')}
          className="col-span-1 p-4 rounded-[24px] bg-white/[0.03] backdrop-blur-md border border-white/10 flex flex-col justify-between h-[110px] cursor-pointer active:scale-95 transition-transform"
        >
           <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-textMuted">
             <DollarSign size={16} />
           </div>
           <div>
             <div className="text-[20px] font-bold tracking-tight text-white">${balance}</div>
             <div className="text-[10px] text-textMuted font-medium">Wallet</div>
           </div>
        </div>
        
        {/* AI Credits - Glass Effect - Click to Navigate (Top Up) */}
        <div 
          onClick={() => onNavigate('wallet')}
          className="col-span-1 p-4 rounded-[24px] bg-white/[0.03] backdrop-blur-md border border-white/10 flex flex-col justify-between h-[110px] cursor-pointer active:scale-95 transition-transform"
        >
           <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
             <Brain size={16} />
           </div>
           <div>
             <div className="text-[20px] font-bold tracking-tight text-white">{credits}</div>
             <div className="text-[10px] text-textMuted font-medium">AI Credits</div>
           </div>
        </div>

        {/* Active Tasks - White Solid Design - Click to Filter */}
        <div 
          onClick={() => setActiveTab('ACTIVE')}
          className="col-span-1 p-4 rounded-[24px] bg-white text-black flex flex-col justify-between h-[110px] shadow-glow cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        >
           <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/60">
             <Zap size={16} fill="currentColor" />
           </div>
           <div>
             <div className="text-[20px] font-bold tracking-tight">{activeCount}</div>
             <div className="text-[10px] font-medium opacity-60">Active Tasks</div>
           </div>
        </div>
      </div>

      {/* 3. AI Assistance / "What Should I Do?" */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <button 
          onClick={onOpenAssistant}
          className="w-full p-1 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10 flex items-center pr-2 shadow-lg group active:scale-[0.98] transition-all"
        >
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center mr-3 shadow-sm">
             <Sparkles size={20} className="text-black" />
          </div>
          <span className="text-sm text-textMuted group-hover:text-white transition-colors flex-1 text-left font-medium">
            Ask OnePoint to handle something...
          </span>
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
             <Search size={14} />
          </div>
        </button>
      </div>

      {/* 4. Suggested Automations */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-sm uppercase tracking-wider text-textMuted">Suggested for you</h3>
        </div>
        <div className="flex overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
          {isLoading ? (
             [1, 2].map(i => (
               <div key={i} className="min-w-[260px] h-[120px] rounded-[22px] bg-white/5 animate-pulse mr-3" />
             ))
          ) : (
             suggestions.map(s => <SuggestionCard key={s.id} suggestion={s} onClick={handleSuggestionClick} />)
          )}
        </div>
      </div>

      {/* 5. Real-Time Task Feed */}
      <div className="flex-1 pb-32 animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#050505]/90 backdrop-blur-md z-20 py-2">
           <h3 className="font-bold text-xl">Life Feed</h3>
           <div className="flex bg-white/5 rounded-full p-1">
             {(['ALL', 'ACTIVE', 'ACTION'] as const).map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-textMuted hover:text-white'}`}
               >
                 {tab}
               </button>
             ))}
           </div>
        </div>

        <div className="space-y-1">
           {filteredTasks.length === 0 ? (
             <div className="text-center py-10 text-textMuted text-sm font-medium">
               No tasks found in this category.
             </div>
           ) : (
             filteredTasks.map(task => <TaskCard key={task.id} task={task} />)
           )}
           
           {/* Mock "End of Feed" */}
           <div className="flex items-center justify-center py-6 opacity-30">
             <div className="w-1 h-1 bg-white rounded-full mx-1" />
             <div className="w-1 h-1 bg-white rounded-full mx-1" />
             <div className="w-1 h-1 bg-white rounded-full mx-1" />
           </div>
        </div>
      </div>
    </Screen>
  );
};