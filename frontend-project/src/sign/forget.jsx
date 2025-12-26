import React, { useState } from 'react';
import './sign.css';
import { forgetPassword } from '../services/api';

const Forget = ({ switchpage }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await forgetPassword(email.trim());
      setSuccess(true);
      // Clear email after successful submission
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="maincard">
      <h1 className="title">Reset Password</h1>
      <form onSubmit={handleSubmit}>
        {success ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#d1fae5',
            color: '#059669',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '10px' }}>
              ✓ Password Reset Email Sent
            </p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              If the email exists, a temporary password has been sent to your email address.
              Please check your inbox and use the temporary password to log in.
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>
              Important: Please change your password after logging in.
            </p>
          </div>
        ) : (
          <>
            <input 
              type="email" 
              placeholder="Enter Email Address" 
              className="inputfield" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              disabled={loading}
              required
            />
            {error && (
              <div style={{
                color: '#ff4444',
                fontSize: '14px',
                marginTop: '10px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
            <button 
              type="submit" 
              className="actionbutton" 
              disabled={loading}
              style={{ 
                marginTop: '20px',
                opacity: loading ? 0.6 : 1, 
                cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? 'Sending...' : 'Send Temporary Password'}
            </button>
          </>
        )}
      </form>
      <p className="bottomtext">
        Remember Password? <span className="linktext" onClick={() => switchpage('signin')}>Login</span>
      </p>
    </div>
  );
};

export default Forget;