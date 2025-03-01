import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set the base URL for API requests
const API_URL = 'http://192.168.1.9:5000/api'; // Use your computer's IP address

// Helper function to create headers with authentication token
const createAuthHeader = (token) => {
  if (!token) {
    throw new Error('Authentication token is required');
  }
  return { Authorization: `Bearer ${token}` };
};

// Create API service
const api = {
  // Register a new user (student or teacher)
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Register API error:', error);
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },

  // Login a user
  login: async (credentials) => {
    try {
      console.log('Login request:', credentials);
      const response = await axios.post(`${API_URL}/login`, credentials);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },

  // Helper method to get the stored token
  getToken: async () => {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  // Teacher API endpoints
  teacher: {
    // Get teacher profile
    getProfile: async (token) => {
      try {
        console.log('Sending request to:', `${API_URL}/teacher/profile`);
        console.log('With token:', token);
        const response = await axios.get(`${API_URL}/teacher/profile`, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        console.error('Get profile API error:', error.response || error);
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Update teacher profile
    updateProfile: async (token, profileData) => {
      try {
        const response = await axios.post(`${API_URL}/teacher/profile/update`, profileData, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        console.error('Update profile API error:', error.response || error);
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Upload profile picture
    uploadProfilePicture: async (token, formData) => {
      try {
        const response = await axios.post(`${API_URL}/teacher/profile/upload-picture`, formData, {
          headers: {
            ...createAuthHeader(token),
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } catch (error) {
        console.error('Upload profile picture API error:', error.response || error);
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Delete profile picture
    deleteProfilePicture: async (token) => {
      try {
        const response = await axios.delete(`${API_URL}/teacher/profile/delete-picture`, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        console.error('Delete profile picture API error:', error.response || error);
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Get teacher's classes
    getClasses: async (token) => {
      try {
        const response = await axios.get(`${API_URL}/teacher/classes`, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Create a new class
    createClass: async (token, classData) => {
      try {
        const response = await axios.post(`${API_URL}/teacher/classes`, classData, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Get students in a class
    getClassStudents: async (token, classId) => {
      try {
        const response = await axios.get(`${API_URL}/teacher/classes/${classId}/students`, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Record attendance for a class
    recordAttendance: async (token, classId, attendanceData) => {
      try {
        const response = await axios.post(`${API_URL}/teacher/classes/${classId}/attendance`, attendanceData, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Get teacher's subjects
    getSubjects: async (token) => {
      try {
        const response = await axios.get(`${API_URL}/teacher/subjects`, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Create a new subject
    createSubject: async (token, subjectData) => {
      try {
        const response = await axios.post(`${API_URL}/teacher/subjects`, subjectData, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },

    // Get students in a subject
    getSubjectStudents: async (token, subjectId) => {
      try {
        const response = await axios.get(`${API_URL}/teacher/subjects/${subjectId}/students`, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },
    
    // Update a subject
    updateSubject: async (token, subjectId, subjectData) => {
      try {
        const response = await axios.put(`${API_URL}/teacher/subjects/${subjectId}`, subjectData, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },
    
    // Delete a subject
    deleteSubject: async (token, subjectId) => {
      try {
        const response = await axios.delete(`${API_URL}/teacher/subjects/${subjectId}`, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    },
    
    // Generate a key code for a subject
    generateSubjectKey: async (token, subjectId) => {
      try {
        const response = await axios.post(`${API_URL}/teacher/subjects/${subjectId}/generate-key`, {}, {
          headers: createAuthHeader(token)
        });
        return response.data;
      } catch (error) {
        throw error.response ? error.response.data : { message: 'Network error' };
      }
    }
  }
};

export default api; 