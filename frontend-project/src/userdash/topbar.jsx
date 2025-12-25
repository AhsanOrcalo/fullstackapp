import React from 'react';

const Topbar = ({ title, logout, setview }) => {
  return (
    <div className="topbar">
      {/* Click karne par Dashboard par le jaye ga */}
      <div className="top-title-container" onClick={() => setview('Dashboard')}>
        <h2 className="toptitle animated-shimmer-title">
          {title}
        </h2>
      </div>
      
      <div className="topright">
        <div className="balancebox" onClick={() => setview('Payments')}>
          <span className="coin-icon">💰</span> 
          $0.00
        </div>

        <button className="cartbutton" onClick={() => setview('Cart')}>
          <span className="cart-icon">🛒</span> 
          Add to Cart
        </button>

        <button className="logoutbutton" onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default Topbar;