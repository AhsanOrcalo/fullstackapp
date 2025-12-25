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

