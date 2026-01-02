import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllLeads, addMultipleToCart, purchaseLead } from '../services/api';

const Browsedata = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLeads, setSelectedLeads] = useState(new Set()); // Set of IDs for quick lookup
  const [selectedLeadsData, setSelectedLeadsData] = useState(new Map()); // Map of ID -> lead object for storing full data
  const [fastBuying, setFastBuying] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter state
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    dobFrom: '',
    dobTo: '',
    zip: '',
    state: '',
    scoreFilter: '',
    priceSort: '',
    canadaFilter: '',
  });

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const fetchLeads = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError('');
      const activeFilters = { ...filters, ...filterParams };
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v !== '')
      );
      
      // Add pagination
      cleanFilters.page = currentPage;
      cleanFilters.limit = pageSize;
      
      const response = await getAllLeads(cleanFilters);
      
      // Handle paginated response
      let data = [];
      if (response.leads) {
        // New paginated response
        data = response.leads;
        setTotalPages(response.totalPages || 1);
        setTotalRecords(response.total || 0);
      } else if (Array.isArray(response)) {
        // Legacy response (array)
        data = response;
        setTotalPages(1);
        setTotalRecords(data.length);
      }
      
      // Backend already filters out leads purchased by any user for regular users
      // So we just use the data as-is
      setLeads(data);
      // Update stored lead data for leads that are already selected (refresh their data)
      setSelectedLeadsData(prev => {
        const updated = new Map(prev);
        data.forEach(lead => {
          if (selectedLeads.has(lead.id)) {
            updated.set(lead.id, lead); // Update with latest data
          }
        });
        return updated;
      });
      // Don't clear selection when changing pages - preserve selections across pagination
    } catch (err) {
      setError(err.message || 'Failed to fetch leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: prev[name] === value ? '' : value, // Toggle if same value clicked
    }));
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value, 10);
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    setSelectedLeads(new Set()); // Clear selection when filters change
    setSelectedLeadsData(new Map()); // Clear stored lead data
    fetchLeads();
  };

  const clearFilters = () => {
    const clearedFilters = {
      name: '',
      city: '',
      dobFrom: '',
      dobTo: '',
      zip: '',
      state: '',
      scoreFilter: '',
      priceSort: '',
      canadaFilter: '',
    };
    setFilters(clearedFilters);
    setSelectedLeads(new Set()); // Clear selection when filters are cleared
    setSelectedLeadsData(new Map()); // Clear stored lead data
    fetchLeads(clearedFilters);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length && leads.length > 0) {
      // Deselect all current page leads
      const newSelected = new Set(selectedLeads);
      const newSelectedData = new Map(selectedLeadsData);
      leads.forEach(lead => {
        newSelected.delete(lead.id);
        newSelectedData.delete(lead.id);
      });
      setSelectedLeads(newSelected);
      setSelectedLeadsData(newSelectedData);
    } else {
      // Select all current page leads
      const newSelected = new Set(selectedLeads);
      const newSelectedData = new Map(selectedLeadsData);
      leads.forEach(lead => {
        newSelected.add(lead.id);
        newSelectedData.set(lead.id, lead);
      });
      setSelectedLeads(newSelected);
      setSelectedLeadsData(newSelectedData);
    }
  };

  const handleSelectLead = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    const newSelected = new Set(selectedLeads);
    const newSelectedData = new Map(selectedLeadsData);
    
    if (newSelected.has(leadId)) {
      // Deselect
      newSelected.delete(leadId);
      newSelectedData.delete(leadId);
    } else {
      // Select - store both ID and full lead object
      if (lead) {
        newSelected.add(leadId);
        newSelectedData.set(leadId, lead);
      }
    }
    setSelectedLeads(newSelected);
    setSelectedLeadsData(newSelectedData);
  };

  const handleFastBuy = async () => {
    if (selectedLeads.size === 0) {
      alert('Please select at least one lead to purchase');
      return;
    }

    // Get all selected leads from stored data (across all pages)
    const leadsToPurchase = Array.from(selectedLeadsData.values());
      const totalPrice = leadsToPurchase.reduce((sum, lead) => sum + (lead.price || 0), 0);

    const confirmMessage = selectedLeads.size === 1
      ? `Purchase this lead for ${formatPrice(totalPrice)}?`
      : `Purchase ${selectedLeads.size} leads for ${formatPrice(totalPrice)}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setFastBuying(true);
    try {
      let successCount = 0;
      let failedCount = 0;
      let lastRemainingBalance = null;
      const errors = [];

      // Purchase leads sequentially
      for (const lead of leadsToPurchase) {
        try {
          const result = await purchaseLead(lead.id);
          if (result.remainingBalance !== undefined) {
            lastRemainingBalance = result.remainingBalance;
          }
          successCount++;
        } catch (error) {
          failedCount++;
          errors.push(`${lead.firstName} ${lead.lastName}: ${error.message || 'Purchase failed'}`);
        }
      }

      // Clear selection
      setSelectedLeads(new Set());
      setSelectedLeadsData(new Map());
      
      // Refresh leads list to remove purchased items
      await fetchLeads();

      // Trigger balance update event
      window.dispatchEvent(new CustomEvent('balanceUpdated'));

      // Show result message
      let message = `Purchase completed!\n\nSuccess: ${successCount}`;
      if (failedCount > 0) {
        message += `\nFailed: ${failedCount}`;
        if (errors.length > 0) {
          message += `\n\nErrors:\n${errors.slice(0, 3).join('\n')}`;
          if (errors.length > 3) {
            message += `\n... and ${errors.length - 3} more`;
          }
        }
      }
      if (lastRemainingBalance !== null) {
        message += `\n\nRemaining balance: ${formatPrice(lastRemainingBalance)}`;
      }
      alert(message);
    } catch (error) {
      alert('Failed to complete purchase: ' + (error.message || 'Unknown error'));
      console.error('Fast buy error:', error);
    } finally {
      setFastBuying(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const formatDOBWithAge = (dob) => {
    if (!dob) return 'N/A';
    try {
      const birthDate = new Date(dob);
      const year = birthDate.getFullYear();
      const age = calculateAge(dob);
      if (age !== null) {
        return `${year} (age ${age})`;
      }
      return year.toString();
    } catch {
      return 'N/A';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get unique states from leads for dropdown
  const uniqueStates = [...new Set(leads.map(lead => lead.state).filter(Boolean))].sort(); 

  return (
    <div className="browsebox">
      <div className="browsetop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '24px', fontWeight: '700' }}>
            Browse Data
          </h2>
          <p className="subtitle" style={{ marginTop: '5px' }}>
            Showing {leads.length} of {totalRecords} {totalRecords === 1 ? 'available lead' : 'available leads'}
          </p>
        </div>
        <div className="topbuttons" style={{ display: 'flex', gap: '10px' }}>
          {/* <button className="applybtn" onClick={handleSelectAll}>
            {selectedLeads.size === leads.length && leads.length > 0 ? 'Deselect All' : 'Select All'}
          </button> */}
          <button 
            className="applybtn" 
            disabled={selectedLeads.size === 0 || fastBuying}
            onClick={() => {
              // Get all selected leads from stored data (across all pages)
              const leadsToAdd = Array.from(selectedLeadsData.values());
              addMultipleToCart(leadsToAdd);
              setSelectedLeads(new Set());
              setSelectedLeadsData(new Map());
              alert(`${leadsToAdd.length} lead(s) added to cart!`);
            }}
            style={{ 
              backgroundColor: 'var(--primary-blue)',
              opacity: selectedLeads.size === 0 || fastBuying ? 0.6 : 1
            }}
          >
            🛒 Add to Cart ({selectedLeads.size})
          </button>
          <button 
            className="applybtn" 
            disabled={selectedLeads.size === 0 || fastBuying}
            onClick={handleFastBuy}
            style={{ 
              backgroundColor: '#10b981',
              opacity: selectedLeads.size === 0 || fastBuying ? 0.6 : 1
            }}
          >
            {fastBuying ? '⏳ Purchasing...' : '⚡ Fast Buy'}
          </button>
        </div>
      </div>

      <div className="filtercard">
        <div className="filterheader">
          <span className="filtertitle" style={{ fontWeight: '700', color: 'var(--text-main)' }}>Filters</span>
          <button className="clearbtn" onClick={clearFilters}>Clear All</button>
        </div>
        
        <div className="filtergrid">
          <div className="filtergroup">
            <label style={{ fontWeight: '700', color: 'var(--text-main)' }}>Name</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Search by name"
              className="filterinput"
            />
          </div>
          <div className="filtergroup">
            <label style={{ fontWeight: '700', color: 'var(--text-main)' }}>City</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Search by city"
              className="filterinput"
            />
          </div>
          <div className="filtergroup">
            <label style={{ fontWeight: '700', color: 'var(--text-main)' }}>Date of Birth (Year)</label>
            <div className="daterow">
              <input
                type="text"
                name="dobFrom"
                value={filters.dobFrom}
                onChange={handleFilterChange}
                placeholder="From"
                className="filterinput"
              />
              <input
                type="text"
                name="dobTo"
                value={filters.dobTo}
                onChange={handleFilterChange}
                placeholder="To"
                className="filterinput"
              />
            </div>
          </div>
          <div className="filtergroup">
            <label style={{ fontWeight: '700', color: 'var(--text-main)' }}>ZIP Code</label>
            <input
              type="text"
              name="zip"
              value={filters.zip}
              onChange={handleFilterChange}
              placeholder="Search by ZIP"
              className="filterinput"
            />
          </div>
        </div>

        <div className="filtergrid">
          <div className="filtergroup">
            <label style={{ fontWeight: '700', color: 'var(--text-main)' }}>Score</label>
            <div className="checkrow">
              <label className="customradio">
                <input
                  type="radio"
                  name="scoreFilter"
                  checked={filters.scoreFilter === ''}
                  onChange={() => handleRadioChange('scoreFilter', '')}
                />
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>All</span>
              </label>
              <label className="customradio">
                <input
                  type="radio"
                  name="scoreFilter"
                  checked={filters.scoreFilter === '700+'}
                  onChange={() => handleRadioChange('scoreFilter', '700+')}
                />
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>700+ Score</span>
              </label>
              <label className="customradio">
                <input
                  type="radio"
                  name="scoreFilter"
                  checked={filters.scoreFilter === '800+'}
                  onChange={() => handleRadioChange('scoreFilter', '800+')}
                />
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>800+ Score</span>
              </label>
              <label className="customradio">
                <input
                  type="radio"
                  name="scoreFilter"
                  checked={filters.scoreFilter === 'random'}
                  onChange={() => handleRadioChange('scoreFilter', 'random')}
                />
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Random</span>
              </label>
            </div>
          </div>
          <div className="filtergroup">
            <label style={{ fontWeight: '700', color: 'var(--text-main)' }}>State</label>
            <select
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
              className="filterinput"
            >
              <option value="">All States/Provinces</option>
              {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="filtergroup">
            <label style={{ fontWeight: '700', color: 'var(--text-main)' }}>Price Sort</label>
            <div className="checkrow">
              <label className="customradio">
                <input
                  type="radio"
                  name="priceSort"
                  checked={filters.priceSort === 'high-to-low'}
                  onChange={() => handleRadioChange('priceSort', 'high-to-low')}
                />
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>High to Low</span>
              </label>
              <label className="customradio">
                <input
                  type="radio"
                  name="priceSort"
                  checked={filters.priceSort === 'low-to-high'}
                  onChange={() => handleRadioChange('priceSort', 'low-to-high')}
                />
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Low to High</span>
              </label>
            </div>
          </div>
          <div className="filtergroup">
            <label style={{ fontWeight: '700', color: 'var(--text-main)' }}>Country</label>
            <div className="checkrow">
              <label className="customradio">
                <input
                  type="radio"
                  name="canadaFilter"
                  checked={filters.canadaFilter === 'canada'}
                  onChange={() => handleRadioChange('canadaFilter', 'canada')}
                />
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Canada</span>
              </label>
            </div>
          </div>
        </div>

        <button className="applybtn" onClick={applyFilters}>Apply Filters</button>
      </div>

      {/* Total Records and Page Size Selector */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-clr)'
      }}>
        <div style={{ 
          color: 'var(--text-main)', 
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Total Records: <span style={{ color: 'var(--primary-blue)', fontWeight: '700' }}>{totalRecords}</span>
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

      <div className="tablecard">
        {loading ? (
          <div className="nodata">
            <p style={{ color: 'var(--text-sub)' }}>Loading leads...</p>
          </div>
        ) : error ? (
          <div className="nodata">
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button className="applybtn" onClick={fetchLeads} style={{ marginTop: '15px' }}>
              Retry
            </button>
          </div>
        ) : leads.length === 0 ? (
          <div className="nodata">
            No available leads found. Try adjusting your filters.
          </div>
        ) : (
          <div className="tablewrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    <label className="customcheck">
                      <input
                        type="checkbox"
                        checked={selectedLeads.size === leads.length && leads.length > 0}
                        onChange={handleSelectAll}
                      />
                    </label>
                  </th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  {/* <th>Email</th> */}
                  <th>City</th>
                  <th>State</th>
                  <th>Year of Birth</th>
                  <th>ZIP Code</th>
                  <th>Score</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <label className="customcheck">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                        />
                      </label>
                    </td>
                    <td>{lead.firstName || 'N/A'}</td>
                    <td>{lead.lastName || 'N/A'}</td>
                    {/* <td>{lead.email || 'N/A'}</td> */}
                    <td>{lead.city || 'N/A'}</td>
                    <td>{lead.state || 'N/A'}</td>
                    <td>{formatDOBWithAge(lead.dob)}</td>
                    <td>{lead.zip || 'N/A'}</td>
                    <td>
                      {lead.score ? (
                        <span style={{ 
                          color: (() => {
                            const scoreNum = parseFloat(lead.score);
                            if (!isNaN(scoreNum)) {
                              return scoreNum >= 800 ? '#10b981' : scoreNum >= 700 ? '#3b82f6' : '#ef4444';
                            }
                            return 'var(--text-main)'; // Default color for text scores
                          })(),
                          fontWeight: '600'
                        }}>
                          {lead.score}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                      {formatPrice(lead.price || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px', alignItems: 'center' }}>
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

export default Browsedata;