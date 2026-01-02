const API_BASE_URL = 'http://localhost:8000';

// Helper function to get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Helper function to set auth token in localStorage
export const setAuthToken = (token) => {
  localStorage.setItem('access_token', token);
};

// Helper function to remove auth token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem('access_token');
};

// Helper function to get user data from localStorage
export const getUserData = () => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

// Helper function to set user data in localStorage
export const setUserData = (user) => {
  localStorage.setItem('user_data', JSON.stringify(user));
};

// Helper function to remove user data from localStorage
export const removeUserData = () => {
  localStorage.removeItem('user_data');
};

// Cart management functions
export const getCart = () => {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
};

export const addToCart = (lead) => {
  const cart = getCart();
  // Check if lead already in cart
  if (!cart.find(item => item.id === lead.id)) {
    cart.push(lead);
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  return cart;
};

export const addMultipleToCart = (leads) => {
  const cart = getCart();
  leads.forEach(lead => {
    if (!cart.find(item => item.id === lead.id)) {
      cart.push(lead);
    }
  });
  localStorage.setItem('cart', JSON.stringify(cart));
  return cart;
};

export const removeFromCart = (leadId) => {
  const cart = getCart();
  const updatedCart = cart.filter(item => item.id !== leadId);
  localStorage.setItem('cart', JSON.stringify(updatedCart));
  return updatedCart;
};

export const clearCart = () => {
  localStorage.removeItem('cart');
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors (array of messages) or single error message
      let errorMessage = data.message;
      
      if (Array.isArray(data.message)) {
        // Validation errors come as an array
        errorMessage = data.message.join(', ');
      } else if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Re-throw if it's already our custom error
    if (error.status) {
      throw error;
    }
    // Handle network errors or JSON parsing errors
    throw new Error(error.message || 'Network error. Please check your connection.');
  }
};

// Login API
export const login = async (userName, password) => {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userName, password }),
    });

    // Store token and user data
    if (response.access_token) {
      setAuthToken(response.access_token);
      setUserData(response.user);
    }

    return response;
  } catch (error) {
    throw error;
  }
};

// Register API (for future use)
export const register = async (userData) => {
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Logout function
export const logout = () => {
  removeAuthToken();
  removeUserData();
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Get all leads API
export const getAllLeads = async (filters = {}) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.dobFrom) queryParams.append('dobFrom', filters.dobFrom);
    if (filters.dobTo) queryParams.append('dobTo', filters.dobTo);
    if (filters.zip) queryParams.append('zip', filters.zip);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.priceSort) queryParams.append('priceSort', filters.priceSort);
    if (filters.scoreFilter) queryParams.append('scoreFilter', filters.scoreFilter);
    if (filters.canadaFilter) queryParams.append('canadaFilter', filters.canadaFilter);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const queryString = queryParams.toString();
    const endpoint = `/leads${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest(endpoint, {
      method: 'GET',
    });

    return response;
  } catch (error) {
    throw error;
  }
};

// Add lead API
export const addLead = async (leadData) => {
  try {
    const response = await apiRequest('/leads/add-lead', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Bulk add leads API
export const bulkAddLeads = async (leadsData) => {
  try {
    const response = await apiRequest('/leads/bulk/add', {
      method: 'POST',
      body: JSON.stringify({ leads: leadsData }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete lead API (Admin only)
export const deleteLead = async (leadId) => {
  try {
    const response = await apiRequest(`/leads/${leadId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete multiple leads API (Admin only)
export const deleteLeads = async (leadIds) => {
  try {
    const response = await apiRequest('/leads/bulk/delete', {
      method: 'DELETE',
      body: JSON.stringify({ leadIds }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get all users API (Admin only)
export const getAllUsers = async () => {
  try {
    const response = await apiRequest('/auth/users', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Add funds to user API (Admin only)
export const addFundsToUser = async (userId, amount) => {
  try {
    const response = await apiRequest(`/auth/users/${userId}/add-funds`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete user API (Admin only)
export const deleteUser = async (userId) => {
  try {
    const response = await apiRequest(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete multiple users API (Admin only)
export const deleteUsers = async (userIds) => {
  try {
    const response = await apiRequest('/auth/users/bulk/delete', {
      method: 'DELETE',
      body: JSON.stringify({ userIds }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get user funds API (User only)
export const getUserFunds = async () => {
  try {
    const response = await apiRequest('/auth/funds', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get all purchases API (Admin only)
export const getAllPurchases = async () => {
  try {
    const response = await apiRequest('/purchases/all', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Purchase a lead API (User only)
export const purchaseLead = async (leadId) => {
  try {
    const response = await apiRequest(`/purchases/lead/${leadId}`, {
      method: 'POST',
    });
    // Extract remainingBalance from message or response
    if (response.remainingBalance !== undefined) {
      return response;
    }
    // Try to extract from message if not in response
    const balanceMatch = response.message?.match(/Remaining balance: \$([\d.]+)/);
    if (balanceMatch) {
      response.remainingBalance = parseFloat(balanceMatch[1]);
    }
    return response;
  } catch (error) {
    throw error;
  }
};

// Get user purchases API (User only)
export const getUserPurchases = async () => {
  try {
    const response = await apiRequest('/purchases', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Enquiries API
export const createEnquiry = async (message) => {
  try {
    const response = await apiRequest('/enquiries', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getUserEnquiries = async () => {
  try {
    const response = await apiRequest('/enquiries', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllEnquiries = async () => {
  try {
    const response = await apiRequest('/enquiries/all', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const respondToEnquiry = async (enquiryId, response) => {
  try {
    const response_data = await apiRequest(`/enquiries/${enquiryId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ response }),
    });
    return response_data;
  } catch (error) {
    throw error;
  }
};

export const closeEnquiry = async (enquiryId) => {
  try {
    const response = await apiRequest(`/enquiries/${enquiryId}/close`, {
      method: 'PUT',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get admin dashboard stats API
export const getDashboardStats = async () => {
  try {
    const response = await apiRequest('/dashboard/stats', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get user dashboard stats API
export const getUserDashboardStats = async () => {
  try {
    const response = await apiRequest('/dashboard/user-stats', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Change password API
export const changePassword = async (oldPassword, newPassword, confirmPassword) => {
  try {
    const response = await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get user profile API
export const getProfile = async () => {
  try {
    const response = await apiRequest('/auth/profile', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Update profile API
export const updateProfile = async (userName, email) => {
  try {
    const updateData = {};
    if (userName) updateData.userName = userName;
    if (email) updateData.email = email;
    
    const response = await apiRequest('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    // Update user data in localStorage if username changed
    if (response.user) {
      const currentUserData = getUserData();
      if (currentUserData) {
        setUserData({
          ...currentUserData,
          userName: response.user.userName,
        });
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

// Forget password API
export const forgetPassword = async (email) => {
  try {
    const response = await apiRequest('/auth/forget-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get sold data analytics API (Admin only)
export const getSoldDataAnalytics = async (dateFrom, dateTo) => {
  try {
    const queryParams = new URLSearchParams();
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);
    
    const queryString = queryParams.toString();
    const endpoint = `/purchases/analytics${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest(endpoint, {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// ==================== PAYMENT GATEWAY APIs ====================

// Create payment (Cryptomus)
export const createPayment = async (paymentData) => {
  try {
    const response = await apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get payment status
export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await apiRequest(`/payments/${paymentId}`, {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get user payments
export const getUserPayments = async () => {
  try {
    const response = await apiRequest('/payments', {
      method: 'GET',
    });
    return response;
  } catch (error) {
    throw error;
  }
};

