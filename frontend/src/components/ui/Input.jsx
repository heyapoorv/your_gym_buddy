import React from 'react';
import { cn } from '../../utils/cn';

export const Input = ({ label, error, className, ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="font-semibold text-xs text-text-muted uppercase tracking-widest pl-1">
          {label}
        </label>
      )}
      <input 
        className={cn(
          "bg-white/5 border border-white/10 text-text-main text-sm rounded-xl px-4 py-3 w-full backdrop-blur-md",
          "placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white/10 transition-all duration-300 shadow-inner",
          error && "border-error focus:ring-error/50 focus:border-error bg-error/5",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-error pl-1 font-medium">{error}</span>}
    </div>
  );
};
