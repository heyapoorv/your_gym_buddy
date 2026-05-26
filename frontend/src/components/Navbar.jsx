import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../api/notificationService';

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'payment': return 'payments';
      case 'membership': return 'card_membership';
      case 'attendance': return 'how_to_reg';
      case 'lead': return 'person_add';
      default: return 'info';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'payment': return 'text-success bg-success/10 border-success/20';
      case 'membership': return 'text-warning bg-warning/10 border-warning/20';
      case 'attendance': return 'text-primary bg-primary/10 border-primary/20';
      case 'lead': return 'text-info bg-info/10 border-info/20';
      default: return 'text-text-muted bg-white/5 border-white/10';
    }
  };

  return (
    <div className="w-full h-16 md:h-20 flex items-center justify-end px-4 md:px-8 mb-6 z-30 relative">
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="relative p-2 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center border border-transparent hover:border-white/10"
        >
          <span className="material-symbols-outlined text-text-secondary hover:text-text-main text-[24px] transition-colors">notifications</span>
          {unreadCount > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-4 h-4 bg-error rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.6)]"
            >
              {unreadCount}
            </motion.div>
          )}
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[rgba(18,18,20,0.95)] backdrop-blur-2xl border border-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[500px]"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-white/5">
                <h3 className="text-base font-bold text-text-main font-display">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl opacity-50">notifications_paused</span>
                    <p>No notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div 
                        key={notification._id}
                        onClick={() => !notification.read && markAsRead(notification._id)}
                        className={`p-3 rounded-xl flex gap-3 transition-colors cursor-pointer ${notification.read ? 'opacity-60 hover:bg-white/5' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        <div className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center ${getColor(notification.type)}`}>
                          <span className="material-symbols-outlined text-[18px]">{getIcon(notification.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className={`text-sm font-bold truncate pr-2 ${notification.read ? 'text-text-secondary' : 'text-text-main'}`}>{notification.title}</h4>
                            <span className="text-[10px] text-text-dim whitespace-nowrap mt-0.5">
                              {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted line-clamp-2">{notification.description}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Navbar;
