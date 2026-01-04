import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserPurchases } from '../services/api';
import { FaSearch, FaSync, FaFileExcel, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

// Canadian provinces and territories
const CANADIAN_PROVINCES = [
  'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 
  'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador',
  'Newfoundland', 'Prince Edward Island', 'Northwest Territories', 'Yukon', 'Nunavut'
];

// Major Canadian cities
const CANADIAN_CITIES = [
  'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa',
  'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria',
  'Halifax', 'Oshawa', 'Windsor', 'Saskatoon', 'Regina', 'Sherbrooke',
  'St. John\'s', 'Barrie', 'Kelowna', 'Abbotsford', 'Sudbury', 'Kingston',
  'Saguenay', 'Trois-Rivières', 'Guelph', 'Cambridge', 'Thunder Bay', 'Saint John'
];

// US states (2-letter codes)
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO',
  'CT', 'DE', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'RI', 'SC', 'SD',
  'TN', 'TX', 'UT', 'VT', 'VA', 'WA',
  'WV', 'WI', 'WY', 'DC'
];

// Major US cities
const US_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
  'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Detroit', 'Nashville',
  'Portland', 'Oklahoma City', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore',
  'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City',
  'Mesa', 'Atlanta', 'Omaha', 'Raleigh', 'Miami', 'Long Beach', 'Virginia Beach',
  'Oakland', 'Minneapolis', 'Tulsa', 'Tampa', 'Arlington', 'New Orleans'
];

// Helper function to check if state/city is Canadian
const isCanadianLocation = (state, city) => {
  const stateLower = (state || '').trim().toLowerCase();
  const cityLower = (city || '').trim().toLowerCase();
  
  const isCanadianState = CANADIAN_PROVINCES.some(province => 
    stateLower === province.toLowerCase()
  );
  
  const isCanadianCity = CANADIAN_CITIES.some(canadianCity => 
    cityLower === canadianCity.toLowerCase()
  );
  
  return isCanadianState || isCanadianCity;
};

// Helper function to check if state/city is US
const isUSLocation = (state, city) => {
  const stateLower = (state || '').trim().toLowerCase();
  const cityLower = (city || '').trim().toLowerCase();
  
  const isUSState = US_STATES.some(usState => 
    stateLower === usState.toLowerCase()
  );
  
  const isUSCity = US_CITIES.some(usCity => 
    cityLower === usCity.toLowerCase()
  );
  
  return isUSState || isUSCity;
};

