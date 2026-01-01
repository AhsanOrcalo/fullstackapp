import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSoldDataAnalytics } from '../services/api';
import { FaChartLine, FaCalendarDay, FaCalendarAlt, FaFilter, FaSearch, FaHistory } from 'react-icons/fa';

const SoldData = () => {
  const [analytics, setAnalytics] = useState({
    totalDataSold: 0,
    todaysSold: 0,
    monthlySold: 0,
    todayDate: '',
    monthDate: '',
    filteredPurchases: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSoldDataAnalytics(dateFrom || undefined, dateTo || undefined);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch sold data analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSales = () => {
    fetchAnalytics();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    if (!price) return '$0.00';
    // Price is already in dollars, not cents
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };


  // Filter out purchases with invalid or missing lead data (unavailable data)
  const purchases = (analytics.filteredPurchases || []).filter(purchase => {
    // Only show purchases that have valid lead and user data
    // Check both leadId/userId (from API) and lead/user (if transformed)
    const hasLead = (purchase.leadId && (purchase.leadId._id || purchase.leadId.id)) || 
                    (purchase.lead && (purchase.lead._id || purchase.lead.id));
    const hasUser = (purchase.userId && (purchase.userId._id || purchase.userId.id)) || 
                    (purchase.user && (purchase.user._id || purchase.user.id));
    return hasLead && hasUser;
  });

  return (
    <div style={{ width: '100%', padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          color: 'var(--text-main)', 
          margin: '0 0 10px 0', 
          fontSize: '32px', 
          fontWeight: '700' 
        }}>
          Sold Data Analytics
        </h1>
        <p style={{ 
          color: 'var(--text-sub)', 
          margin: '0', 
          fontSize: '16px' 
        }}>
          Overview of total sales and performance.
        </p>
      </div>

      {/* Loading State */}
      {loading && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: 'var(--text-sub)' 
        }}>
          Loading analytics data...
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
          <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>Error loading analytics</p>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>{error}</p>
          <button 
            className="applybtn" 
            onClick={fetchAnalytics}
            style={{ marginTop: '10px' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && (
        <>
          {/* Key Metric Cards */}
          <div className="admin-metric-grid" style={{ marginBottom: '30px' }}>
            <div className="sold-data-card">
              <div className="sold-data-icon" style={{backgroundColor: '#4318ff'}}>
                <FaChartLine />
              </div>
              <div className="sold-data-content">
                <span className="sold-data-label">Total Data Sold</span>
                <h2 className="sold-data-value">
                  {analytics.totalDataSold.toLocaleString()}
                </h2>
                <p className="sold-data-subtitle">Lifetime Sales</p>
              </div>
            </div>

            <div className="sold-data-card">
              <div className="sold-data-icon" style={{backgroundColor: '#28c76f'}}>
                <FaCalendarDay />
              </div>
              <div className="sold-data-content">
                <span className="sold-data-label">Today's Sold</span>
                <h2 className="sold-data-value">
                  {analytics.todaysSold}
                </h2>
                <p className="sold-data-subtitle">{analytics.todayDate || 'Today'}</p>
              </div>
            </div>

            <div className="sold-data-card">
              <div className="sold-data-icon" style={{backgroundColor: '#ff9f43'}}>
                <FaCalendarAlt />
              </div>
              <div className="sold-data-content">
                <span className="sold-data-label">Monthly Sold</span>
                <h2 className="sold-data-value">
                  {analytics.monthlySold.toLocaleString()}
                </h2>
                <p className="sold-data-subtitle">{analytics.monthDate || 'This Month'}</p>
              </div>
            </div>
          </div>

          {/* Filter Sales by Date Section */}
          <div className="sold-data-filter-card">
            <div className="sold-data-filter-header">
              <FaFilter className="sold-data-filter-icon" />
              <h3 className="sold-data-filter-title">Filter Sales by Date</h3>
            </div>
            
            <div className="sold-data-filter-row">
              <div className="sold-data-filter-field">
                <label className="sold-data-filter-label">From Date</label>
                <div className="sold-data-input-wrapper">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="sold-data-date-input"
                    placeholder="dd/mm/yyyy"
                  />
                  <FaCalendarDay className="sold-data-calendar-icon" />
                </div>
              </div>

              <div className="sold-data-filter-field">
                <label className="sold-data-filter-label">To Date</label>
                <div className="sold-data-input-wrapper">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="sold-data-date-input"
                    placeholder="dd/mm/yyyy"
                  />
                  <FaCalendarDay className="sold-data-calendar-icon" />
                </div>
              </div>

              <button 
                className="sold-data-check-button" 
                onClick={handleCheckSales}
              >
                <FaSearch />
                <span>Check Sale</span>
              </button>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div className="icon-box" style={{backgroundColor: '#4318ff', marginBottom: 0, width: '35px', height: '35px'}}>
                <FaHistory style={{ fontSize: '16px' }} />
              </div>
              <h3 style={{ 
                color: 'var(--text-main)', 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '700' 
              }}>
                Recent Transactions
              </h3>
            </div>

            {purchases.length === 0 ? (
              <div className="nodata">
                No transactions found for the selected date range.
              </div>
            ) : (
              <div className="tablewrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>BUYER NAME</th>
                      <th>SERVICE</th>
                      <th> STATE</th>
                      <th>PRICE</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => {
                      // Handle both leadId/userId (from API) and lead/user (if transformed)
                      const lead = purchase.lead || purchase.leadId;
                      const user = purchase.user || purchase.userId;
                      const purchaseId = purchase.id || purchase._id;
                      
                      return (
                        <tr key={purchaseId}>
                          <td style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                            {user?.userName || 'N/A'}
                          </td>
                          <td style={{ color: 'var(--text-main)' }}>
                            {lead?.firstName && lead?.lastName 
                              ? `${lead.firstName} ${lead.lastName}`
                              : 'OnePay'}
                          </td>
                          <td style={{ color: 'var(--text-main)' }}>
                            {lead?.state || 'N/A'}
                          </td>
                          <td style={{ color: '#28c76f', fontWeight: '600' }}>
                            {lead ? formatPrice(lead.price) : '$0.00'}
                          </td>
                          <td style={{ color: 'var(--text-main)' }}>
                            {formatDate(purchase.purchasedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SoldData;
