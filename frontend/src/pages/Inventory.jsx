import React, { useState, useEffect } from 'react';
import { PackageSearch, RefreshCw, Filter, ShieldCheck, MapPin } from 'lucide-react';
import api from '../services/api';
import './Inventory.css';

const Inventory = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const data = await api.getStocks();
      setStocks(data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    const term = searchTerm.toLowerCase();
    return (
      (stock.product && stock.product.name.toLowerCase().includes(term)) ||
      (stock.product && stock.product.sku.toLowerCase().includes(term)) ||
      (stock.location && stock.location.barcode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="inventory-container">
      <div className="page-header">
        <div className="header-title">
          <div className="icon-wrapper bg-primary-transparent">
            <PackageSearch size={24} className="text-primary" />
          </div>
          <div>
            <h2>Real-time Stock (FIFO)</h2>
            <p className="text-muted">Live view of physical stocks, location mapping, and ASRS coordination</p>
          </div>
        </div>
        <div className="header-actions-inventory">
          <button className="secondary-btn" onClick={fetchStocks}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            <span>Sync WMS-SAM</span>
          </button>
          <button className="primary-btn">
            <Filter size={20} />
            <span>Advanced Filter</span>
          </button>
        </div>
      </div>

      <div className="glass table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <MapPin size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan Location Barcode, SKU, atau Nama..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="system-status">
            <div className="status-indicator">
              <span className="pulse-dot green"></span>
              <span>ProfiNET: Online</span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Location Coordinate</th>
                <th>SKU & Product</th>
                <th>Zone / Tier</th>
                <th>Stock Qty</th>
                <th>Validation</th>
                <th className="text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">Sinkronisasi data dari Siemens PLC...</td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">Tidak ada data stok ditemukan.</td>
                </tr>
              ) : (
                filteredStocks.map(stock => (
                  <tr key={stock.id}>
                    <td>
                      <div className="location-barcode">
                        <MapPin size={14} className="text-muted" />
                        <span className="font-medium">{stock.location ? stock.location.barcode : 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{stock.product ? stock.product.sku : 'N/A'}</div>
                      <div className="text-muted" style={{fontSize: '0.8rem'}}>{stock.product ? stock.product.name : 'Unknown'}</div>
                    </td>
                    <td>
                      <div className="zone-info">
                        <span className="badge-zone">{stock.location ? stock.location.zone : 'N/A'}</span>
                        <span className="text-muted text-sm ml-2">Tier: {stock.location ? stock.location.tier : '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="stock-quantity font-bold">{stock.quantity}</span>
                      <span className="text-muted text-sm ml-1">{stock.product ? stock.product.uom : 'pcs'}</span>
                    </td>
                    <td>
                      <div className="validation-status success">
                        <ShieldCheck size={16} />
                        <span>Verified</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="text-muted" style={{fontSize: '0.85rem'}}>
                        {new Date(stock.updated_at).toLocaleString('id-ID')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
