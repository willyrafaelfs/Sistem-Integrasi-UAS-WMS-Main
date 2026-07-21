import React from 'react';
import { Package, TrendingUp, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import './Dashboard.css';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }) => (
  <div className="stat-card glass hover-lift">
    <div className="stat-header">
      <div className="stat-title">{title}</div>
      <div className={`stat-icon-wrapper`} style={{ background: `var(--${color}-transparent)`, color: `var(--${color})` }}>
        <Icon size={20} />
      </div>
    </div>
    <div className="stat-value">{value}</div>
    <div className={`stat-trend ${trendUp ? 'positive' : 'negative'}`}>
      <TrendingUp size={14} className={!trendUp ? 'rotate-180' : ''} />
      <span>{trend}</span>
      <span className="trend-label">vs last month</span>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="text-muted">Welcome back, here's what's happening in your warehouse today.</p>
        </div>
        <button className="primary-btn">
          <ArrowRightLeft size={18} />
          New Transaction
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="Total SKU in Stock" value="12,450" icon={Package} trend="+5.2%" trendUp={true} color="primary" />
        <StatCard title="Low Stock Alerts" value="24" icon={AlertTriangle} trend="-12%" trendUp={true} color="warning" />
        <StatCard title="Today's Inbound" value="450" icon={ArrowRightLeft} trend="+18%" trendUp={true} color="success" />
        <StatCard title="Today's Outbound" value="380" icon={ArrowRightLeft} trend="-4%" trendUp={false} color="danger" />
      </div>

      <div className="dashboard-content-grid">
        <div className="main-chart glass">
          <h3>Inventory Movement</h3>
          <div className="chart-placeholder">
            <div className="bar" style={{height: '40%'}}></div>
            <div className="bar" style={{height: '60%'}}></div>
            <div className="bar" style={{height: '30%'}}></div>
            <div className="bar" style={{height: '80%'}}></div>
            <div className="bar" style={{height: '50%'}}></div>
            <div className="bar" style={{height: '90%'}}></div>
            <div className="bar" style={{height: '70%'}}></div>
          </div>
        </div>
        
        <div className="recent-activity glass">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="activity-item">
                <div className="activity-icon bg-success-transparent">
                  <Package size={14} color="var(--success)" />
                </div>
                <div className="activity-details">
                  <div className="activity-text"><strong>TRX-IN-00{i}</strong> received 50 items</div>
                  <div className="activity-time">{i * 15} mins ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
