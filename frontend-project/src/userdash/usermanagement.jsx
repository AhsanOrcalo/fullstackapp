import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllUsers, addFundsToUser, deleteUser, deleteUsers } from '../services/api';
import { FaDollarSign, FaPlus, FaTrash } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingFunds, setAddingFunds] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [showAddFundModal, setShowAddFundModal] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

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
      // Trigger balance update event for the user (if they're logged in)
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
    } catch (err) {
      alert(err.message || 'Failed to add funds');
      console.error('Error adding funds:', err);
    } finally {
      setAddingFunds(null);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allUserIds = new Set(users.map(user => user.id));
      setSelectedUsers(allUserIds);
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleDeleteUsers = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user to delete');
      return;
    }

    const userIds = Array.from(selectedUsers);
    const confirmMessage = userIds.length === 1
      ? `Are you sure you want to delete this user? This action cannot be undone.`
      : `Are you sure you want to delete ${userIds.length} users? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(true);
      const result = await deleteUsers(userIds);
      setSelectedUsers(new Set());
      await fetchUsers(); // Refresh users list
      alert(result.message || `${result.deletedCount} user(s) deleted successfully`);
    } catch (err) {
      alert(err.message || 'Failed to delete users');
      console.error('Error deleting users:', err);
    } finally {
      setDeleting(false);
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
            {selectedUsers.size > 0 && ` • ${selectedUsers.size} selected`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedUsers.size > 0 && (
            <button 
              className="applybtn" 
              onClick={handleDeleteUsers}
              disabled={deleting || loading}
              style={{ 
                backgroundColor: '#ef4444',
                opacity: deleting || loading ? 0.6 : 1
              }}
            >
              <FaTrash style={{ marginRight: '5px' }} />
              {deleting ? 'Deleting...' : `Delete (${selectedUsers.size})`}
            </button>
          )}
          <button className="applybtn" onClick={fetchUsers} disabled={loading}>
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
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
                  <th>
                    <label className="customcheck">
                      <input
                        type="checkbox"
                        checked={users.length > 0 && users.every(user => selectedUsers.has(user.id))}
                        onChange={handleSelectAll}
                      />
                    </label>
                  </th>
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
                {users.map((user, index) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ backgroundColor: 'rgba(67, 24, 255, 0.1)', scale: 1.01 }}
                  >
                    <td>
                      <label className="customcheck">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </label>
                    </td>
                    <td style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '600' }}>
                      {index + 1}
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
                  </motion.tr>
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

