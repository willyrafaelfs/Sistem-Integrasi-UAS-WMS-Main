import React, { useState, useEffect } from 'react';
import { ArrowUpFromLine, Search, Route, PackageCheck, Truck, Clock, MapPin, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import './Outbound.css';

const Outbound = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [requestedQty, setRequestedQty] = useState('');
  const [pickList, setPickList] = useState(null);
  const [step, setStep] = useState('select'); // select | picklist | done
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadProducts();
    loadHistory();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.getProducts({ per_page: 100 });
      setProducts(res.data || res);
    } catch (e) { console.error(e); }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data.filter(t => t.type === 'OUTBOUND').slice(0, 10));
    } catch (e) { console.error(e); }
  };

  const handleGeneratePickList = async () => {
    if (!selectedProduct || !requestedQty || requestedQty < 1) return;
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await api.generatePickList(selectedProduct.id, parseInt(requestedQty));
      setPickList(res);
      setStep('picklist');
    } catch (err) {
      const msg = err.data?.message || 'Gagal membuat pick list';
      setStatusMsg({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePicking = async () => {
    if (!pickList) return;
    setLoading(true);
    setStatusMsg(null);

    try {
      const payload = {
        product_id: pickList.product.id,
        pick_items: pickList.pick_list.map(item => ({
          stock_id: item.stock_id,
          pick_qty: item.pick_qty,
        })),
        reference_document: `SO-${Date.now()}`,
      };

      const res = await api.executePicking(payload);
      setStatusMsg({ text: `${res.message} (${res.transaction_code})`, type: 'success' });
      setStep('done');
      loadHistory();
    } catch (err) {
      const msg = err.data?.message || 'Gagal eksekusi picking';
      setStatusMsg({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setSelectedProduct(null);
    setRequestedQty('');
    setPickList(null);
    setStep('select');
    setStatusMsg(null);
    loadProducts();
  };

  return (
    <div className="outbound-container">
      <div className="page-header">
        <div className="header-title">
          <div className="icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <ArrowUpFromLine size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h2>Outbound & Smart Picking</h2>
            <p className="text-muted">FIFO-optimized picking with route-aware sequence algorithm</p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className={`global-status-banner ${statusMsg.type}`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="outbound-grid">
        {/* Left Column: Pick Flow */}
        <div className="pick-flow-column">
          {/* Step Indicator */}
          <div className="glass step-tracker">
            <div className={`tracker-step ${step === 'select' ? 'active' : (step !== 'select' ? 'done' : '')}`}>
              <div className="tracker-dot">1</div>
              <span>Pilih Produk</span>
            </div>
            <ChevronRight size={16} className="text-muted" />
            <div className={`tracker-step ${step === 'picklist' ? 'active' : (step === 'done' ? 'done' : '')}`}>
              <div className="tracker-dot">2</div>
              <span>Review Pick List</span>
            </div>
            <ChevronRight size={16} className="text-muted" />
            <div className={`tracker-step ${step === 'done' ? 'active' : ''}`}>
              <div className="tracker-dot">3</div>
              <span>Selesai</span>
            </div>
          </div>

          {/* Step 1: Select Product */}
          {step === 'select' && (
            <div className="glass pick-form-card">
              <h3 className="card-title"><Search size={18} /> Pilih Produk & Kuantitas</h3>

              <div className="product-selector">
                {products.map(p => (
                  <div
                    key={p.id}
                    className={`product-option ${selectedProduct?.id === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedProduct(p)}
                  >
                    <div className="product-option-info">
                      <span className="sku-label">{p.sku}</span>
                      <span className="product-name">{p.name}</span>
                    </div>
                    <span className="uom-label">{p.uom}</span>
                  </div>
                ))}
              </div>

              <div className="qty-input-row">
                <label>Jumlah yang diminta (Qty):</label>
                <input
                  type="number"
                  min="1"
                  value={requestedQty}
                  onChange={e => setRequestedQty(e.target.value)}
                  placeholder="Contoh: 10"
                />
              </div>

              <button
                className="primary-btn generate-btn"
                onClick={handleGeneratePickList}
                disabled={!selectedProduct || !requestedQty || loading}
              >
                <Route size={18} />
                <span>{loading ? 'Generating...' : 'Generate FIFO Pick List'}</span>
              </button>
            </div>
          )}

          {/* Step 2: Review Pick List */}
          {step === 'picklist' && pickList && (
            <div className="glass picklist-card">
              <h3 className="card-title"><Route size={18} /> FIFO Pick List — Route Optimized</h3>

              <div className="picklist-product-info">
                <span className="sku-label">{pickList.product.sku}</span>
                <span>{pickList.product.name}</span>
                <span className="qty-badge">Diminta: {pickList.requested_qty} {pickList.product.uom}</span>
              </div>

              <div className="picklist-table-wrap">
                <table className="data-table picklist-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Lokasi Rak</th>
                      <th>Zone / Tier</th>
                      <th>Stok Tersedia</th>
                      <th>Ambil (Pick)</th>
                      <th>FIFO Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickList.pick_list.map((item, idx) => (
                      <tr key={item.stock_id}>
                        <td>
                          <span className="pick-order">{idx + 1}</span>
                        </td>
                        <td>
                          <div className="location-barcode">
                            <MapPin size={14} className="text-muted" />
                            <span className="font-medium">{item.location_barcode}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge-zone">{item.zone}</span>
                          <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>T{item.tier}</span>
                        </td>
                        <td>{item.available_qty}</td>
                        <td><span className="pick-qty-highlight">{item.pick_qty}</span></td>
                        <td className="text-muted text-sm">
                          <Clock size={12} style={{ marginRight: '0.3rem' }} />
                          {new Date(item.fifo_date).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="picklist-actions">
                <button className="secondary-btn" onClick={resetFlow}>Batalkan</button>
                <button className="primary-btn execute-pick-btn" onClick={handleExecutePicking} disabled={loading}>
                  <PackageCheck size={18} />
                  <span>{loading ? 'Memproses...' : 'Eksekusi Picking'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="glass done-card">
              <CheckCircle2 size={60} style={{ color: 'var(--success)' }} />
              <h3>Picking Selesai!</h3>
              <p className="text-muted">Barang siap dimuat ke area Shipping Dock.</p>
              <button className="primary-btn" onClick={resetFlow}>
                <Truck size={18} />
                <span>Buat Picking Baru</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Transaction History */}
        <div className="history-column">
          <div className="glass history-card">
            <h3 className="card-title"><Clock size={18} /> Riwayat Outbound Terakhir</h3>
            <div className="history-list">
              {history.length === 0 ? (
                <div className="text-muted text-center" style={{ padding: '2rem' }}>Belum ada riwayat outbound.</div>
              ) : (
                history.map((trx, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-icon"><ArrowUpFromLine size={16} /></div>
                    <div className="history-info">
                      <span className="history-code">{trx.transaction_code}</span>
                      <span className="history-detail">
                        {trx.product?.name || 'N/A'} — {trx.quantity} {trx.product?.uom || 'pcs'}
                      </span>
                      <span className="history-time">{new Date(trx.created_at).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Outbound;
