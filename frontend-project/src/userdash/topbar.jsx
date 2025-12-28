import React, { useState, useEffect } from 'react';
import { getUserData, getUserDashboardStats } from '../services/api';
import { FaDollarSign } from 'react-icons/fa';

const Topbar = ({ title, logout, setview }) => {
  // Get user data to determine role
  const userData = getUserData();
  const userRole = userData?.role || 'user';
  const isUser = userRole !== 'admin';
  const [balance, setBalance] = useState(0.0);

  useEffect(() => {
    if (isUser) {
      fetchBalance();
    }
  }, [isUser]);

  const fetchBalance = async () => {
    try {
      const data = await getUserDashboardStats();
      setBalance(data.availableBalance || 0.0);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance(0.0);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

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
            <FaDollarSign className="coin-icon" /> 
            {formatPrice(balance)}
          </div>
        )}

        <button className="logoutbutton" onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default Topbar;