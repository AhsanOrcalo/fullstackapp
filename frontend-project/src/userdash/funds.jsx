import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserFunds } from '../services/api';
import { FaDollarSign, FaFileAlt, FaMoneyBillWave } from 'react-icons/fa';

const Funds = () => {
  const [fundsData, setFundsData] = useState({
    currentBalance: 0,
    totalDeposits: 0,
    minimumDeposit: 10.0,
    pendingPayments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFundsData();
  }, []);

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

  const pendingPayment = fundsData.pendingPayments && fundsData.pendingPayments.length > 0 
    ? fundsData.pendingPayments[0] 
    : null; 

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

      {/* Main Payment Section */}
      <motion.div 
        className="datasection payment-detail-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="payment-top-row">
          <div className="pending-info">
            <h3 className="filtertitle">Pending Payment</h3>
            {!pendingPayment ? (
              <p className="infotext" style={{marginTop: '10px'}}>No pending payments at the moment.</p>
            ) : (
              <>
                <p className="infotext">Amount: <strong>{formatPrice(pendingPayment.amount)}</strong></p>
                <p className="infotext">Status: <span className="statusbadge pending">{pendingPayment.status}</span></p>
              </>
            )}
          </div>
          
          {/* FIXED: Using Blue Theme 'applybtn' instead of green 'fastbutton' */}
          <motion.button 
            className="applybtn" 
            style={{height: 'fit-content', padding: '10px 20px'}}
            onClick={fetchFundsData}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? 'Checking...' : 'Check Status'}
          </motion.button>
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
      </motion.div>
    </motion.div>
  );
};

export default Funds;