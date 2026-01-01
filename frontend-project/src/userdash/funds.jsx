import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserFunds, createPayment, getPaymentStatus, getUserPayments } from '../services/api';
import { FaDollarSign, FaFileAlt, FaMoneyBillWave, FaCopy, FaQrcode } from 'react-icons/fa';

const Funds = () => {
  const [fundsData, setFundsData] = useState({
    currentBalance: 0,
    totalDeposits: 0,
    minimumDeposit: 10.0,
    pendingPayments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    fetchFundsData();
    checkPendingPayments();
  }, []);

  // Check for pending payments periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (activePayment) {
        checkPaymentStatus(activePayment.paymentId);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [activePayment]);

  const fetchFundsData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserFunds();
      setFundsData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch funds data');
      console.error('Error fetching funds data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price || 0);
  };

  const checkPendingPayments = async () => {
    try {
      const payments = await getUserPayments();
      const pending = payments.find(p => 
        p.status === 'pending' || p.status === 'processing'
      );
      if (pending) {
        setActivePayment({
          paymentId: pending._id || pending.id,
          address: pending.plisioAddress || pending.cryptomusAddress,
          currency: pending.plisioCurrency || pending.cryptomusCurrency,
          network: pending.plisioCurrency || pending.cryptomusNetwork || 'N/A',
          amount: pending.amount,
          paymentUrl: pending.plisioPaymentUrl || pending.cryptomusPaymentUrl,
          expiredAt: pending.plisioExpiredAt || pending.cryptomusExpiredAt,
        });
      }
    } catch (err) {
      console.error('Error checking pending payments:', err);
    }
  };

  const checkPaymentStatus = async (paymentId) => {
    if (!paymentId || checkingStatus) return;
    
    try {
      setCheckingStatus(true);
      const payment = await getPaymentStatus(paymentId);
      
      if (payment.status === 'paid') {
        setActivePayment(null);
        fetchFundsData();
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        alert('Payment successful! Your balance has been updated.');
      } else if (payment.status === 'failed' || payment.status === 'expired') {
        setActivePayment(null);
        alert(`Payment ${payment.status}. Please try again.`);
      } else {
        // Still pending, update active payment
        setActivePayment({
          paymentId: payment._id || payment.id,
          address: payment.plisioAddress || payment.cryptomusAddress,
          currency: payment.plisioCurrency || payment.cryptomusCurrency,
          network: payment.plisioCurrency || payment.cryptomusNetwork || 'N/A',
          amount: payment.amount,
          paymentUrl: payment.plisioPaymentUrl || payment.cryptomusPaymentUrl,
          expiredAt: payment.plisioExpiredAt || payment.cryptomusExpiredAt,
        });
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCreatePayment = async () => {
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount < fundsData.minimumDeposit) {
      alert(`Minimum deposit is ${formatPrice(fundsData.minimumDeposit)}`);
      return;
    }

    try {
      setCreatingPayment(true);
      setError('');
      
      const paymentData = {
        amount: paymentAmount,
        currency: 'USD',
        paymentMethod: 'plisio',
      };

      const result = await createPayment(paymentData);
      
      setActivePayment({
        paymentId: result.paymentId,
        address: result.address,
        currency: result.currency,
        network: result.network || result.currency || 'N/A',
        amount: result.amount,
        paymentUrl: result.paymentUrl,
        expiredAt: result.expiredAt ? new Date(result.expiredAt * 1000) : null,
      });
      
      setAmount('');
      alert('Payment invoice created! Please complete the payment using the details below.');
    } catch (err) {
      setError(err.message || 'Failed to create payment');
      alert('Failed to create payment: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingPayment(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy');
    });
  };

  const pendingPayment = activePayment; 

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="fundsbox"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div 
        className="fundsheader" 
        style={{ marginBottom: '25px' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="toptitle">Funds</h2>
        <p className="subtitle">Add funds to your account balance</p>
      </motion.div>

      {/* Stats Cards Row */}
      <motion.div className="statsrow" variants={containerVariants}>
        <motion.div 
          className="statcard"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="cardinfo">
            <p className="cardtitle">Current Balance</p>
            {loading ? (
              <h1 className="cardvalue">...</h1>
            ) : error ? (
              <h1 className="cardvalue" style={{ color: '#ef4444', fontSize: '20px' }}>
                Error
              </h1>
            ) : (
              <h1 className="cardvalue">{formatPrice(fundsData.currentBalance)}</h1>
            )}
          </div>
          <div className="cardicon" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '32px',
            color: '#f1c40f'
          }}>
            <FaDollarSign />
          </div>
        </motion.div>
        <motion.div 
          className="statcard"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="cardinfo">
            <p className="cardtitle">Total Deposits</p>
            {loading ? (
              <h1 className="cardvalue">...</h1>
            ) : error ? (
              <h1 className="cardvalue" style={{ color: '#ef4444', fontSize: '20px' }}>
                Error
              </h1>
            ) : (
              <motion.h1 
                className="cardvalue"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {formatPrice(fundsData.totalDeposits)}
              </motion.h1>
            )}
          </div>
          <motion.div 
            className="cardicon" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '32px',
              color: 'var(--text-main)'
            }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <FaFileAlt />
          </motion.div>
        </motion.div>
        <motion.div 
          className="statcard"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="cardinfo">
            <p className="cardtitle">Minimum Deposit</p>
            <h1 className="cardvalue">{formatPrice(fundsData.minimumDeposit)}</h1>
          </div>
          <motion.div 
            className="cardicon" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '32px',
              color: 'var(--text-main)'
            }}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <FaMoneyBillWave />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          color: '#ef4444',
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>Error loading funds data</p>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>{error}</p>
          <button className="applybtn" onClick={fetchFundsData} style={{ marginTop: '10px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Add Funds Form */}
      {!pendingPayment && (
        <motion.div 
          className="datasection payment-detail-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h3 className="filtertitle" style={{ marginBottom: '20px' }}>Add Funds via Cryptocurrency</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text-main)',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum: ${formatPrice(fundsData.minimumDeposit)}`}
              min={fundsData.minimumDeposit}
              step="0.01"
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '10px',
                border: '1px solid var(--border-clr)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreatePayment();
                }
              }}
            />
            <p style={{ 
              marginTop: '5px', 
              fontSize: '12px', 
              color: 'var(--text-sub)' 
            }}>
              Minimum deposit: {formatPrice(fundsData.minimumDeposit)}
            </p>
          </div>

          <motion.button
            className="applybtn"
            onClick={handleCreatePayment}
            disabled={creatingPayment || !amount || parseFloat(amount) < fundsData.minimumDeposit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '100%',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: (!amount || parseFloat(amount) < fundsData.minimumDeposit) ? 0.6 : 1
            }}
          >
            <FaDollarSign />
            {creatingPayment ? 'Creating Payment...' : 'Create Payment Invoice'}
          </motion.button>
        </motion.div>
      )}

      {/* Active Payment Section */}
      {pendingPayment && (
        <motion.div 
          className="datasection payment-detail-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="payment-top-row">
            <div className="pending-info">
              <h3 className="filtertitle">Pending Payment</h3>
              <p className="infotext" style={{marginTop: '10px'}}>
                Amount: <strong>{formatPrice(pendingPayment.amount)}</strong>
              </p>
              <p className="infotext">
                Status: <span className="statusbadge pending">Processing</span>
              </p>
              {pendingPayment.expiredAt && (
                <p className="infotext" style={{fontSize: '12px', color: 'var(--text-sub)'}}>
                  Expires: {new Date(pendingPayment.expiredAt).toLocaleString()}
                </p>
              )}
            </div>
            
            <motion.button 
              className="applybtn" 
              style={{height: 'fit-content', padding: '10px 20px'}}
              onClick={() => checkPaymentStatus(pendingPayment.paymentId)}
              disabled={checkingStatus}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {checkingStatus ? 'Checking...' : 'Check Status'}
            </motion.button>
          </div>

          <div className="payment-methods-grid" style={{ marginTop: '20px' }}>
            <div className="qr-section">
              <p className="filtertitle" style={{fontSize: '14px', marginBottom: '10px'}}>
                <FaQrcode style={{ marginRight: '5px' }} />
                Payment QR Code
              </p>
              <div className="qr-placeholder" style={{
                padding: '20px',
                background: 'white',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px'
              }}>
                {pendingPayment.paymentUrl ? (
                  <a 
                    href={pendingPayment.paymentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--primary-blue)',
                      textDecoration: 'underline',
                      fontSize: '14px'
                    }}
                  >
                    Click to open payment page
                  </a>
                ) : (
                  <p style={{ color: 'var(--text-sub)', fontSize: '14px' }}>
                    QR Code not available
                  </p>
                )}
              </div>
            </div>

            <div className="instructions-section">
              <p className="filtertitle" style={{fontSize: '14px', marginBottom: '10px'}}>Payment Instructions</p>
              <p className="infotext" style={{fontSize: '13px', marginBottom: '15px'}}>
                Click the payment link above or send the exact amount to the address below using {pendingPayment.network} network.
              </p>
              
              <p className="filtertitle" style={{fontSize: '14px', marginBottom: '10px'}}>Payment Address</p>
              <div className="searchbar address-bar" style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={pendingPayment.address || ''} 
                  className="ordersearch"
                  style={{fontSize: '12px', flex: 1}}
                />
                <button 
                  className="secondarybutton"
                  onClick={() => copyToClipboard(pendingPayment.address)}
                  style={{
                    padding: '8px 15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FaCopy style={{ fontSize: '12px' }} />
                  Copy
                </button>
              </div>
              
              <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                <p className="infotext" style={{fontSize: '13px', marginBottom: '5px'}}>
                  <strong>Network:</strong> {pendingPayment.network}
                </p>
                <p className="infotext" style={{fontSize: '13px', marginBottom: '5px'}}>
                  <strong>Currency:</strong> {pendingPayment.currency}
                </p>
                <p className="infotext" style={{fontSize: '13px'}}>
                  <strong>Amount:</strong> {pendingPayment.amount} {pendingPayment.currency}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Funds;