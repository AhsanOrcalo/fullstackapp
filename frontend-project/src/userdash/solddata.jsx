import React, { useState, useEffect } from 'react';
import { getAllPurchases } from '../services/api';

const SoldData = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllPurchases();
      setPurchases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch sold leads');
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="browsebox">
      <div className="browsetop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '24px', fontWeight: '700' }}>
            Sold Data
          </h2>
          <p className="subtitle" style={{ marginTop: '5px' }}>
            {purchases.length} {purchases.length === 1 ? 'lead sold' : 'leads sold'}
          </p>
        </div>
        <button className="applybtn" onClick={fetchPurchases} disabled={loading}>
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="tablecard">
        {loading ? (
          <div className="nodata">
            <p style={{ color: 'var(--text-sub)' }}>Loading sold leads...</p>
          </div>
        ) : error ? (
          <div className="nodata">
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button className="applybtn" onClick={fetchPurchases} style={{ marginTop: '15px' }}>
              Retry
            </button>
          </div>
        ) : purchases.length === 0 ? (
          <div className="nodata">
            No leads have been sold yet. Sales will appear here once users purchase leads.
          </div>
        ) : (
          <div className="tablewrapper">
            <table>
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Lead Name</th>
                  <th>Lead Email</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>ZIP</th>
                  <th>Price</th>
                  <th>Buyer</th>
                  <th>Buyer Email</th>
                  <th>Sold Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td style={{ color: 'var(--text-sub)', fontSize: '12px', fontFamily: 'monospace' }}>
                      {purchase.id.substring(0, 8)}...
                    </td>
                    <td>
                      {purchase.lead ? (
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {purchase.lead.firstName} {purchase.lead.lastName}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{purchase.lead?.email || 'N/A'}</td>
                    <td>{purchase.lead?.address || 'N/A'}</td>
                    <td>{purchase.lead?.city || 'N/A'}</td>
                    <td>{purchase.lead?.state || 'N/A'}</td>
                    <td>{purchase.lead?.zip || 'N/A'}</td>
                    <td style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                      {purchase.lead ? formatPrice(purchase.lead.price || 0) : 'N/A'}
                    </td>
                    <td>
                      {purchase.user ? (
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {purchase.user.userName}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{purchase.user?.email || 'N/A'}</td>
                    <td style={{ color: 'var(--text-sub)', fontSize: '14px' }}>
                      {formatDate(purchase.purchasedAt)}
                    </td>
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

export default SoldData;

