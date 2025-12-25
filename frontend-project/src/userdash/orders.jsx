import React, { useState } from 'react';

const Orders = () => {
  const [purchasedata] = useState([]); 

  return (
    <div className="ordersbox">
      <div className="ordersheader">
        <div className="headertitle">
          <h2 className="toptitle">Purchased Data</h2>
          <p className="subtitle">View all your purchased data records</p>
        </div>
        <button className="applybtn">
          <span>📄 Export to Excel</span>
        </button>
      </div>

      <div className="searchsection">
        <div className="searchbar">
          <input 
            type="text" 
            placeholder="Search records by name, email, location or phone..." 
            className="ordersearch"
          />
          <button className="applybtn">
            🔍 Search
          </button>
        </div>
      </div>

      <div className="tablecard">
        <div className="tablewrapper">
          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>ZIP</th>
                <th>DOB</th>
                <th>SSN</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Price</th>
                <th>Purchased Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchasedata.length === 0 ? (
                <tr>
                  <td colSpan="13" className="emptyrow">No purchased records found.</td>
                </tr>
              ) : (
                purchasedata.map((item, index) => (
                  <tr key={index}>
                    <td>{item.fname}</td>
                    <td>{item.lname}</td>
                    <td>{item.address}</td>
                    <td>{item.city}</td>
                    <td>{item.state}</td>
                    <td>{item.zip}</td>
                    <td>{item.dob}</td>
                    <td>{item.ssn}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td>{item.price}</td>
                    <td>{item.date}</td>
                    <td>
                      <button className="downloadbtn" title="Download Record">
                        📥
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;