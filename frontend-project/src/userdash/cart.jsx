import React, { useState, useEffect } from 'react';
import { getCart, removeFromCart, clearCart, purchaseLead, getUserDashboardStats } from '../services/api';

const Cart = ({ setview }) => {
  const [cartitems, setCartitems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    loadCart();
    fetchUserBalance();
    
    // Listen for balance update events (e.g., after admin adds funds)
    const handleBalanceUpdate = () => {
      fetchUserBalance();
    };
    
    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, []);

  const fetchUserBalance = async () => {
    try {
      const data = await getUserDashboardStats();
      setUserBalance(data.availableBalance || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setUserBalance(0);
    }
  };

  const loadCart = () => {
    const cart = getCart();
    setCartitems(cart);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartitems.length && cartitems.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartitems.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = () => {
    selectedItems.forEach(itemId => {
      removeFromCart(itemId);
    });
    setSelectedItems(new Set());
    loadCart();
  };

  const handleCheckout = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to checkout');
      return;
    }

    // Calculate total price of selected items
    const itemsToPurchase = cartitems.filter(item => selectedItems.has(item.id));
    const totalPrice = itemsToPurchase.reduce((sum, item) => sum + (item.price || 0), 0);

    // Check balance before attempting purchase
    if (userBalance < totalPrice) {
      const shortfall = totalPrice - userBalance;
      alert(`Not enough balance!\n\nTotal: ${formatPrice(totalPrice)}\nYour Balance: ${formatPrice(userBalance)}\nShortfall: ${formatPrice(shortfall)}\n\nPlease add funds to your account before purchasing.`);
      setview('Funds');
      return;
    }

    setCheckoutLoading(true);
    
    try {
      // Purchase items sequentially to get remaining balance from each purchase
      let lastRemainingBalance = null;
      for (const item of itemsToPurchase) {
        const result = await purchaseLead(item.id);
        // Extract remaining balance from response
        if (result.remainingBalance !== undefined) {
          lastRemainingBalance = result.remainingBalance;
          setUserBalance(result.remainingBalance); // Update local balance state
        }
      }
      
      // Remove purchased items from cart
      selectedItems.forEach(itemId => {
        removeFromCart(itemId);
      });
      setSelectedItems(new Set());
      loadCart();
      
      // Show success message with remaining balance
      const balanceMsg = lastRemainingBalance !== null 
        ? `\n\nRemaining balance: ${formatPrice(lastRemainingBalance)}`
        : '';
      alert(`Purchase successful! Items have been added to your orders.${balanceMsg}`);
      
      // Trigger balance refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      
      setview('Orders');
    } catch (error) {
      // Handle specific error messages
      let errorMessage = 'Failed to complete purchase. Please try again.';
      if (error.message) {
        if (error.message.includes('Not enough balance') || error.message.includes('Insufficient balance')) {
          errorMessage = error.message;
          // Refresh balance to get latest value
          await fetchUserBalance();
        } else {
          errorMessage = error.message;
        }
      }
      alert(errorMessage);
      console.error('Checkout error:', error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateTotal = () => {
    const selected = cartitems.filter(item => selectedItems.has(item.id));
    return selected.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const selectedCount = selectedItems.size;
  const subtotal = calculateTotal();

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
                <input
                  type="checkbox"
                  checked={selectedItems.size === cartitems.length && cartitems.length > 0}
                  onChange={handleSelectAll}
                />
                <span>Select All</span>
              </label>
              <span className="countinfo">{selectedCount} selected</span>
            </div>
            <button 
              className="deletebutton"
              onClick={handleDeleteSelected}
              disabled={selectedCount === 0}
            >
              Delete Selected
            </button>
          </div>

          <div className="itemlist">
            {cartitems.length === 0 ? (
              <div className="emptycart">
                <p>Your cart is empty. Browse data to add items.</p>
              </div>
            ) : (
              <div className="itemrows">
                {cartitems.map((item) => (
                  <div 
                    key={item.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px',
                      borderBottom: '1px solid var(--border-clr)',
                      gap: '15px',
                    }}
                  >
                    <label className="customcheck">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                      />
                    </label>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: 'var(--text-main)',
                        marginBottom: '5px',
                        fontSize: '16px'
                      }}>
                        {item.firstName} {item.lastName}
                      </div>
                      <div style={{ 
                        color: 'var(--text-sub)',
                        fontSize: '14px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <span>{item.email}</span>
                        <span>•</span>
                        <span>{item.city}, {item.state}</span>
                      </div>
                    </div>
                    <div style={{ 
                      color: 'var(--primary-blue)',
                      fontWeight: '600',
                      fontSize: '16px',
                      minWidth: '100px',
                      textAlign: 'right'
                    }}>
                      {formatPrice(item.price || 0)}
                    </div>
                    <button
                      onClick={() => {
                        removeFromCart(item.id);
                        loadCart();
                      }}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        transition: '0.3s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rightarea">
          <div className="summarycard">
            <h3 className="cardsubtitle">Cart Summary</h3>
            <div className="summaryrow">
              <span>Items:</span>
              <span>{selectedCount}</span>
            </div>
            <div className="summaryrow">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <hr className="divider" />
            <div className="summaryrow totalrow">
              <span>Total:</span>
              <span className="totaltext">{formatPrice(subtotal)}</span>
            </div>
            <div className="summaryrow" style={{ 
              marginTop: '15px', 
              paddingTop: '15px', 
              borderTop: '1px solid var(--border-clr)' 
            }}>
              <span>Your Balance:</span>
              <span style={{ 
                fontWeight: '600',
                color: userBalance >= subtotal ? '#10b981' : '#ef4444'
              }}>
                {formatPrice(userBalance)}
              </span>
            </div>
            {selectedCount > 0 && (
              <div className="summaryrow" style={{ 
                marginTop: '5px',
                fontSize: '13px'
              }}>
                <span>After Purchase:</span>
                <span style={{ 
                  fontWeight: '600',
                  color: userBalance >= subtotal ? '#10b981' : '#ef4444'
                }}>
                  {formatPrice(userBalance - subtotal)}
                </span>
              </div>
            )}
            {selectedCount > 0 && userBalance < subtotal && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                ⚠️ Insufficient balance. Add ${(subtotal - userBalance).toFixed(2)} more
              </div>
            )}
            <button 
              className="checkoutbutton"
              onClick={handleCheckout}
              disabled={selectedCount === 0 || checkoutLoading || userBalance < subtotal}
              style={{
                opacity: (selectedCount === 0 || checkoutLoading || userBalance < subtotal) ? 0.5 : 1,
                cursor: (selectedCount === 0 || checkoutLoading || userBalance < subtotal) ? 'not-allowed' : 'pointer',
                marginTop: '15px'
              }}
            >
              {checkoutLoading ? 'Processing...' : userBalance < subtotal ? 'Insufficient Balance' : 'Proceed to Checkout'}
            </button>
            <button className="continuebutton" onClick={() => setview('Browse Data')}>Continue Shopping</button>
          </div>

          <div className="balancecard" onClick={() => setview('Funds')} style={{ cursor: 'pointer' }}>
            <p className="balancetitle">Account Balance</p>
            <h2 className="balanceval">{formatPrice(userBalance)}</h2>
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