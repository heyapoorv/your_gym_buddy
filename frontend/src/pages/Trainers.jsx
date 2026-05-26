import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner, FullPageSpinner } from '../components/ui/Spinner';
import { trainerService } from '../api/trainerService';
import { memberService } from '../api/memberService';

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Trainer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', specialization: '', salary: '' });
  const [formLoading, setFormLoading] = useState(false);

  // Assign Member Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Edit Trainer Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', fullName: '', email: '', phone: '', specialization: '', salary: '', isActive: true });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Trainer Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTrainers = async () => {
    try {
      const res = await trainerService.getAll();
      setTrainers(res.data.data.trainers);
    } catch (error) {
      console.error('Failed to fetch trainers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await trainerService.create({ ...formData, salary: Number(formData.salary) });
      setIsModalOpen(false);
      setFormData({ fullName: '', email: '', phone: '', password: '', specialization: '', salary: '' });
      fetchTrainers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create trainer');
    } finally {
      setFormLoading(false);
    }
  };

  const openAssignModal = async (trainerId) => {
    setSelectedTrainerId(trainerId);
    setIsAssignModalOpen(true);
    try {
      const res = await memberService.getAll({ status: 'active', limit: 100 });
      setMembers(res.data.data.members);
    } catch (error) {
      console.error('Failed to fetch members', error);
    }
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    setAssignLoading(true);
    try {
      await trainerService.assignMember(selectedTrainerId, selectedMemberId);
      setIsAssignModalOpen(false);
      setSelectedMemberId('');
      fetchTrainers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign member');
    } finally {
      setAssignLoading(false);
    }
  };

  const openEditModal = (trainer) => {
    setEditFormData({
      id: trainer._id,
      fullName: trainer.fullName,
      email: trainer.email,
      phone: trainer.phone || '',
      specialization: trainer.specialization,
      salary: trainer.salary || '',
      isActive: trainer.isActive
    });
    setIsEditModalOpen(true);
  };

  const handleEditTrainer = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await trainerService.update(editFormData.id, {
        specialization: editFormData.specialization,
        salary: Number(editFormData.salary),
        isActive: editFormData.isActive,
      });
      setIsEditModalOpen(false);
      fetchTrainers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update trainer');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!trainerToDelete) return;
    setDeleteLoading(true);
    try {
      await trainerService.remove(trainerToDelete._id);
      setIsDeleteModalOpen(false);
      setTrainerToDelete(null);
      fetchTrainers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete trainer');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  const activeTrainersCount = trainers.length;
  const totalAssignedMembers = trainers.reduce((acc, trainer) => acc + trainer.assignedMembers.length, 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-4xl font-bold text-text-main tracking-tight font-display drop-shadow-md">Trainer Performance</h2>
          <p className="text-sm text-text-muted mt-2 font-medium">Real-time tracking of elite staff and revenue metrics.</p>
        </div>
        <Button icon="add" className="w-full md:w-auto" onClick={() => setIsModalOpen(true)}>
          Add Trainer
        </Button>
      </header>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverEffect className="flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full group-hover:bg-primary/20 transition-colors"></div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest relative z-10">Active Trainers</p>
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-4xl font-bold text-text-main font-display drop-shadow-sm">{activeTrainersCount}</span>
          </div>
        </Card>

        <Card hoverEffect className="flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 blur-[40px] rounded-full group-hover:bg-warning/20 transition-colors"></div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest relative z-10">Assigned Members</p>
          <div className="flex items-baseline gap-2 mt-4 relative z-10">
            <span className="text-4xl font-bold text-primary font-display drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{totalAssignedMembers}</span>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Schedule: Calendar View */}
        <Card className="lg:col-span-2 flex flex-col p-0 overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b border-white/10 bg-white/5 backdrop-blur-md">
            <h3 className="text-xl font-bold text-text-main font-display tracking-tight">Today's Schedule (Coming Soon)</h3>
          </div>
          
          <div className="space-y-2 p-5 overflow-y-auto max-h-[500px] custom-scrollbar flex items-center justify-center text-text-muted text-sm min-h-[300px]">
            Future PT Session integration goes here.
          </div>
        </Card>

        {/* Trainer Cards: List */}
        <section className="space-y-5">
          <h3 className="text-xl font-bold text-text-main font-display tracking-tight mb-4 drop-shadow-sm">Elite Trainers</h3>
          
          {trainers.map((trainer) => (
            <Card key={trainer._id} hoverEffect className="p-0 overflow-hidden group border-white/10">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="bg-white/5 backdrop-blur-xl px-4 py-3 rounded-lg border border-white/10 shadow-xl flex-1 max-w-sm">
                    <h4 className="text-base font-bold text-text-main drop-shadow-md flex items-center gap-2">
                      {trainer.fullName}
                      {!trainer.isActive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-400 uppercase tracking-wider font-bold">Inactive</span>}
                    </h4>
                    <p className="text-[10px] text-primary uppercase tracking-widest font-bold drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] mt-1">{trainer.specialization}</p>
                    
                    <div className="mt-3 pt-2 border-t border-white/10 flex flex-col gap-1.5 text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">mail</span>
                        <span>{trainer.email}</span>
                      </div>
                      {trainer.phone && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">phone</span>
                          <span>{trainer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => openEditModal(trainer)} className="p-1.5 text-text-muted hover:text-primary transition-colors bg-white/5 rounded-lg border border-white/10" title="Edit Trainer">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => { setTrainerToDelete(trainer); setIsDeleteModalOpen(true); }} className="p-1.5 text-text-muted hover:text-error transition-colors bg-white/5 rounded-lg border border-white/10" title="Delete Trainer">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                    <span className="text-[10px] font-medium text-text-dim mt-0.5">{trainer.assignedMembers.length} Members</span>
                    <button 
                      onClick={() => openAssignModal(trainer._id)}
                      className="mt-2 text-xs font-bold text-primary hover:text-white transition-colors"
                    >
                      Assign Member
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-text-muted mb-2 font-bold uppercase tracking-widest">Assigned Members:</p>
                  <div className="flex flex-wrap gap-2">
                    {trainer.assignedMembers.map(m => (
                      <span key={m._id} className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-text-secondary">{m.name}</span>
                    ))}
                    {trainer.assignedMembers.length === 0 && <span className="text-xs text-text-dim italic">None</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {trainers.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm border border-white/10 rounded-xl bg-white/5">
              No trainers added yet.
            </div>
          )}
        </section>
      </div>

      {/* Add Trainer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Trainer">
        <form onSubmit={handleCreateTrainer} className="space-y-4">
          <Input label="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
          <Input label="Password (for login)" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          <Input label="Specialization (e.g. HIIT, Yoga)" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} required />
          <Input label="Salary / Month (Optional)" type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
          
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={formLoading}>Create Trainer</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Member Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Member to Trainer">
        <form onSubmit={handleAssignMember} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Select Member</label>
            <select 
              className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
            >
              <option value="">Search member...</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.phone})</option>)}
            </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={assignLoading}>Assign</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Trainer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Trainer">
        <form onSubmit={handleEditTrainer} className="space-y-4">
          <Input label="Full Name (Read-only)" value={editFormData.fullName} readOnly />
          <Input label="Email (Read-only)" type="email" value={editFormData.email} readOnly />
          <Input label="Phone Number (Read-only)" value={editFormData.phone} readOnly />
          <Input label="Specialization (e.g. HIIT, Yoga)" value={editFormData.specialization} onChange={(e) => setEditFormData({...editFormData, specialization: e.target.value})} required />
          <Input label="Salary / Month" type="number" value={editFormData.salary} onChange={(e) => setEditFormData({...editFormData, salary: e.target.value})} />
          
          <div className="flex items-center gap-2 mt-4">
            <input 
              type="checkbox" 
              id="isActiveTrainer" 
              checked={editFormData.isActive} 
              onChange={(e) => setEditFormData({...editFormData, isActive: e.target.checked})}
              className="w-4 h-4 rounded border-border bg-white/5 text-primary focus:ring-primary focus:ring-offset-background"
            />
            <label htmlFor="isActiveTrainer" className="text-sm font-medium text-text-main cursor-pointer">Trainer is Active</label>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={editLoading}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Trainer Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove Trainer">
        <div className="space-y-4">
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 text-error">
            <span className="material-symbols-outlined">warning</span>
            <div>
              <h4 className="font-bold text-sm">Delete Trainer: {trainerToDelete?.fullName}?</h4>
              <p className="text-xs mt-1 opacity-90">This action will completely remove the trainer from your gym and safely unassign all their {trainerToDelete?.assignedMembers?.length || 0} members. This action cannot be undone.</p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteTrainer} 
              isLoading={deleteLoading}
              className="bg-error hover:bg-error/90 text-white"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Trainers;
