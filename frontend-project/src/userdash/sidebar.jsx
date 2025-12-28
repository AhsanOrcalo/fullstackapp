import React from 'react';
import { getUserData } from '../services/api';
import { FaHome, FaDatabase, FaUsers, FaCheckCircle, FaCog, FaMoon, FaSun, FaShoppingCart, FaFileAlt, FaCreditCard, FaDollarSign, FaComments } from 'react-icons/fa';

const Sidebar = ({ setview, activeview, theme, toggleTheme }) => {
  // Get user data to determine role
  const userData = getUserData();
  const userRole = userData?.role || 'user';

  // Define menu items based on role
  const userMenuItems = [
    { name: 'Dashboard', icon: FaHome },
    { name: 'Browse Data', icon: FaDatabase },
    { name: 'Cart', icon: FaShoppingCart },
    { name: 'Orders', icon: FaFileAlt },
    { name: 'Payments', icon: FaCreditCard },
    { name: 'Funds', icon: FaDollarSign },
    { name: 'Enquiries', icon: FaComments },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', icon: FaHome },
    { name: 'Data Management', icon: FaDatabase },
    { name: 'User Management', icon: FaUsers },
    { name: 'Sold Data', icon: FaCheckCircle },
    { name: 'Enquiries', icon: FaComments },
  ];

  // Select menu items based on role
  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <div className="sidebar">
      <div>
        {/* Brand Name */}
        <div className="brandname">
            <FaDatabase style={{color: '#4318ff'}} />
            <span>Data Leads</span>
        </div>
        
        {/* Menu Items Loop */}
        {menuItems.map(item => {
          const IconComponent = item.icon;
          return (
            <div 
              key={item.name} 
              className={`navitem ${activeview === item.name ? 'activeitem' : ''}`}
              onClick={() => setview(item.name)}
            >
              <IconComponent className="navicon" />
              <span className="navtext">{item.name}</span>
            </div>
          );
        })}
      </div>
      
      <div className="sidebar-bottom">
        {/* Professional Theme Toggle Box */}
        <div className={`theme-toggle-box ${theme === 'light' ? 'light-active' : ''}`} onClick={toggleTheme}>
            <div className="toggle-content">
                {theme === 'dark' ? (
                  <FaMoon style={{ color: '#f1c40f' }} className="toggle-icon" />
                ) : (
                  <FaSun style={{ color: '#ff9f43' }} className="toggle-icon" />
                )}
                <span className="toggle-label">Theme</span>
            </div>
            <div className="switch-pill">
                <div className="pill-circle"></div>
            </div>
        </div>

        {/* Account Settings Button */}
        <div 
          className={`navitem ${activeview === 'Settings' ? 'activeitem' : ''}`} 
          onClick={() => setview('Settings')}
          style={{marginTop: '10px'}}
        >
          <FaCog className="navicon" />
          <span className="navtext">Settings</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;