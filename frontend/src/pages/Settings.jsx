import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const Settings = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');

  // Password change form state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwError('New passwords do not match.');
    }
    if (pwForm.newPassword.length < 6) {
      return setPwError('New password must be at least 6 characters.');
    }

    setPwLoading(true);
    try {
      await client.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const navItems = [
    { id: 'profile', label: 'Gym Profile', icon: 'fitness_center' },
    { id: 'account', label: 'My Account', icon: 'person' },
    { id: 'password', label: 'Change Password', icon: 'lock' },
  ];

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-border">
        <h2 className="text-3xl font-bold text-text-main tracking-tight font-display">Settings</h2>
        <p className="text-sm text-text-secondary mt-1">Manage your gym profile and account preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-main border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* ── Gym Profile ──────────────────────────────────────── */}
          {activeSection === 'profile' && (
            <Card>
              <h4 className="text-lg font-bold text-text-main mb-1 font-display">Gym Profile</h4>
              <p className="text-xs text-text-muted mb-6 border-b border-border pb-4">Your registered account information.</p>
              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Full Name</p>
                      <p className="text-sm font-semibold text-text-main mt-0.5">{user?.name || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Email — locked */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-lg border border-warning/20">
                      <span className="material-symbols-outlined text-warning text-[18px]">mail</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-semibold text-text-main mt-0.5">{user?.email || '—'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    Locked
                  </span>
                </div>

                {/* Phone — locked */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/10 rounded-lg border border-warning/20">
                      <span className="material-symbols-outlined text-warning text-[18px]">phone</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Phone Number</p>
                      <p className="text-sm font-semibold text-text-main mt-0.5">{user?.phone || '—'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    Locked
                  </span>
                </div>

                {/* Role */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg border border-success/20">
                      <span className="material-symbols-outlined text-success text-[18px]">shield_person</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Account Role</p>
                      <p className="text-sm font-bold text-success mt-0.5 uppercase tracking-widest">{user?.role?.replace('_', ' ') || '—'}</p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted pt-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  To update your email or phone number, please contact GymOS support.
                </p>
              </div>
            </Card>
          )}

          {/* ── My Account (read-only email/phone) ───────────────── */}
          {activeSection === 'account' && (
            <Card>
              <h4 className="text-lg font-bold text-text-main mb-1 font-display">My Account</h4>
              <p className="text-xs text-text-muted mb-6 border-b border-border pb-4">
                Your personal account details. Email and phone cannot be changed after registration.
              </p>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2 pl-1">Full Name</label>
                    <div className="bg-white/5 border border-border rounded-xl px-4 py-3 text-sm text-text-main">
                      {user?.name || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2 pl-1">Role</label>
                    <div className="bg-white/5 border border-border rounded-xl px-4 py-3 text-sm text-primary uppercase tracking-wider font-bold">
                      {user?.role?.replace('_', ' ') || '—'}
                    </div>
                  </div>
                </div>

                {/* Locked Email */}
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2 pl-1 flex items-center gap-2">
                    Email Address
                    <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">lock</span>
                      Locked
                    </span>
                  </label>
                  <div className="bg-white/5 border border-border/50 rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed flex items-center justify-between">
                    <span>{user?.email || '—'}</span>
                    <span className="material-symbols-outlined text-[18px] text-text-muted">lock</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1.5 pl-1">Email cannot be changed for security reasons.</p>
                </div>

                {/* Locked Phone */}
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2 pl-1 flex items-center gap-2">
                    Phone Number
                    <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">lock</span>
                      Locked
                    </span>
                  </label>
                  <div className="bg-white/5 border border-border/50 rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed flex items-center justify-between">
                    <span>{user?.phone || '—'}</span>
                    <span className="material-symbols-outlined text-[18px] text-text-muted">lock</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1.5 pl-1">Phone number cannot be changed. Contact support if needed.</p>
                </div>
              </div>
            </Card>
          )}

          {/* ── Change Password ───────────────────────────────────── */}
          {activeSection === 'password' && (
            <Card>
              <h4 className="text-lg font-bold text-text-main mb-1 font-display">Change Password</h4>
              <p className="text-xs text-text-muted mb-6 border-b border-border pb-4">
                Choose a strong password. It must be at least 6 characters.
              </p>

              {pwError && (
                <div className="bg-error/10 text-error p-3 rounded-lg text-sm mb-5 border border-error/20 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="bg-success/10 text-success p-3 rounded-lg text-sm mb-5 border border-success/20 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {pwSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-5">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.currentPassword}
                  onChange={handlePwChange}
                  required
                />
                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={pwForm.newPassword}
                  onChange={handlePwChange}
                  required
                />
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  value={pwForm.confirmPassword}
                  onChange={handlePwChange}
                  required
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" isLoading={pwLoading}>
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
