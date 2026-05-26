import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Button } from '../components/ui/Button';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

const TOUR_STEPS = [
  { id: 'dashboard', title: 'Dashboard Metrics', content: 'Track your total revenue, active members, and attendance at a glance.' },
  { id: 'members', title: 'Member Management', content: 'Add new members, update their status, and assign them to trainers.' },
  { id: 'financials', title: 'Payments & Plans', content: 'Create membership plans and record payments to calculate revenue.' },
  { id: 'crm', title: 'CRM & Leads', content: 'Track your prospective members through a drag-and-drop sales pipeline.' },
];

export const TourProvider = ({ children }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Only run tour if gym owner, has completed onboarding, and hasn't seen tour
    if (user?.role === 'gym_owner' && user?.gymOnboardingComplete) {
      const hasSeen = localStorage.getItem('gymos_tour_completed');
      if (!hasSeen) {
        setIsActive(true);
      }
    }
  }, [user]);

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(s => s + 1);
    } else {
      dismissTour();
    }
  };

  const dismissTour = () => {
    setIsActive(false);
    localStorage.setItem('gymos_tour_completed', 'true');
  };

  return (
    <TourContext.Provider value={{ isActive, currentStepId: TOUR_STEPS[currentStepIndex]?.id }}>
      {children}
      
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[200] w-80 bg-surface border border-primary/30 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] shadow-primary/10"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">
                Product Tour {currentStepIndex + 1}/{TOUR_STEPS.length}
              </span>
              <button onClick={dismissTour} className="text-text-muted hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">{TOUR_STEPS[currentStepIndex].title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              {TOUR_STEPS[currentStepIndex].content}
            </p>
            <div className="flex justify-between items-center">
              <button onClick={dismissTour} className="text-xs text-text-muted hover:text-white transition-colors uppercase font-bold tracking-widest">
                Skip Tour
              </button>
              <Button onClick={nextStep}>
                {currentStepIndex < TOUR_STEPS.length - 1 ? 'Next Tip' : 'Finish'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
};

export const TourTarget = ({ id, children }) => {
  const { isActive, currentStepId } = useTour();
  
  const isTargeted = isActive && currentStepId === id;
  
  return (
    <div className={`relative transition-all duration-500 ${isTargeted ? 'ring-4 ring-primary ring-offset-4 ring-offset-background rounded-xl z-50' : ''}`}>
      {children}
    </div>
  );
};
