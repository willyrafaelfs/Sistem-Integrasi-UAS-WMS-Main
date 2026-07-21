import React, { useState, useEffect } from 'react';
import { ScanLine, MapPin, Package, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import api from '../services/api';
import './MobileScanner.css';

const MobileScanner = () => {
  const [scannedLocation, setScannedLocation] = useState('');
  const [locationId, setLocationId] = useState('');
  const [scannedItems, setScannedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: 'Sistem Siap', type: 'info' });

  const [inputVal, setInputVal] = useState('');

  // Auto focus to body for dark theme application on this page specifically
  useEffect(() => {
    document.body.classList.add('mobile-scanner-active');
    return () => {
      document.body.classList.remove('mobile-scanner-active');
    };
  }, []);

  const handleScan = async (barcode) => {
    if (!barcode || isProcessing) return;
    setIsProcessing(true);
    setStatusMsg({ text: 'Memproses...', type: 'info' });

    try {
      if (!locationId) {
        // Step 1: Validasi Lokasi
        const result = await api.validateLocation(barcode);
        if (result.valid) {
          setScannedLocation(result.location.name);
          setLocationId(result.location.id);
          setStatusMsg({ text: `Lokasi Tervalidasi: ${result.location.name}`, type: 'success' });
          
          // Trigger mock haptic feedback (browser)
          if (navigator.vibrate) navigator.vibrate(50);
        } else {
          throw new Error('Lokasi tidak valid');
        }
      } else {
        // Step 2: Tambah Produk
        setScannedItems(prev => [...prev, { barcode: barcode, quantity: 1 }]);
        setStatusMsg({ text: `Item Ditambahkan: ${barcode}`, type: 'success' });
        
        if (navigator.vibrate) navigator.vibrate(50);
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Gagal memindai';
      setStatusMsg({ text: msg, type: 'error' });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Error vibrate
    } finally {
      setIsProcessing(false);
      setInputVal(''); // Clear input for next scan
    }
  };

  const submitPutaway = async () => {
    if (!locationId || scannedItems.length === 0) return;
    setIsProcessing(true);
    setStatusMsg({ text: 'Mengirim Misi ke WMS...', type: 'info' });

    try {
      const payload = {
        location_id: locationId,
        scanned_items: scannedItems
      };
      const res = await api.submitPutaway(payload);
      
      setStatusMsg({ text: `SUKSES! TRX: ${res.transaction_code}`, type: 'success' });
      if (navigator.vibrate) navigator.vibrate(200);
      
      // Reset for next task
      setTimeout(() => {
        setScannedLocation('');
        setLocationId('');
        setScannedItems([]);
        setStatusMsg({ text: 'Sistem Siap untuk Misi Berikutnya', type: 'info' });
      }, 3000);

    } catch (err) {
      const msg = err.data?.message || err.message || 'Gagal submit';
      setStatusMsg({ text: `GAGAL: ${msg}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mobile-scanner-layout">
      {/* Header */}
      <div className="scanner-header">
        <h1 className="app-title">AERO<span>WMS</span> MOBILE</h1>
        <div className="operator-badge">
          <span className="dot online"></span>
          <span>Operator 1</span>
        </div>
      </div>

      {/* Camera Viewport (Simulated) */}
      <div className="camera-viewport">
        <div className="reticle">
          <div className="reticle-corner tl"></div>
          <div className="reticle-corner tr"></div>
          <div className="reticle-corner bl"></div>
          <div className="reticle-corner br"></div>
          <div className="laser-line"></div>
        </div>
        <div className="camera-overlay-text">ARAHKAN KE BARCODE</div>
      </div>

      {/* Task Panel */}
      <div className="task-panel">
        <div className={`status-bar ${statusMsg.type}`}>
          {statusMsg.type === 'success' && <CheckCircle2 size={18} />}
          {statusMsg.type === 'error' && <AlertTriangle size={18} />}
          {statusMsg.type === 'info' && <ScanLine size={18} />}
          <span>{statusMsg.text}</span>
        </div>

        <div className="steps-container">
          <div className={`step-item ${locationId ? 'completed' : 'active'}`}>
            <div className="step-icon"><MapPin size={20} /></div>
            <div className="step-content">
              <h4>Langkah 1: Lokasi Rak</h4>
              <p>{scannedLocation || 'Belum discan'}</p>
            </div>
          </div>
          
          <div className={`step-item ${locationId ? 'active' : 'waiting'}`}>
            <div className="step-icon"><Package size={20} /></div>
            <div className="step-content">
              <h4>Langkah 2: Barcode Palet</h4>
              <p>{scannedItems.length} Palet terscan</p>
            </div>
          </div>
        </div>

        {/* Manual Input for Simulation */}
        <div className="manual-input-group">
          <input 
            type="text" 
            placeholder={!locationId ? "Ketik Barcode Lokasi..." : "Ketik Barcode Palet..."}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan(inputVal)}
            disabled={isProcessing}
          />
          <button className="scan-btn" onClick={() => handleScan(inputVal)} disabled={isProcessing || !inputVal}>
            <ScanLine size={20} />
          </button>
        </div>

        {/* Action Button */}
        <button 
          className="submit-task-btn" 
          disabled={!locationId || scannedItems.length === 0 || isProcessing}
          onClick={submitPutaway}
        >
          {isProcessing ? 'Memproses...' : 'SELESAIKAN PUTAWAY'}
          <Send size={20} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default MobileScanner;
