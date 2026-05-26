import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

const OnboardingWizard = () => {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If not a gym owner, or already completed, do not render
  if (user?.role !== 'gym_owner' || user?.gymOnboardingComplete) {
    return null;
  }

  const handleComplete = async () => {
    setIsSubmitting(true);
    await completeOnboarding();
    setIsSubmitting(false);
  };

  const steps = [
    {
      title: "Welcome to GymOS!",
      content: "Let's get your gym set up. This quick wizard will guide you through creating your first membership plan, adding staff, and registering members.",
      icon: "celebration"
    },
    {
      title: "1. Create Plans",
      content: "First, you'll need Membership Plans (like 'Monthly Standard' or 'Annual Elite'). Head over to the Financials tab to create these.",
      icon: "sell"
    },
    {
      title: "2. Add Trainers",
      content: "Assign staff to your gym in the Trainers tab. They'll be able to manage their own assigned members and schedules.",
      icon: "fitness_center"
    },
    {
      title: "3. Register Members",
      content: "Start adding members and assigning them to the plans and trainers you just created. Your dashboard will automatically track revenue and attendance.",
      icon: "group_add"
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">{steps[step - 1].icon}</span>
          </div>
          <h2 className="text-2xl font-bold text-text-main font-display">{steps[step - 1].title}</h2>
          <p className="text-text-secondary mt-2 text-sm leading-relaxed">
            {steps[step - 1].content}
          </p>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-white/10">
          <button 
            onClick={handleComplete}
            disabled={isSubmitting}
            className="text-xs font-bold text-text-muted hover:text-white transition-colors uppercase tracking-widest"
          >
            Skip Tutorial
          </button>
          
          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Back</Button>
            )}
            {step < steps.length ? (
              <Button onClick={() => setStep(s => s + 1)}>Next</Button>
            ) : (
              <Button onClick={handleComplete} isLoading={isSubmitting}>Get Started</Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
