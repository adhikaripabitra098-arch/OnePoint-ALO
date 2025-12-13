import React from 'react';
import { LucideIcon, ChevronLeft } from 'lucide-react';

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
    primary: "bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.15)]", // High contrast
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

// --- Back Button (Revolut Style) ---
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
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({ label, leftIcon, rightIcon, onRightIconClick, className = '', ...props }) => {
  return (
    <div className="w-full group">
      {label && <label className="block text-xs font-semibold text-textMuted mb-2 ml-4 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-white transition-colors">
            {leftIcon}
          </div>
        )}
        <input 
          className={`w-full bg-white/[0.03] border border-white/10 text-white rounded-[24px] h-[64px] px-6 text-lg placeholder:text-textMuted/50 outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all duration-300 ${leftIcon ? 'pl-14' : ''} ${rightIcon ? 'pr-14' : ''} ${className}`}
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
    </div>
  );
};

// --- Screen Container ---
export const Screen: React.FC<{ children: React.ReactNode; className?: string; hidePadding?: boolean }> = ({ children, className = '', hidePadding = false }) => (
  <div className={`min-h-screen bg-[#050505] text-textMain overflow-hidden relative ${className}`}>
    {/* Global Background Gradient - Blue glow from top */}
    <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1E3A8A]/20 to-transparent blur-[80px] pointer-events-none z-0" />
    
    <div className={`max-w-md mx-auto min-h-screen relative flex flex-col z-10 ${hidePadding ? '' : 'px-6 pt-safe'}`}>
      {children}
    </div>
  </div>
);