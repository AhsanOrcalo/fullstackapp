import React, { useState, useEffect } from 'react';
import { getAllLeads, addMultipleToCart } from '../services/api';

const Browsedata = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  
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
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError('');
      const activeFilters = { ...filters, ...filterParams };
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, v]) => v !== '')
      );
      const data = await getAllLeads(cleanFilters);
      // Backend already filters out leads purchased by any user for regular users
      // So we just use the data as-is
      setLeads(Array.isArray(data) ? data : []);
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

  const applyFilters = () => {
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
    };
    setFilters(clearedFilters);
    fetchLeads(clearedFilters);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
    }
  };

  const handleSelectLead = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
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
            {leads.length} {leads.length === 1 ? 'available lead' : 'available leads'}
          </p>
        </div>
        <div className="topbuttons" style={{ display: 'flex', gap: '10px' }}>
          {/* <button className="applybtn" onClick={handleSelectAll}>
            {selectedLeads.size === leads.length && leads.length > 0 ? 'Deselect All' : 'Select All'}
          </button> */}
          <button 
            className="applybtn" 
            disabled={selectedLeads.size === 0}
            onClick={() => {
              const selectedLeadsData = leads.filter(lead => selectedLeads.has(lead.id));
              addMultipleToCart(selectedLeadsData);
              setSelectedLeads(new Set());
              alert(`${selectedLeadsData.length} lead(s) added to cart!`);
            }}
          >
            🛒 Add to Cart ({selectedLeads.size})
          </button>
        </div>
      </div>

      <div className="filtercard">
        <div className="filterheader">
          <span className="filtertitle">Filters</span>
          <button className="clearbtn" onClick={clearFilters}>Clear All</button>
        </div>
        
        <div className="filtergrid">
          <div className="filtergroup">
            <label>Name</label>
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
            <label>City</label>
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
            <label>Date of Birth (Year)</label>
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
            <label>ZIP Code</label>
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
            <label>Score</label>
            <div className="checkrow">
              <label className="customradio">
                <input
                  type="radio"
                  name="scoreFilter"
                  checked={filters.scoreFilter === '700+'}
                  onChange={() => handleRadioChange('scoreFilter', '700+')}
                />
                <span>700+ Score</span>
              </label>
              <label className="customradio">
                <input
                  type="radio"
                  name="scoreFilter"
                  checked={filters.scoreFilter === '800+'}
                  onChange={() => handleRadioChange('scoreFilter', '800+')}
                />
                <span>800+ Score</span>
              </label>
            </div>
          </div>
          <div className="filtergroup">
            <label>State</label>
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
            <label>Price Sort</label>
            <div className="checkrow">
              <label className="customradio">
                <input
                  type="radio"
                  name="priceSort"
                  checked={filters.priceSort === 'high-to-low'}
                  onChange={() => handleRadioChange('priceSort', 'high-to-low')}
                />
                <span>High to Low</span>
              </label>
              <label className="customradio">
                <input
                  type="radio"
                  name="priceSort"
                  checked={filters.priceSort === 'low-to-high'}
                  onChange={() => handleRadioChange('priceSort', 'low-to-high')}
                />
                <span>Low to High</span>
              </label>
            </div>
          </div>
        </div>

        <button className="applybtn" onClick={applyFilters}>Apply Filters</button>
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
                  <th>Email</th>
                  <th>City</th>
                  <th>State</th>
                  <th>DOB</th>
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
                    <td>{lead.email || 'N/A'}</td>
                    <td>{lead.city || 'N/A'}</td>
                    <td>{lead.state || 'N/A'}</td>
                    <td>{formatDate(lead.dob)}</td>
                    <td>{lead.zip || 'N/A'}</td>
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
                    <td style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                      {formatPrice(lead.price || 0)}
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

export default Browsedata;