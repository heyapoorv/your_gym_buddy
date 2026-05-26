import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`${sizes[size]} rounded-full border-t-primary border-r-primary border-b-primary/20 border-l-primary/20 animate-spin shadow-glow-primary`}
      ></div>
    </div>
  );
};

export const FullPageSpinner = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);
