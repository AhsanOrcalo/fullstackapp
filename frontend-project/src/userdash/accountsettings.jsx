import React, { useState, useEffect } from 'react';
import { changePassword, getUserData, getProfile, updateProfile } from '../services/api';

const Accountsettings = () => {
  const userData = getUserData();
  
  // Profile state
  const [username, setUsername] = useState(userData?.userName || '');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setInitialLoading(true);
        const profileData = await getProfile();
        setUsername(profileData.userName || '');
        setEmail(profileData.email || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfileError('Failed to load profile data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setProfileError('');
    setProfileSuccess('');

    // Validation
    if (!username || username.trim().length < 3) {
      setProfileError('Username must be at least 3 characters long');
      return;
    }

    if (!email || !email.includes('@')) {
      setProfileError('Please provide a valid email address');
      return;
    }

    // Get current profile to check if values changed
    let currentProfile;
    try {
      currentProfile = await getProfile();
    } catch (err) {
      // If we can't get profile, continue with update
      currentProfile = null;
    }

    // Check if values have actually changed
    if (currentProfile) {
      if (username === currentProfile.userName && email === currentProfile.email) {
        setProfileError('No changes detected. Please update at least one field.');
        return;
      }
    }

    try {
      setProfileLoading(true);
      const response = await updateProfile(username, email);
      setProfileSuccess('Profile updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setProfileSuccess('');
      }, 5000);
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

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

        {profileError && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '15px', 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            borderRadius: '6px',
            border: '1px solid #fecaca'
          }}>
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '15px', 
            backgroundColor: '#d1fae5', 
            color: '#059669', 
            borderRadius: '6px',
            border: '1px solid #a7f3d0'
          }}>
            {profileSuccess}
          </div>
        )}

        {initialLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading profile...</div>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <div className="filtergroup" style={{ marginBottom: '15px' }}>
              <label>Username</label>
              <input 
                type="text" 
                className="filterinput" 
                placeholder="Enter your username (min 3 characters)" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={profileLoading}
                required
                minLength={3}
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
                disabled={profileLoading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="applybtn" 
              disabled={profileLoading}
              style={{ opacity: profileLoading ? 0.6 : 1, cursor: profileLoading ? 'not-allowed' : 'pointer' }}
            >
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}
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