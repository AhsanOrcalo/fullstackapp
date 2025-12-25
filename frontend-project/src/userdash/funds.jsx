import React, { useState } from 'react';

const Funds = () => {
  // Real data aane par yahan object pass hoga
  const [pendingPayment] = useState(null); 

  return (
    <div className="fundsbox">
      {/* Header Section */}
      <div className="fundsheader" style={{ marginBottom: '25px' }}>
        <h2 className="toptitle">Add Funds</h2>
        <p className="subtitle">Add funds to your account balance</p>
      </div>

      {/* Stats Cards Row */}
      <div className="statsrow">
        <div className="statcard">
          <div className="cardinfo">
            <p className="cardtitle">Current Balance</p>
            <h1 className="cardvalue">$0.00</h1>
          </div>
          <span className="cardicon">💰</span>
        </div>
        <div className="statcard">
          <div className="cardinfo">
            <p className="cardtitle">Total Deposits</p>
            <h1 className="cardvalue">$0.00</h1>
          </div>
          <span className="cardicon">📋</span>
        </div>
        <div className="statcard">
          <div className="cardinfo">
            <p className="cardtitle">Minimum Deposit</p>
            <h1 className="cardvalue">$10.00</h1>
          </div>
          <span className="cardicon">💵</span>
        </div>
      </div>

      {/* Main Payment Section */}
      <div className="datasection payment-detail-card">
        <div className="payment-top-row">
          <div className="pending-info">
            <h3 className="filtertitle">Pending Payment</h3>
            {!pendingPayment ? (
              <p className="infotext" style={{marginTop: '10px'}}>No pending payments at the moment.</p>
            ) : (
              <>
                <p className="infotext">Amount: <strong>${pendingPayment.amount}</strong></p>
                <p className="infotext">Status: <span className="statusbadge pending">{pendingPayment.status}</span></p>
              </>
            )}
          </div>
          
          {/* FIXED: Using Blue Theme 'applybtn' instead of green 'fastbutton' */}
          <button className="applybtn" style={{height: 'fit-content', padding: '10px 20px'}}>
            Check Status
          </button>
        </div>

        {pendingPayment && (
          <div className="payment-methods-grid">
            <div className="qr-section">
              <p className="filtertitle" style={{fontSize: '14px'}}>QR Code</p>
              <div className="qr-placeholder">
                <img src={pendingPayment.qrUrl} alt="QR Code" />
              </div>
            </div>

            <div className="instructions-section">
              <p className="filtertitle" style={{fontSize: '14px'}}>Payment Instructions</p>
              <p className="infotext" style={{fontSize: '13px', marginBottom: '15px'}}>
                Scan the QR code with your crypto wallet or send the payment to the address below.
              </p>
              
              <p className="filtertitle" style={{fontSize: '14px'}}>Payment Address</p>
              <div className="searchbar address-bar">
                <input 
                  type="text" 
                  readOnly 
                  value={pendingPayment.address} 
                  className="ordersearch"
                  style={{fontSize: '12px'}}
                />
                <button className="secondarybutton">Copy</button>
              </div>
              <p className="infotext" style={{marginTop: '10px', fontSize: '13px'}}>
                Currency: <strong>{pendingPayment.currency}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Funds;