// utils/api.js - Enhanced version with better error handling
const API_BASE_URL = 'http://localhost:5001/api';

export const api = {
  get: async (url) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = { data, status: response.status };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  },

  post: async (url, data) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🚀 API POST Request:', url, data);
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { message: 'Invalid JSON response from server' };
      }

      console.log('📨 API POST Response:', response.status, responseData);

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = { data: responseData, status: response.status };
        throw error;
      }

      return responseData;
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  },

  put: async (url, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = { data: responseData, status: response.status };
        throw error;
      }

      return responseData;
    } catch (error) {
      console.error('API PUT error:', error);
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = { data, status: response.status };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API DELETE error:', error);
      throw error;
    }
  },
};