import React, { useState, useEffect } from 'react';
import { getUserData, getUserDashboardStats } from '../services/api';
import { FaDollarSign, FaBars, FaTimes } from 'react-icons/fa';

const Topbar = ({ title, logout, setview, sidebarOpen, setSidebarOpen }) => {
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
      <div className="topbar-left">
        {/* Mobile Menu Toggle Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        
        {/* Balance Display - Parallel to hamburger icon on mobile */}
        {isUser && (
          <div className="balancebox-mobile" onClick={() => setview('Payments')}>
            <FaDollarSign className="coin-icon" /> 
            <span className="balance-text-mobile">{formatPrice(balance)}</span>
          </div>
        )}
        
        {/* Click karne par Dashboard par le jaye ga */}
        <div className="top-title-container" onClick={() => setview('Dashboard')}>
          <h2 className="toptitle animated-shimmer-title">
            {title}
          </h2>
        </div>
      </div>
      
      <div className="topright">
        {/* Balance Display - Desktop Only */}
        {isUser && (
          <div className="balancebox-desktop" onClick={() => setview('Payments')}>
            <FaDollarSign className="coin-icon" /> 
            <span className="balance-text">{formatPrice(balance)}</span>
          </div>
        )}

        {/* Logout Button - Desktop Only */}
        <button className="logoutbutton-desktop" onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default Topbar;