import React from 'react';
import { cn } from '../../utils/cn';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  icon,
  isLoading,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded-lg overflow-hidden relative group";
  
  const variants = {
    primary: "bg-gradient-primary text-white border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:scale-[1.02]",
    secondary: "glass-card text-text-main hover:bg-white/5 hover:border-white/10 hover:scale-[1.02]",
    outline: "border border-border text-text-main hover:bg-white/5 hover:border-white/10 hover:scale-[1.02]",
    ghost: "text-text-secondary hover:text-text-main hover:bg-white/5 hover:scale-[1.02]",
    danger: "bg-error/20 text-error border border-error/30 hover:bg-error/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-[1.02]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading}
      {...props}
    >
      {/* Button Inner Glow */}
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      )}
      
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin text-[1.2em]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[1.2em]">{icon}</span>
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
