import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      // Ensure all required fields are present
      setStats({
        totalUsers: data?.totalUsers ?? 0,
        totalRecords: data?.totalRecords ?? 0,
        recentActivity: data?.recentActivity ?? 0,
        systemStatus: data?.systemStatus ?? 'Active',
        soldData700Plus: data?.soldData700Plus ?? 0,
        soldData800Plus: data?.soldData800Plus ?? 0,
        availableData700Plus: data?.availableData700Plus ?? 0,
        availableData800Plus: data?.availableData800Plus ?? 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard stats');
      console.error('Error fetching dashboard stats:', err);
      // Keep default stats even on error so cards still show
      setStats(prev => ({ 
        ...prev, 
        systemStatus: 'Error' 
      }));
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
      bgColor: 'linear-gradient(135deg, rgba(115, 103, 240, 0.25) 0%, rgba(115, 103, 240, 0.15) 100%)',
      shadowColor: 'rgba(115, 103, 240, 0.4)',
    },
    {
      title: 'Total Records',
      value: stats.totalRecords,
      subtitle: 'Data entries',
      icon: FaFileAlt,
      color: '#00cfe8',
      bgColor: 'linear-gradient(135deg, rgba(0, 207, 232, 0.25) 0%, rgba(0, 207, 232, 0.15) 100%)',
      shadowColor: 'rgba(0, 207, 232, 0.4)',
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      subtitle: 'Last 5 records',
      icon: FaClock,
      color: '#ff9f43',
      bgColor: 'linear-gradient(135deg, rgba(255, 159, 67, 0.25) 0%, rgba(255, 159, 67, 0.15) 100%)',
      shadowColor: 'rgba(255, 159, 67, 0.4)',
    },
    {
      title: 'System Status',
      value: stats.systemStatus,
      subtitle: stats.systemStatus === 'Active' ? 'All systems operational' : 'Some APIs not working',
      icon: FaServer,
      color: stats.systemStatus === 'Active' ? '#28c76f' : '#ef4444',
      bgColor: stats.systemStatus === 'Active' 
        ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.25) 0%, rgba(40, 199, 111, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%)',
      shadowColor: stats.systemStatus === 'Active' ? 'rgba(40, 199, 111, 0.4)' : 'rgba(239, 68, 68, 0.4)',
    },
    {
      title: 'Sold (700+)',
      value: stats.soldData700Plus,
      subtitle: 'Completed orders with score ≥ 700',
      icon: FaCheckCircle,
      color: '#3b82f6',
      bgColor: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)',
      shadowColor: 'rgba(59, 130, 246, 0.4)',
    },
    {
      title: 'Sold (800+)',
      value: stats.soldData800Plus,
      subtitle: 'Completed orders with score ≥ 800',
      icon: FaCheckCircle,
      color: '#3b82f6',
      bgColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
      shadowColor: 'rgba(99, 102, 241, 0.4)',
    },
    {
      title: 'Available (700+)',
      value: stats.availableData700Plus,
      subtitle: 'Score 700-799, not purchased',
      icon: FaDatabase,
      color: '#10b981',
      bgColor: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.4)',
    },
    {
      title: 'Available (800+)',
      value: stats.availableData800Plus,
      subtitle: 'Score ≥ 800, not purchased',
      icon: FaDatabase,
      color: '#10b981',
      bgColor: 'linear-gradient(135deg, rgba(5, 150, 105, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
      shadowColor: 'rgba(5, 150, 105, 0.4)',
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      style={{ padding: '0' }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div 
        style={{ marginBottom: '30px' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
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
      </motion.div>

      {/* Error State - Show above cards if there's an error */}
      {error && (
        <motion.div 
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            color: '#ef4444',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>Error loading dashboard</p>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>{error}</p>
          <motion.button 
            className="applybtn" 
            onClick={fetchDashboardStats}
            style={{ marginTop: '10px' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Retry
          </motion.button>
        </motion.div>
      )}

      {/* Loading State - Show only when loading and no error */}
      {loading && !error && (
        <motion.div 
          style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'var(--text-sub)' 
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading dashboard data...
        </motion.div>
      )}

      {/* Metric Cards Grid - Always show */}
      <motion.div 
        className="admin-metric-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
            {metricCards.map((card, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  background: card.bgColor,
                  backgroundColor: 'var(--bg-card)', // Fallback
                  padding: '25px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-clr)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 8px 24px ${card.shadowColor}, 0 4px 8px rgba(0, 0, 0, 0.1)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${card.shadowColor}, 0 6px 12px rgba(0, 0, 0, 0.15)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${card.shadowColor}, 0 4px 8px rgba(0, 0, 0, 0.1)`;
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
              </motion.div>
            ))}
      </motion.div>

      {/* Quick Actions Section - Always show */}
      <motion.div 
        style={{ marginTop: '40px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <h2 style={{ 
          color: 'var(--text-main)', 
          margin: '0 0 20px 0', 
          fontSize: '24px', 
          fontWeight: '700' 
        }}>
          Quick Actions
        </h2>
        <motion.div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px' 
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
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
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;

