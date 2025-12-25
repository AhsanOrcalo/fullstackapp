import React, { useState } from 'react'; // FIXED: useEffect hata diya warning khatam karne ke liye
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
import './userdashboard.css';

const Userdashboard = ({ logout }) => {
  const [view, setview] = useState('Dashboard');
  const [theme, setTheme] = useState('dark'); // Default theme dark

  // Theme change function
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    /* Theme class 'light-mode' tabhi lagay gi jab theme === 'light' ho ga */
    <div className={`dashboardbox ${theme === 'light' ? 'light-mode' : ''}`}>
      <Sidebar 
        setview={setview} 
        activeview={view} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />
      
      <div className="mainarea">
        <Topbar title={view} logout={logout} setview={setview} />
        
        <div style={{ padding: '30px', flex: 1 }}>
          {/* 1. Dashboard View */}
          {view === 'Dashboard' && (
            <div>
              <div className="statsrow">
                <div className="statcard">
                  <p className="cardtitle">Data Purchased</p>
                  <h1 className="cardvalue">0</h1>
                </div>
                <div className="statcard">
                  <p className="cardtitle">Available Balance</p>
                  <h1 className="cardvalue">$0.00</h1>
                </div>
              </div>
              <div className="datasection">
                <h2 className="sectiontitle">All Data Available</h2>
                <p className="infotext">No data records found at the moment.</p>
              </div>
            </div>
          )}

          {/* 2. Page Components */}
          {view === 'Browse Data' && <Browsedata />}
          {view === 'Cart' && <Cart setview={setview} />}
          {view === 'Orders' && <Orders />}
          {view === 'Payments' && <Payments />}
          {view === 'Funds' && <Funds />}
          {view === 'Settings' && <Accountsettings />}
          {view === 'Data Management' && <DataManagement />}
          {view === 'User Management' && <UserManagement />}

          {/* 3. Placeholder Logic */}
          {view !== 'Dashboard' && 
           view !== 'Browse Data' && 
           view !== 'Cart' && 
           view !== 'Orders' && 
           view !== 'Payments' && 
           view !== 'Funds' && 
           view !== 'Settings' &&
           view !== 'Data Management' &&
           view !== 'User Management' && ( 
            <div>
              <h1 style={{ color: 'var(--text-main)' }}>{view} Page</h1>
              <p style={{ color: 'var(--text-sub)' }}>This section is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Userdashboard;