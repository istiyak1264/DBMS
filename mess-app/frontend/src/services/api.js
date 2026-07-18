import axios from 'axios'
import toast from 'react-hot-toast'

// Base URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_VERSION = '/api/v1' // Optional: for versioning

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // For sending cookies
})

// Request interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config.data || {})
    }
    
    return config
  },
  (error) => {
    console.error('[API] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API] Response:`, response.status, response.data)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    const { status, data } = error.response

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API] Error:', status, data)
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        // Bad Request - Show validation errors
        if (data.errors) {
          Object.values(data.errors).forEach(err => {
            toast.error(err)
          })
        } else {
          toast.error(data.message || 'Invalid request')
        }
        break

      case 401:
        // Unauthorized - Token expired or invalid
        if (!originalRequest._retry) {
          originalRequest._retry = true
          try {
            // Attempt to refresh token if available
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                refreshToken
              })
              const { token } = response.data
              localStorage.setItem('token', token)
              originalRequest.headers.Authorization = `Bearer ${token}`
              return api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed - redirect to login
            handleAuthError()
          }
        }
        // No refresh token or refresh failed
        handleAuthError()
        break

      case 403:
        // Forbidden - Insufficient permissions
        toast.error('You do not have permission to perform this action')
        break

      case 404:
        // Not Found
        toast.error(data.message || 'Resource not found')
        break

      case 409:
        // Conflict - Duplicate resource
        toast.error(data.message || 'Resource already exists')
        break

      case 422:
        // Unprocessable Entity - Validation errors
        if (data.errors) {
          Object.values(data.errors).forEach(err => {
            toast.error(err)
          })
        } else {
          toast.error(data.message || 'Validation failed')
        }
        break

      case 429:
        // Too Many Requests - Rate limiting
        toast.error('Too many requests. Please try again later.')
        break

      case 500:
        // Internal Server Error
        toast.error('Something went wrong on the server. Please try again later.')
        break

      case 503:
        // Service Unavailable
        toast.error('Service is temporarily unavailable. Please try again later.')
        break

      default:
        // Other errors
        toast.error(data.message || 'An unexpected error occurred')
    }

    return Promise.reject(error)
  }
)

// Helper function to handle authentication errors
const handleAuthError = () => {
  // Clear all auth data
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  localStorage.removeItem('rememberMe')
  
  // Show message
  toast.error('Session expired. Please login again.')
  
  // Redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// ============================================
// API Service Methods
// ============================================

// ===== AUTHENTICATION SERVICES =====
export const authService = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/api/auth/profile')
    return response.data
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await api.put('/api/auth/profile', userData)
    return response.data
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/api/auth/change-password', passwordData)
    return response.data
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email })
    return response.data
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/api/auth/reset-password', { token, newPassword })
    return response.data
  },

  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token')
    return !!token && token !== 'undefined' && token !== 'null'
  },

  // Get current user from storage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  },

  // Set authentication data
  setAuthData: (token, user, refreshToken = null) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
  }
}

// ===== USER SERVICES =====
export const userService = {
  // Get all members
  getMembers: async (params = {}) => {
    const response = await api.get('/api/users/members', { params })
    return response.data
  },

  // Get member by ID
  getMember: async (id) => {
    const response = await api.get(`/api/users/members/${id}`)
    return response.data
  },

  // Update member
  updateMember: async (id, data) => {
    const response = await api.put(`/api/users/members/${id}`, data)
    return response.data
  },

  // Delete member
  deleteMember: async (id) => {
    const response = await api.delete(`/api/users/members/${id}`)
    return response.data
  },

  // Get member statistics
  getStats: async () => {
    const response = await api.get('/api/users/stats')
    return response.data
  },

  // Bulk update members
  bulkUpdateMembers: async (memberIds, data) => {
    const response = await api.put('/api/users/members/bulk', { memberIds, ...data })
    return response.data
  },

  // Bulk delete members
  bulkDeleteMembers: async (memberIds) => {
    const response = await api.delete('/api/users/members/bulk', { data: { memberIds } })
    return response.data
  }
}

