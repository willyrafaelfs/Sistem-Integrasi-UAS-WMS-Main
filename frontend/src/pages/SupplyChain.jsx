import React, { useState, useEffect } from 'react';
import { Truck, Plus, X, FileText, ChevronLeft, ChevronRight, Search, CheckCircle2, Clock, Package } from 'lucide-react';
import api from '../services/api';
import './SupplyChain.css';

const SupplyChain = () => {
  const [tab, setTab] = useState('suppliers'); // suppliers | po
  
  // Supplier state
  const [suppliers, setSuppliers] = useState([]);
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierTotalPages, setSupplierTotalPages] = useState(1);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ code: '', name: '', contact_person: '', phone: '', email: '', address: '' });

  // PO state
  const [pos, setPos] = useState([]);
  const [poPage, setPoPage] = useState(1);
  const [poTotalPages, setPoTotalPages] = useState(1);
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPoForm] = useState({ supplier_id: '', order_date: '', expected_arrival: '', notes: '', items: [{ product_id: '', ordered_qty: 1 }] });
  const [products, setProducts] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadSuppliers(); loadPOs(); loadProducts(); }, [supplierPage, poPage]);

  const loadSuppliers = async () => {
    try {
      const res = await api.getSuppliers({ page: supplierPage, per_page: 10 });
      setSuppliers(res.data || []);
      setSupplierTotalPages(res.last_page || 1);
      const all = await api.getSuppliers({ per_page: 100 });
      setAllSuppliers(all.data || []);
    } catch (e) { console.error(e); }
  };

  const loadPOs = async () => {
    try {
      const res = await api.getPurchaseOrders({ page: poPage, per_page: 10 });
      setPos(res.data || []);
      setPoTotalPages(res.last_page || 1);
    } catch (e) { console.error(e); }
  };

  const loadProducts = async () => {
    try {
      const res = await api.getProducts({ per_page: 100 });
      setProducts(res.data || res);
    } catch (e) { console.error(e); }
  };

  const saveSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.createSupplier(supplierForm);
      setShowSupplierModal(false);
      setSupplierForm({ code: '', name: '', contact_person: '', phone: '', email: '', address: '' });
      loadSuppliers();
    } catch (err) { alert(err.data?.message || 'Gagal menyimpan supplier'); }
  };

  const deleteSupplier = async (id) => {
    if (!confirm('Hapus supplier ini?')) return;
    try { await api.deleteSupplier(id); loadSuppliers(); } catch (e) { alert('Gagal menghapus'); }
  };

  const savePO = async (e) => {
    e.preventDefault();
    try {
      await api.createPurchaseOrder(poForm);
      setShowPOModal(false);
      setPoForm({ supplier_id: '', order_date: '', expected_arrival: '', notes: '', items: [{ product_id: '', ordered_qty: 1 }] });
      loadPOs();
    } catch (err) { alert(err.data?.message || 'Gagal membuat PO'); }
  };

  const updatePOStatus = async (id, status) => {
    try { await api.updatePOStatus(id, status); loadPOs(); } catch (e) { alert('Gagal update status'); }
  };

  const addPOItem = () => setPoForm(f => ({ ...f, items: [...f.items, { product_id: '', ordered_qty: 1 }] }));
  const removePOItem = (idx) => setPoForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updatePOItem = (idx, field, val) => setPoForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));

  const statusColors = { DRAFT: '#94a3b8', CONFIRMED: '#6366f1', RECEIVING: '#f59e0b', COMPLETED: '#10b981', CANCELLED: '#ef4444' };

  return (
    <div className="sc-container">
      <div className="page-header">
        <div className="header-title">
          <div className="icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)' }}><Truck size={24} className="text-primary" /></div>
          <div><h2>Supply Chain (Hulu)</h2><p className="text-muted">Manajemen Supplier & Purchase Order</p></div>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'suppliers' ? 'active' : ''}`} onClick={() => setTab('suppliers')}>Supplier</button>
        <button className={`tab-btn ${tab === 'po' ? 'active' : ''}`} onClick={() => setTab('po')}>Purchase Order</button>
      </div>

      {tab === 'suppliers' && (
        <div className="glass table-card">
          <div className="table-toolbar">
            <h3 style={{ margin: 0 }}>Master Supplier</h3>
            <button className="primary-btn" onClick={() => setShowSupplierModal(true)}><Plus size={18} /> Tambah Supplier</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Kode</th><th>Nama</th><th>Kontak</th><th>Telepon</th><th>Email</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td className="mono font-medium">{s.code}</td>
                    <td>{s.name}</td>
                    <td>{s.contact_person || '-'}</td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.email || '-'}</td>
                    <td className="text-right"><button className="icon-btn delete" onClick={() => deleteSupplier(s.id)}>×</button></td>
                  </tr>
                ))}
                {suppliers.length === 0 && <tr><td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>Belum ada data supplier.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
            <span className="text-sm text-muted">Hal {supplierPage}/{supplierTotalPages}</span>
            <div className="pagination-buttons">
              <button disabled={supplierPage <= 1} onClick={() => setSupplierPage(p => p - 1)}><ChevronLeft size={18} /></button>
              <button disabled={supplierPage >= supplierTotalPages} onClick={() => setSupplierPage(p => p + 1)}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {tab === 'po' && (
        <div className="glass table-card">
          <div className="table-toolbar">
            <h3 style={{ margin: 0 }}>Purchase Orders</h3>
            <button className="primary-btn" onClick={() => setShowPOModal(true)}><Plus size={18} /> Buat PO Baru</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>No. PO</th><th>Supplier</th><th>Tanggal Order</th><th>ETA Kedatangan</th><th>Status</th><th>Item</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {pos.map(po => (
                  <tr key={po.id}>
                    <td className="mono font-medium">{po.po_number}</td>
                    <td>{po.supplier?.name || '-'}</td>
                    <td>{new Date(po.order_date).toLocaleDateString('id-ID')}</td>
                    <td>{po.expected_arrival ? new Date(po.expected_arrival).toLocaleDateString('id-ID') : '-'}</td>
                    <td><span className="badge" style={{ background: `${statusColors[po.status]}22`, color: statusColors[po.status], border: `1px solid ${statusColors[po.status]}44` }}>{po.status}</span></td>
                    <td>{po.items?.length || 0} SKU</td>
                    <td className="text-right">
                      {po.status === 'CONFIRMED' && <button className="secondary-btn small" onClick={() => updatePOStatus(po.id, 'RECEIVING')}>Terima</button>}
                      {po.status === 'RECEIVING' && <button className="secondary-btn small" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => updatePOStatus(po.id, 'COMPLETED')}>Selesai</button>}
                    </td>
                  </tr>
                ))}
                {pos.length === 0 && <tr><td colSpan="7" className="text-center text-muted" style={{ padding: '2rem' }}>Belum ada Purchase Order.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
            <span className="text-sm text-muted">Hal {poPage}/{poTotalPages}</span>
            <div className="pagination-buttons">
              <button disabled={poPage <= 1} onClick={() => setPoPage(p => p - 1)}><ChevronLeft size={18} /></button>
              <button disabled={poPage >= poTotalPages} onClick={() => setPoPage(p => p + 1)}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header"><h3>Tambah Supplier</h3><button className="icon-btn" onClick={() => setShowSupplierModal(false)}><X size={20} /></button></div>
            <form onSubmit={saveSupplier} className="crud-form">
              <div className="form-row"><div className="form-group"><label>Kode</label><input required value={supplierForm.code} onChange={e => setSupplierForm({ ...supplierForm, code: e.target.value })} /></div><div className="form-group"><label>Nama</label><input required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} /></div></div>
              <div className="form-row"><div className="form-group"><label>Kontak</label><input value={supplierForm.contact_person} onChange={e => setSupplierForm({ ...supplierForm, contact_person: e.target.value })} /></div><div className="form-group"><label>Telepon</label><input value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></div></div>
              <div className="form-group"><label>Email</label><input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} /></div>
              <div className="form-group"><label>Alamat</label><textarea value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} rows={2} /></div>
              <div className="modal-footer"><button type="button" className="secondary-btn" onClick={() => setShowSupplierModal(false)}>Batal</button><button type="submit" className="primary-btn">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {showPOModal && (
        <div className="modal-overlay">
          <div className="modal-content glass wide">
            <div className="modal-header"><h3>Buat Purchase Order</h3><button className="icon-btn" onClick={() => setShowPOModal(false)}><X size={20} /></button></div>
            <form onSubmit={savePO} className="crud-form">
              <div className="form-row">
                <div className="form-group"><label>Supplier</label><select required value={poForm.supplier_id} onChange={e => setPoForm({ ...poForm, supplier_id: e.target.value })}><option value="">Pilih Supplier</option>{allSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="form-group"><label>Tgl Order</label><input required type="date" value={poForm.order_date} onChange={e => setPoForm({ ...poForm, order_date: e.target.value })} /></div>
                <div className="form-group"><label>ETA Kedatangan</label><input type="date" value={poForm.expected_arrival} onChange={e => setPoForm({ ...poForm, expected_arrival: e.target.value })} /></div>
              </div>
              <h4 style={{ margin: '1rem 0 0.5rem' }}>Item Pesanan</h4>
              {poForm.items.map((item, idx) => (
                <div key={idx} className="form-row" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 2 }}><label>Produk</label><select required value={item.product_id} onChange={e => updatePOItem(idx, 'product_id', e.target.value)}><option value="">Pilih Produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}</select></div>
                  <div className="form-group" style={{ flex: 1 }}><label>Qty</label><input required type="number" min="1" value={item.ordered_qty} onChange={e => updatePOItem(idx, 'ordered_qty', parseInt(e.target.value))} /></div>
                  {poForm.items.length > 1 && <button type="button" className="icon-btn delete" onClick={() => removePOItem(idx)} style={{ marginBottom: '0.4rem' }}>×</button>}
                </div>
              ))}
              <button type="button" className="secondary-btn" onClick={addPOItem} style={{ alignSelf: 'flex-start' }}><Plus size={16} /> Tambah Item</button>
              <div className="form-group"><label>Catatan</label><textarea value={poForm.notes} onChange={e => setPoForm({ ...poForm, notes: e.target.value })} rows={2} /></div>
              <div className="modal-footer"><button type="button" className="secondary-btn" onClick={() => setShowPOModal(false)}>Batal</button><button type="submit" className="primary-btn">Buat PO</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChain;
