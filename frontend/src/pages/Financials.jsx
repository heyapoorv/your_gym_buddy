import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, TablePagination } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { paymentService } from '../api/paymentService';
import { planService } from '../api/planService';
import { memberService } from '../api/memberService'; // needed to select member for payment

const Financials = () => {
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'plans'
  
  // Payment State
  const [payments, setPayments] = useState([]);
  const [payPagination, setPayPagination] = useState(null);
  const [payStats, setPayStats] = useState(null);
  const [payLoading, setPayLoading] = useState(true);
  const [payPage, setPayPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  // Plans State
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [paymentToEdit, setPaymentToEdit] = useState(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  const fetchPayments = async () => {
    setPayLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        paymentService.getStats(),
        paymentService.getAll({ page: payPage, limit: 10, status: statusFilter })
      ]);
      setPayStats(statsRes.data.data);
      setPayments(listRes.data.data.payments);
      setPayPagination(listRes.data.data.pagination);
    } catch (error) {
      console.error(error);
    } finally {
      setPayLoading(false);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await planService.getAll();
      setPlans(res.data.data.plans);
    } catch (error) {
      console.error(error);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'plans') fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, payPage, statusFilter]);

  // Payment Form
  const [members, setMembers] = useState([]);
  const [payForm, setPayForm] = useState({ memberId: '', amount: '', paymentMethod: 'cash', type: 'membership', description: '' });
  const [paySubmitting, setPaySubmitting] = useState(false);

  const openPaymentModal = async () => {
    setIsPaymentModalOpen(true);
    try {
      // Just fetch active members for the dropdown
      const res = await memberService.getAll({ status: 'active', limit: 100 });
      setMembers(res.data.data.members);
    } catch (e) {}
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaySubmitting(true);
    try {
      await paymentService.create({ ...payForm, status: 'success' });
      setIsPaymentModalOpen(false);
      setPayForm({ memberId: '', amount: '', paymentMethod: 'cash', type: 'membership', description: '' });
      fetchPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Payment failed');
    } finally {
      setPaySubmitting(false);
    }
  };

  // Plan Form
  const [planForm, setPlanForm] = useState({ name: '', price: '', durationDays: 30, description: '' });
  const [planSubmitting, setPlanSubmitting] = useState(false);

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setPlanSubmitting(true);
    try {
      await planService.create(planForm);
      setIsPlanModalOpen(false);
      setPlanForm({ name: '', price: '', durationDays: 30, description: '' });
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.message || 'Plan creation failed');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleEditPlanSubmit = async (e) => {
    e.preventDefault();
    setPlanSubmitting(true);
    try {
      await planService.update(planToEdit._id, {
        name: planToEdit.name,
        price: Number(planToEdit.price),
        durationDays: Number(planToEdit.durationDays),
        description: planToEdit.description
      });
      setIsEditPlanModalOpen(false);
      setPlanToEdit(null);
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.message || 'Plan update failed');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await planService.remove(id);
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.message || 'Deletion blocked or failed.');
    }
  };

  const handleEditPaymentSubmit = async (e) => {
    e.preventDefault();
    setPaySubmitting(true);
    try {
      await paymentService.update(paymentToEdit._id, {
        status: paymentToEdit.status
      });
      setIsEditPaymentModalOpen(false);
      setPaymentToEdit(null);
      fetchPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Payment update failed');
    } finally {
      setPaySubmitting(false);
    }
  };

  const generateInvoice = (payment) => {
    setInvoiceToPrint(payment);
  };

  const printInvoice = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const map = {
      success: { v: 'success', l: 'Paid' },
      pending: { v: 'warning', l: 'Pending' },
      failed: { v: 'danger', l: 'Failed' },
      refunded: { v: 'secondary', l: 'Refunded' }
    };
    const b = map[status] || map.pending;
    return <Badge variant={b.v}>{b.l}</Badge>;
  };

  const payColumns = [
    {
      header: 'Member',
      cell: (row) => (
        <div>
          <div className="font-bold text-text-main">{row.memberId?.name || 'Unknown'}</div>
          <div className="text-xs text-text-muted">{row.memberId?.phone || ''}</div>
        </div>
      )
    },
    {
      header: 'Amount',
      cell: (row) => <span className="font-bold font-display text-text-main">₹{row.amount}</span>
    },
    {
      header: 'Type & Method',
      cell: (row) => (
        <div>
          <div className="text-sm capitalize">{row.type.replace('_', ' ')}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">{row.paymentMethod}</div>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Date',
      cell: (row) => <span className="text-sm text-text-secondary">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button onClick={() => { setPaymentToEdit(row); setIsEditPaymentModalOpen(true); }} className="text-primary text-xs font-bold hover:underline">Update</button>
          {row.status === 'success' && (
             <button onClick={() => generateInvoice(row)} className="text-text-muted hover:text-white transition-colors text-xs font-bold border border-white/10 bg-white/5 px-2 py-1 rounded">Invoice</button>
          )}
        </div>
      )
    }
  ];

  const planColumns = [
    {
      header: 'Plan Name',
      cell: (row) => (
        <div>
          <div className="font-bold text-text-main">{row.name}</div>
          <div className="text-xs text-text-muted">{row.description}</div>
        </div>
      )
    },
    {
      header: 'Price',
      cell: (row) => <span className="font-bold font-display text-success">₹{row.price}</span>
    },
    {
      header: 'Duration',
      cell: (row) => <span className="text-sm text-text-secondary">{row.durationDays} Days</span>
    },
    {
      header: 'Status',
      cell: (row) => (row.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>)
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-3">
          <button onClick={() => { setPlanToEdit(row); setIsEditPlanModalOpen(true); }} className="text-text-muted hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
          <button onClick={() => handleDeletePlan(row._id)} className="text-text-muted hover:text-error transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-3xl font-bold text-text-main tracking-tight font-display drop-shadow-md">Financials</h2>
          <p className="text-sm text-text-secondary mt-1 font-medium">Manage revenue, payments, and membership tiers.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon="sell" onClick={() => setIsPlanModalOpen(true)}>New Plan</Button>
          <Button icon="payments" onClick={openPaymentModal}>Record Payment</Button>
        </div>
      </header>

      {/* KPI Cards */}
      {payStats && activeTab === 'payments' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-revenue/10 border-t border-t-warning/30">
            <p className="text-xs font-bold text-warning uppercase tracking-widest mb-1">Monthly MRR</p>
            <p className="text-2xl font-bold font-display text-warning">₹{payStats.monthlyRevenue.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-white/5 border-t border-t-white/10">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-2xl font-bold font-display">₹{payStats.totalRevenue.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-warning/5 border-t border-t-warning/20">
            <p className="text-xs font-bold text-warning uppercase tracking-widest mb-1">Pending Dues</p>
            <p className="text-2xl font-bold font-display text-warning">{payStats.pendingCount}</p>
          </Card>
          <Card className="p-4 bg-error/5 border-t border-t-error/20">
            <p className="text-xs font-bold text-error uppercase tracking-widest mb-1">Failed Payments</p>
            <p className="text-2xl font-bold font-display text-error">{payStats.failedCount}</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'
          }`}
          onClick={() => setActiveTab('payments')}
        >
          Transaction History
        </button>
        <button
          className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'plans' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'
          }`}
          onClick={() => setActiveTab('plans')}
        >
          Membership Plans
        </button>
      </div>

      {/* Content */}
      {activeTab === 'payments' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <select 
              className="bg-surface border border-border text-text-main rounded-lg px-4 py-2 text-sm outline-none focus:border-primary"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPayPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="success">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <Table 
            columns={payColumns} 
            data={payments} 
            isLoading={payLoading} 
            emptyState="No payments recorded."
            emptyStateIcon="payments"
            emptyStateAction={
              <Button icon="add" onClick={openPaymentModal}>Record First Payment</Button>
            }
          />
          <TablePagination pagination={payPagination} onPageChange={setPayPage} />
        </div>
      ) : (
        <Table 
          columns={planColumns} 
          data={plans} 
          isLoading={plansLoading} 
          emptyState="No plans created yet."
          emptyStateIcon="sell"
          emptyStateAction={
            <Button icon="add" onClick={() => setIsPlanModalOpen(true)}>Create First Plan</Button>
          }
        />
      )}

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Member</label>
            <select 
              className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm"
              value={payForm.memberId}
              onChange={(e) => setPayForm({...payForm, memberId: e.target.value})}
              required
            >
              <option value="">Select Member...</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.phone})</option>)}
            </select>
          </div>
          <Input label="Amount (₹)" type="number" min="0" value={payForm.amount} onChange={(e) => setPayForm({...payForm, amount: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Type</label>
              <select 
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm"
                value={payForm.type}
                onChange={(e) => setPayForm({...payForm, type: e.target.value})}
              >
                <option value="membership">Membership</option>
                <option value="pt_session">PT Session</option>
                <option value="supplement">Supplement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">Method</label>
              <select 
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm"
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({...payForm, paymentMethod: e.target.value})}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <Input label="Description (Optional)" value={payForm.description} onChange={(e) => setPayForm({...payForm, description: e.target.value})} />
          
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={paySubmitting}>Save Payment</Button>
          </div>
        </form>
      </Modal>

      {/* New Plan Modal */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Create Membership Plan">
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <Input label="Plan Name" placeholder="e.g. Monthly Standard" value={planForm.name} onChange={(e) => setPlanForm({...planForm, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" min="0" value={planForm.price} onChange={(e) => setPlanForm({...planForm, price: e.target.value})} required />
            <Input label="Duration (Days)" type="number" min="1" value={planForm.durationDays} onChange={(e) => setPlanForm({...planForm, durationDays: e.target.value})} required />
          </div>
          <Input label="Description (Optional)" value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})} />
          
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsPlanModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={planSubmitting}>Create Plan</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      {planToEdit && (
        <Modal isOpen={isEditPlanModalOpen} onClose={() => setIsEditPlanModalOpen(false)} title="Edit Membership Plan">
          <form onSubmit={handleEditPlanSubmit} className="space-y-4">
            <Input label="Plan Name" value={planToEdit.name} onChange={(e) => setPlanToEdit({...planToEdit, name: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" min="0" value={planToEdit.price} onChange={(e) => setPlanToEdit({...planToEdit, price: e.target.value})} required />
              <Input label="Duration (Days)" type="number" min="1" value={planToEdit.durationDays} onChange={(e) => setPlanToEdit({...planToEdit, durationDays: e.target.value})} required />
            </div>
            <Input label="Description (Optional)" value={planToEdit.description} onChange={(e) => setPlanToEdit({...planToEdit, description: e.target.value})} />
            
            <div className="pt-4 flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setIsEditPlanModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={planSubmitting}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Payment Modal */}
      {paymentToEdit && (
        <Modal isOpen={isEditPaymentModalOpen} onClose={() => setIsEditPaymentModalOpen(false)} title="Update Payment Status">
          <form onSubmit={handleEditPaymentSubmit} className="space-y-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Payment For</p>
              <p className="font-bold text-text-main">{paymentToEdit.memberId?.name} — ₹{paymentToEdit.amount}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest block pl-1">New Status</label>
              <select 
                className="w-full bg-surface border border-border text-text-main rounded-lg px-4 py-2.5 text-sm"
                value={paymentToEdit.status}
                onChange={(e) => setPaymentToEdit({...paymentToEdit, status: e.target.value})}
              >
                <option value="pending">Pending</option>
                <option value="success">Success (Paid)</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setIsEditPaymentModalOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={paySubmitting}>Update Status</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invoice Modal (Printable) */}
      <Modal isOpen={!!invoiceToPrint} onClose={() => setInvoiceToPrint(null)} title="Invoice">
        {invoiceToPrint && (
          <div className="space-y-6">
            <div id="invoice-content" className="p-8 bg-white text-black rounded-xl max-w-2xl mx-auto border print:shadow-none print:border-none print:m-0 print:p-0">
              <div className="flex justify-between items-start border-b border-black/10 pb-6 mb-6">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-black">GymOS</h1>
                  <p className="text-sm text-gray-500 font-medium">Professional Fitness CRM</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold uppercase tracking-widest text-gray-400 mb-1">Invoice</h2>
                  <p className="text-sm font-bold text-gray-800">#INV-{invoiceToPrint._id.substring(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(invoiceToPrint.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Billed To</p>
                  <p className="font-bold text-lg text-gray-800">{invoiceToPrint.memberId?.name}</p>
                  <p className="text-sm text-gray-600">{invoiceToPrint.memberId?.email || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{invoiceToPrint.memberId?.phone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Status</p>
                  <p className="font-bold text-lg text-green-600 uppercase tracking-wider">PAID</p>
                  <p className="text-sm text-gray-600 capitalize">Method: {invoiceToPrint.paymentMethod.replace('_', ' ')}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse mb-8">
                <thead>
                  <tr className="border-b-2 border-black/10">
                    <th className="py-3 font-bold text-sm text-gray-400 uppercase tracking-widest">Description</th>
                    <th className="py-3 font-bold text-sm text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black/5">
                    <td className="py-4 text-gray-800 font-medium capitalize">
                      {invoiceToPrint.type.replace('_', ' ')}
                      {invoiceToPrint.description && <div className="text-sm text-gray-500 font-normal mt-1">{invoiceToPrint.description}</div>}
                    </td>
                    <td className="py-4 text-gray-800 font-bold text-right text-lg">₹{invoiceToPrint.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-1/2">
                  <div className="flex justify-between py-2 font-bold text-xl border-t-2 border-black/10 pt-4">
                    <span>Total Paid</span>
                    <span>₹{invoiceToPrint.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 text-center text-xs font-medium text-gray-400 border-t border-black/10 pt-6">
                Thank you for your business! Generated by GymOS.
              </div>
            </div>

            <style>{`
              @media print {
                body * { visibility: hidden; }
                #invoice-content, #invoice-content * { visibility: visible; }
                #invoice-content { position: absolute; left: 0; top: 0; width: 100%; }
              }
            `}</style>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="secondary" onClick={() => setInvoiceToPrint(null)}>Close</Button>
              <Button onClick={printInvoice} icon="print">Print / Save PDF</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Financials;
