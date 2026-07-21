import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, ArrowDownToLine, ArrowUpFromLine, Layers, Truck, Users, ShieldCheck, LogOut } from 'lucide-react';
import api from '../services/api';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('wms_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'operator';

  const handleLogout = async () => {
    try { await api.logout(); } catch (e) {}
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/', label: 'Digital Twin Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'manager', 'operator'] },
    { path: '/products', label: 'SKU & ABC Catalog', icon: Layers, roles: ['superadmin', 'manager'] },
    { path: '/inventory', label: 'Real-time Stock (FIFO)', icon: PackageSearch, roles: ['superadmin', 'manager', 'operator'] },
    { path: '/supply-chain', label: 'Supply Chain (Hulu)', icon: Truck, roles: ['superadmin', 'manager'] },
    { path: '/inbound', label: 'Inbound & Auto-Gate', icon: ArrowDownToLine, roles: ['superadmin', 'manager', 'operator'] },
    { path: '/outbound', label: 'Outbound & Picking', icon: ArrowUpFromLine, roles: ['superadmin', 'manager', 'operator'] },
    { path: '/fulfillment', label: 'Fulfillment (Hilir)', icon: Users, roles: ['superadmin', 'manager'] },
    { path: '/approvals', label: 'Audit & Approvals', icon: ShieldCheck, roles: ['superadmin', 'manager'] },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-icon">
          <Layers size={24} color="var(--primary)" />
        </div>
        <h2 className="logo-text">Aero<span>WMS</span></h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {allowedItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: 'auto' }}>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div className="avatar" style={{ background: 'var(--primary)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="user-name" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user?.username || 'Guest'}</span>
              <span className="user-role" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</span>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
