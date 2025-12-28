import React, { useState, useEffect } from 'react';
import { getAllUsers, addFundsToUser } from '../services/api';
import { FaDollarSign, FaPlus } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingFunds, setAddingFunds] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [showAddFundModal, setShowAddFundModal] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price || 0);
  };

  const handleAddFunds = async (userId) => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setAddingFunds(userId);
      await addFundsToUser(userId, amount);
      setFundAmount('');
      setShowAddFundModal(null);
      await fetchUsers(); // Refresh users list
      alert('Funds added successfully!');
    } catch (err) {
      alert(err.message || 'Failed to add funds');
      console.error('Error adding funds:', err);
    } finally {
      setAddingFunds(null);
    }
  };

  return (
    <div className="browsebox">
      <div className="browsetop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '24px', fontWeight: '700' }}>
            User Management
          </h2>
          <p className="subtitle" style={{ marginTop: '5px' }}>
            {users.length} {users.length === 1 ? 'user' : 'users'} registered
          </p>
        </div>
        <button className="applybtn" onClick={fetchUsers} disabled={loading}>
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="tablecard">
        {loading ? (
          <div className="nodata">
            <p style={{ color: 'var(--text-sub)' }}>Loading users...</p>
          </div>
        ) : error ? (
          <div className="nodata">
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button className="applybtn" onClick={fetchUsers} style={{ marginTop: '15px' }}>
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="nodata">
            No users found. Users will appear here after they register.
          </div>
        ) : (
          <div className="tablewrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th>Balance</th>
                  <th>Registered Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ color: 'var(--text-sub)', fontSize: '12px', fontFamily: 'monospace' }}>
                      {user.id.substring(0, 8)}...
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {user.userName || 'N/A'}
                    </td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.phoneNumber || 'N/A'}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backgroundColor: user.role === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: user.role === 'admin' ? 'var(--primary-blue)' : '#10b981',
                      }}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td style={{ 
                      color: 'var(--primary-blue)', 
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {formatPrice(user.balance)}
                    </td>
                    <td style={{ color: 'var(--text-sub)', fontSize: '14px' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td>
                      <button
                        className="applybtn"
                        onClick={() => {
                          setShowAddFundModal(user.id);
                          setFundAmount('');
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <FaPlus style={{ fontSize: '10px' }} />
                        Add Fund
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Fund Modal */}
      {showAddFundModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0px 18px 40px rgba(112, 144, 176, 0.12)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: 'var(--text-main)',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              Add Funds
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Amount ($)
              </label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-color)',
                  fontSize: '15px',
                  outline: 'none'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFunds(showAddFundModal);
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddFundModal(null);
                  setFundAmount('');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                className="applybtn"
                onClick={() => handleAddFunds(showAddFundModal)}
                disabled={addingFunds === showAddFundModal || !fundAmount || parseFloat(fundAmount) <= 0}
                style={{
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FaDollarSign />
                {addingFunds === showAddFundModal ? 'Adding...' : 'Add Funds'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

