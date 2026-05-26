import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner, FullPageSpinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { dashboardService } from '../api/dashboardService';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/UpgradeModal';

const Sparkline = ({ data, color, className }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d - min) / range) * 100}`).join(' ');

  return (
    <svg className={`w-full h-10 overflow-visible ${className}`} viewBox="0 -10 100 120" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 100,100`} fill={`url(#grad-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Dashboard = () => {
  const { user, daysRemaining } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Super Admin gym list state
  const [gyms, setGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(false);
  const [gymSearch, setGymSearch] = useState('');
  const [gymStatusFilter, setGymStatusFilter] = useState('');
  const [gymPage, setGymPage] = useState(1);
  const [gymPagination, setGymPagination] = useState({ total: 0, pages: 1 });
  const [selectedGym, setSelectedGym] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ plan: 'free', planExpiresAt: '' });
  const [updateLoading, setUpdateLoading] = useState(false);

  // ─── Gym Detail Modal State ────────────────────────────────────────
  const [gymDetailModal, setGymDetailModal] = useState(null);
  const [gymDetailData, setGymDetailData] = useState(null);
  const [gymDetailLoading, setGymDetailLoading] = useState(false);

  const fetchGyms = async () => {
    setGymsLoading(true);
    try {
      const res = await dashboardService.getGyms({ page: gymPage, limit: 10, search: gymSearch, status: gymStatusFilter });
      setGyms(res.data.data.gyms);
      setGymPagination(res.data.data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to load gyms', err);
    } finally {
      setGymsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchGyms();
    }
  }, [gymPage, gymSearch, gymStatusFilter, user]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getMetrics();
        setData(res.data.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  if (loading) return <FullPageSpinner />;
  if (error) return <div className="p-8 text-center text-error bg-error/10 rounded-xl">{error}</div>;

  // ─── SUPER ADMIN VIEW ────────────────────────────────────────────────
  if (user?.role === 'superadmin') {
    const stats = data?.stats || {};
    const charts = data?.charts || {};
    const revenueValues = charts?.revenueTrend?.map(r => r.total) || [0, 0];
    const revenueLabels = charts?.revenueTrend?.map(r => r.month) || [];

    const handleViewGymDetails = async (gym) => {
      setGymDetailModal(gym);
      setGymDetailData(null);
      setGymDetailLoading(true);
      try {
        const res = await dashboardService.getGymDetails(gym._id);
        setGymDetailData(res.data.data);
      } catch (err) {
        console.error('Failed to load gym details', err);
      } finally {
        setGymDetailLoading(false);
      }
    };

    const handleOpenPlanModal = (gym) => {
      setSelectedGym(gym);
      setPlanForm({
        plan: gym.plan || 'trial',
        subscriptionStatus: gym.subscriptionStatus || 'trial',
        planExpiresAt: gym.planExpiresAt ? new Date(gym.planExpiresAt).toISOString().split('T')[0] : '',
        note: '',
      });
      setIsPlanModalOpen(true);
    };

    const handleUpdatePlan = async (e) => {
      e.preventDefault();
      setUpdateLoading(true);
      try {
        await dashboardService.updateGymPlan(selectedGym._id, planForm);
        setIsPlanModalOpen(false);
        const metricsRes = await dashboardService.getMetrics();
        setData(metricsRes.data.data);
        await fetchGyms();
        // Refresh detail modal if open for same gym
        if (gymDetailModal?._id === selectedGym._id) {
          const detailRes = await dashboardService.getGymDetails(selectedGym._id);
          setGymDetailData(detailRes.data.data);
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update plan');
      } finally {
        setUpdateLoading(false);
      }
    };

    const handleDeleteGym = async (id) => {
      if (!window.confirm('Are you sure you want to delete this gym and ALL its related data? This cannot be undone.')) return;
      try {
        await dashboardService.deleteGym(id);
        const metricsRes = await dashboardService.getMetrics();
        setData(metricsRes.data.data);
        await fetchGyms();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete gym');
      }
    };

    const STATUS_STYLES = {
      trial:     { text: 'text-violet-300',  bg: 'bg-violet-500/10 border-violet-500/30',  dot: 'bg-violet-400' },
      active:    { text: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
      expired:   { text: 'text-red-300',     bg: 'bg-red-500/10 border-red-500/30',         dot: 'bg-red-400' },
      cancelled: { text: 'text-zinc-400',    bg: 'bg-zinc-500/10 border-zinc-500/30',       dot: 'bg-zinc-400' },
    };
    const PLAN_COLORS = {
      trial: 'from-slate-500 to-zinc-500',
      starter: 'from-emerald-500 to-teal-500',
      growth: 'from-blue-500 to-violet-500',
      enterprise: 'from-amber-500 to-orange-500',
    };

    const getStatusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.trial;

    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-3xl font-bold text-text-main tracking-tight font-display drop-shadow-md">Platform Operations</h2>
            <p className="text-sm text-text-secondary mt-1 font-medium">Multi-tenant SaaS management · real-time subscription data.</p>
          </div>
        </header>

        {/* Platform Stats Grid — 8 cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Gyms', value: stats.totalGyms, icon: 'domain', color: 'text-primary', glow: 'bg-primary/10' },
            { label: 'Active (Paid)', value: stats.activeGyms, icon: 'domain_verification', color: 'text-emerald-400', glow: 'bg-emerald-500/10' },
            { label: 'On Trial', value: stats.trialGyms, icon: 'science', color: 'text-violet-400', glow: 'bg-violet-500/10' },
            { label: 'Expired', value: stats.expiredGyms, icon: 'cancel', color: 'text-red-400', glow: 'bg-red-500/10' },
            { label: 'Platform Members', value: stats.totalMembers, icon: 'groups', color: 'text-warning', glow: 'bg-warning/10' },
            { label: 'Today Check-ins', value: stats.todayCheckIns, icon: 'how_to_reg', color: 'text-success', glow: 'bg-success/10' },
            { label: 'Pending Dues', value: stats.pendingDues, icon: 'credit_card_off', color: 'text-orange-400', glow: 'bg-orange-500/10' },
            { label: 'Monthly Revenue', value: `₹${(stats.monthlyRevenue || 0).toLocaleString('en-IN')}`, icon: 'payments', color: 'text-purple', glow: 'bg-purple/10' },
          ].map((s) => (
            <Card key={s.label} hoverEffect className="flex flex-col relative overflow-hidden group p-4 border-t border-t-white/10">
              <div className={`absolute top-0 right-0 w-24 h-24 ${s.glow} blur-[40px] rounded-full`} />
              <div className="flex justify-between items-start relative z-10 mb-2">
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest leading-tight">{s.label}</p>
                <span className={`material-symbols-outlined ${s.color} text-[20px]`}>{s.icon}</span>
              </div>
              <p className={`text-2xl font-bold font-display tracking-tight relative z-10 ${s.color}`}>{s.value ?? '—'}</p>
            </Card>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gym Tenants Table */}
          <Card className="lg:col-span-2 flex flex-col p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-text-main font-display">Registered Gym Tenants</h3>
                <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded-lg border border-white/10">{gymPagination.total} total</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">search</span>
                  <input
                    type="text"
                    placeholder="Search gyms..."
                    value={gymSearch}
                    onChange={(e) => { setGymSearch(e.target.value); setGymPage(1); }}
                    className="w-full bg-surface border border-border text-text-main rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <select
                  className="bg-surface border border-border text-text-main rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  value={gymStatusFilter}
                  onChange={(e) => { setGymStatusFilter(e.target.value); setGymPage(1); }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            {gymsLoading ? (
              <div className="py-8 flex justify-center"><Spinner /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-text-muted uppercase tracking-widest">
                      <th className="py-3 font-semibold">Gym</th>
                      <th className="py-3 font-semibold">Owner</th>
                      <th className="py-3 font-semibold">Plan / Status</th>
                      <th className="py-3 font-semibold">Usage</th>
                      <th className="py-3 font-semibold">Expiry</th>
                      <th className="py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gyms.map((g) => {
                      const ss = getStatusStyle(g.subscriptionStatus);
                      const planColor = PLAN_COLORS[g.plan] || PLAN_COLORS.trial;
                      const memberPct = g.maxMembers && g.maxMembers < 9999
                        ? Math.min(100, Math.round(((g.usage?.members?.current || 0) / g.maxMembers) * 100))
                        : 0;
                      const expiryDate = g.subscriptionStatus === 'trial' ? g.trialEndsAt : g.planExpiresAt;
                      return (
                        <tr key={g._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3.5">
                            <div className="font-semibold text-text-main">{g.name}</div>
                            <div className="text-[10px] text-text-dim">{g.address?.city || '—'}</div>
                          </td>
                          <td className="py-3.5">
                            <div className="text-text-main text-sm font-semibold">{g.owner?.name}</div>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <div className="text-[10px] text-text-muted flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">mail</span> {g.owner?.email}
                              </div>
                              {g.owner?.phone && (
                                <div className="text-[10px] text-text-dim flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">phone</span> {g.owner?.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-1.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit bg-gradient-to-r ${planColor} bg-clip-text text-transparent border-white/10`}>
                                {g.planLabel || g.plan}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${ss.bg} ${ss.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                                {g.subscriptionStatus}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-1 min-w-[80px]">
                              <div className="text-[10px] text-text-muted flex justify-between">
                                <span>Members</span>
                                <span>{g.usage?.members?.current ?? 0}/{g.maxMembers >= 9999 ? '∞' : g.maxMembers}</span>
                              </div>
                              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${memberPct >= 90 ? 'from-red-500 to-red-600' : memberPct >= 70 ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-violet-500'}`}
                                  style={{ width: `${memberPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            {expiryDate ? (
                              <div>
                                <div className="text-xs text-text-secondary">
                                  {new Date(expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                {g.daysRemaining !== null && g.daysRemaining >= 0 && (
                                  <div className={`text-[10px] font-bold mt-0.5 ${g.daysRemaining <= 3 ? 'text-red-400' : g.daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {g.daysRemaining === 0 ? 'Expires today' : `${g.daysRemaining}d left`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-text-dim text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                id={`view-gym-${g._id}`}
                                onClick={() => handleViewGymDetails(g)}
                                className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-text-main hover:bg-white/10 transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                View
                              </button>
                              <button
                                id={`manage-plan-${g._id}`}
                                onClick={() => handleOpenPlanModal(g)}
                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                                Plan
                              </button>
                              <button
                                id={`delete-gym-${g._id}`}
                                onClick={() => handleDeleteGym(g._id)}
                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {gyms.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-text-muted text-sm">No gyms found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!gymsLoading && gymPagination.pages > 1 && (
              <div className="flex justify-between items-center mt-5 pt-5 border-t border-white/5">
                <p className="text-xs text-text-muted">
                  Showing <span className="font-semibold text-text-main">{(gymPage - 1) * 10 + 1}</span> to <span className="font-semibold text-text-main">{Math.min(gymPage * 10, gymPagination.total)}</span> of <span className="font-semibold text-text-main">{gymPagination.total}</span> gyms
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={gymPage === 1}
                    onClick={() => setGymPage(p => Math.max(1, p - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors text-text-main border border-white/10"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <span className="text-xs font-semibold px-2">Page {gymPage} of {gymPagination.pages}</span>
                  <button 
                    disabled={gymPage >= gymPagination.pages}
                    onClick={() => setGymPage(p => Math.min(gymPagination.pages, p + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors text-text-main border border-white/10"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-6 flex flex-col">
            <Card className="flex flex-col p-6">
              <h3 className="text-base font-bold text-text-main font-display mb-4">Platform Revenue Trend</h3>
              <div className="h-40 relative flex items-end">
                <Sparkline data={revenueValues} color="#8B5CF6" className="h-full w-full" />
              </div>
              <div className="flex justify-between text-[9px] text-text-muted mt-2">
                {revenueLabels.map((lbl, i) => <span key={i}>{lbl}</span>)}
              </div>
            </Card>

            <Card className="flex flex-col p-6">
              <h3 className="text-base font-bold text-text-main font-display mb-3">Subscription Breakdown</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Active (Paid)', count: stats.activeGyms || 0, color: 'bg-emerald-500', max: stats.totalGyms || 1 },
                  { label: 'On Trial', count: stats.trialGyms || 0, color: 'bg-violet-500', max: stats.totalGyms || 1 },
                  { label: 'Expired', count: stats.expiredGyms || 0, color: 'bg-red-500', max: stats.totalGyms || 1 },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="text-text-main font-bold">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((item.count / item.max) * 100)}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="flex flex-col p-6">
              <h3 className="text-base font-bold text-text-main font-display mb-2">Platform System Status</h3>
              <div className="space-y-3 mt-2 text-xs">
                {[
                  { label: 'Node Version', value: 'v20.19.0', mono: true },
                  { label: 'Database', value: 'MongoDB Connected', mono: true },
                  { label: 'Cron Services', value: 'Active', success: true },
                  { label: 'Subscription Cron', value: 'Daily 00:05', mono: true },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between border-b border-white/5 py-1.5 last:border-0">
                    <span className="text-text-muted">{item.label}</span>
                    <span className={`${item.mono ? 'font-mono text-text-main' : ''} ${item.success ? 'text-success font-bold flex items-center gap-1' : ''}`}>
                      {item.success && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ─── Gym Owner Detail Modal ──────────────────────────────────────── */}
        {gymDetailModal && (
          <Modal
            isOpen={!!gymDetailModal}
            onClose={() => { setGymDetailModal(null); setGymDetailData(null); }}
            title=""
          >
            <div className="space-y-5 -mt-2">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-white">{gymDetailModal.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(gymDetailModal.subscriptionStatus).bg} ${getStatusStyle(gymDetailModal.subscriptionStatus).text}`}>
                      {gymDetailModal.subscriptionStatus}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 bg-gradient-to-r ${PLAN_COLORS[gymDetailModal.plan]} bg-clip-text text-transparent capitalize`}>
                      {gymDetailModal.planLabel || gymDetailModal.plan}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleOpenPlanModal(gymDetailModal)} className="text-xs font-bold px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                  Manage Plan
                </button>
              </div>

              {gymDetailLoading ? (
                <div className="py-8 flex justify-center"><Spinner /></div>
              ) : gymDetailData ? (
                <>
                  {/* Owner Info */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Gym Owner</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {gymDetailData.gym.owner?.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{gymDetailData.gym.owner?.name}</p>
                        <p className="text-xs text-text-muted">{gymDetailData.gym.owner?.email}</p>
                        {gymDetailData.gym.owner?.phone && <p className="text-xs text-text-dim">{gymDetailData.gym.owner.phone}</p>}
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-[10px] text-text-muted">Member since</p>
                        <p className="text-xs font-semibold text-text-secondary">
                          {new Date(gymDetailData.gym.owner?.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </p>
                        {gymDetailData.gym.owner?.lastLogin && (
                          <p className="text-[10px] text-text-dim">
                            Last login: {new Date(gymDetailData.gym.owner.lastLogin).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Active Members', value: gymDetailData.stats.members.active, icon: 'group', color: 'text-blue-400' },
                      { label: 'Staff', value: gymDetailData.stats.staff, icon: 'badge', color: 'text-violet-400' },
                      { label: 'Monthly Revenue', value: `₹${(gymDetailData.stats.revenue.monthly).toLocaleString('en-IN')}`, icon: 'payments', color: 'text-emerald-400' },
                      { label: 'Today Check-ins', value: gymDetailData.stats.attendance.today, icon: 'how_to_reg', color: 'text-amber-400' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                        <span className={`material-symbols-outlined ${s.color} text-[22px] mb-1`}>{s.icon}</span>
                        <p className="text-lg font-display font-bold text-white">{s.value}</p>
                        <p className="text-[10px] text-text-muted">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Usage bars */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Resource Usage</p>
                    {[
                      { label: 'Members', current: gymDetailData.stats.usage.members.current, limit: gymDetailData.stats.usage.members.limit, color: 'from-blue-500 to-violet-500' },
                      { label: 'Staff', current: gymDetailData.stats.usage.staff.current, limit: gymDetailData.stats.usage.staff.limit, color: 'from-emerald-500 to-teal-500' },
                    ].map((bar) => {
                      const isUnlimited = bar.limit >= 9999;
                      const pct = isUnlimited ? 0 : Math.min(100, Math.round((bar.current / bar.limit) * 100));
                      return (
                        <div key={bar.label} className="mb-3 last:mb-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-text-secondary">{bar.label}</span>
                            <span className="text-text-main font-bold">{bar.current} / {isUnlimited ? '∞' : bar.limit}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${pct >= 90 ? 'from-red-500 to-red-600' : bar.color}`}
                              style={{ width: isUnlimited ? '20%' : `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent Members */}
                  {gymDetailData.recentMembers?.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Recent Members</p>
                      <div className="space-y-2">
                        {gymDetailData.recentMembers.map((m) => (
                          <div key={m._id} className="flex justify-between text-sm">
                            <span className="text-text-secondary">{m.name}</span>
                            <span className={`text-xs font-bold ${m.status === 'active' ? 'text-emerald-400' : m.status === 'expiring' ? 'text-amber-400' : 'text-red-400'}`}>{m.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff / Trainers */}
                  {gymDetailData.trainersList?.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Staff / Trainers</p>
                      <div className="space-y-3">
                        {gymDetailData.trainersList.map((t) => (
                          <div key={t._id} className="flex flex-col gap-0.5 pb-3 mb-3 border-b border-white/5 last:border-0 last:pb-0 last:mb-0">
                            <div className="flex justify-between">
                              <span className="text-sm font-bold text-text-main flex items-center gap-2">
                                {t.fullName}
                                {!t.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-400 uppercase tracking-wider">Inactive</span>}
                              </span>
                              <span className="text-[11px] text-text-secondary bg-white/5 px-2 py-0.5 rounded-full">{t.specialization}</span>
                            </div>
                            <div className="flex justify-between text-xs text-text-muted mt-1">
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">mail</span> {t.email}</span>
                              {t.phone && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">phone</span> {t.phone}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-text-muted py-4">Failed to load details.</p>
              )}
            </div>
          </Modal>
        )}

        {/* ─── Plan Management Modal ───────────────────────────────────────── */}
        <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title={`Manage Subscription: ${selectedGym?.name}`}>
          <form onSubmit={handleUpdatePlan} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Subscription Tier</label>
              <select
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={planForm.plan}
                onChange={(e) => setPlanForm({ ...planForm, plan: e.target.value })}
                required
              >
                <option value="trial">Trial (Free)</option>
                <option value="starter">Starter — ₹699/mo</option>
                <option value="growth">Growth — ₹1,799/mo</option>
                <option value="enterprise">Enterprise — ₹3,999/mo</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Subscription Status</label>
              <select
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={planForm.subscriptionStatus}
                onChange={(e) => setPlanForm({ ...planForm, subscriptionStatus: e.target.value })}
              >
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <Input
              label="Custom Expiry Date (optional)"
              type="date"
              value={planForm.planExpiresAt}
              onChange={(e) => setPlanForm({ ...planForm, planExpiresAt: e.target.value })}
            />

            <Input
              label="Admin Note (optional)"
              placeholder="e.g. Complimentary extension"
              value={planForm.note}
              onChange={(e) => setPlanForm({ ...planForm, note: e.target.value })}
            />

            <div className="pt-4 flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setIsPlanModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={updateLoading}>Update Subscription</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ─── TRAINER VIEW ────────────────────────────────────────────────────
  if (user?.role === 'trainer') {
    const { members, attendance, charts } = data;
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-3xl font-bold text-text-main tracking-tight font-display drop-shadow-md">Welcome, {user.name}</h2>
            <p className="text-sm text-text-secondary mt-1 font-medium">Here's the activity for your gym today.</p>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Active Members */}
          <Card hoverEffect className="flex flex-col relative overflow-hidden group p-5 border-t border-t-white/10">
            <div className="absolute inset-0 bg-gradient-primary opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"></div>
            <div className="flex justify-between items-start relative z-10">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Active Members</p>
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] p-[1px]">
                <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
                   <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-4 relative z-10">
              <span className="text-3xl font-bold text-text-main font-display tracking-tight">{members.active}</span>
              <span className="text-xs font-medium text-text-muted">/ {members.total} Total</span>
            </div>
            <div className="mt-4 relative z-10 -mx-1">
               <Sparkline data={charts.memberTrend && charts.memberTrend.length > 0 ? charts.memberTrend : [0,0]} color="#3B82F6" />
            </div>
          </Card>

          {/* Attendance */}
          <Card hoverEffect className="flex flex-col relative overflow-hidden group p-5 border-t border-t-white/10">
            <div className="absolute inset-0 bg-gradient-success opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"></div>
            <div className="flex justify-between items-start relative z-10">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Check-ins Today</p>
              <div className="w-8 h-8 rounded-lg bg-gradient-success flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)] p-[1px]">
                <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
                   <span className="material-symbols-outlined text-success text-[18px]">how_to_reg</span>
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-4 relative z-10">
              <span className="text-3xl font-bold text-text-main font-display tracking-tight">{attendance.todayCheckIns}</span>
            </div>
            <div className="mt-4 pt-1 relative z-10 flex items-end gap-1 h-9">
              {(charts.attendanceTrend || []).map((h, i) => (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(h / Math.max(10, ...charts.attendanceTrend)) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} className={`flex-1 rounded-t-sm transition-colors cursor-pointer border border-b-0 border-white/5 ${i === 6 ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-white/10 hover:bg-white/20'}`}></motion.div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    );
  }

  // ─── GYM OWNER VIEW ──────────────────────────────────────────────────
  const { members, financials, attendance, crm, charts } = data;

  const revenueValues = charts?.revenueTrend?.map(r => r.total) || [0, 0];
  const revenueLabels = charts?.revenueTrend?.map(r => r.month) || [];

  const PLAN_COLORS = {
    trial: 'from-slate-500 to-zinc-500',
    starter: 'from-emerald-500 to-teal-500',
    growth: 'from-blue-500 to-violet-500',
    enterprise: 'from-amber-500 to-orange-500',
  };
  const planColor = PLAN_COLORS[user?.gymPlan] || PLAN_COLORS.trial;
  const isTrial = user?.gymSubscriptionStatus === 'trial';
  const isExpired = user?.gymSubscriptionStatus === 'expired';
  const memberUsagePct = user?.gymMaxMembers
    ? Math.min(100, Math.round(((members.active + members.expiring) / user.gymMaxMembers) * 100))
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight font-display drop-shadow-md">Overview</h2>
          <p className="text-sm text-text-secondary mt-1 font-medium">Here is what's happening at your gym today.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="secondary" icon="download" className="flex-1 md:flex-none text-xs h-9 py-0">
            Export Report
          </Button>
        </div>
      </header>

      {/* ─── Subscription Overview Widget ──────────────────────────────── */}
      {user?.role === 'gym_owner' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border bg-[rgba(255,255,255,0.03)] overflow-hidden ${
            isExpired ? 'border-red-500/30' : 'border-white/10'
          }`}
        >
          <div className={`h-1 w-full bg-gradient-to-r ${isExpired ? 'from-red-600 to-orange-500' : planColor}`} />
          <div className="p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${planColor} flex items-center justify-center shadow-lg`}>
                <span className="material-symbols-outlined text-white text-[20px]">workspace_premium</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-base font-display font-bold bg-gradient-to-r ${planColor} bg-clip-text text-transparent capitalize`}>
                    {user?.gymPlan || 'trial'} Plan
                  </span>
                  {isTrial && daysRemaining !== null && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      daysRemaining <= 2
                        ? 'bg-red-500/10 text-red-300 border-red-500/20'
                        : daysRemaining <= 5
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        : 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                    }`}>
                      {daysRemaining === 0 ? 'Expires today' : `${daysRemaining}d left`}
                    </span>
                  )}
                  {isExpired && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-300 border-red-500/20">
                      Expired
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  {members.active + members.expiring} / {user?.gymMaxMembers ?? '—'} members used
                </p>
              </div>
            </div>

            {/* Usage bar */}
            <div className="hidden sm:flex flex-col gap-1 min-w-[160px] flex-1 max-w-xs">
              <div className="flex justify-between text-[11px] text-text-muted mb-1">
                <span>Member usage</span>
                <span>{memberUsagePct}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${memberUsagePct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${
                    memberUsagePct >= 100 ? 'from-red-500 to-red-600' :
                    memberUsagePct >= 80 ? 'from-amber-500 to-orange-500' :
                    planColor
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="dashboard-subscription-btn"
                onClick={() => navigate('/subscription')}
                className="px-3 py-2 text-xs font-medium text-text-secondary bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                Details
              </button>
              {user?.gymPlan !== 'enterprise' && !isExpired && (
                <button
                  id="dashboard-upgrade-btn"
                  onClick={() => setShowUpgradeModal(true)}
                  className={`px-3 py-2 text-xs font-bold bg-gradient-to-r ${planColor} text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md`}
                >
                  <span className="material-symbols-outlined text-[14px]">rocket_launch</span>
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card hoverEffect className="flex flex-col relative overflow-hidden group p-5 border-t border-t-white/10">
          <div className="absolute inset-0 bg-gradient-revenue opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Monthly MRR</p>
            <div className="w-8 h-8 rounded-lg bg-gradient-revenue flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)] p-[1px]">
              <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
                 <span className="material-symbols-outlined text-warning text-[18px]">account_balance_wallet</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-3xl font-bold text-text-main font-display tracking-tight">₹{financials.monthlyRevenue.toLocaleString()}</span>
          </div>
          
          <div className="mt-4 relative z-10 -mx-1">
             <Sparkline data={revenueValues.length > 0 ? revenueValues : [0,0,0]} color="#F97316" />
          </div>
        </Card>

        {/* Active Members */}
        <Card hoverEffect className="flex flex-col relative overflow-hidden group p-5 border-t border-t-white/10">
          <div className="absolute inset-0 bg-gradient-primary opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Active Members</p>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] p-[1px]">
              <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
                 <span className="material-symbols-outlined text-primary text-[18px]">group</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-3xl font-bold text-text-main font-display tracking-tight">{members.active}</span>
            <span className="text-xs font-medium text-text-muted">/ {members.total} Total</span>
          </div>
          
          <div className="mt-4 relative z-10 -mx-1">
             <Sparkline data={charts.memberTrend && charts.memberTrend.length > 0 ? charts.memberTrend : [0,0]} color="#3B82F6" />
          </div>
        </Card>

        {/* Attendance */}
        <Card hoverEffect className="flex flex-col relative overflow-hidden group p-5 border-t border-t-white/10">
          <div className="absolute inset-0 bg-gradient-success opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Check-ins Today</p>
            <div className="w-8 h-8 rounded-lg bg-gradient-success flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)] p-[1px]">
              <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
                 <span className="material-symbols-outlined text-success text-[18px]">how_to_reg</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-3xl font-bold text-text-main font-display tracking-tight">{attendance.todayCheckIns}</span>
          </div>
          
          <div className="mt-4 pt-1 relative z-10 flex items-end gap-1 h-9">
            {(charts.attendanceTrend || []).map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(h / Math.max(10, ...charts.attendanceTrend)) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} className={`flex-1 rounded-t-sm transition-colors cursor-pointer border border-b-0 border-white/5 ${i === 6 ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-white/10 hover:bg-white/20'}`}></motion.div>
            ))}
          </div>
        </Card>

        {/* Payments Processing */}
        <Card hoverEffect className="flex flex-col relative overflow-hidden group p-5 border-t border-t-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple to-primary opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Pending Dues</p>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] p-[1px]">
              <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
                 <span className="material-symbols-outlined text-purple text-[18px]">credit_card_off</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-3xl font-bold text-text-main font-display tracking-tight">{financials.pendingDues}</span>
            {financials.pendingDues > 0 && (
              <span className="text-xs font-bold text-error flex items-center"><span className="material-symbols-outlined text-[14px]">warning</span>Action Req</span>
            )}
          </div>
          
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-auto mb-1 overflow-hidden border border-white/5 relative z-10">
            <motion.div initial={{ width: 0 }} animate={{ width: financials.pendingDues > 0 ? '50%' : '0%' }} transition={{ duration: 1, ease: "easeOut" }} className="bg-error h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></motion.div>
          </div>
        </Card>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart Area */}
        <Card className="lg:col-span-2 relative min-h-[420px] flex flex-col p-0 overflow-hidden group border-t border-t-white/10">
          <div className="p-6 flex justify-between items-center z-10 border-b border-white/5">
            <h3 className="text-lg font-bold text-text-main font-display tracking-tight">Revenue Trend (Last 6 Months)</h3>
          </div>
          
          <div className="flex-1 relative mt-4 px-6 pb-6 flex items-end">
             {/* Chart Grid */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-20 pointer-events-none px-6 pb-8 pt-4 pl-16">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-px bg-white/30 border-b border-white/10 border-dashed"></div>
              ))}
            </div>
            
            <div className="w-full h-full pl-10 relative pt-4 pb-2">
               {/* Main Sparkline for Revenue representing smooth curve */}
               <Sparkline data={revenueValues.length > 0 ? revenueValues : [0,0]} color="#3B82F6" className="h-full w-full" />
               {/* Glowing Active Point at the end */}
               {revenueValues.length > 0 && (
                 <div className="absolute top-[5%] right-[0%] w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1),0_0_30px_rgba(59,130,246,0.8)] border-2 border-primary z-20"></div>
               )}
            </div>
            
             {/* X-Axis Labels */}
             <div className="absolute bottom-2 left-16 right-6 flex justify-between text-[10px] font-medium text-text-muted z-10">
                {revenueLabels.length > 0 ? revenueLabels.map((lbl, i) => <span key={i}>{lbl}</span>) : <span>No Data</span>}
             </div>
          </div>
        </Card>

        {/* Recent Alerts Panel */}
        <div className="flex flex-col h-full">
          <Card className="flex-1 flex flex-col p-6 border-t border-t-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text-main font-display tracking-tight">Recent Alerts</h3>
              <Badge variant="primary">Notifications</Badge>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
              {/* Combine System Alerts and specific action items */}
              {financials.pendingDues > 0 && (
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                  <div className="p-2 rounded-lg bg-error/10 text-error border border-error/20">
                    <span className="material-symbols-outlined text-[18px]">credit_card_off</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="text-sm font-semibold text-text-main truncate">Payment Action Required</h4>
                    <p className="text-xs text-text-muted mt-1">{financials.pendingDues} pending dues require immediate follow-up.</p>
                  </div>
                </div>
              )}
              {members.expiring > 0 && (
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning border border-warning/20">
                    <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="text-sm font-semibold text-text-main truncate">Memberships Expiring</h4>
                    <p className="text-xs text-text-muted mt-1">{members.expiring} members are expiring within 7 days.</p>
                  </div>
                </div>
              )}
              {crm?.leadsConverted > 0 && (
                <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                  <div className="p-2 rounded-lg bg-success/10 text-success border border-success/20">
                    <span className="material-symbols-outlined text-[18px]">celebration</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="text-sm font-semibold text-text-main truncate">Leads Converted</h4>
                    <p className="text-xs text-text-muted mt-1">Great job! {crm.leadsConverted} leads have been converted.</p>
                  </div>
                </div>
              )}
              {financials.pendingDues === 0 && members.expiring === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
                  <p>All caught up! No recent alerts.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default Dashboard;