// ===== MEAL SERVICES =====
export const mealService = {
  // Get all meals with filters
  getMeals: async (params = {}) => {
    const response = await api.get('/api/meals', { params })
    return response.data
  },

  // Get meal by ID
  getMeal: async (id) => {
    const response = await api.get(`/api/meals/${id}`)
    return response.data
  },

  // Create new meal
  createMeal: async (data) => {
    const response = await api.post('/api/meals', data)
    return response.data
  },

  // Update meal
  updateMeal: async (id, data) => {
    const response = await api.put(`/api/meals/${id}`, data)
    return response.data
  },

  // Delete meal
  deleteMeal: async (id) => {
    const response = await api.delete(`/api/meals/${id}`)
    return response.data
  },

  // Get meal summary
  getMealSummary: async (params) => {
    const response = await api.get('/api/meals/summary', { params })
    return response.data
  },

  // Get meals by member
  getMealsByMember: async (memberId, params = {}) => {
    const response = await api.get(`/api/meals/member/${memberId}`, { params })
    return response.data
  },

  // Get meals by date range
  getMealsByDateRange: async (startDate, endDate) => {
    const response = await api.get('/api/meals', { 
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data
  },

  // Bulk create meals
  bulkCreateMeals: async (meals) => {
    const response = await api.post('/api/meals/bulk', { meals })
    return response.data
  },

  // Export meals
  exportMeals: async (params = {}) => {
    const response = await api.get('/api/meals/export', { 
      params,
      responseType: 'blob'
    })
    return response.data
  }
}

// ===== EXPENSE SERVICES =====
export const expenseService = {
  // Get all expenses with filters
  getExpenses: async (params = {}) => {
    const response = await api.get('/api/expenses', { params })
    return response.data
  },

  // Get expense by ID
  getExpense: async (id) => {
    const response = await api.get(`/api/expenses/${id}`)
    return response.data
  },

  // Create new expense
  createExpense: async (data) => {
    const response = await api.post('/api/expenses', data)
    return response.data
  },

  // Update expense
  updateExpense: async (id, data) => {
    const response = await api.put(`/api/expenses/${id}`, data)
    return response.data
  },

  // Delete expense
  deleteExpense: async (id) => {
    const response = await api.delete(`/api/expenses/${id}`)
    return response.data
  },

  // Get expense summary
  getExpenseSummary: async (params) => {
    const response = await api.get('/api/expenses/summary', { params })
    return response.data
  },

  // Get expenses by category
  getExpensesByCategory: async (category, params = {}) => {
    const response = await api.get(`/api/expenses/category/${category}`, { params })
    return response.data
  },

  // Get expenses by date range
  getExpensesByDateRange: async (startDate, endDate) => {
    const response = await api.get('/api/expenses', {
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data
  },

  // Bulk create expenses
  bulkCreateExpenses: async (expenses) => {
    const response = await api.post('/api/expenses/bulk', { expenses })
    return response.data
  },

  // Export expenses
  exportExpenses: async (params = {}) => {
    const response = await api.get('/api/expenses/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  }
}

// ===== REPORT SERVICES =====
export const reportService = {
  // Get meal report
  getMealReport: async (params) => {
    const response = await api.get('/api/reports/meals', { params })
    return response.data
  },

  // Get expense report
  getExpenseReport: async (params) => {
    const response = await api.get('/api/reports/expenses', { params })
    return response.data
  },

  // Get financial report
  getFinancialReport: async (params) => {
    const response = await api.get('/api/reports/financial', { params })
    return response.data
  },

  // Get member report
  getMemberReport: async (params) => {
    const response = await api.get('/api/reports/members', { params })
    return response.data
  },

  // Get dashboard data
  getDashboardData: async () => {
    const response = await api.get('/api/reports/dashboard')
    return response.data
  },

  // Export report
  exportReport: async (type, params = {}) => {
    const response = await api.get(`/api/reports/export/${type}`, {
      params,
      responseType: 'blob'
    })
    return response.data
  }
}

// ===== UPLOAD SERVICES =====
export const uploadService = {
  // Upload single file
  uploadFile: async (file, type = 'general') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        // You can add progress callback here
      }
    })
    return response.data
  },

  // Upload multiple files
  uploadMultipleFiles: async (files, type = 'general') => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('type', type)
    
    const response = await api.post('/api/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        // You can add progress callback here
      }
    })
    return response.data
  },

  // Delete file
  deleteFile: async (filename) => {
    const response = await api.delete(`/api/upload/${filename}`)
    return response.data
  },

  // Get file URL
  getFileUrl: (filename) => {
    return `${API_URL}/uploads/${filename}`
  },

  // Download file
  downloadFile: async (filename) => {
    const response = await api.get(`/api/upload/download/${filename}`, {
      responseType: 'blob'
    })
    return response.data
  }
}

// ===== UTILITY FUNCTIONS =====
export const utils = {
  // Format date
  formatDate: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date)
    if (isNaN(d.getTime())) return date
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
  },

  // Format currency
  formatCurrency: (amount, currency = '₹') => {
    return `${currency}${Number(amount).toFixed(2)}`
  },

  // Get status color
  getStatusColor: (status) => {
    const colors = {
      active: '#10b981',
      inactive: '#ef4444',
      pending: '#f59e0b',
      completed: '#10b981',
      cancelled: '#ef4444'
    }
    return colors[status] || '#667eea'
  },

  // Generate random ID
  generateId: () => {
    return Math.random().toString(36).substr(2, 9)
  },

  // Debounce function
  debounce: (func, wait = 300) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // Deep clone object
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj))
  }
}

// ===== ERROR HANDLING =====
export const handleError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response
    return {
      status,
      message: data.message || data.error || 'An error occurred',
      errors: data.errors || null
    }
  } else if (error.request) {
    // Request made but no response
    return {
      status: 0,
      message: 'No response from server. Please check your connection.',
      errors: null
    }
  } else {
    // Request setup error
    return {
      status: 0,
      message: error.message || 'Request failed',
      errors: null
    }
  }
}

// ===== API STATUS =====
export const apiStatus = {
  // Check API health
  checkHealth: async () => {
    try {
      const response = await api.get('/api/health')
      return response.data
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  },

  // Get system info
  getSystemInfo: async () => {
    try {
      const response = await api.get('/api/system')
      return response.data
    } catch (error) {
      return null
    }
  }
}

// Default export
export default api