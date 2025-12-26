import React from 'react';
import { getUserData } from '../services/api';

const Topbar = ({ title, logout, setview }) => {
  // Get user data to determine role
  const userData = getUserData();
  const userRole = userData?.role || 'user';
  const isUser = userRole !== 'admin';

  return (
    <div className="topbar">
      {/* Click karne par Dashboard par le jaye ga */}
      <div className="top-title-container" onClick={() => setview('Dashboard')}>
        <h2 className="toptitle animated-shimmer-title">
          {title}
        </h2>
      </div>
      
      <div className="topright">
        {isUser && (
          <div className="balancebox" onClick={() => setview('Payments')}>
            <span className="coin-icon">💰</span> 
            $0.00
          </div>
        )}

        <button className="logoutbutton" onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default Topbar;