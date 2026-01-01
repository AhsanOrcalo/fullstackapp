import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserDashboardStats, getAllLeads } from '../services/api';
import { getUserData } from '../services/api';
import { FaChartBar, FaDollarSign } from 'react-icons/fa';

const UserDashboardComponent = () => {
  const [stats, setStats] = useState({
    dataPurchased: 0,
    availableBalance: 0.0,
  });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState('');

  const userData = getUserData();
  const userName = userData?.userName || 'user';

  useEffect(() => {
    fetchDashboardStats();
    fetchAvailableLeads();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard stats');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableLeads = async () => {
    try {
      setLeadsLoading(true);
      setLeadsError('');
      const response = await getAllLeads({ page: 1, limit: 10 });
      // Handle paginated response
      let data = [];
      if (response.leads) {
        // New paginated response
        data = response.leads;
      } else if (Array.isArray(response)) {
        // Legacy response (array)
        data = response;
      }
      // Backend already filters out leads purchased by any user for regular users
      setLeads(data);
    } catch (err) {
      setLeadsError(err.message || 'Failed to fetch available leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLeadsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

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
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Stats Cards Row */}
      <motion.div className="statsrow" variants={containerVariants}>
        <motion.div 
          className="statcard"
          style={{
            background: 'linear-gradient(135deg, rgba(67, 24, 255, 0.25) 0%, rgba(67, 24, 255, 0.15) 100%)',
            boxShadow: '0 8px 24px rgba(67, 24, 255, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1)',
          }}
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="cardinfo">
            <p className="cardtitle">Data Purchased</p>
            {loading ? (
              <h1 className="cardvalue">...</h1>
            ) : error ? (
              <h1 className="cardvalue" style={{ color: '#ef4444', fontSize: '20px' }}>
                Error
              </h1>
            ) : (
              <motion.h1 
                className="cardvalue"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {stats.dataPurchased}
              </motion.h1>
            )}
          </div>
          <motion.div 
            className="cardicon" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '32px',
              color: 'var(--text-main)'
            }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <FaChartBar />
          </motion.div>
        </motion.div>
        <motion.div 
          className="statcard"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1)',
          }}
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="cardinfo">
            <p className="cardtitle">Available Balance</p>
            {loading ? (
              <h1 className="cardvalue">...</h1>
            ) : error ? (
              <h1 className="cardvalue" style={{ color: '#ef4444', fontSize: '20px' }}>
                Error
              </h1>
            ) : (
              <motion.h1 
                className="cardvalue"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {formatPrice(stats.availableBalance)}
              </motion.h1>
            )}
          </div>
          <motion.div 
            className="cardicon" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '32px',
              color: '#f1c40f'
            }}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <FaDollarSign />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* All Data Available Section */}
      <motion.div 
        className="datasection" 
        style={{ marginTop: '30px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="sectiontitle">All Data Available</h2>
          <motion.button 
            className="applybtn" 
            onClick={fetchAvailableLeads} 
            disabled={leadsLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {leadsLoading ? 'Loading...' : '🔄 Refresh'}
          </motion.button>
        </div>

        {leadsError && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#ef4444',
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>Error loading data</p>
            <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>{leadsError}</p>
            <button className="applybtn" onClick={fetchAvailableLeads} style={{ marginTop: '10px' }}>
              Retry
            </button>
          </div>
        )}

        {leadsLoading ? (
          <div className="nodata">
            <p style={{ color: 'var(--text-sub)' }}>Loading available data...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="nodata">
            <p style={{ color: 'var(--text-sub)' }}>No data records found at the moment.</p>
          </div>
        ) : (
          <motion.div 
            className="tablewrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <table>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>City</th>
                  <th>State</th>
                  <th>ZIP</th>
                  <th>Year of Birth</th>
                  <th>Price</th>
                  <th>Score</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <motion.tr 
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ backgroundColor: 'rgba(67, 24, 255, 0.1)', scale: 1.01 }}
                  >
                    <td>{lead.firstName || 'N/A'}</td>
                    <td>{lead.lastName || 'N/A'}</td>
                    {/* <td>{lead.email || 'N/A'}</td> */}
                    <td>{lead.city || 'N/A'}</td>
                    <td>{lead.state || 'N/A'}</td>
                    <td>{lead.zip || 'N/A'}</td>
                    <td>{lead.dob ? new Date(lead.dob).getFullYear() : 'N/A'}</td>
                    <td style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                      {formatPrice(lead.price || 0)}
                    </td>
                    <td>
                      {lead.score ? (
                        <span style={{
                          color: lead.score >= 800 ? '#10b981' : lead.score >= 700 ? '#3b82f6' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {lead.score}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{formatDate(lead.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default UserDashboardComponent;

