import React, { useState } from 'react';
import './sign.css';
import { forgetPassword } from '../services/api';

const Forget = ({ switchpage }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [userName, setUserName] = useState('');

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
      if (response.temporaryPassword) {
        setTemporaryPassword(response.temporaryPassword);
        setUserName(response.userName || '');
        setSuccess(true);
        // Clear email after successful submission
        setEmail('');
      } else {
        setError('Email not found. Please check your email address.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate temporary password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="maincard">
      <h1 className="title">Reset Password</h1>
      <form onSubmit={handleSubmit}>
        {success && temporaryPassword ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#d1fae5',
            color: '#059669',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '15px', fontSize: '16px' }}>
              ✓ Temporary Password Generated
            </p>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '15px',
              border: '2px solid #059669'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                Your Temporary Password:
              </p>
              <p style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                color: '#059669',
                userSelect: 'all',
                cursor: 'text'
              }}>
                {temporaryPassword}
              </p>
            </div>
            {userName && (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '10px',
                border: '1px solid #059669'
              }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>
                  Your Username:
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#059669',
                  userSelect: 'all',
                  cursor: 'text'
                }}>
                  {userName}
                </p>
              </div>
            )}
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
              Please use your {userName ? 'username or email' : 'email'} and this temporary password to log in.
            </p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>
              ⚠️ Important: Please change your password after logging in.
            </p>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(temporaryPassword);
                  // Redirect to login page after copying
                  switchpage('signin');
                } catch (err) {
                  // Fallback if clipboard API fails
                  console.error('Failed to copy password:', err);
                  switchpage('signin');
                }
              }}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Copy Password
            </button>
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