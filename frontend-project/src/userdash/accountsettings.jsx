import React, { useState } from 'react';
import { changePassword, getUserData } from '../services/api';

const Accountsettings = () => {
  const userData = getUserData();
  
  // Profile state
  const [username, setUsername] = useState(userData?.userName || '');
  const [email, setEmail] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword, confirmPassword);
      setPasswordSuccess('Password changed successfully!');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordSuccess('');
      }, 5000);
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="settingsbox">
      <div className="settingsheader" style={{ marginBottom: '25px' }}>
        <h2 className="toptitle">Account Settings</h2>
        <p className="subtitle">Update your personal information and security settings</p>
      </div>

      {/* Profile Management Section */}
      <div className="datasection" style={{ marginBottom: '30px' }}>
        <h3 className="filtertitle" style={{ marginBottom: '20px' }}>Profile Management</h3>
        
        <div className="filtergroup" style={{ marginBottom: '15px' }}>
          <label>Username</label>
          <input 
            type="text" 
            className="filterinput" 
            placeholder="Enter your username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled
          />
        </div>

        <div className="filtergroup" style={{ marginBottom: '20px' }}>
          <label>Email</label>
          <input 
            type="email" 
            className="filterinput" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled
          />
        </div>

        <button className="applybtn" disabled>Update Profile</button>
      </div>

      {/* Change Password Section */}
      <div className="datasection">
        <h3 className="filtertitle" style={{ marginBottom: '20px' }}>Change Password</h3>

        {passwordError && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '15px', 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            borderRadius: '6px',
            border: '1px solid #fecaca'
          }}>
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '15px', 
            backgroundColor: '#d1fae5', 
            color: '#059669', 
            borderRadius: '6px',
            border: '1px solid #a7f3d0'
          }}>
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="filtergroup" style={{ marginBottom: '15px' }}>
            <label>Current Password</label>
            <input 
              type="password" 
              className="filterinput" 
              placeholder="Enter current password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>

          <div className="filtergroup" style={{ marginBottom: '15px' }}>
            <label>New Password</label>
            <input 
              type="password" 
              className="filterinput" 
              placeholder="Enter new password (min 6 characters)" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>

          <div className="filtergroup" style={{ marginBottom: '20px' }}>
            <label>Confirm New Password</label>
            <input 
              type="password" 
              className="filterinput" 
              placeholder="Confirm new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>

          <button 
            type="submit" 
            className="applybtn" 
            disabled={passwordLoading}
            style={{ opacity: passwordLoading ? 0.6 : 1, cursor: passwordLoading ? 'not-allowed' : 'pointer' }}
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Accountsettings;