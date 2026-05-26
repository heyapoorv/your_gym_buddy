import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner, FullPageSpinner } from '../components/ui/Spinner';
import { leadService } from '../api/leadService';

const STAGES = [
  { id: 'inquiry', title: 'Inquiry', color: 'bg-primary' },
  { id: 'contacted', title: 'Contacted', color: 'bg-warning' },
  { id: 'trial', title: 'Trial', color: 'bg-info' },
  { id: 'converted', title: 'Converted', color: 'bg-success' },
  { id: 'lost', title: 'Lost', color: 'bg-error' }
];

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Drag state
  const [draggedLead, setDraggedLead] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', source: 'walk_in', notes: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, statsRes] = await Promise.all([
        leadService.getAll({ limit: 100 }),
        leadService.getStats()
      ]);
      setLeads(leadsRes.data.data.leads);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch leads', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.setData('text/plain', lead._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.status === targetStatus) return;

    const leadId = draggedLead._id;
    
    // Optimistic update
    setLeads(leads.map(l => l._id === leadId ? { ...l, status: targetStatus } : l));
    setDraggedLead(null);

    try {
      await leadService.update(leadId, { status: targetStatus });
      leadService.getStats().then(res => setStats(res.data.data)); // background refresh stats
    } catch (error) {
      console.error('Failed to update lead status', error);
      fetchData(); // revert on failure
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await leadService.create(formData);
      setIsModalOpen(false);
      setFormData({ fullName: '', phone: '', source: 'walk_in', notes: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create lead');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && !stats) return <FullPageSpinner />;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight font-display drop-shadow-md">CRM & Leads</h2>
          <p className="text-sm text-text-secondary mt-1 font-medium">Manage your sales pipeline and follow-ups.</p>
        </div>
        <Button icon="add" onClick={() => setIsModalOpen(true)}>Add Lead</Button>
      </header>

      {/* Stats */}
      {stats && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Total Leads</p>
            <p className="text-3xl font-bold font-display mt-2">{stats.total}</p>
          </Card>
          <Card className="p-5 flex flex-col justify-between border-t border-t-success/30">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest text-success">Converted</p>
            <p className="text-3xl font-bold font-display mt-2 text-success">{stats.converted || 0}</p>
          </Card>
          <Card className="p-5 flex flex-col justify-between border-t border-t-info/30">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest text-info">Conversion Rate</p>
            <p className="text-3xl font-bold font-display mt-2 text-info">
              {stats.total > 0 ? Math.round(((stats.converted || 0) / stats.total) * 100) : 0}%
            </p>
          </Card>
          <Card className="p-5 flex flex-col justify-between border-t border-t-warning/30">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest text-warning">Active Follow-ups</p>
            <p className="text-3xl font-bold font-display mt-2 text-warning">
              {(stats.inquiry || 0) + (stats.contacted || 0) + (stats.trial || 0)}
            </p>
          </Card>
        </section>
      )}

      {/* Kanban Board or Empty State */}
      {leads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface/30 border border-white/5 rounded-2xl">
          <div className="w-20 h-20 bg-white/5 text-text-muted rounded-full flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-4xl">contact_page</span>
          </div>
          <h3 className="text-xl font-bold text-text-main mb-2">No leads in pipeline</h3>
          <p className="text-sm text-text-muted text-center max-w-sm mb-6">Start tracking your prospective members here. Drop them through the pipeline stages until they convert.</p>
          <Button icon="add" onClick={() => setIsModalOpen(true)}>Add First Lead</Button>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-6 h-full min-w-max items-start">
            {STAGES.map((stage) => {
              const stageLeads = leads.filter(l => l.status === stage.id);
              return (
                <div 
                  key={stage.id} 
                  className="w-80 flex flex-col bg-surface/50 border border-border rounded-2xl h-full max-h-[70vh] overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="p-4 border-b border-border flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color} shadow-[0_0_8px_currentColor]`}></div>
                      <h3 className="font-bold text-sm text-text-main">{stage.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-text-muted bg-surface px-2 py-1 rounded-full border border-border">
                      {stageLeads.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    <AnimatePresence>
                      {stageLeads.map((lead) => (
                        <motion.div
                          key={lead._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          className="bg-surface-elevated border border-border p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-white/20 hover:shadow-lg transition-all"
                        >
                          <h4 className="font-bold text-text-main text-sm mb-1">{lead.fullName}</h4>
                          <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                            <span className="material-symbols-outlined text-[14px]">phone</span>
                            {lead.phone}
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-medium text-text-secondary uppercase tracking-widest border-t border-border pt-2">
                            <span>{lead.source.replace('_', ' ')}</span>
                            <span className="text-text-dim">
                              {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {stageLeads.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-text-dim text-xs font-medium">
                        Drop leads here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Lead">
        <form onSubmit={handleCreateLead} className="space-y-4">
          <Input 
            label="Full Name" 
            value={formData.fullName} 
            onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
            required 
          />
          <Input 
            label="Phone Number" 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            required 
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Source</label>
            <select 
              className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm"
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
            >
              <option value="walk_in">Walk-in</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social_media">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input 
            label="Notes (Optional)" 
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={formLoading}>Create Lead</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Leads;
