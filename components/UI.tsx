import React from 'react';
import { LucideIcon, ChevronLeft, X, AlertCircle, CheckCircle } from 'lucide-react';

// --- Global Alert Modal (No more window.alert) ---
interface AlertProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

export const CustomAlertModal: React.FC<AlertProps> = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;
  
  const colors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  };
  
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : AlertCircle;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="w-full max-w-xs bg-[#121212] border border-white/10 rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colors[type]}`}>
             <Icon size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-textMuted text-sm font-medium leading-relaxed mb-6">
             {message}
          </p>
          <button 
             onClick={onClose}
             className="w-full h-12 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
          >
             Okay
          </button>
       </div>
    </div>
  );
};

// --- Card ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glassLevel?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, className = '', glassLevel = 'md', ...props }) => {
  const glassStyles = {
    sm: "bg-white/[0.02] backdrop-blur-md border-white/5",
    md: "bg-white/[0.05] backdrop-blur-xl border-white/[0.08]",
    lg: "bg-white/[0.08] backdrop-blur-2xl border-white/[0.12]",
  };

  return (
    <div 
      className={`rounded-[26px] border ${glassStyles[glassLevel]} p-6 shadow-glass ${className} ${props.onClick ? 'cursor-pointer active:scale-[0.98] transition-transform duration-200 ease-out' : ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
  fullWidth?: boolean;
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  icon: Icon, 
  ...props 
}) => {
  const baseStyles = "h-[56px] rounded-full font-bold text-[16px] flex items-center justify-center transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 tracking-wide";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.15)]", 
    secondary: "bg-[#252525] text-white hover:bg-[#333]",
    glass: "bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20",
    ghost: "bg-transparent text-textMuted hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} 
      {...props}
    >
      {children}
      {Icon && <Icon className="ml-2 w-5 h-5" strokeWidth={2.5} />}
    </button>
  );
};

// --- Back Button ---
export const BackButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = '' }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1 py-2 pr-4 rounded-full active:bg-white/10 transition-colors z-50 ${className}`}
  >
    <ChevronLeft size={28} className="text-white" strokeWidth={2} />
    <span className="text-[17px] font-semibold text-white tracking-wide">Back</span>
  </button>
);

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({ leftIcon, rightIcon, onRightIconClick, className = '', ...props }) => {
  return (
    <div className="w-full relative group">
      {leftIcon && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-white transition-colors">
          {leftIcon}
        </div>
      )}
      <input 
        className={`
          w-full bg-white/[0.03] border border-white/10 rounded-[24px] h-[64px] px-6 text-lg placeholder:text-textMuted/50 outline-none text-white focus:bg-white/[0.08] focus:border-white/20 transition-all duration-300
          ${leftIcon ? 'pl-14' : ''} 
          ${rightIcon ? 'pr-14' : ''} 
          ${className}
        `}
        {...props}
      />
      {rightIcon && (
        <div 
          onClick={onRightIconClick}
          className={`absolute right-5 top-1/2 -translate-y-1/2 text-textMuted hover:text-white transition-colors ${onRightIconClick ? 'cursor-pointer' : ''}`}
        >
          {rightIcon}
        </div>
      )}
    </div>
  );
};

// --- Screen Container ---
export const Screen: React.FC<{ children: React.ReactNode; className?: string; hidePadding?: boolean }> = ({ children, className = '', hidePadding = false }) => (
  <div className={`min-h-screen text-textMain overflow-hidden relative ${className}`}>
    <div className={`max-w-md mx-auto min-h-screen relative flex flex-col z-10 ${hidePadding ? '' : 'px-6 pt-12'}`}>
      {children}
    </div>
  </div>
);
