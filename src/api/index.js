import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor - add token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// Users
export const usersApi = {
  list: () => api.get('/users'),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// Drug Items
export const drugItemsApi = {
  list: (params) => api.post('/drug-items/list', params),
  categories: () => api.post('/drug-items/categories'),
  create: (data) => api.post('/drug-items/create', data),
  import: (items) => api.post('/drug-items/import', items),
  update: (data) => api.post('/drug-items/update', data),
  delete: (data) => api.post('/drug-items/delete', data),
}

// Packaging Items
export const packagingItemsApi = {
  list: (params) => api.post('/packaging-items/list', params),
  categories: () => api.post('/packaging-items/categories'),
  create: (data) => api.post('/packaging-items/create', data),
  import: (items) => api.post('/packaging-items/import', items),
  update: (data) => api.post('/packaging-items/update', data),
  delete: (data) => api.post('/packaging-items/delete', data),
}

// Quotations
export const quotationsApi = {
  list: (params) => api.post('/quotations/list', params),
  create: (data) => api.post('/quotations/create', data),
  get: (data) => api.post('/quotations/get', data),
  update: (data) => api.post('/quotations/update', data),
  delete: (data) => api.post('/quotations/delete', data),
}

// Stats
export const statsApi = {
  get: () => api.post('/stats'),
}

export default api
