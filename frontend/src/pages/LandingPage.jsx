import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const LandingPage = () => {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    setDemoLoading(true);
    const res = await loginAsDemo();
    if (res.success) {
      navigate('/');
    } else {
      setDemoLoading(false);
      alert('Demo login failed. Ensure seed data is generated.');
    }
  };
  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Intense Atmospheric Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[150px] -z-10 pointer-events-none rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-success/10 blur-[150px] -z-10 pointer-events-none rounded-full"></div>
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-glow-primary border border-white/20">
              <span className="material-symbols-outlined text-[20px]">fitness_center</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-text-main drop-shadow-md">GymOS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-text-muted hover:text-white transition-colors tracking-wide">Sign In</Link>
            <Link to="/signup" className="text-sm font-bold bg-white text-black px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 min-h-screen flex flex-col justify-center items-center">
        
        <div className="max-w-5xl mx-auto text-center z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary mb-10 shadow-glow-primary backdrop-blur-md uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
              GymOS 2.0 is now live
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter text-white mb-8 leading-[1.1] drop-shadow-2xl">
              The operating system for <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-success filter drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">elite fitness brands.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-text-muted mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Run your entire gym from a single, powerful platform. Automate payments, manage trainers, and scale your business with <span className="text-white font-bold">investor-ready</span> infrastructure.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/signup" className="w-full sm:w-auto px-10 py-5 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-hover transition-all shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_50px_rgba(59,130,246,0.8)] border border-white/20 hover:-translate-y-1 text-center">
                Start Free Trial
              </Link>
              <button onClick={handleDemo} disabled={demoLoading} className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all backdrop-blur-md hover:-translate-y-1 flex items-center justify-center gap-2">
                {demoLoading ? 'Loading Demo...' : 'Try Interactive Demo'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview Overlay */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="w-full max-w-6xl mx-auto mt-24 relative perspective-1000"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20 pointer-events-none"></div>
          
          <div className="rounded-2xl border border-white/20 bg-surface/80 backdrop-blur-2xl shadow-[0_30px_100px_-20px_rgba(59,130,246,0.4)] overflow-hidden relative transform rotate-x-12 scale-105 origin-bottom">
            {/* Fake Browser Chrome */}
            <div className="h-12 bg-white/5 border-b border-white/10 flex items-center px-6 gap-3 backdrop-blur-md">
              <div className="w-3.5 h-3.5 rounded-full bg-error/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-warning/80 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-success/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            </div>
            
            {/* Fake Dashboard Content */}
            <div className="p-8 grid grid-cols-4 gap-6 h-[500px]">
              <div className="col-span-1 border-r border-white/10 pr-6 space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-10 rounded-lg bg-white/5 border border-white/5"></div>
                ))}
              </div>
              <div className="col-span-3 space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-32 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-xl"></div>
                    </div>
                  ))}
                </div>
                <div className="h-64 rounded-xl bg-white/5 border border-white/10"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-background py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-glow-primary">
              <span className="material-symbols-outlined text-[16px]">fitness_center</span>
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">GymOS</span>
          </div>
          <p className="text-sm font-medium text-text-muted">© 2024 GymOS Inc. Powering Elite Fitness.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
