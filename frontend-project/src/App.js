import React, { useState, useEffect } from 'react';
import Signin from './sign/signin.jsx';
import Signup from './sign/signup.jsx';
import Forget from './sign/forget.jsx';
import Dashboard from './userdash/userdashboard.jsx';
import { isAuthenticated, logout as apiLogout } from './services/api';

function App() {
  const [screen, setscreen] = useState('signin');

  // Check authentication status on component mount
  useEffect(() => {
    if (isAuthenticated()) {
      setscreen('dashboard');
    } else {
      setscreen('signin');
    }
  }, []);

  const logoutuser = () => {
    // Clear authentication data
    apiLogout();
    // Redirect to signin
    setscreen('signin');
  };

  const handleLoginSuccess = (response) => {
    // Login successful - user data and token are already stored by the API function
    console.log('Login successful:', response);
    setscreen('dashboard');
  };

  return (
    <div className="appcontainer" style={{ height: '100vh', width: '100vw' }}>
      {screen === 'dashboard' ? (
        <Dashboard logout={logoutuser} />
      ) : (
        <div className="authwrapper">
          {screen === 'signin' && <Signin switchpage={setscreen} onLoginSuccess={handleLoginSuccess} />}
          {screen === 'signup' && <Signup switchpage={setscreen} />}
          {screen === 'forget' && <Forget switchpage={setscreen} />}
        </div>
      )}
    </div>
  );
}

export default App;