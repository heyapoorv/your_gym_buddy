import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, TablePagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Spinner, FullPageSpinner } from '../components/ui/Spinner';
import { memberService } from '../api/memberService';
import { planService } from '../api/planService';
import { trainerService } from '../api/trainerService';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', planId: '', trainerId: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', email: '', phone: '', planId: '', trainerId: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchData = async (currentPage = page) => {
    setLoading(true);
    try {
      const [membersRes, statsRes, plansRes, trainersRes] = await Promise.all([
        memberService.getAll({ page: currentPage, limit: 10, search, status: statusFilter }),
        memberService.getStats(),
        planService.getAll(),
        trainerService.getAll()
      ]);
      setMembers(membersRes.data.data.members);
      setPagination(membersRes.data.data.pagination);
      setStats(statsRes.data.data);
      setPlans(plansRes.data.data.plans);
      setTrainers(trainersRes.data.data.trainers);
    } catch (error) {
      setFetchError('Failed to load members data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    // search is now in the dependency array, so setPage(1) or search update will trigger it
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError('');
    try {
      await memberService.create(addForm);
      setIsAddModalOpen(false);
      setAddForm({ name: '', email: '', phone: '', planId: '', trainerId: '' });
      fetchData();
    } catch (error) {
      setAddError(error.response?.data?.message || 'Failed to add member.');
    } finally {
      setIsAdding(false);
    }
  };

  const openEditModal = (member) => {
    setEditForm({
      id: member._id,
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      planId: member.planId?._id || '',
      trainerId: member.trainerId || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    setEditError('');
    try {
      await memberService.update(editForm.id, editForm);
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      setEditError(error.response?.data?.message || 'Failed to update member.');
    } finally {
      setIsEditing(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { v: 'success', l: 'Active' },
      expiring: { v: 'warning', l: 'Expiring' },
      expired: { v: 'danger', l: 'Expired' },
      inactive: { v: 'secondary', l: 'Inactive' }
    };
    const b = map[status] || map.inactive;
    return <Badge variant={b.v}>{b.l}</Badge>;
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to deactivate this member?')) return;
    try {
      await memberService.remove(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to deactivate member.');
    }
  };

  const columns = [
    {
      header: 'Member',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold font-display">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-text-main">{row.name}</div>
            <div className="text-xs text-text-muted">{row.email || row.phone}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Plan',
      cell: (row) => (
        <div>
          <div className="font-semibold">{row.planId?.name || 'No Plan'}</div>
          {row.planEndDate && (
            <div className="text-xs text-text-muted">
              Exp: {new Date(row.planEndDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openEditModal(row); }}>
            Edit
          </Button>
          <Button onClick={(e) => handleDelete(e, row._id)} className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 text-xs px-3">
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight font-display drop-shadow-md">Members</h2>
          <p className="text-sm text-text-secondary mt-1 font-medium">Manage your gym members and subscriptions.</p>
        </div>
        <Button icon="add" onClick={() => setIsAddModalOpen(true)}>
          Add Member
        </Button>
      </header>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white/5 border-t border-t-white/10">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Total Members</p>
            <p className="text-2xl font-bold font-display">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-gradient-success/5 border-t border-t-success/20">
            <p className="text-xs font-bold text-success uppercase tracking-widest mb-1">Active</p>
            <p className="text-2xl font-bold font-display text-success">{stats.active}</p>
          </Card>
          <Card className="p-4 bg-gradient-revenue/5 border-t border-t-warning/20">
            <p className="text-xs font-bold text-warning uppercase tracking-widest mb-1">Expiring Soon</p>
            <p className="text-2xl font-bold font-display text-warning">{stats.expiring}</p>
          </Card>
          <Card className="p-4 bg-error/5 border-t border-t-error/20">
            <p className="text-xs font-bold text-error uppercase tracking-widest mb-1">Expired</p>
            <p className="text-2xl font-bold font-display text-error">{stats.expired}</p>
          </Card>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface/50 p-4 rounded-xl border border-border">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <Input 
            placeholder="Search name, phone, email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button variant="secondary" type="submit" icon="search">Search</Button>
        </form>
        <select 
          className="bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary w-full sm:w-auto"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Main Table */}
      {fetchError ? (
        <div className="text-center p-8 text-error bg-error/10 rounded-xl border border-error/20">{fetchError}</div>
      ) : (
        <>
          <Table 
            columns={columns} 
            data={members} 
            isLoading={loading} 
            emptyState="No members found."
            emptyStateIcon="group"
            emptyStateAction={
              <Button icon="add" onClick={() => setIsAddModalOpen(true)}>Add First Member</Button>
            }
            onRowClick={(row) => openEditModal(row)}
          />
          <TablePagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {/* Add Member Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Member">
        {addError && <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm border border-error/20">{addError}</div>}
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input label="Full Name" value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Phone Number" value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})} />
            <Input label="Email (Optional)" type="email" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Assign Plan</label>
              <select 
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                value={addForm.planId}
                onChange={(e) => setAddForm({...addForm, planId: e.target.value})}
              >
                <option value="">No Plan (Walk-in)</option>
                {plans.map(p => (
                  <option key={p._id} value={p._id}>{p.name} - ₹{p.price} ({p.durationDays} days)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Assign Trainer</label>
              <select 
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                value={addForm.trainerId}
                onChange={(e) => setAddForm({...addForm, trainerId: e.target.value})}
              >
                <option value="">No Trainer</option>
                {trainers.map(t => (
                  <option key={t._id} value={t.userId?._id || t.userId}>{t.fullName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isAdding}>Add Member</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Member">
        {editError && <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm border border-error/20">{editError}</div>}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input label="Full Name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Phone Number" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
            <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Plan</label>
              <select 
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={editForm.planId}
                onChange={(e) => setEditForm({...editForm, planId: e.target.value})}
              >
                <option value="">No Plan</option>
                {plans.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Trainer</label>
              <select 
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                value={editForm.trainerId}
                onChange={(e) => setEditForm({...editForm, trainerId: e.target.value})}
              >
                <option value="">No Trainer</option>
                {trainers.map(t => (
                  <option key={t._id} value={t.userId?._id || t.userId}>{t.fullName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isEditing}>Save Changes</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Members;
