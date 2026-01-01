import React, { useState } from 'react';
import './sign.css';
import { login } from '../services/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Signin = ({ switchpage, onLoginSuccess }) => {
  const [logindata, setlogindata] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handlechange = (e) => {
    setlogindata({ ...logindata, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const loginnow = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate inputs
    if (!logindata.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (!logindata.password.trim()) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      // Call login API - backend expects userName (camelCase)
      const response = await login(logindata.username.trim(), logindata.password);
      
      // Login successful - token and user data are stored in localStorage by the API function
      if (onLoginSuccess) {
        onLoginSuccess(response);
      }
      
      // Switch to dashboard
      switchpage('dashboard');
    } catch (err) {
      // Handle error
      setError(err.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side - Welcome Section */}
      <div className="auth-welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome Back!</h1>
          <p className="welcome-subtitle">
            We're excited to have you back. Sign in to continue your journey with us.
          </p>
          <div className="welcome-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Access your dashboard</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Manage your data</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Track your progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="auth-form-section">
        <div className="maincard animated-form">
          <h1 className="title">Sign In</h1>
          <form onSubmit={loginnow}>
            <div className="input-wrapper">
              <input 
                type="text" 
                name="username" 
                placeholder="Username" 
                className="inputfield" 
                onChange={handlechange}
                value={logindata.username}
                disabled={loading}
              />
            </div>
            <div className="input-wrapper password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Password" 
                className="inputfield" 
                onChange={handlechange}
                value={logindata.password}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <span className="forgetlink" onClick={() => switchpage('forget')}>Forget Password?</span>
            <button 
              type="submit" 
              className="actionbutton" 
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          <p className="bottomtext">
            Don't have an account? <span className="linktext" onClick={() => switchpage('signup')}>Create One</span>
          </p>
          <p className="bottomtext">
          <span>
            Need help? Contact us <a href="mailto:info@freshdata.shop" style={{ color: '#4318ff', textDecoration: 'underline' }}>info@freshdata.shop</a>
          </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signin;