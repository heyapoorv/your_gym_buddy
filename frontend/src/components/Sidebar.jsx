import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { TourTarget } from '../context/TourContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: 'space_dashboard', path: '/' },
    { name: 'Members', icon: 'group', path: '/members', roles: ['gym_owner', 'trainer'] },
    { name: 'Financials', icon: 'payments', path: '/financials', roles: ['gym_owner'] },
    { name: 'Trainers', icon: 'sports', path: '/trainers', roles: ['gym_owner'] },
    { name: 'Attendance', icon: 'how_to_reg', path: '/attendance', roles: ['gym_owner', 'trainer'] },
    { name: 'CRM / Leads', icon: 'diversity_3', path: '/leads', roles: ['gym_owner'] },
    { name: 'Settings', icon: 'settings', path: '/settings', roles: ['gym_owner'] },
    { name: 'Subscription', icon: 'workspace_premium', path: '/subscription', roles: ['gym_owner'] },
  ];

  const closeSidebar = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-background/80 backdrop-blur-xl z-40 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-primary flex items-center justify-center text-white shadow-glow-primary border border-white/20">
            <span className="material-symbols-outlined text-[18px]">fitness_center</span>
          </div>
          <span className="font-display font-bold text-xl text-text-main tracking-tight">GymOS</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-text-main p-2 hover:bg-white/5 rounded-md transition-colors">
          <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={closeSidebar}></div>
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-[rgba(9,9,11,0.6)] backdrop-blur-2xl border-r border-border flex flex-col transition-transform duration-300 z-50 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3 hidden md:flex">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-white/20">
            <span className="material-symbols-outlined text-[20px]">fitness_center</span>
          </div>
          <span className="font-display font-bold text-2xl text-text-main tracking-tight">GymOS</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-20 md:mt-0 overflow-y-auto custom-scrollbar py-4 relative">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 px-2">Menu</div>
          {filteredItems.map((item) => {
            let tourId = null;
            if (item.path === '/') tourId = 'dashboard';
            else if (item.path === '/members') tourId = 'members';
            else if (item.path === '/financials') tourId = 'financials';
            else if (item.path === '/leads') tourId = 'crm';

            const linkContent = (
              <NavLink
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative overflow-hidden",
                  isActive 
                    ? "text-white" 
                    : "text-text-secondary hover:text-text-main"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent border-l-2 border-primary shadow-[inset_15px_0_20px_-10px_rgba(59,130,246,0.2)]" />
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 rounded-xl" />
                    )}
                    
                    <span className={cn(
                      "material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:scale-110 relative z-10",
                      isActive ? "text-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" : "text-text-muted group-hover:text-text-secondary"
                    )}>{item.icon}</span>
                    <span className="relative z-10">{item.name}</span>
                  </>
                )}
              </NavLink>
            );

            return (
              <React.Fragment key={item.name}>
                {tourId ? <TourTarget id={tourId}>{linkContent}</TourTarget> : linkContent}
              </React.Fragment>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-3 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center border border-white/10 overflow-hidden relative group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-shadow">
              <div className="absolute inset-0 bg-gradient-primary opacity-50"></div>
              <span className="material-symbols-outlined text-text-main text-[20px] relative z-10">person</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-text-main truncate">{user?.name || "Gym Owner"}</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">{user?.role?.replace('_', ' ') || "Admin"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-secondary hover:text-error hover:bg-error/10 border border-transparent rounded-xl transition-all text-left w-full group"
          >
            <span className="material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:scale-110">logout</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
