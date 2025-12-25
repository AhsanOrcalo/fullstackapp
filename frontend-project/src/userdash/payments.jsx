import React, { useState } from 'react';

const Payments = () => {
  // Filhal empty state taakay "No transactions found" show ho.
  // Baad mein jab backend lage ga, yahan real data aye ga.
  const [transactions] = useState([]); 

  return (
    <div className="paymentsbox">
      {/* Header Section - Reusing existing classes for consistent look */}
      <div className="ordersheader" style={{ marginBottom: '20px' }}>
        <div className="headertitle">
          <h2 className="toptitle">Payment History</h2>
          <p className="subtitle">View all your payment transactions</p>
        </div>
        {/* Agar future mein koi button chahiye ho (like Export) toh yahan aa sakta hai */}
      </div>

      {/* Table Container - Using your existing .tablecard class */}
      <div className="tablecard">
        <div className="tablewrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Address</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="5" className="emptyrow">No payment transactions found.</td>
                </tr>
              ) : (
                // Dummy Row Structure (Commented out for now, will be used with real data)
                /* <tr>
                  <td>Add Funds</td>
                  <td>$10.00</td>
                  <td><span className="statusbadge pending">Pending</span></td>
                  <td>
                    <div className="address-cell">
                        <span className="payment-address">0x123...abc</span>
                        <button className="copybtn">Copy</button>
                    </div>
                  </td>
                  <td>Nov 07, 2025</td>
                </tr>
                */
                null
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;