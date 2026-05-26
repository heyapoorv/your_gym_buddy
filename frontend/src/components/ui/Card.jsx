import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <div 
      className={cn(
        "glass-card p-6 rounded-2xl shadow-glass-layered transition-all duration-300 ease-out",
        hoverEffect && "hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.15)] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
