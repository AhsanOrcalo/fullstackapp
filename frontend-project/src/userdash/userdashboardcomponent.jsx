import React, { useState, useEffect } from 'react';
import { getUserDashboardStats, getAllLeads } from '../services/api';
import { getUserData } from '../services/api';

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
      const data = await getAllLeads();
      // Backend already filters out leads purchased by any user for regular users
      setLeads(Array.isArray(data) ? data : []);
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

  return (
    <div>
      {/* Stats Cards Row */}
      <div className="statsrow">
        <div className="statcard">
          <div className="cardinfo">
            <p className="cardtitle">Data Purchased</p>
            {loading ? (
              <h1 className="cardvalue">...</h1>
            ) : error ? (
              <h1 className="cardvalue" style={{ color: '#ef4444', fontSize: '20px' }}>
                Error
              </h1>
            ) : (
              <h1 className="cardvalue">{stats.dataPurchased}</h1>
            )}
          </div>
          <span className="cardicon">📊</span>
        </div>
        <div className="statcard">
          <div className="cardinfo">
            <p className="cardtitle">Available Balance</p>
            {loading ? (
              <h1 className="cardvalue">...</h1>
            ) : error ? (
              <h1 className="cardvalue" style={{ color: '#ef4444', fontSize: '20px' }}>
                Error
              </h1>
            ) : (
              <h1 className="cardvalue">{formatPrice(stats.availableBalance)}</h1>
            )}
          </div>
          <span className="cardicon">💰</span>
        </div>
      </div>

      {/* All Data Available Section */}
      <div className="datasection" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="sectiontitle">All Data Available</h2>
          <button className="applybtn" onClick={fetchAvailableLeads} disabled={leadsLoading}>
            {leadsLoading ? 'Loading...' : '🔄 Refresh'}
          </button>
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
          <div className="tablewrapper">
            <table>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>ZIP</th>
                  <th>DOB</th>
                  <th>Price</th>
                  <th>Score</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.firstName || 'N/A'}</td>
                    <td>{lead.lastName || 'N/A'}</td>
                    <td>{lead.email || 'N/A'}</td>
                    <td>{lead.address || 'N/A'}</td>
                    <td>{lead.city || 'N/A'}</td>
                    <td>{lead.state || 'N/A'}</td>
                    <td>{lead.zip || 'N/A'}</td>
                    <td>{formatDate(lead.dob)}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardComponent;

