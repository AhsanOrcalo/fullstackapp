import React, { useState } from 'react';

const Cart = ({ setview }) => { // setview prop yahan receive ki hai
  const [cartitems] = useState([]);

  return (
    <div className="cartbox">
      <div className="cartheader">
        <h2 className="toptitle">Shopping Cart</h2>
        <p className="subtitle">Review and manage your selected items</p>
      </div>

      <div className="cartlayout">
        <div className="leftarea">
          <div className="panelheader">
            <div className="selectioninfo">
              <label className="customcheck">
                <input type="checkbox" />
                <span>Select All</span>
              </label>
              <span className="countinfo">{cartitems.length} selected</span>
            </div>
            <button className="deletebutton">Delete Selected</button>
          </div>

          <div className="itemlist">
            {cartitems.length === 0 ? (
              <div className="emptycart">
                <p>Your cart is empty. Browse data to add items.</p>
              </div>
            ) : (
              <div className="itemrows">
                {/* Data rows yahan ayenge */}
              </div>
            )}
          </div>
        </div>

        <div className="rightarea">
          <div className="summarycard">
            <h3 className="cardsubtitle">Cart Summary</h3>
            <div className="summaryrow">
              <span>Items:</span>
              <span>0</span>
            </div>
            <div className="summaryrow">
              <span>Subtotal:</span>
              <span>$0.00</span>
            </div>
            <hr className="divider" />
            <div className="summaryrow totalrow">
              <span>Total:</span>
              <span className="totaltext">$0.00</span>
            </div>
            <button className="checkoutbutton">Proceed to Checkout</button>
            <button className="continuebutton" onClick={() => setview('Browse Data')}>Continue Shopping</button>
          </div>

          <div className="balancecard">
            <p className="balancetitle">Account Balance</p>
            <h2 className="balanceval">$0.00</h2>
            {/* Click karne par Funds page par le jaye ga */}
            <button className="fundsbutton" onClick={() => setview('Funds')}>
              Add Funds →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;