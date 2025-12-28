import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserEnquiries, getAllEnquiries, createEnquiry, closeEnquiry, respondToEnquiry } from '../services/api';
import { getUserData } from '../services/api';

const Enquiries = () => {
  const userData = getUserData();
  const isAdmin = userData?.role === 'admin';
  
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      setError('');
      const data = isAdmin 
        ? await getAllEnquiries() 
        : await getUserEnquiries();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch enquiries');
      console.error('Error fetching enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || message.trim().length < 10) {
      setFormError('Message must be at least 10 characters long');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      await createEnquiry(message.trim());
      setMessage('');
      setShowForm(false);
      await fetchEnquiries();
      alert('Enquiry submitted successfully!');
    } catch (err) {
      setFormError(err.message || 'Failed to submit enquiry');
      console.error('Error creating enquiry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseEnquiry = async (enquiryId) => {
    if (!window.confirm('Are you sure you want to close this enquiry?')) {
      return;
    }

    try {
      await closeEnquiry(enquiryId);
      await fetchEnquiries();
      alert('Enquiry closed successfully');
    } catch (err) {
      alert(err.message || 'Failed to close enquiry');
      console.error('Error closing enquiry:', err);
    }
  };

  const handleRespond = async (enquiryId) => {
    if (!responseText.trim() || responseText.trim().length < 10) {
      setFormError('Response must be at least 10 characters long');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      await respondToEnquiry(enquiryId, responseText.trim());
      setResponseText('');
      setRespondingTo(null);
      await fetchEnquiries();
      alert('Response sent successfully!');
    } catch (err) {
      setFormError(err.message || 'Failed to send response');
      console.error('Error responding to enquiry:', err);
    } finally {
      setSubmitting(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'responded':
        return '#10b981';
      case 'closed':
        return '#6b7280';
      default:
        return 'var(--text-sub)';
    }
  };

  return (
    <div className="browsebox">
      <div className="browsetop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '24px', fontWeight: '700' }}>
            {isAdmin ? 'All Enquiries' : 'My Enquiries'}
          </h2>
          <p className="subtitle" style={{ marginTop: '5px' }}>
            {enquiries.length} total
            {isAdmin && ` • ${enquiries.filter(e => e.status === 'pending').length} pending`}
          </p>
        </div>
        {!isAdmin && (
          <button className="applybtn" onClick={() => setShowForm(true)}>
            ➕ New Enquiry
          </button>
        )}
      </div>

      {/* New Enquiry Form Modal */}
      {showForm && !isAdmin && (
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
        }} onClick={() => { setShowForm(false); setMessage(''); setFormError(''); }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '30px',
            width: '100%',
            maxWidth: '600px',
            border: '1px solid var(--border-clr)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                New Enquiry
              </h2>
              <button
                onClick={() => { setShowForm(false); setMessage(''); setFormError(''); }}
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
              <div className="filtergroup" style={{ marginBottom: '20px' }}>
                <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                  Your Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="filterinput"
                  placeholder="Type your enquiry here (minimum 10 characters)..."
                  rows="6"
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                {formError && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    {formError}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setMessage(''); setFormError(''); }}
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
                  {submitting ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tablecard">
        {loading ? (
          <div className="nodata">
            <p style={{ color: 'var(--text-sub)' }}>Loading enquiries...</p>
          </div>
        ) : error ? (
          <div className="nodata">
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button className="applybtn" onClick={fetchEnquiries} style={{ marginTop: '15px' }}>
              Retry
            </button>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="nodata">
            {isAdmin ? 'No enquiries found.' : 'You have no enquiries yet. Create one to get started!'}
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            {enquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-clr)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '15px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    {isAdmin && enquiry.user && (
                      <div style={{ marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-sub)', fontSize: '14px' }}>From: </span>
                        <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                          {enquiry.user.userName} ({enquiry.user.email})
                        </span>
                      </div>
                    )}
                    <div style={{ color: 'var(--text-main)', marginBottom: '10px', lineHeight: '1.6' }}>
                      {enquiry.message}
                    </div>
                    <div style={{ color: 'var(--text-sub)', fontSize: '12px' }}>
                      Submitted: {formatDate(enquiry.createdAt)}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      backgroundColor: `${getStatusColor(enquiry.status)}20`,
                      color: getStatusColor(enquiry.status),
                    }}
                  >
                    {enquiry.status}
                  </span>
                </div>

                {enquiry.adminResponse ? (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--primary-blue)',
                  }}>
                    <div style={{ color: 'var(--primary-blue)', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                      {isAdmin ? 'Your Response:' : 'Admin Response:'}
                    </div>
                    <div style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>
                      {enquiry.adminResponse}
                    </div>
                    <div style={{ color: 'var(--text-sub)', fontSize: '12px', marginTop: '8px' }}>
                      Responded: {formatDate(enquiry.updatedAt)}
                    </div>
                  </div>
                ) : isAdmin && (
                  <div style={{ marginTop: '15px' }}>
                    {respondingTo === enquiry.id ? (
                      <div style={{
                        padding: '15px',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-clr)',
                      }}>
                        <label style={{ color: 'var(--text-main)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                          Your Response *
                        </label>
                        <textarea
                          value={responseText}
                          onChange={(e) => {
                            setResponseText(e.target.value);
                            if (formError) setFormError('');
                          }}
                          className="filterinput"
                          placeholder="Type your response here (minimum 10 characters)..."
                          rows="4"
                          style={{
                            width: '100%',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            marginBottom: '10px',
                          }}
                        />
                        {formError && (
                          <span style={{ color: '#ef4444', fontSize: '12px', marginBottom: '10px', display: 'block' }}>
                            {formError}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                              setFormError('');
                            }}
                            style={{
                              padding: '8px 20px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-clr)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              fontWeight: '600',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRespond(enquiry.id)}
                            className="applybtn"
                            disabled={submitting}
                            style={{ padding: '8px 20px', fontSize: '14px' }}
                          >
                            {submitting ? 'Sending...' : 'Send Response'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="applybtn"
                        onClick={() => setRespondingTo(enquiry.id)}
                        style={{ padding: '8px 20px', fontSize: '14px' }}
                      >
                        Respond to Enquiry
                      </button>
                    )}
                  </div>
                )}

                {!isAdmin && enquiry.status !== 'closed' && enquiry.adminResponse && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button
                      className="applybtn"
                      onClick={() => handleCloseEnquiry(enquiry.id)}
                      style={{ padding: '8px 20px', fontSize: '14px' }}
                    >
                      Close Enquiry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Enquiries;

