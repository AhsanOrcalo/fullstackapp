import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getAllLeads, addLead, deleteLead, deleteLeads, getUserData } from '../services/api';
import { FaSearch, FaFileAlt, FaDatabase, FaUpload, FaDownload, FaPlus, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const DataManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState({ success: 0, failed: 0, total: 0 });
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Filter state - search and score filter
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;
  
  // Selection state for delete functionality
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  
  // Check if user is admin
  const userData = getUserData();
  const isAdmin = userData?.role === 'admin';

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build filters - search and score filters work for both "All" and "Canada"
      const filters = {
        page: currentPage,
        limit: pageSize,
      };
      if (searchQuery) {
        filters.name = searchQuery;
      }
      if (scoreFilter) {
        filters.scoreFilter = scoreFilter;
      }
      
      const response = await getAllLeads(filters);
      
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
      
      setLeads(data);
      // Clear selection when leads are refreshed
      setSelectedLeads(new Set());
    } catch (err) {
      setError(err.message || 'Failed to fetch leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, scoreFilter, currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLeads();
    }, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [fetchLeads]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleScoreFilterChange = (value) => {
    setScoreFilter(scoreFilter === value ? '' : value);
    setCurrentPage(1); // Reset to first page when filter changes
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

  // Export to CSV
  const handleExport = () => {
    try {
      // Prepare CSV headers - matching table column order
      const headers = [
        'FIRST NAME',
        'LAST NAME',
        'ADDRESS',
        'CITY',
        'STATE',
        'ZIP',
        'DOB',
        'SSN',
        'MAIL',
        'PHONE',
        'PRICE',
        'SCORE',
        'CREATED AT'
      ];

      // Convert leads to CSV rows
      const csvRows = [
        headers.join(','),
        ...leads.map(lead => {
          const row = [
            `"${(lead.firstName || '').replace(/"/g, '""')}"`,
            `"${(lead.lastName || '').replace(/"/g, '""')}"`,
            `"${(lead.address || '').replace(/"/g, '""')}"`,
            `"${(lead.city || '').replace(/"/g, '""')}"`,
            `"${(lead.state || '').replace(/"/g, '""')}"`,
            `"${(lead.zip || '').replace(/"/g, '""')}"`,
            `"${formatDOBWithAge(lead.dob)}"`,
            `"${(lead.ssn || '').replace(/"/g, '""')}"`,
            `"${(lead.email || '').replace(/"/g, '""')}"`,
            `"${(lead.phone || '').replace(/"/g, '""')}"`,
            lead.price || 0,
            lead.score || '',
            `"${lead.createdAt ? new Date(lead.createdAt).toISOString() : ''}"`
          ];
          return row.join(',');
        })
      ];

      // Create CSV content
      const csvContent = csvRows.join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export data: ' + err.message);
      console.error('Export error:', err);
    }
  };

  // Import from CSV or XLSX
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const isCSV = file.name.endsWith('.csv');
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    
    if (!isCSV && !isXLSX) {
      alert('Please select a CSV or XLSX file');
      return;
    }

    try {
      setImporting(true);
      setImportStatus({ success: 0, failed: 0, total: 0 });

      let headers = [];
      let dataRows = [];

      if (isCSV) {
        // Parse CSV file
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV file is empty or invalid');
          setImporting(false);
          return;
        }

        // Parse CSV header row
        const parseCSVLine = (line) => {
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim().replace(/^"|"$/g, ''));
          return values;
        };

        const headerLine = lines[0];
        headers = parseCSVLine(headerLine).map(h => h.trim().toUpperCase());
        const csvDataRows = lines.slice(1);
        
        // Parse each CSV row
        dataRows = csvDataRows.map(row => {
          if (!row.trim()) return null;
          return parseCSVLine(row);
        }).filter(row => row !== null);
      } else {
        // Parse XLSX file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (jsonData.length < 2) {
          alert('XLSX file is empty or invalid');
          setImporting(false);
          return;
        }

        // First row is headers
        headers = jsonData[0].map(h => String(h).trim().toUpperCase());
        // Rest are data rows
        dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));
      }

      // Create header index map
      const headerMap = {};
      headers.forEach((header, index) => {
        headerMap[header] = index;
      });

      // Helper function to extract year from DOB format "2010 (age 15)" or parse date
      const parseDOB = (dobValue) => {
        if (!dobValue) return '';
        const cleaned = String(dobValue).replace(/"/g, '').trim();
        // Check if it's in format "2010 (age 15)"
        const yearMatch = cleaned.match(/^(\d{4})\s*\(/);
        if (yearMatch) {
          // Extract year and create a date (using Jan 1st of that year)
          return `${yearMatch[1]}-01-01`;
        }
        // If it's a date object from XLSX, convert to string
        if (dobValue instanceof Date) {
          return dobValue.toISOString().split('T')[0];
        }
        // If it's already a date string, return as is
        return cleaned;
      };

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) continue;

        try {
          // For CSV, row is already parsed array. For XLSX, row is already an array.
          const values = Array.isArray(row) ? row : [];

          // Map values to lead object based on header names
          const getValue = (headerName) => {
            const index = headerMap[headerName];
            if (index === undefined) return '';
            const value = values[index];
            // Convert to string and clean up
            return value !== undefined && value !== null ? String(value).trim() : '';
          };

          // Helper to parse number values for price (handles both string and number from XLSX)
          const getNumberValue = (headerName) => {
            const index = headerMap[headerName];
            if (index === undefined) return null;
            const value = values[index];
            if (value === undefined || value === null || value === '') return null;
            // If it's already a number, return it
            if (typeof value === 'number') return value;
            // Otherwise parse the string
            const parsed = parseFloat(String(value));
            return isNaN(parsed) ? null : parsed;
          };

          const leadData = {
            firstName: getValue('FIRST NAME'),
            lastName: getValue('LAST NAME'),
            address: getValue('ADDRESS'),
            city: getValue('CITY'),
            state: getValue('STATE'),
            zip: getValue('ZIP'),
            dob: parseDOB(getValue('DOB')),
            ssn: getValue('SSN'),
            email: getValue('MAIL'),
            phone: getValue('PHONE'),
            price: getNumberValue('PRICE') || 0,
            score: getValue('SCORE') || undefined, // Score accepts any text or number
          };

          // Validate required fields
          if (!leadData.firstName || !leadData.lastName || !leadData.email) {
            failedCount++;
            continue;
          }

          // Add lead via API
          await addLead(leadData);
          successCount++;

          // Update status
          setImportStatus({
            success: successCount,
            failed: failedCount,
            total: dataRows.length
          });
        } catch (err) {
          failedCount++;
          console.error(`Error importing row ${i + 1}:`, err);
        }
      }

      setImportStatus({
        success: successCount,
        failed: failedCount,
        total: dataRows.length
      });

      // Refresh leads list
      await fetchLeads();

      // Show completion message
      alert(`Import completed!\nSuccess: ${successCount}\nFailed: ${failedCount}`);
      setShowImportModal(false);
    } catch (err) {
      alert('Failed to import file: ' + err.message);
      console.error('Import error:', err);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
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
    // Score validation removed - accepts any text or number

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
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip: formData.zip.trim(),
        dob: formData.dob,
        ssn: formData.ssn.trim(),
        price: parseFloat(formData.price),
        score: formData.score ? formData.score.trim() : undefined,
      };

      await addLead(leadPayload);
      
      // Reset form and close modal
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
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
      phone: '',
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

  // Handle checkbox selection
  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allLeadIds = new Set(leads.map(lead => lead.id));
      setSelectedLeads(allLeadIds);
    } else {
      setSelectedLeads(new Set());
    }
  };

  // Handle delete selected leads
  const handleDeleteSelected = async () => {
    if (selectedLeads.size === 0) return;
    
    const confirmMessage = selectedLeads.size === 1 
      ? 'Are you sure you want to delete this record?'
      : `Are you sure you want to delete ${selectedLeads.size} records?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(true);
      const leadIdsArray = Array.from(selectedLeads);
      
      if (leadIdsArray.length === 1) {
        // Delete single lead
        await deleteLead(leadIdsArray[0]);
      } else {
        // Delete multiple leads
        await deleteLeads(leadIdsArray);
      }
      
      // Clear selection and refresh leads
      setSelectedLeads(new Set());
      await fetchLeads();
    } catch (err) {
      alert('Failed to delete record(s): ' + err.message);
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      style={{ width: '100%', padding: '0' }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section with Buttons in Parallel */}
      <motion.div 
        style={{ 
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
        <motion.div 
          style={{ 
            display: 'flex', 
            gap: '10px', 
            flexWrap: 'wrap',
            alignItems: 'flex-start'
          }}
          variants={itemVariants}
        >
          <motion.button 
            className="dm-btn"
            onClick={() => {
              setShowImportModal(true);
              setImportStatus({ success: 0, failed: 0, total: 0 });
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaUpload />
            <span>Import</span>
          </motion.button>
          <motion.button 
            className="dm-btn"
            onClick={handleExport}
            disabled={loading || leads.length === 0}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaDownload />
            <span>Export</span>
          </motion.button>
          <motion.button 
            className="applybtn"
            onClick={() => setShowForm(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 18px'
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus />
            <span>Add Record</span>
          </motion.button>
          {isAdmin && (
            <motion.button 
              className="dm-btn"
              onClick={handleDeleteSelected}
              disabled={selectedLeads.size === 0 || deleting}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                opacity: selectedLeads.size === 0 ? 0.5 : 1,
                cursor: selectedLeads.size === 0 ? 'not-allowed' : 'pointer'
              }}
              whileHover={selectedLeads.size > 0 ? { scale: 1.05, y: -2 } : {}}
              whileTap={selectedLeads.size > 0 ? { scale: 0.95 } : {}}
            >
              <FaTrash />
              <span>Delete {selectedLeads.size > 0 ? `(${selectedLeads.size})` : ''}</span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div 
        style={{ 
          display: 'flex', 
          gap: '15px', 
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
        variants={itemVariants}
      >
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
                width: '100%',
                cursor: 'text'
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
            <span style={{ 
              color: 'var(--text-main)', 
              fontSize: '14px' 
            }}>700+</span>
          </label>
          <label className="customradio" style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              checked={scoreFilter === '800+'}
              onChange={() => handleScoreFilterChange('800+')}
            />
            <span style={{ 
              color: 'var(--text-main)', 
              fontSize: '14px' 
            }}>800+</span>
          </label>
          <label className="customradio" style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              checked={scoreFilter === 'random'}
              onChange={() => handleScoreFilterChange('random')}
            />
            <span style={{ 
              color: 'var(--text-main)', 
              fontSize: '14px' 
            }}>All Random</span>
          </label>
        </div>

        {/* Record Count */}
        <div style={{ 
          color: 'var(--text-sub)', 
          fontSize: '14px',
          fontWeight: '500',
          marginLeft: 'auto'
        }}>
          Showing {leads.length} of {totalRecords} records
        </div>
      </motion.div>

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
                  {isAdmin && (
                    <th>
                      <label className="customcheck" style={{ margin: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={leads.length > 0 && selectedLeads.size === leads.length}
                          onChange={handleSelectAll}
                        />
                      </label>
                    </th>
                  )}
                  <th>FIRST NAME</th>
                  <th>LAST NAME</th>
                  <th>ADDRESS</th>
                  <th>CITY</th>
                  <th>STATE</th>
                  <th>ZIP</th>
                  <th>DOB</th>
                  <th>SSN</th>
                  <th>MAIL</th>
                  <th>PHONE</th>
                  <th>PRICE</th>
                  <th>SCORE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    {isAdmin && (
                      <td>
                        <label className="customcheck" style={{ margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => handleSelectLead(lead.id)}
                          />
                        </label>
                      </td>
                    )}
                    <td>{lead.firstName || 'N/A'}</td>
                    <td>{lead.lastName || 'N/A'}</td>
                    <td>{lead.address || 'N/A'}</td>
                    <td>{lead.city || 'N/A'}</td>
                    <td>{lead.state || 'N/A'}</td>
                    <td>{lead.zip || 'N/A'}</td>
                    <td>{formatDOBWithAge(lead.dob)}</td>
                    <td>{lead.ssn || 'N/A'}</td>
                    <td>{lead.email || 'N/A'}</td>
                    <td>{lead.phone || 'N/A'}</td>
                    <td style={{ color: 'var(--primary-blue)', fontWeight: '600' }}>
                      {formatPrice(lead.price || 0)}
                    </td>
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
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backgroundColor: (lead.status === 'available' || !lead.status) 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(239, 68, 68, 0.2)',
                        color: (lead.status === 'available' || !lead.status) 
                          ? '#10b981' 
                          : '#ef4444',
                      }}>
                        {lead.status || 'available'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && leads.length > 0 && totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '20px',
            padding: '15px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-clr)',
                background: currentPage === 1 ? 'var(--bg-input)' : 'var(--bg-card)',
                color: currentPage === 1 ? 'var(--text-sub)' : 'var(--text-main)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Previous
            </button>
            
            <div style={{
              display: 'flex',
              gap: '5px',
              alignItems: 'center'
            }}>
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
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-clr)',
                      background: currentPage === pageNum ? 'var(--primary-blue)' : 'var(--bg-card)',
                      color: currentPage === pageNum ? '#ffffff' : 'var(--text-main)',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      minWidth: '40px'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-clr)',
                background: currentPage === totalPages ? 'var(--bg-input)' : 'var(--bg-card)',
                color: currentPage === totalPages ? 'var(--text-sub)' : 'var(--text-main)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Next
            </button>
            
            <span style={{
              color: 'var(--text-sub)',
              fontSize: '14px',
              marginLeft: '10px'
            }}>
              Page {currentPage} of {totalPages}
            </span>
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="filterinput"
                  placeholder="123-456-7890"
                />
                {formErrors.phone && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    {formErrors.phone}
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
                  type="text"
                  name="score"
                  value={formData.score}
                  onChange={handleInputChange}
                  className="filterinput"
                  placeholder="750 or any text"
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

      {/* Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: 'var(--text-main)',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              Import Leads from CSV/XLSX
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Select CSV or XLSX File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
                disabled={importing}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-color)',
                  fontSize: '15px',
                  outline: 'none',
                  cursor: importing ? 'not-allowed' : 'pointer'
                }}
              />
              <p style={{
                margin: '10px 0 0 0',
                color: 'var(--text-sub)',
                fontSize: '12px'
              }}>
                Supported formats: CSV, XLSX, XLS<br/>
                Required columns: FIRST NAME, LAST NAME, ADDRESS, CITY, STATE, ZIP, DOB, SSN, MAIL, PHONE, PRICE, SCORE
              </p>
            </div>

            {importing && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: 'rgba(67, 24, 255, 0.1)',
                borderRadius: '10px'
              }}>
                <p style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontWeight: '600' }}>
                  Importing... Please wait
                </p>
                {importStatus.total > 0 && (
                  <div>
                    <p style={{ margin: '5px 0', color: 'var(--text-sub)', fontSize: '14px' }}>
                      Progress: {importStatus.success + importStatus.failed} / {importStatus.total}
                    </p>
                    <p style={{ margin: '5px 0', color: '#10b981', fontSize: '14px' }}>
                      ✓ Success: {importStatus.success}
                    </p>
                    {importStatus.failed > 0 && (
                      <p style={{ margin: '5px 0', color: '#ef4444', fontSize: '14px' }}>
                        ✗ Failed: {importStatus.failed}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportStatus({ success: 0, failed: 0, total: 0 });
                }}
                disabled={importing}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: importing ? 0.5 : 1
                }}
              >
                {importing ? 'Importing...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DataManagement;

