import React, { useState } from 'react';
import './sign.css';
import { login } from '../services/api';

const Signin = ({ switchpage, onLoginSuccess }) => {
  const [logindata, setlogindata] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="maincard">
      <h1 className="title">Welcome Back</h1>
      <form onSubmit={loginnow}>
        <input 
          type="text" 
          name="username" 
          placeholder="Username" 
          className="inputfield" 
          onChange={handlechange}
          value={logindata.username}
          disabled={loading}
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          className="inputfield" 
          onChange={handlechange}
          value={logindata.password}
          disabled={loading}
          style={{marginTop: '20px'}} 
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
    </div>
  );
};

export default Signin;