import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './sidebar.jsx';
import Topbar from './topbar.jsx';
import Browsedata from './browsedata.jsx';
import Cart from './cart.jsx';
import Orders from './orders.jsx'; 
import Payments from './payments.jsx'; 
import Funds from './funds.jsx';
import Accountsettings from './accountsettings.jsx';
import DataManagement from './datamanagement.jsx';
import UserManagement from './usermanagement.jsx';
import SoldData from './solddata.jsx';
import Enquiries from './enquiries.jsx';
import AdminDashboard from './admindashboard.jsx';
import UserDashboardComponent from './userdashboardcomponent.jsx';
import { getUserData } from '../services/api';
import './userdashboard.css';

const Userdashboard = ({ logout }) => {
  const [view, setview] = useState('Dashboard');
  const [theme, setTheme] = useState('dark'); // Default theme dark
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state

  // Get user data to determine role
  const userData = getUserData();
  const userRole = userData?.role || 'user';
  const isAdmin = userRole === 'admin';

  // Theme change function
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Close sidebar when view changes on mobile
  const handleViewChange = (newView) => {
    setview(newView);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Handle window resize - close sidebar on desktop, keep state on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    /* Theme class 'light-mode' tabhi lagay gi jab theme === 'light' ho ga */
    <div className={`dashboardbox ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
        setview={handleViewChange} 
        activeview={view} 
        theme={theme} 
        toggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logout={logout}
      />
      
      <div className="mainarea">
        <Topbar 
          title={view} 
          logout={logout} 
          setview={handleViewChange}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <div style={{ padding: '30px', flex: 1 }}>
          <AnimatePresence mode="wait">
            {/* 1. Dashboard View */}
            {view === 'Dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {isAdmin ? (
                  <AdminDashboard setview={setview} />
                ) : (
                  <UserDashboardComponent />
                )}
              </motion.div>
            )}

            {/* 2. Page Components */}
            {view === 'Browse Data' && (
              <motion.div
                key="browsedata"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Browsedata />
              </motion.div>
            )}
            {view === 'Cart' && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Cart setview={setview} />
              </motion.div>
            )}
            {view === 'Orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Orders />
              </motion.div>
            )}
            {view === 'Payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Payments />
              </motion.div>
            )}
            {view === 'Funds' && (
              <motion.div
                key="funds"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Funds />
              </motion.div>
            )}
            {view === 'Settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Accountsettings />
              </motion.div>
            )}
            {view === 'Data Management' && (
              <motion.div
                key="datamanagement"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DataManagement />
              </motion.div>
            )}
            {view === 'User Management' && (
              <motion.div
                key="usermanagement"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UserManagement />
              </motion.div>
            )}
            {view === 'Sold Data' && (
              <motion.div
                key="solddata"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SoldData />
              </motion.div>
            )}
            {view === 'Enquiries' && (
              <motion.div
                key="enquiries"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Enquiries />
              </motion.div>
            )}

            {/* 3. Placeholder Logic */}
            {view !== 'Dashboard' && 
             view !== 'Browse Data' && 
             view !== 'Cart' && 
             view !== 'Orders' && 
             view !== 'Payments' && 
             view !== 'Funds' && 
             view !== 'Settings' &&
             view !== 'Data Management' &&
             view !== 'User Management' &&
             view !== 'Sold Data' &&
             view !== 'Enquiries' && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 style={{ color: 'var(--text-main)' }}>{view} Page</h1>
                <p style={{ color: 'var(--text-sub)' }}>This section is coming soon.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Userdashboard;