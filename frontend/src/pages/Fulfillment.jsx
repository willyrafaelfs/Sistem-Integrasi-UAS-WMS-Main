import React, { useState, useEffect } from 'react';
import { Users, Plus, X, ChevronLeft, ChevronRight, ShoppingCart, PackageCheck, Truck as TruckIcon } from 'lucide-react';
import api from '../services/api';
import './SupplyChain.css'; // shared styles

const Fulfillment = () => {
  const [tab, setTab] = useState('customers'); // customers | so | shipments

  // Customer
  const [customers, setCustomers] = useState([]);
  const [custPage, setCustPage] = useState(1);
  const [custTotalPages, setCustTotalPages] = useState(1);
  const [showCustModal, setShowCustModal] = useState(false);
  const [custForm, setCustForm] = useState({ code: '', name: '', contact_person: '', phone: '', email: '', address: '' });

  // SO
  const [sos, setSos] = useState([]);
  const [soPage, setSoPage] = useState(1);
  const [soTotalPages, setSoTotalPages] = useState(1);
  const [showSOModal, setShowSOModal] = useState(false);
  const [soForm, setSoForm] = useState({ customer_id: '', order_date: '', ship_by_date: '', notes: '', items: [{ product_id: '', ordered_qty: 1 }] });
  const [allCustomers, setAllCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Shipments
  const [shipments, setShipments] = useState([]);
  const [shipPage, setShipPage] = useState(1);
  const [shipTotalPages, setShipTotalPages] = useState(1);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipForm, setShipForm] = useState({ so_id: '', carrier: '', notes: '' });
  const [allSOs, setAllSOs] = useState([]);

  useEffect(() => { loadCustomers(); loadSOs(); loadShipments(); loadProducts(); }, [custPage, soPage, shipPage]);

  const loadCustomers = async () => {
    try {
      const res = await api.getCustomers({ page: custPage, per_page: 10 });
      setCustomers(res.data || []);
      setCustTotalPages(res.last_page || 1);
      const all = await api.getCustomers({ per_page: 100 });
      setAllCustomers(all.data || []);
    } catch (e) { console.error(e); }
  };

  const loadSOs = async () => {
    try {
      const res = await api.getSalesOrders({ page: soPage, per_page: 10 });
      setSos(res.data || []);
      setSoTotalPages(res.last_page || 1);
      const all = await api.getSalesOrders({ per_page: 100 });
      setAllSOs((all.data || []).filter(s => ['CONFIRMED', 'PICKING', 'PACKING'].includes(s.status)));
    } catch (e) { console.error(e); }
  };

  const loadShipments = async () => {
    try {
      const res = await api.getShipments({ page: shipPage, per_page: 10 });
      setShipments(res.data || []);
      setShipTotalPages(res.last_page || 1);
    } catch (e) { console.error(e); }
  };

  const loadProducts = async () => {
    try { const res = await api.getProducts({ per_page: 100 }); setProducts(res.data || res); } catch (e) { console.error(e); }
  };

  const saveCust = async (e) => {
    e.preventDefault();
    try { await api.createCustomer(custForm); setShowCustModal(false); setCustForm({ code: '', name: '', contact_person: '', phone: '', email: '', address: '' }); loadCustomers(); }
    catch (err) { alert(err.data?.message || 'Gagal menyimpan'); }
  };

  const deleteCust = async (id) => {
    if (!confirm('Hapus customer?')) return;
    try { await api.deleteCustomer(id); loadCustomers(); } catch (e) { alert('Gagal menghapus'); }
  };

  const saveSO = async (e) => {
    e.preventDefault();
    try { await api.createSalesOrder(soForm); setShowSOModal(false); setSoForm({ customer_id: '', order_date: '', ship_by_date: '', notes: '', items: [{ product_id: '', ordered_qty: 1 }] }); loadSOs(); }
    catch (err) { alert(err.data?.message || 'Gagal membuat SO'); }
  };

  const updateSOStat = async (id, status) => { try { await api.updateSOStatus(id, status); loadSOs(); loadShipments(); } catch (e) { alert('Gagal'); } };

  const saveShipment = async (e) => {
    e.preventDefault();
    try { await api.createShipment(shipForm); setShowShipModal(false); setShipForm({ so_id: '', carrier: '', notes: '' }); loadShipments(); loadSOs(); }
    catch (err) { alert(err.data?.message || 'Gagal membuat DO'); }
  };

  const updateShipStat = async (id, status) => { try { await api.updateShipmentStatus(id, status); loadShipments(); loadSOs(); } catch (e) { alert('Gagal'); } };

  const addSOItem = () => setSoForm(f => ({ ...f, items: [...f.items, { product_id: '', ordered_qty: 1 }] }));
  const removeSOItem = (idx) => setSoForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateSOItem = (idx, field, val) => setSoForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));

  const soStatusColors = { DRAFT: '#94a3b8', CONFIRMED: '#6366f1', PICKING: '#f59e0b', PACKING: '#8b5cf6', SHIPPED: '#3b82f6', COMPLETED: '#10b981', CANCELLED: '#ef4444' };
  const shipStatusColors = { PACKING: '#f59e0b', READY: '#6366f1', DISPATCHED: '#3b82f6', DELIVERED: '#10b981' };

  return (
    <div className="ff-container">
      <div className="page-header">
        <div className="header-title">
          <div className="icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}><Users size={24} style={{ color: '#10b981' }} /></div>
          <div><h2>Fulfillment (Hilir)</h2><p className="text-muted">Customer, Sales Order, Packing & Shipping</p></div>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'customers' ? 'active' : ''}`} onClick={() => setTab('customers')}>Customer</button>
        <button className={`tab-btn ${tab === 'so' ? 'active' : ''}`} onClick={() => setTab('so')}>Sales Order</button>
        <button className={`tab-btn ${tab === 'shipments' ? 'active' : ''}`} onClick={() => setTab('shipments')}>Shipping / DO</button>
      </div>

      {/* CUSTOMERS TAB */}
      {tab === 'customers' && (
        <div className="glass table-card">
          <div className="table-toolbar"><h3 style={{ margin: 0 }}>Master Customer</h3><button className="primary-btn" onClick={() => setShowCustModal(true)}><Plus size={18} /> Tambah Customer</button></div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Kode</th><th>Nama</th><th>Kontak</th><th>Telepon</th><th>Email</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}><td className="mono font-medium">{c.code}</td><td>{c.name}</td><td>{c.contact_person || '-'}</td><td>{c.phone || '-'}</td><td>{c.email || '-'}</td><td className="text-right"><button className="icon-btn delete" onClick={() => deleteCust(c.id)}>×</button></td></tr>
                ))}
                {customers.length === 0 && <tr><td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>Belum ada customer.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls"><span className="text-sm text-muted">Hal {custPage}/{custTotalPages}</span><div className="pagination-buttons"><button disabled={custPage <= 1} onClick={() => setCustPage(p => p - 1)}><ChevronLeft size={18} /></button><button disabled={custPage >= custTotalPages} onClick={() => setCustPage(p => p + 1)}><ChevronRight size={18} /></button></div></div>
        </div>
      )}

      {/* SALES ORDERS TAB */}
      {tab === 'so' && (
        <div className="glass table-card">
          <div className="table-toolbar"><h3 style={{ margin: 0 }}>Sales Orders</h3><button className="primary-btn" onClick={() => setShowSOModal(true)}><Plus size={18} /> Buat SO Baru</button></div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>No. SO</th><th>Customer</th><th>Tgl Order</th><th>Kirim Sebelum</th><th>Status</th><th>Item</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {sos.map(so => (
                  <tr key={so.id}>
                    <td className="mono font-medium">{so.so_number}</td>
                    <td>{so.customer?.name || '-'}</td>
                    <td>{new Date(so.order_date).toLocaleDateString('id-ID')}</td>
                    <td>{so.ship_by_date ? new Date(so.ship_by_date).toLocaleDateString('id-ID') : '-'}</td>
                    <td><span className="badge" style={{ background: `${soStatusColors[so.status]}22`, color: soStatusColors[so.status], border: `1px solid ${soStatusColors[so.status]}44` }}>{so.status}</span></td>
                    <td>{so.items?.length || 0} SKU</td>
                    <td className="text-right">
                      {so.status === 'CONFIRMED' && <button className="secondary-btn small" onClick={() => updateSOStat(so.id, 'PICKING')}>Picking</button>}
                      {so.status === 'PICKING' && <button className="secondary-btn small" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }} onClick={() => updateSOStat(so.id, 'PACKING')}>Packing</button>}
                    </td>
                  </tr>
                ))}
                {sos.length === 0 && <tr><td colSpan="7" className="text-center text-muted" style={{ padding: '2rem' }}>Belum ada Sales Order.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls"><span className="text-sm text-muted">Hal {soPage}/{soTotalPages}</span><div className="pagination-buttons"><button disabled={soPage <= 1} onClick={() => setSoPage(p => p - 1)}><ChevronLeft size={18} /></button><button disabled={soPage >= soTotalPages} onClick={() => setSoPage(p => p + 1)}><ChevronRight size={18} /></button></div></div>
        </div>
      )}

      {/* SHIPMENTS TAB */}
      {tab === 'shipments' && (
        <div className="glass table-card">
          <div className="table-toolbar"><h3 style={{ margin: 0 }}>Shipping & Delivery Order</h3><button className="primary-btn" onClick={() => setShowShipModal(true)}><Plus size={18} /> Buat Surat Jalan</button></div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>No. DO</th><th>No. SO</th><th>Customer</th><th>Ekspedisi</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {shipments.map(sh => (
                  <tr key={sh.id}>
                    <td className="mono font-medium">{sh.do_number}</td>
                    <td>{sh.sales_order?.so_number || '-'}</td>
                    <td>{sh.customer?.name || '-'}</td>
                    <td>{sh.carrier || '-'}</td>
                    <td><span className="badge" style={{ background: `${shipStatusColors[sh.status]}22`, color: shipStatusColors[sh.status], border: `1px solid ${shipStatusColors[sh.status]}44` }}>{sh.status}</span></td>
                    <td className="text-right">
                      {sh.status === 'PACKING' && <button className="secondary-btn small" onClick={() => updateShipStat(sh.id, 'READY')}>Siap Kirim</button>}
                      {sh.status === 'READY' && <button className="secondary-btn small" style={{ borderColor: '#3b82f6', color: '#3b82f6' }} onClick={() => updateShipStat(sh.id, 'DISPATCHED')}>Dikirim</button>}
                      {sh.status === 'DISPATCHED' && <button className="secondary-btn small" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => updateShipStat(sh.id, 'DELIVERED')}>Terkirim</button>}
                    </td>
                  </tr>
                ))}
                {shipments.length === 0 && <tr><td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>Belum ada Delivery Order.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls"><span className="text-sm text-muted">Hal {shipPage}/{shipTotalPages}</span><div className="pagination-buttons"><button disabled={shipPage <= 1} onClick={() => setShipPage(p => p - 1)}><ChevronLeft size={18} /></button><button disabled={shipPage >= shipTotalPages} onClick={() => setShipPage(p => p + 1)}><ChevronRight size={18} /></button></div></div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustModal && (
        <div className="modal-overlay"><div className="modal-content glass">
          <div className="modal-header"><h3>Tambah Customer</h3><button className="icon-btn" onClick={() => setShowCustModal(false)}><X size={20} /></button></div>
          <form onSubmit={saveCust} className="crud-form">
            <div className="form-row"><div className="form-group"><label>Kode</label><input required value={custForm.code} onChange={e => setCustForm({ ...custForm, code: e.target.value })} /></div><div className="form-group"><label>Nama</label><input required value={custForm.name} onChange={e => setCustForm({ ...custForm, name: e.target.value })} /></div></div>
            <div className="form-row"><div className="form-group"><label>Kontak</label><input value={custForm.contact_person} onChange={e => setCustForm({ ...custForm, contact_person: e.target.value })} /></div><div className="form-group"><label>Telepon</label><input value={custForm.phone} onChange={e => setCustForm({ ...custForm, phone: e.target.value })} /></div></div>
            <div className="form-group"><label>Email</label><input type="email" value={custForm.email} onChange={e => setCustForm({ ...custForm, email: e.target.value })} /></div>
            <div className="form-group"><label>Alamat</label><textarea value={custForm.address} onChange={e => setCustForm({ ...custForm, address: e.target.value })} rows={2} /></div>
            <div className="modal-footer"><button type="button" className="secondary-btn" onClick={() => setShowCustModal(false)}>Batal</button><button type="submit" className="primary-btn">Simpan</button></div>
          </form>
        </div></div>
      )}

      {/* SO Modal */}
      {showSOModal && (
        <div className="modal-overlay"><div className="modal-content glass wide">
          <div className="modal-header"><h3>Buat Sales Order</h3><button className="icon-btn" onClick={() => setShowSOModal(false)}><X size={20} /></button></div>
          <form onSubmit={saveSO} className="crud-form">
            <div className="form-row">
              <div className="form-group"><label>Customer</label><select required value={soForm.customer_id} onChange={e => setSoForm({ ...soForm, customer_id: e.target.value })}><option value="">Pilih Customer</option>{allCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="form-group"><label>Tgl Order</label><input required type="date" value={soForm.order_date} onChange={e => setSoForm({ ...soForm, order_date: e.target.value })} /></div>
              <div className="form-group"><label>Kirim Sebelum</label><input type="date" value={soForm.ship_by_date} onChange={e => setSoForm({ ...soForm, ship_by_date: e.target.value })} /></div>
            </div>
            <h4 style={{ margin: '1rem 0 0.5rem' }}>Item Pesanan</h4>
            {soForm.items.map((item, idx) => (
              <div key={idx} className="form-row" style={{ alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 2 }}><label>Produk</label><select required value={item.product_id} onChange={e => updateSOItem(idx, 'product_id', e.target.value)}><option value="">Pilih</option>{products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}</select></div>
                <div className="form-group" style={{ flex: 1 }}><label>Qty</label><input required type="number" min="1" value={item.ordered_qty} onChange={e => updateSOItem(idx, 'ordered_qty', parseInt(e.target.value))} /></div>
                {soForm.items.length > 1 && <button type="button" className="icon-btn delete" onClick={() => removeSOItem(idx)} style={{ marginBottom: '0.4rem' }}>×</button>}
              </div>
            ))}
            <button type="button" className="secondary-btn" onClick={addSOItem} style={{ alignSelf: 'flex-start' }}><Plus size={16} /> Tambah Item</button>
            <div className="modal-footer"><button type="button" className="secondary-btn" onClick={() => setShowSOModal(false)}>Batal</button><button type="submit" className="primary-btn">Buat SO</button></div>
          </form>
        </div></div>
      )}

      {/* Shipment Modal */}
      {showShipModal && (
        <div className="modal-overlay"><div className="modal-content glass">
          <div className="modal-header"><h3>Buat Surat Jalan / DO</h3><button className="icon-btn" onClick={() => setShowShipModal(false)}><X size={20} /></button></div>
          <form onSubmit={saveShipment} className="crud-form">
            <div className="form-group"><label>Sales Order (SO)</label><select required value={shipForm.so_id} onChange={e => setShipForm({ ...shipForm, so_id: e.target.value })}><option value="">Pilih SO</option>{allSOs.map(s => <option key={s.id} value={s.id}>{s.so_number} — {s.customer?.name || 'N/A'}</option>)}</select></div>
            <div className="form-group"><label>Nama Ekspedisi</label><input value={shipForm.carrier} onChange={e => setShipForm({ ...shipForm, carrier: e.target.value })} placeholder="Contoh: JNE, SiCepat, Internal Truck" /></div>
            <div className="form-group"><label>Catatan</label><textarea value={shipForm.notes} onChange={e => setShipForm({ ...shipForm, notes: e.target.value })} rows={2} /></div>
            <div className="modal-footer"><button type="button" className="secondary-btn" onClick={() => setShowShipModal(false)}>Batal</button><button type="submit" className="primary-btn">Buat DO</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
};

export default Fulfillment;
