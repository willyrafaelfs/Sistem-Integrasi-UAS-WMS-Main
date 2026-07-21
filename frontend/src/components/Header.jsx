import React, { useState, useEffect } from 'react';
import { Search, Bell, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import './Header.css';

const Header = () => {
  const [notifs, setNotifs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const loadNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifs(data || []);
    } catch (e) { console.error(e); }
  };

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      loadNotifs();
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <header className="header glass">
      <div className="header-search">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search SKU, Barcode, or Location..." className="search-input" />
      </div>
      
      <div className="header-actions">
        <div className="warehouse-selector">
          <span className="warehouse-label">Current:</span>
          <select className="warehouse-select"><option>Main Warehouse (JKT)</option></select>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button className="notification-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {showDropdown && (
            <div className="notif-dropdown glass" style={{ position: 'absolute', right: 0, top: '45px', width: '350px', zIndex: 1000, borderRadius: '8px', padding: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <h4 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Notifikasi</h4>
              {notifs.length === 0 ? <p className="text-muted text-center">Tidak ada notifikasi.</p> : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {notifs.map(n => (
                    <div key={n.id} style={{ opacity: n.is_read ? 0.6 : 1, padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ color: n.type === 'WARNING' ? '#ef4444' : (n.type === 'APPROVAL_REQUIRED' ? '#f59e0b' : '#6366f1') }}>{n.title}</strong>
                        {!n.is_read && <button onClick={() => markAsRead(n.id)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '0.7rem' }}>Tandai Dibaca</button>}
                      </div>
                      <p style={{ margin: 0, color: '#ccc' }}>{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
