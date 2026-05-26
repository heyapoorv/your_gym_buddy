import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-white/10 text-text-main border border-white/20 backdrop-blur-md",
    success: "bg-success/20 text-success border border-success/30 shadow-[0_0_10px_rgba(34,197,94,0.3)] backdrop-blur-md",
    warning: "bg-warning/20 text-warning border border-warning/30 shadow-[0_0_10px_rgba(249,115,22,0.3)] backdrop-blur-md",
    danger: "bg-error/20 text-error border border-error/30 shadow-[0_0_10px_rgba(239,68,68,0.3)] backdrop-blur-md",
    primary: "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.3)] backdrop-blur-md"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
