import React from 'react';

const Accountsettings = () => {
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
          <label>Username</label> {/* Full Name ki jagah Username */}
          <input type="text" className="filterinput" placeholder="Enter your username" />
        </div>

        <div className="filtergroup" style={{ marginBottom: '20px' }}>
          <label>Email</label>
          <input type="email" className="filterinput" placeholder="Enter your email" />
        </div>

        <button className="applybtn">Update Profile</button> {/* Blue Theme Button */}
      </div>

      {/* Change Password Section */}
      <div className="datasection">
        <h3 className="filtertitle" style={{ marginBottom: '20px' }}>Change Password</h3>

        <div className="filtergroup" style={{ marginBottom: '15px' }}>
          <label>Current Password</label>
          <input type="password" className="filterinput" placeholder="Enter current password" />
        </div>

        <div className="filtergroup" style={{ marginBottom: '15px' }}>
          <label>New Password</label>
          <input type="password" className="filterinput" placeholder="Enter new password" />
        </div>

        <div className="filtergroup" style={{ marginBottom: '20px' }}>
          <label>Confirm New Password</label>
          <input type="password" className="filterinput" placeholder="Confirm new password" />
        </div>

        <button className="applybtn">Update Password</button>
      </div>
    </div>
  );
};

export default Accountsettings;