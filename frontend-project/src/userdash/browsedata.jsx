import React, { useState } from 'react';

const Browsedata = () => {
  const [hasdata, sethasdata] = useState(false); 

  return (
    <div className="browsebox">
      <div className="browsetop" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div className="topbuttons">
          <button className="applybtn">Select All</button>
          <button className="applybtn">⚡ Buy Fast</button>
        </div>
      </div>

      <div className="filtercard">
        <div className="filterheader">
          <span className="filtertitle">Filters</span>
          <button className="clearbtn">Clear All</button>
        </div>
        
        <div className="filtergrid">
          <div className="filtergroup">
            <label>Name</label>
            <input type="text" placeholder="Search by name" className="filterinput" />
          </div>
          <div className="filtergroup">
            <label>City</label>
            <input type="text" placeholder="Search by city" className="filterinput" />
          </div>
          <div className="filtergroup">
            <label>Date of Birth (Year)</label>
            <div className="daterow">
              <input type="text" placeholder="From" className="filterinput" />
              <input type="text" placeholder="To" className="filterinput" />
            </div>
          </div>
          <div className="filtergroup">
            <label>ZIP Code</label>
            <input type="text" placeholder="Search by ZIP" className="filterinput" />
          </div>
        </div>

        <div className="filtergrid">
  <div className="filtergroup">
    <label>Score</label>
    <div className="checkrow">
      <label className="customradio"><input type="radio" name="score" /> <span>700+ Score</span></label>
      <label className="customradio"><input type="radio" name="score" /> <span>800+ Score</span></label>
    </div>
  </div>
           <div className="filtergroup">
    <label>Country</label>
    <div className="checkrow">
      <label className="customradio"><input type="radio" name="country" /> <span>USA</span></label>
      <label className="customradio"><input type="radio" name="country" /> <span>Canada</span></label>
    </div>
  </div>
          <div className="filtergroup">
            <label>State</label>
            <select className="filterinput">
              <option>All States/Provinces</option>
            </select>
          </div>
          <div className="filtergroup">
            <label>Price Sort</label>
            <div className="checkrow">
              <label className="customradio"><input type="radio" name="price" /> <span>High to Low</span></label>
              <label className="customradio"><input type="radio" name="price" /> <span>Low to High</span></label>
            </div>
          </div>
        </div>

        <button className="applybtn" onClick={() => sethasdata(true)}>Apply Filters</button>
      </div>

      <div className="tablecard">
        {!hasdata ? (
          <div className="nodata">
            No data records found. Try adjusting your filters.
          </div>
        ) : (
          <div className="tablewrapper">
            <table>
              <thead>
                <tr>
                  <th><label className="customcheck"><input type="checkbox" /></label></th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>City</th>
                  <th>State</th>
                  <th>DOB</th>
                  <th>ZIP Code</th>
                  <th>Country</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browsedata;