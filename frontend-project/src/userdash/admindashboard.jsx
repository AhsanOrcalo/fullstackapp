import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { getUserData } from '../services/api';
import { 
  FaUsers, FaFileAlt, FaClock, FaServer, FaChartLine, FaDatabase, FaCheckCircle
} from 'react-icons/fa';

const AdminDashboard = ({ setview }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecords: 0,
    recentActivity: 0,
    systemStatus: 'Active',
    soldData700Plus: 0,
    soldData800Plus: 0,
    availableData700Plus: 0,
    availableData800Plus: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userData = getUserData();
  const userName = userData?.userName || 'admin';

  useEffect(() => {
    fetchDashboardStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 800000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard stats');
      console.error('Error fetching dashboard stats:', err);
      // Set system status to error if API fails
      setStats(prev => ({ ...prev, systemStatus: 'Error' }));
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: 'Registered users',
      icon: FaUsers,
      color: '#7367f0',
    },
    {
      title: 'Total Records',
      value: stats.totalRecords,
      subtitle: 'Data entries',
      icon: FaFileAlt,
      color: '#00cfe8',
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      subtitle: 'Last 5 records',
      icon: FaClock,
      color: '#ff9f43',
    },
    {
      title: 'System Status',
      value: stats.systemStatus,
      subtitle: stats.systemStatus === 'Active' ? 'All systems operational' : 'Some APIs not working',
      icon: FaServer,
      color: stats.systemStatus === 'Active' ? '#28c76f' : '#ef4444',
    },
    {
      title: 'Sold (700+)',
      value: stats.soldData700Plus,
      subtitle: 'Completed orders with score ≥ 700',
      icon: FaCheckCircle,
      color: '#3b82f6',
    },
    {
      title: 'Sold (800+)',
      value: stats.soldData800Plus,
      subtitle: 'Completed orders with score ≥ 800',
      icon: FaCheckCircle,
      color: '#3b82f6',
    },
    {
      title: 'Available (700+)',
      value: stats.availableData700Plus,
      subtitle: 'Not purchased, admin-created',
      icon: FaDatabase,
      color: '#10b981',
    },
    {
      title: 'Available (800+)',
      value: stats.availableData800Plus,
      subtitle: 'Not purchased, admin-created',
      icon: FaDatabase,
      color: '#10b981',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Data',
      description: 'Add, edit, or delete records',
      icon: FaDatabase,
      view: 'Data Management',
      color: '#ea5455',
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: FaUsers,
      view: 'User Management',
      color: '#28c76f',
    },
    {
      title: 'View Sold Data',
      description: 'View all sold records',
      icon: FaChartLine,
      view: 'Sold Data',
      color: '#00cfe8',
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          color: 'var(--text-main)', 
          margin: '0 0 10px 0', 
          fontSize: '32px', 
          fontWeight: '700' 
        }}>
          Dashboard Overview
        </h1>
        <p style={{ 
          color: 'var(--text-sub)', 
          margin: '0', 
          fontSize: '16px' 
        }}>
          Welcome back, {userName}! Here's what's happening with your data today.
        </p>
      </div>

      {/* Loading State */}
      {loading && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: 'var(--text-sub)' 
        }}>
          Loading dashboard data...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          color: '#ef4444',
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>Error loading dashboard</p>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>{error}</p>
          <button 
            className="applybtn" 
            onClick={fetchDashboardStats}
            style={{ marginTop: '10px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      {!loading && (
        <>
          <div className="admin-metric-grid">
            {metricCards.map((card, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  padding: '25px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-clr)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      marginBottom: '10px' 
                    }}>
                      <div className="icon-box" style={{backgroundColor: card.color}}>
                        {React.createElement(card.icon)}
                      </div>
                      <p style={{ 
                        color: 'var(--text-sub)', 
                        fontSize: '14px', 
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        {card.title}
                      </p>
                    </div>
                    <h1 style={{ 
                      color: card.color, 
                      fontSize: '36px', 
                      margin: '10px 0', 
                      fontWeight: '700' 
                    }}>
                      {card.value}
                    </h1>
                    <p style={{ 
                      color: 'var(--text-sub)', 
                      fontSize: '12px', 
                      margin: 0 
                    }}>
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions Section */}
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ 
              color: 'var(--text-main)', 
              margin: '0 0 20px 0', 
              fontSize: '24px', 
              fontWeight: '700' 
            }}>
              Quick Actions
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '20px' 
            }}>
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  onClick={() => setview(action.view)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '25px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-clr)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = action.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--border-clr)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="icon-box-large" style={{backgroundColor: action.color}}>
                      {React.createElement(action.icon)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        color: 'var(--text-main)', 
                        margin: '0 0 5px 0', 
                        fontSize: '18px', 
                        fontWeight: '600' 
                      }}>
                        {action.title}
                      </h3>
                      <p style={{ 
                        color: 'var(--text-sub)', 
                        margin: 0, 
                        fontSize: '14px' 
                      }}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

