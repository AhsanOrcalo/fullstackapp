import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserPurchases } from '../services/api';
import { FaSearch, FaSync, FaFileExcel, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const Orders = () => {
  const [purchasedata, setPurchasedata] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserPurchases();
      // Transform API data to match table structure
      const formatDOBForDisplay = (dob) => {
        if (!dob) return 'N/A';
        try {
          const date = new Date(dob);
          const month = String(date.getMonth() + 1);
          const day = String(date.getDate());
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        } catch {
          return 'N/A';
        }
      };

      const transformedData = Array.isArray(data) ? data.map(purchase => ({
        id: purchase.id,
        fname: purchase.lead?.firstName || 'N/A',
        lname: purchase.lead?.lastName || 'N/A',
        address: purchase.lead?.address || 'N/A',
        city: purchase.lead?.city || 'N/A',
        state: purchase.lead?.state || 'N/A',
        zip: purchase.lead?.zip || 'N/A',
        dob: purchase.lead?.dob ? formatDOBForDisplay(purchase.lead.dob) : 'N/A',
        ssn: purchase.lead?.ssn || 'N/A', // Show full SSN
        email: purchase.lead?.email || 'N/A',
        phone: purchase.lead?.phone || 'N/A', // Show phone number
        score: purchase.lead?.score || 'N/A', // Show score
        price: purchase.lead?.price || 0,
        date: purchase.purchasedAt ? purchase.purchasedAt : null,
        lead: purchase.lead,
      })) : [];
      setPurchasedata(transformedData);
      setFilteredData(transformedData);
      setSelectedRows(new Set()); // Clear selection when data is refreshed
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

  const formatDOB = (dob) => {
    if (!dob || dob === 'N/A') return 'N/A';
    try {
      const date = new Date(dob);
      const month = String(date.getMonth() + 1);
      const day = String(date.getDate());
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return dob;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return dateString;
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredData.map(item => item.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleDownloadSelected = () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one record to download');
      return;
    }

    try {
      // Get selected records
      const selectedRecords = filteredData.filter(item => selectedRows.has(item.id));

      // Prepare data for Excel
      const excelData = selectedRecords.map(item => ({
        'First Name': item.fname,
        'Last Name': item.lname,
        'Address': item.address,
        'City': item.city,
        'State': item.state,
        'ZIP': item.zip,
        'DOB': item.lead?.dob ? formatDOB(item.lead.dob) : item.dob,
        'SSN': item.ssn,
        'Email': item.email,
        'Phone': item.phone,
        'Score': item.score !== 'N/A' ? item.score : '',
        'Price': item.price,
        'Purchased Date': item.date ? formatDate(item.date) : 'N/A',
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchased Data');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchased_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Clear selection after download
      setSelectedRows(new Set());
    } catch (err) {
      alert('Failed to export data: ' + err.message);
      console.error('Export error:', err);
    }
  }; 

  return (
    <div className="ordersbox">
      <div className="ordersheader">
        <div className="headertitle">
          <h2 className="toptitle">Purchased Data</h2>
          <p className="subtitle">View all your purchased data records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedRows.size > 0 && (
            <button className="applybtn" onClick={handleDownloadSelected} style={{ backgroundColor: '#10b981' }}>
              <FaDownload style={{ marginRight: '5px' }} />
              Download Selected ({selectedRows.size})
            </button>
          )}
          <button className="applybtn" onClick={fetchPurchases} disabled={loading}>
            <FaSync style={{ marginRight: '5px' }} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
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
                  <th>
                    <label className="customcheck" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={filteredData.length > 0 && selectedRows.size === filteredData.length}
                        onChange={handleSelectAll}
                      />
                    </label>
                  </th>
                  <th>FIRST NAME</th>
                  <th>LAST NAME</th>
                  <th>ADDRESS</th>
                  <th>CITY</th>
                  <th>STATE</th>
                  <th>ZIP</th>
                  <th>DOB</th>
                  <th>SSN</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>SCORE</th>
                  <th>PRICE</th>
                  <th>PURCHASED DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="emptyrow">
                      {searchQuery ? 'No records found matching your search.' : 'No purchased records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <label className="customcheck" style={{ margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(item.id)}
                            onChange={() => handleSelectRow(item.id)}
                          />
                        </label>
                      </td>
                      <td>{item.fname}</td>
                      <td>{item.lname}</td>
                      <td>{item.address}</td>
                      <td>{item.city}</td>
                      <td>{item.state}</td>
                      <td>{item.zip}</td>
                      <td>{item.lead?.dob ? formatDOB(item.lead.dob) : item.dob}</td>
                      <td>{item.ssn}</td>
                      <td>{item.email}</td>
                      <td>{item.phone}</td>
                      <td>
                        {item.score && item.score !== 'N/A' ? (
                          <span style={{
                            color: typeof item.score === 'number' 
                              ? (item.score >= 800 ? '#10b981' : item.score >= 700 ? '#3b82f6' : '#ef4444')
                              : 'var(--text-main)',
                            fontWeight: '600'
                          }}>
                            {item.score}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                        {formatPrice(item.price)}
                      </td>
                      <td>{item.date ? formatDate(item.date) : 'N/A'}</td>
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