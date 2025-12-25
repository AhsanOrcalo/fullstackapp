import React from 'react';
import { getUserData } from '../services/api';

const Sidebar = ({ setview, activeview, theme, toggleTheme }) => {
  // Get user data to determine role
  const userData = getUserData();
  const userRole = userData?.role || 'user';

  // Define menu items based on role
  const userMenuItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Browse Data', icon: '🗂️' },
    { name: 'Cart', icon: '🛒' },
    { name: 'Orders', icon: '📋' },
    { name: 'Payments', icon: '💳' },
    { name: 'Funds', icon: '💰' },
    { name: 'Enquiries', icon: '💬' },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Data Management', icon: '🗂️' },
    { name: 'User Management', icon: '👥' },
    { name: 'Sold Data', icon: '📊' },
    { name: 'Enquiries', icon: '💬' },
  ];

  // Select menu items based on role
  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <div className="sidebar">
      <div>
        {/* Brand Name */}
        <div className="brandname">
            <span style={{color: '#3b82f6', marginRight: '10px'}}>🚀</span>
            FreshData
        </div>
        
        {/* Menu Items Loop */}
        {menuItems.map(item => (
          <div 
            key={item.name} 
            className={`navitem ${activeview === item.name ? 'activeitem' : ''}`}
            onClick={() => setview(item.name)}
          >
            <span className="navicon">{item.icon}</span>
            <span className="navtext">{item.name}</span>
          </div>
        ))}
      </div>
      
      <div className="sidebar-bottom">
        {/* Professional Theme Toggle Box */}
        <div className={`theme-toggle-box ${theme === 'light' ? 'light-active' : ''}`} onClick={toggleTheme}>
            <div className="toggle-content">
                <span className="toggle-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
                <span className="toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
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
          <span className="navicon">⚙️</span>
          <span className="navtext">Account Settings</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;