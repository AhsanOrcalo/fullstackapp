import React, { useState } from 'react';
import './sign.css';
import { register } from '../services/api';

const Signup = ({ switchpage }) => {
  const [userdata, setuserdata] = useState({
    fullname: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleinput = (e) => {
    setuserdata({ ...userdata, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    // Username validation
    if (!userdata.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (userdata.username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    // Email validation
    if (!userdata.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userdata.email.trim())) {
      setError('Please provide a valid email address');
      return false;
    }

    // Phone validation
    if (!userdata.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    // Match backend regex pattern: ^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(userdata.phone.trim())) {
      setError('Please provide a valid phone number (e.g., +1234567890)');
      return false;
    }

    // Password validation
    if (!userdata.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (userdata.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Confirm password validation
    if (!userdata.confirmPassword.trim()) {
      setError('Please confirm your password');
      return false;
    }
    if (userdata.password !== userdata.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const submitform = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Map frontend fields to backend DTO format
      const registerData = {
        userName: userdata.username.trim(),
        email: userdata.email.trim(),
        phoneNumber: userdata.phone.trim(),
        password: userdata.password,
        confirmPassword: userdata.confirmPassword
      };

      const response = await register(registerData);
      
      // Registration successful
      setSuccess(true);
      setError('');
      
      // Clear form
      setuserdata({
        fullname: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });

      // Redirect to signin after 2 seconds
      setTimeout(() => {
        switchpage('signin');
      }, 2000);
    } catch (err) {
      // Handle error - backend returns error message
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      setSuccess(false);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="maincard">
      <h1 className="title">Create Account</h1>
      <form onSubmit={submitform}>
        <input 
          type="text" 
          name="fullname" 
          placeholder="Full Name (Optional)" 
          className="inputfield" 
          onChange={handleinput}
          value={userdata.fullname}
          disabled={loading}
        />
        <input 
          type="text" 
          name="username" 
          placeholder="Username" 
          className="inputfield" 
          onChange={handleinput}
          value={userdata.username}
          disabled={loading}
          style={{marginTop: '20px'}} 
        />
        <input 
          type="email" 
          name="email" 
          placeholder="Email Address" 
          className="inputfield" 
          onChange={handleinput}
          value={userdata.email}
          disabled={loading}
          style={{marginTop: '20px'}} 
        />
        <input 
          type="text" 
          name="phone" 
          placeholder="Phone Number (e.g., +1234567890)" 
          className="inputfield" 
          onChange={handleinput}
          value={userdata.phone}
          disabled={loading}
          style={{marginTop: '20px'}} 
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          className="inputfield" 
          onChange={handleinput}
          value={userdata.password}
          disabled={loading}
          style={{marginTop: '20px'}} 
        />
        <input 
          type="password" 
          name="confirmPassword" 
          placeholder="Confirm Password" 
          className="inputfield" 
          onChange={handleinput}
          value={userdata.confirmPassword}
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
        {success && (
          <div style={{
            color: '#44ff44',
            fontSize: '14px',
            marginTop: '10px',
            textAlign: 'center'
          }}>
            Registration successful! Redirecting to login...
          </div>
        )}
        <button 
          type="submit" 
          className="actionbutton" 
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '20px' }}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <p className="bottomtext">
        Already have an account? <span className="linktext" onClick={() => switchpage('signin')}>Login</span>
      </p>
    </div>
  );
};

export default Signup;