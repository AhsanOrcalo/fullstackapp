import React, { useState, useEffect, useCallback } from 'react';
import { getAllLeads, addLead } from '../services/api';
import { FaSearch, FaFileAlt, FaDatabase, FaUpload, FaDownload, FaPlus } from 'react-icons/fa';

const DataManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    dob: '',
    ssn: '',
    price: '',
    score: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Filter state - simplified to only search and score filter
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const filters = {};
      if (searchQuery) {
        filters.name = searchQuery;
      }
      if (scoreFilter) {
        filters.scoreFilter = scoreFilter;
      }
      const data = await getAllLeads(filters);
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, scoreFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLeads();
    }, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [fetchLeads]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleScoreFilterChange = (value) => {
    setScoreFilter(scoreFilter === value ? '' : value);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Auto-format SSN
    if (name === 'ssn') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      // Format as XXX-XX-XXXX
      if (digits.length <= 3) {
        processedValue = digits;
      } else if (digits.length <= 5) {
        processedValue = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else {
        processedValue = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }
    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errors.city = 'City must be at least 2 characters';
    }
    if (!formData.state.trim() || formData.state.trim().length < 2) {
      errors.state = 'State must be at least 2 characters';
    }
    if (!formData.zip.trim() || !/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      errors.zip = 'ZIP code must be in format 12345 or 12345-6789';
    }
    if (!formData.dob) {
      errors.dob = 'Date of birth is required';
    }
    if (!formData.ssn.trim() || !/^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)) {
      errors.ssn = 'SSN must be in format XXX-XX-XXXX';
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      errors.price = 'Price must be a positive number';
    }
    if (formData.score && (isNaN(formData.score) || parseFloat(formData.score) < 300 || parseFloat(formData.score) > 850)) {
      errors.score = 'Score must be between 300 and 850';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const leadPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip: formData.zip.trim(),
        dob: formData.dob,
        ssn: formData.ssn.trim(),
        price: parseFloat(formData.price),
        score: formData.score ? parseFloat(formData.score) : undefined,
      };

      await addLead(leadPayload);
      
      // Reset form and close modal
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        dob: '',
        ssn: '',
        price: '',
        score: '',
      });
      setFormErrors({});
      setShowForm(false);
      
      // Refresh leads list with current filters
      await fetchLeads();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to add lead. Please try again.' });
      console.error('Error adding lead:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      dob: '',
      ssn: '',
      price: '',
      score: '',
    });
    setFormErrors({});
  };

  return (
    <div style={{ width: '100%', padding: '0' }}>
      {/* Header Section with Buttons in Parallel */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Title Section */}
        <div>
          <h1 style={{ 
            color: 'var(--text-main)', 
            margin: '0 0 5px 0', 
            fontSize: '32px', 
            fontWeight: '700' 
          }}>
            Data Management
          </h1>
          <p style={{ 
            color: 'var(--text-sub)', 
            margin: '0', 
            fontSize: '16px' 
          }}>
            Manage and view all data records.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          alignItems: 'flex-start'
        }}>
          <button className="dm-btn">
            <FaFileAlt />
            <span>Templates</span>
          </button>
          <button className="dm-btn">
            <FaDatabase />
            <span>Sample Data</span>
          </button>
          <button className="dm-btn">
            <FaUpload />
            <span>Import</span>
          </button>
          <button className="dm-btn">
            <FaDownload />
            <span>Export</span>
          </button>
          <button 
            className="applybtn"
            onClick={() => setShowForm(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 18px'
            }}
          >
            <FaPlus />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Search Bar - Smaller */}
        <div style={{ 
          width: '300px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid var(--border-clr)',
            gap: '8px'
          }}>
            <FaSearch style={{ color: 'var(--text-sub)', fontSize: '14px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search records..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '14px',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Score Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          alignItems: 'center'
        }}>
          <label className="customradio" style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              checked={scoreFilter === '700+'}
              onChange={() => handleScoreFilterChange('700+')}
            />
            <span style={{ color: 'var(--text-main)', fontSize: '14px' }}>700+</span>
          </label>
          <label className="customradio" style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              checked={scoreFilter === '800+'}
              onChange={() => handleScoreFilterChange('800+')}
            />
            <span style={{ color: 'var(--text-main)', fontSize: '14px' }}>800+</span>
          </label>
        </div>

        {/* Record Count */}
        <div style={{ 
          color: 'var(--text-sub)', 
          fontSize: '14px',
          fontWeight: '500',
          marginLeft: 'auto'
        }}>
          {leads.length} records
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
            No leads found. Add leads to see them here.
          </div>
        ) : (
          <div className="tablewrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    <label className="customcheck" style={{ margin: 0 }}>
                      <input type="checkbox" />
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
                  <th>MAIL</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <label className="customcheck" style={{ margin: 0 }}>
                        <input type="checkbox" />
                      </label>
                    </td>
                    <td>{lead.firstName || 'N/A'}</td>
                    <td>{lead.lastName || 'N/A'}</td>
                    <td>{lead.address || 'N/A'}</td>
                    <td>{lead.city || 'N/A'}</td>
                    <td>{lead.state || 'N/A'}</td>
                    <td>{lead.zip || 'N/A'}</td>
                    <td>{lead.dob ? new Date(lead.dob).getFullYear() : 'N/A'}</td>
                    <td>{lead.ssn || 'N/A'}</td>
                    <td>{lead.email || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={handleCloseForm}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '30px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--border-clr)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                Add New Lead
              </h2>
              <button
                onClick={handleCloseForm}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-sub)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="filtergroup">
                  <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="filterinput"
                    placeholder="John"
                  />
                  {formErrors.firstName && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      {formErrors.firstName}
                    </span>
                  )}
                </div>

                <div className="filtergroup">
                  <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="filterinput"
                    placeholder="Doe"
                  />
                  {formErrors.lastName && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      {formErrors.lastName}
                    </span>
                  )}
                </div>
              </div>

              <div className="filtergroup" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="filterinput"
                  placeholder="john.doe@example.com"
                />
                {formErrors.email && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    {formErrors.email}
                  </span>
                )}
              </div>

              <div className="filtergroup" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="filterinput"
                  placeholder="123 Main Street"
                />
                {formErrors.address && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    {formErrors.address}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="filtergroup">
                  <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="filterinput"
                    placeholder="Los Angeles"
                  />
                  {formErrors.city && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      {formErrors.city}
                    </span>
                  )}
                </div>

                <div className="filtergroup">
                  <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="filterinput"
                    placeholder="California"
                  />
                  {formErrors.state && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      {formErrors.state}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="filtergroup">
                  <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    className="filterinput"
                    placeholder="90001"
                  />
                  {formErrors.zip && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      {formErrors.zip}
                    </span>
                  )}
                </div>

                <div className="filtergroup">
                  <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="filterinput"
                  />
                  {formErrors.dob && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      {formErrors.dob}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="filtergroup">
                  <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                    SSN *
                  </label>
                  <input
                    type="text"
                    name="ssn"
                    value={formData.ssn}
                    onChange={handleInputChange}
                    className="filterinput"
                    placeholder="123-45-6789"
                    maxLength="11"
                  />
                  {formErrors.ssn && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      {formErrors.ssn}
                    </span>
                  )}
                </div>

                <div className="filtergroup">
                  <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="filterinput"
                    placeholder="50000"
                    min="0"
                    step="0.01"
                  />
                  {formErrors.price && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      {formErrors.price}
                    </span>
                  )}
                </div>
              </div>

              <div className="filtergroup" style={{ marginBottom: '15px' }}>
                <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Score
                </label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleInputChange}
                  className="filterinput"
                  placeholder="750"
                  min="300"
                  max="850"
                  step="1"
                />
                {formErrors.score && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    {formErrors.score}
                  </span>
                )}
              </div>

              {formErrors.submit && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '15px',
                  color: '#ef4444',
                }}>
                  {formErrors.submit}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  style={{
                    padding: '12px 30px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-clr)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: '0.3s',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="applybtn"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;

