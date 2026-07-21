import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, ScanLine, Box, CheckCircle2, AlertTriangle, Play, Database } from 'lucide-react';
import api from '../services/api';
import './Inbound.css';

const Inbound = () => {
  const [productBarcode, setProductBarcode] = useState('');
  const [locationBarcode, setLocationBarcode] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [message, setMessage] = useState('Sistem Siap. Menunggu Palet Masuk...');
  const [logs, setLogs] = useState([]);
  
  const [availableData, setAvailableData] = useState({ products: [], locations: [] });

  useEffect(() => {
    // Fetch some products and locations for hints
    const loadHints = async () => {
      try {
        const [productsRes, locations] = await Promise.all([
          api.getProducts({ per_page: 100 }),
          api.getLocations()
        ]);
        setAvailableData({ products: productsRes.data || productsRes, locations });
      } catch (error) {
        console.error("Failed to load hints", error);
      }
    };
    loadHints();
  }, []);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 5));
  };

  const handleSimulateScan = async (e) => {
    e.preventDefault();
    if (!productBarcode || !locationBarcode || quantity < 1) {
      setStatus('error');
      setMessage('Lengkapi Data Barcode & Kuantitas!');
      return;
    }

    setStatus('scanning');
    setMessage('Auto-Gate: Memvalidasi Dimensi Palet & Kode Lokasi...');
    addLog(`Membaca Barcode Lokasi: ${locationBarcode}`);

    try {
      // 1. Validate Location
      const locResponse = await api.validateLocation(locationBarcode);
      
      if (!locResponse.valid) {
        throw new Error("Lokasi tidak valid atau tidak aktif.");
      }
      addLog(`Lokasi Valid: ${locResponse.location.name}`, 'success');
      
      setMessage(`Meneruskan Palet ke ASRS (Lokasi: ${locResponse.location.name})...`);
      addLog(`Memindai Produk: ${productBarcode} (Qty: ${quantity})`);

      // 2. Submit Putaway Transaction
      const payload = {
        location_id: locResponse.location.id,
        scanned_items: [
          { barcode: productBarcode, quantity: parseInt(quantity) }
        ]
      };

      const putawayRes = await api.submitPutaway(payload);
      
      if (putawayRes.success) {
        setStatus('success');
        setMessage(`Berhasil! ${putawayRes.message} (TRX: ${putawayRes.transaction_code})`);
        addLog(`Transaksi Berhasil: ${putawayRes.transaction_code}`, 'success');
        
        // Reset form
        setProductBarcode('');
        setQuantity(1);
      } else {
        throw new Error(putawayRes.message || "Gagal memproses transaksi");
      }

    } catch (error) {
      console.error(error);
      setStatus('error');
      const errorMsg = error.data?.message || error.message || 'Terjadi kesalahan sistem';
      setMessage(`DITOLAK: ${errorMsg}`);
      addLog(`Ditolak: ${errorMsg}`, 'error');
    }
  };

  return (
    <div className="inbound-container">
      <div className="page-header">
        <div className="header-title">
          <div className="icon-wrapper" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
            <ArrowDownToLine size={24} style={{color: 'var(--success)'}} />
          </div>
          <div>
            <h2>Inbound & Auto-Gate Simulation</h2>
            <p className="text-muted">Simulasi sensor penerimaan palet dan penempatan rak via WMS-SAM</p>
          </div>
        </div>
      </div>

      <div className="inbound-grid">
        {/* Left Column: Form / Scanner Panel */}
        <div className="glass scanner-panel">
          <div className="panel-heading">
            <ScanLine size={20} className="text-primary" />
            <h3>Terminal Simulasi Scanner</h3>
          </div>
          
          <form className="scanner-form" onSubmit={handleSimulateScan}>
            <div className="form-group">
              <label>Barcode Lokasi (Tujuan Rak)</label>
              <input 
                type="text" 
                placeholder="Contoh: LOC-A1-T1-B1" 
                value={locationBarcode}
                onChange={(e) => setLocationBarcode(e.target.value)}
                required
              />
              <div className="hints">
                {availableData.locations.map(l => (
                  <span key={l.id} className="hint-chip" onClick={() => setLocationBarcode(l.barcode)}>
                    {l.barcode}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Barcode Produk (Palet Masuk)</label>
              <input 
                type="text" 
                placeholder="Contoh: 899123456001" 
                value={productBarcode}
                onChange={(e) => setProductBarcode(e.target.value)}
                required
              />
              <div className="hints">
                {availableData.products.map(p => (
                  <span key={p.id} className="hint-chip" onClick={() => setProductBarcode(p.barcode)}>
                    {p.name} ({p.barcode})
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Kuantitas (Qty)</label>
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="primary-btn execute-btn" disabled={status === 'scanning'}>
              <Play size={18} />
              <span>{status === 'scanning' ? 'Memproses...' : 'Simulasikan Auto-Gate'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Status & Logs */}
        <div className="monitor-column">
          {/* Status Display Screen */}
          <div className={`glass status-screen ${status}`}>
            <div className="screen-indicator">
              {status === 'idle' && <Box size={40} className="text-muted" />}
              {status === 'scanning' && <ScanLine size={40} className="text-primary spinning" />}
              {status === 'success' && <CheckCircle2 size={40} style={{color: 'var(--success)'}} />}
              {status === 'error' && <AlertTriangle size={40} style={{color: 'var(--danger)'}} />}
            </div>
            <h3 className="status-message">{message}</h3>
          </div>

          {/* Real-time Logs */}
          <div className="glass logs-panel">
            <div className="panel-heading">
              <Database size={18} className="text-muted" />
              <h4>Log Komunikasi WCS / PLC</h4>
            </div>
            <div className="log-list">
              {logs.length === 0 ? (
                <div className="text-muted text-center" style={{padding: '2rem 0', fontSize: '0.9rem'}}>Belum ada log pergerakan.</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`log-item ${log.type}`}>
                    <span className="log-time">[{log.time}]</span>
                    <span className="log-msg">{log.msg}</span>
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

export default Inbound;
