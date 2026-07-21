import React, { useState, useEffect } from 'react';
import { LayoutDashboard, RefreshCw, Moon, Zap, Box, MapPin, Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';
import './DigitalTwin.css';

const DigitalTwin = () => {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [compacting, setCompacting] = useState(false);
  const [compactionLogs, setCompactionLogs] = useState(null);

  useEffect(() => {
    loadMap();
  }, []);

  const loadMap = async () => {
    setLoading(true);
    try {
      const data = await api.getWarehouseMap();
      setMapData(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleNightCompaction = async () => {
    setCompacting(true);
    setCompactionLogs(null);
    try {
      const res = await api.triggerNightCompaction();
      setCompactionLogs(res.logs);
      loadMap(); // Refresh map after compaction
    } catch (e) {
      console.error(e);
      setCompactionLogs([{ phase: 0, action: 'ERROR', message: 'Gagal menjalankan Night Compaction' }]);
    } finally {
      setCompacting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'full') return '#ef4444';
    if (status === 'partial') return '#f59e0b';
    return '#10b981';
  };

  const getStatusLabel = (status) => {
    if (status === 'full') return 'Penuh';
    if (status === 'partial') return 'Terisi Sebagian';
    return 'Kosong';
  };

  return (
    <div className="twin-container">
      <div className="page-header">
        <div className="header-title">
          <div className="icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <LayoutDashboard size={24} className="text-primary" />
          </div>
          <div>
            <h2>Digital Twin — Warehouse Map</h2>
            <p className="text-muted">Real-time rack visualization & Night Compaction engine</p>
          </div>
        </div>
        <div className="header-actions-twin">
          <button className="secondary-btn" onClick={loadMap} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            <span>Refresh Map</span>
          </button>
          <button className="night-btn" onClick={handleNightCompaction} disabled={compacting}>
            <Moon size={18} />
            <span>{compacting ? 'Running...' : 'Night Compaction'}</span>
          </button>
        </div>
      </div>

      <div className="twin-grid">
        {/* Left: Warehouse Visual Map */}
        <div className="map-column">
          {mapData.map((wh, whIdx) => (
            <div key={whIdx} className="glass warehouse-block">
              <div className="wh-header">
                <h3><Box size={18} /> {wh.warehouse.name} <span className="wh-code">({wh.warehouse.code})</span></h3>
                <div className="wh-stats">
                  <span className="stat-chip full">{wh.summary.full} Penuh</span>
                  <span className="stat-chip partial">{wh.summary.partial} Sebagian</span>
                  <span className="stat-chip empty">{wh.summary.empty} Kosong</span>
                </div>
              </div>

              <div className="rack-grid">
                {wh.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className={`rack-cell ${loc.status} ${selectedLoc?.id === loc.id ? 'selected' : ''}`}
                    onClick={() => setSelectedLoc(loc)}
                    title={`${loc.barcode} — ${getStatusLabel(loc.status)}`}
                  >
                    <div className="rack-fill-bar" style={{ height: `${Math.min(loc.total_qty * 2, 100)}%`, backgroundColor: getStatusColor(loc.status) }}></div>
                    <span className="rack-label">{loc.zone}{loc.tier || ''}</span>
                    <span className="rack-qty">{loc.total_qty}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {mapData.length === 0 && !loading && (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
              <p className="text-muted">Tidak ada data gudang ditemukan.</p>
            </div>
          )}
        </div>

        {/* Right: Detail & Compaction Panel */}
        <div className="detail-column">
          {/* Location Detail Card */}
          <div className="glass detail-card">
            <h4 className="panel-title"><MapPin size={16} /> Detail Lokasi</h4>
            {selectedLoc ? (
              <div className="detail-content">
                <div className="detail-row">
                  <span className="detail-label">Barcode</span>
                  <span className="detail-value mono">{selectedLoc.barcode}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Nama</span>
                  <span className="detail-value">{selectedLoc.name || selectedLoc.barcode}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Zone / Tier</span>
                  <span className="detail-value">
                    <span className="badge-zone">{selectedLoc.zone}</span>
                    <span style={{ marginLeft: '0.5rem' }}>Tier {selectedLoc.tier || '-'}</span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className="status-dot" style={{ backgroundColor: getStatusColor(selectedLoc.status) }}></span>
                    {getStatusLabel(selectedLoc.status)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Stok</span>
                  <span className="detail-value bold">{selectedLoc.total_qty} unit</span>
                </div>

                {selectedLoc.products && selectedLoc.products.length > 0 && (
                  <div className="detail-products">
                    <span className="detail-label">Isi Palet:</span>
                    {selectedLoc.products.map((p, i) => (
                      <div key={i} className="product-chip">
                        <Package size={14} />
                        <span>{p.sku} — {p.name} ({p.qty} {p.uom})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted text-center" style={{ padding: '2rem' }}>Klik rak di peta untuk melihat detail.</div>
            )}
          </div>

          {/* Night Compaction Logs */}
          <div className="glass compaction-card">
            <h4 className="panel-title"><Moon size={16} /> Night Compaction Log</h4>
            {compactionLogs ? (
              <div className="compaction-log-list">
                {compactionLogs.map((log, idx) => (
                  <div key={idx} className={`comp-log-item ${log.action === 'ERROR' ? 'error' : (log.action.includes('DONE') || log.action === 'CLEANUP' || log.action === 'UTILIZATION_REPORT' ? 'success' : 'info')}`}>
                    <div className="comp-log-phase">P{log.phase}</div>
                    <div className="comp-log-body">
                      <span className="comp-log-action">{log.action}</span>
                      <span className="comp-log-msg">{log.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-center" style={{ padding: '2rem', fontSize: '0.9rem' }}>
                {compacting ? (
                  <div className="compaction-running">
                    <Zap size={24} className="spinning" style={{ color: '#f59e0b' }} />
                    <p>Menjalankan Night Compaction...</p>
                    <p className="text-sm">Robot ASRS sedang merapikan gudang</p>
                  </div>
                ) : 'Belum dijalankan. Tekan tombol "Night Compaction" di atas.'}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="glass legend-card">
            <h4 className="panel-title">Legenda Peta</h4>
            <div className="legend-items">
              <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#10b981' }}></span> Kosong (Available)</div>
              <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span> Terisi Sebagian</div>
              <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span> Penuh (Full)</div>
              <div className="legend-item"><span className="legend-color selected-border"></span> Lokasi Terpilih</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
