import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, TablePagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { attendanceService } from '../api/attendanceService';
import { memberService } from '../api/memberService';

const Attendance = () => {
  const [stats, setStats] = useState(null);
  
  // History state
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');

  // Check-in state
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [notes, setNotes] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        attendanceService.getTodayStats(),
        attendanceService.getHistory({ page, limit: 15, date: dateFilter })
      ]);
      setStats(statsRes.data.data);
      setRecords(historyRes.data.data.records);
      setPagination(historyRes.data.data.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dateFilter]);

  const openCheckIn = async () => {
    setIsCheckInModalOpen(true);
    setCheckInError('');
    setSelectedMember('');
    setNotes('');
    try {
      const res = await memberService.getAll({ limit: 150 });
      setMembers(res.data.data.members);
    } catch (e) {}
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setCheckInLoading(true);
    setCheckInError('');
    try {
      await attendanceService.checkIn({ memberId: selectedMember, notes });
      setIsCheckInModalOpen(false);
      setSelectedMember('');
      setNotes('');
      fetchData(); // refresh data
    } catch (error) {
      setCheckInError(error.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await attendanceService.checkOut(id);
      fetchData();
    } catch (error) {
      alert('Check-out failed');
    }
  };

  const columns = [
    {
      header: 'Member',
      cell: (row) => (
        <div>
          <div className="font-bold text-text-main">{row.memberId?.name}</div>
          <div className="text-xs text-text-muted">{row.memberId?.phone}</div>
        </div>
      )
    },
    {
      header: 'Membership Plan',
      cell: (row) => (
        <div>
          {row.memberId?.planId ? (
            <span className="font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full text-xs border border-primary/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              {row.memberId.planId.name}
            </span>
          ) : (
            <span className="font-medium text-text-muted bg-white/5 px-2.5 py-1 rounded-full text-xs">
              No Plan
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Membership Status',
      cell: (row) => {
        const status = row.memberId?.status || 'inactive';
        let variant = 'default';
        if (status === 'active') variant = 'success';
        else if (status === 'expiring') variant = 'warning';
        else if (status === 'expired') variant = 'danger';
        
        return <Badge variant={variant}>{status}</Badge>;
      }
    },
    {
      header: 'Date',
      cell: (row) => <span className="text-sm font-medium">{new Date(row.date).toLocaleDateString()}</span>
    },
    {
      header: 'Check In',
      cell: (row) => (
        <span className="text-success font-bold font-display text-lg">
          {new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      header: 'Check Out',
      cell: (row) => (
        row.checkOutTime ? (
          <span className="text-text-secondary font-display text-lg">
            {new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <Button variant="secondary" onClick={() => handleCheckOut(row._id)}>Check Out</Button>
        )
      )
    },
    {
      header: 'Status',
      cell: (row) => (
        row.checkOutTime ? <Badge variant="default">Completed</Badge> : <Badge variant="success">Currently In</Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight font-display drop-shadow-md">Attendance</h2>
          <p className="text-sm text-text-secondary mt-1 font-medium">Track daily gym footfall and member check-ins.</p>
        </div>
        <Button icon="how_to_reg" onClick={openCheckIn}>Record Check-in</Button>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-gradient-primary/5 border-t-2 border-t-primary/30 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Today's Total Check-ins</p>
              <p className="text-4xl font-bold font-display">{stats.totalToday}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[32px]">groups</span>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-success/5 border-t-2 border-t-success/30 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-success uppercase tracking-widest mb-1">Currently In Gym</p>
              <p className="text-4xl font-bold font-display text-success">{stats.currentlyIn}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success">
              <span className="material-symbols-outlined text-[32px]">directions_run</span>
            </div>
          </Card>
        </div>
      )}

      {/* History */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold font-display text-text-main">Check-in History</h3>
          <input 
            type="date" 
            className="bg-surface border border-border text-text-main rounded-lg px-4 py-2 text-sm outline-none focus:border-primary"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Table 
          columns={columns} 
          data={records} 
          isLoading={loading} 
          emptyState="No check-in records found."
          emptyStateIcon="directions_run"
          emptyStateAction={
            <Button icon="add" onClick={openCheckIn}>Start Check-in</Button>
          }
        />
        <TablePagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Check In Modal */}
      <Modal isOpen={isCheckInModalOpen} onClose={() => setIsCheckInModalOpen(false)} title="Record Check-in">
        <form onSubmit={handleCheckIn} className="space-y-4">
          {checkInError && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium flex items-start gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>{checkInError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Select Member</label>
            <select 
              className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              required
            >
              <option value="">Search member...</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.phone}) — {m.status.toUpperCase()} [{m.planId?.name || 'No Plan'}]
                </option>
              ))}
            </select>

            {/* Selected Member Inline Status Warning */}
            {(() => {
              const sel = members.find(m => m._id === selectedMember);
              if (!sel) return null;
              
              if (sel.status === 'expired') {
                return (
                  <p className="text-xs text-error font-medium pl-1 flex items-center gap-1.5 pt-1">
                    <span className="material-symbols-outlined text-[14px]">report_problem</span>
                    Expired member. Renew membership to permit check-in.
                  </p>
                );
              }
              if (sel.status === 'expiring') {
                return (
                  <p className="text-xs text-warning font-medium pl-1 flex items-center gap-1.5 pt-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Expiring soon. Advise member to pay renewal dues.
                  </p>
                );
              }
              if (sel.status === 'inactive') {
                return (
                  <p className="text-xs text-error font-medium pl-1 flex items-center gap-1.5 pt-1">
                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                    Inactive account. Check-in is blocked.
                  </p>
                );
              }
              return (
                <p className="text-xs text-success font-medium pl-1 flex items-center gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Active membership ({sel.planId?.name || 'Assigned Plan'}).
                </p>
              );
            })()}
          </div>
          <Input label="Notes (Optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsCheckInModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={checkInLoading}>Check In</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Attendance;
