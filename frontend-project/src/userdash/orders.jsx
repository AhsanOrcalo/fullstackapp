import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserPurchases } from '../services/api';
import { FaSearch, FaSync, FaFileExcel } from 'react-icons/fa';

const Orders = () => {
  const [purchasedata, setPurchasedata] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      setFilteredData(transformedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch purchases');
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredData(purchasedata);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = purchasedata.filter(item => {
      const searchableText = `
        ${item.fname || ''} 
        ${item.lname || ''} 
        ${item.email || ''} 
        ${item.address || ''} 
        ${item.city || ''} 
        ${item.state || ''} 
        ${item.zip || ''} 
        ${item.phone || ''}
      `.toLowerCase();

      return searchableText.includes(query);
    });

    setFilteredData(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // If search is cleared, show all data
    if (!e.target.value.trim()) {
      setFilteredData(purchasedata);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
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
            <FaSync style={{ marginRight: '5px' }} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          {/* <button className="applybtn">
            <FaFileExcel style={{ marginRight: '5px' }} />
            Export to Excel
          </button> */}
        </div>
      </div>

      <div className="searchsection">
        <div className="searchbar">
          <FaSearch style={{ 
            color: 'var(--text-sub)', 
            fontSize: '16px', 
            marginLeft: '15px',
            marginRight: '10px'
          }} />
          <input 
            type="text" 
            placeholder="Search records by name, email, location or phone..." 
            className="ordersearch"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent' }}
          />
          <button className="applybtn" onClick={handleSearch}>
            <FaSearch style={{ marginRight: '5px' }} />
            Search
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
                  <th>FIRST NAME</th>
                  <th>LAST NAME</th>
                  <th>ADDRESS</th>
                  <th>CITY</th>
                  <th>STATE</th>
                  <th>ZIP</th>
                  <th>DOB</th>
                  <th>SSN</th>
                  <th>EMAIL</th>
                  <th>PRICE</th>
                  <th>PURCHASED DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="emptyrow">
                      {searchQuery ? 'No records found matching your search.' : 'No purchased records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
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