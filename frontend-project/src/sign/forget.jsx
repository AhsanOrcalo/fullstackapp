import React, { useState } from 'react';
import './sign.css';

const Forget = ({ switchpage }) => {
  const [email, setemail] = useState('');
  const [code, setcode] = useState('');
  const [sent, setsent] = useState(false);

  const handleclick = (e) => {
    e.preventDefault();
    if (!sent) {
      console.log(email);
      setsent(true);
    } else {
      console.log(code);
    }
  };

  return (
    <div className="maincard">
      <h1 className="title">Reset Password</h1>
      <form onSubmit={handleclick}>
        {!sent ? (
          <div>
            <input type="email" placeholder="Enter Email Address" className="inputfield" onChange={(e) => setemail(e.target.value)} />
            <button type="submit" className="actionbutton">Send Code</button>
          </div>
        ) : (
          <div>
            <input type="text" placeholder="Enter 6 Digit Code" className="inputfield" onChange={(e) => setcode(e.target.value)} />
            <button type="submit" className="actionbutton" style={{marginTop: '20px'}}>Verify Code</button>
          </div>
        )}
      </form>
      <p className="bottomtext">
        Remember Password? <span className="linktext" onClick={() => switchpage('signin')}>Login</span>
      </p>
    </div>
  );
};

export default Forget;