import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, CheckCircle2, XCircle, Clock, Search, ListFilter, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import './SupplyChain.css';

const Approvals = () => {
  const [tab, setTab] = useState('approvals');
  
  const [approvals, setApprovals] = useState([]);
  const [approvalPage, setApprovalPage] = useState(1);
  const [approvalTotalPages, setApprovalTotalPages] = useState(1);
  const [approvalTotal, setApprovalTotal] = useState(0);

  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [activeApproval, setActiveApproval] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState('APPROVED');

  useEffect(() => {
    if (tab === 'approvals') loadApprovals();
    else loadLogs();
  }, [tab, logPage, approvalPage]);

  const loadApprovals = async () => {
    try {
      const res = await api.getPendingApprovals();
      setApprovals(res.data || []);
      setApprovalTotalPages(res.last_page || 1);
      setApprovalTotal(res.total || 0);
    } catch (e) { console.error(e); }
  };

  const loadLogs = async () => {
    try { 
      const res = await api.getActivityLogs(logPage); 
      setLogs(res.data || []); 
      setLogTotalPages(res.last_page || 1);
    } catch (e) { console.error(e); }
  };

  const openProcessModal = (trx, action) => {
    setActiveApproval(trx);
    setApprovalAction(action);
    setApprovalNotes('');
    setShowNotesModal(true);
  };

  const submitProcess = async (e) => {
    e.preventDefault();
    try {
      await api.processApproval(activeApproval.id, { status: approvalAction, notes: approvalNotes });
      setShowNotesModal(false);
      loadApprovals();
    } catch (e) {
      alert(e.data?.message || 'Gagal memproses approval.');
    }
  };

  return (
    <div className="ff-container">
      <div className="page-header">
        <div className="header-title">
          <div className="icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)' }}><ShieldCheck size={24} className="text-danger" style={{color: '#ef4444'}} /></div>
          <div><h2>Audit & Approvals</h2><p className="text-muted">General Audit Trail & WMS Authorization Workflow</p></div>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'approvals' ? 'active' : ''}`} onClick={() => setTab('approvals')}>Pending Approvals</button>
        <button className={`tab-btn ${tab === 'audit_logs' ? 'active' : ''}`} onClick={() => setTab('audit_logs')}>Activity Logs</button>
      </div>

      {tab === 'approvals' && (
        <div className="glass table-card">
          <div className="table-toolbar">
            <h3 style={{ margin: 0 }}>Otorisasi Transaksi Gudang</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Trx Code</th><th>Tipe</th><th>Produk</th><th>Source / Dest</th><th>Qty</th><th>Waktu Transaksi</th><th className="text-right">Aksi Supervisor</th></tr></thead>
              <tbody>
                {approvals.map(a => (
                  <tr key={a.id}>
                    <td className="mono font-medium text-primary">{a.transaction_code}</td>
                    <td><span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>{a.type}</span></td>
                    <td>{a.product?.sku}</td>
                    <td className="text-sm">
                      {a.source_location ? `${a.source_location.barcode}` : '-'} <br/> 
                      <span className="text-muted">to</span> {a.destination_location ? `${a.destination_location.barcode}` : '-'}
                    </td>
                    <td className="font-bold">{a.quantity}</td>
                    <td className="text-sm text-muted">{new Date(a.created_at).toLocaleString('id-ID')}</td>
                    <td className="text-right">
                      <button className="icon-btn" style={{color: '#10b981', background: 'rgba(16,185,129,0.1)', marginRight: '0.5rem'}} onClick={() => openProcessModal(a, 'APPROVED')} title="Approve"><CheckCircle2 size={18}/></button>
                      <button className="icon-btn" style={{color: '#ef4444', background: 'rgba(239,68,68,0.1)'}} onClick={() => openProcessModal(a, 'REJECTED')} title="Reject"><XCircle size={18}/></button>
                    </td>
                  </tr>
                ))}
                {approvals.length === 0 && <tr><td colSpan="7" className="text-center text-muted" style={{ padding: '3rem' }}>Tidak ada antrean approval. Semua bersih! ✨</td></tr>}
              </tbody>
            </table>
          </div>
          {approvalTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total: {approvalTotal} transaksi pending</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button disabled={approvalPage <= 1} onClick={() => setApprovalPage(p => p - 1)} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}>← Prev</button>
                <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hal {approvalPage}/{approvalTotalPages}</span>
                <button disabled={approvalPage >= approvalTotalPages} onClick={() => setApprovalPage(p => p + 1)} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'audit_logs' && (
        <div className="glass table-card">
          <div className="table-toolbar"><h3 style={{ margin: 0 }}><Activity size={18} style={{display: 'inline', marginRight: '0.5rem'}}/> Log Aktivitas Pengguna</h3></div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Modul</th><th>Deskripsi</th><th>IP Address</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td className="text-sm text-muted">{new Date(l.created_at).toLocaleString('id-ID')}</td>
                    <td>{l.user?.username || 'System'}</td>
                    <td><span className="badge" style={{background: 'rgba(99,102,241,0.1)', color: '#818cf8'}}>{l.action}</span></td>
                    <td className="text-sm mono">{l.model_type}</td>
                    <td className="text-sm">{l.description}</td>
                    <td className="text-sm mono text-muted">{l.ip_address || '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan="6" className="text-center text-muted" style={{ padding: '3rem' }}>Belum ada log.</td></tr>}
              </tbody>
            </table>
          </div>
          {logTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', gap: '0.5rem' }}>
              <button disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}>← Prev</button>
              <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hal {logPage}/{logTotalPages}</span>
              <button disabled={logPage >= logTotalPages} onClick={() => setLogPage(p => p + 1)} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Approval Modal */}
      {showNotesModal && (
        <div className="modal-overlay">
          <div className="modal-content glass small">
            <h3>Konfirmasi {approvalAction === 'APPROVED' ? 'Persetujuan' : 'Penolakan'}</h3>
            <p className="text-muted text-sm">Transaksi: <span className="mono">{activeApproval?.transaction_code}</span></p>
            <form onSubmit={submitProcess} style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label>Catatan Supervisor (Opsional)</label>
                <textarea rows="3" value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} placeholder="Alasan approval/rejection..." style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}></textarea>
              </div>
              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowNotesModal(false)}>Batal</button>
                <button type="submit" className="primary-btn" style={{ background: approvalAction === 'APPROVED' ? '#10b981' : '#ef4444' }}>{approvalAction === 'APPROVED' ? 'Ya, Approve' : 'Tolak Transaksi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
