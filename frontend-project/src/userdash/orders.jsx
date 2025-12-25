import React, { useState, useEffect } from 'react';
import { getUserPurchases } from '../services/api';

const Orders = () => {
  const [purchasedata, setPurchasedata] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserPurchases();
      // Transform API data to match table structure
      const transformedData = Array.isArray(data) ? data.map(purchase => ({
        id: purchase.id,
        fname: purchase.lead?.firstName || 'N/A',
        lname: purchase.lead?.lastName || 'N/A',
        address: purchase.lead?.address || 'N/A',
        city: purchase.lead?.city || 'N/A',
        state: purchase.lead?.state || 'N/A',
        zip: purchase.lead?.zip || 'N/A',
        dob: purchase.lead?.dob ? new Date(purchase.lead.dob).toLocaleDateString() : 'N/A',
        ssn: purchase.lead?.ssn ? '***-**-' + purchase.lead.ssn.slice(-4) : 'N/A',
        email: purchase.lead?.email || 'N/A',
        phone: 'N/A', // Lead entity doesn't have phone
        price: purchase.lead?.price || 0,
        date: purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : 'N/A',
        lead: purchase.lead,
      })) : [];
      setPurchasedata(transformedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch purchases');
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
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
    <div className="ordersbox">
      <div className="ordersheader">
        <div className="headertitle">
          <h2 className="toptitle">Purchased Data</h2>
          <p className="subtitle">View all your purchased data records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="applybtn" onClick={fetchPurchases} disabled={loading}>
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
          <button className="applybtn">
            <span>📄 Export to Excel</span>
          </button>
        </div>
      </div>

      <div className="searchsection">
        <div className="searchbar">
          <input 
            type="text" 
            placeholder="Search records by name, email, location or phone..." 
            className="ordersearch"
          />
          <button className="applybtn">
            🔍 Search
          </button>
        </div>
      </div>

      <div className="tablecard">
        {loading ? (
          <div className="nodata">
            <p style={{ color: 'var(--text-sub)' }}>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="nodata">
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button className="applybtn" onClick={fetchPurchases} style={{ marginTop: '15px' }}>
              Retry
            </button>
          </div>
        ) : (
          <div className="tablewrapper">
            <table>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>ZIP</th>
                  <th>DOB</th>
                  <th>SSN</th>
                  <th>Email</th>
                  <th>Price</th>
                  <th>Purchased Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchasedata.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="emptyrow">No purchased records found.</td>
                  </tr>
                ) : (
                  purchasedata.map((item) => (
                    <tr key={item.id}>
                      <td>{item.fname}</td>
                      <td>{item.lname}</td>
                      <td>{item.address}</td>
                      <td>{item.city}</td>
                      <td>{item.state}</td>
                      <td>{item.zip}</td>
                      <td>{item.dob}</td>
                      <td>{item.ssn}</td>
                      <td>{item.email}</td>
                      <td style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                        {formatPrice(item.price)}
                      </td>
                      <td>{item.date}</td>
                      <td>
                        <button className="downloadbtn" title="Download Record">
                          📥
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;