const Orders = () => {
  const [purchasedata, setPurchasedata] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'canada', or 'usa'

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Reapply filters when tab changes
  useEffect(() => {
    if (purchasedata.length > 0) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
      // Apply tab filter after setting data
      applyFilters(transformedData);
      setSelectedRows(new Set()); // Clear selection when data is refreshed
    } catch (err) {
      setError(err.message || 'Failed to fetch purchases');
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters (search + tab filter)
  const applyFilters = (dataToFilter = purchasedata) => {
    let filtered = [...dataToFilter];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
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
    }

    // Apply country filter based on active tab
    if (activeTab === 'canada') {
      filtered = filtered.filter(item => {
        const state = item.lead?.state || item.state || '';
        const city = item.lead?.city || item.city || '';
        return isCanadianLocation(state, city);
      });
    } else if (activeTab === 'usa') {
      filtered = filtered.filter(item => {
        const state = item.lead?.state || item.state || '';
        const city = item.lead?.city || item.city || '';
        return isUSLocation(state, city);
      });
    }
    // If activeTab is 'all', show all records

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters are applied
  };

  const handleSearch = () => {
    applyFilters();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // If search is cleared, reapply filters (including tab filter)
    if (!e.target.value.trim()) {
      applyFilters();
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when tab changes
    // Reapply all filters with new tab
    applyFilters();
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
    // Get current page data
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPageData = filteredData.slice(startIndex, endIndex);
    const currentPageIds = new Set(currentPageData.map(item => item.id));
    
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (e.target.checked) {
        // Add all current page IDs
        currentPageIds.forEach(id => newSet.add(id));
      } else {
        // Remove only current page IDs
        currentPageIds.forEach(id => newSet.delete(id));
      }
      return newSet;
    });
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value, 10);
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Calculate pagination
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = filteredData.slice(startIndex, endIndex);

  const handleDownloadSelected = () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one record to download');
      return;
    }

    try {
      // Get selected records
      const selectedRecords = filteredData.filter(item => selectedRows.has(item.id));

      // Prepare data for Excel
      const excelData = selectedRecords.map(item => {
        const baseData = {
          'First Name': item.fname,
          'Last Name': item.lname,
          'Address': item.address,
          'City': item.city,
          'State': item.state,
          'ZIP': item.zip,
          'DOB': item.lead?.dob ? formatDOB(item.lead.dob) : item.dob,
          'SSN': item.ssn,
          'Phone': item.phone,
          'Score': item.score !== 'N/A' ? item.score : '',
          'Price': item.price,
          'Purchased Date': item.date ? formatDate(item.date) : 'N/A',
        };
        
        // Only include email for USA and All tabs
        if (activeTab === 'usa' || activeTab === 'all') {
          baseData['Email'] = item.email;
        }
        
        return baseData;
      });

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
          <p className="subtitle">
            View all your purchased data records
          </p>
          <p style={{ color: 'var(--success-color)', fontSize: '18px', fontWeight: '600',marginBottom:"0px" }}>
            Total Purchased: {totalRecords}
          </p>
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '2px solid var(--border-clr)',
        marginBottom: '20px',
        paddingLeft: '0'
      }}>
        <button
          onClick={() => handleTabChange('all')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'all' ? 'var(--primary-blue)' : 'var(--text-sub)',
            fontSize: '16px',
            fontWeight: activeTab === 'all' ? '700' : '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'all' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.3s'
          }}
        >
          All
        </button>
        <button
          onClick={() => handleTabChange('canada')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'canada' ? 'var(--primary-blue)' : 'var(--text-sub)',
            fontSize: '16px',
            fontWeight: activeTab === 'canada' ? '700' : '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'canada' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.3s'
          }}
        >
          Canada
        </button>
        <button
          onClick={() => handleTabChange('usa')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'usa' ? 'var(--primary-blue)' : 'var(--text-sub)',
            fontSize: '16px',
            fontWeight: activeTab === 'usa' ? '700' : '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'usa' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.3s'
          }}
        >
          USA
        </button>
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

      {/* Total Records and Page Size Selector */}
      {!loading && !error && filteredData.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          padding: '10px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-clr)'
        }}>
          <div style={{ 
            color: 'var(--text-main)', 
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} records
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <label style={{
              color: 'var(--text-main)',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Records per page:
            </label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-clr)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '80px'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

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
                        checked={currentPageData.length > 0 && currentPageData.every(item => selectedRows.has(item.id))}
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
                  {(activeTab === 'usa' || activeTab === 'all') && <th>EMAIL</th>}
                  <th>PHONE</th>
                  <th>SCORE</th>
                  <th>PRICE</th>
                  <th>PURCHASED DATE</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'canada' ? 13 : 14} className="emptyrow">
                      {searchQuery ? 'No records found matching your search.' : 'No purchased records found.'}
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((item) => (
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
                      {(activeTab === 'usa' || activeTab === 'all') && <td>{item.email}</td>}
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
        
        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '20px', 
            gap: '10px', 
            alignItems: 'center' 
          }}>
            <button
              className="applybtn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-sub)', fontSize: '14px' }}>
              Page {currentPage} of {totalPages}
            </span>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className="applybtn"
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    backgroundColor: currentPage === pageNum ? 'var(--primary-blue)' : 'var(--bg-card)',
                    color: currentPage === pageNum ? 'white' : 'var(--text-main)',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="applybtn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;