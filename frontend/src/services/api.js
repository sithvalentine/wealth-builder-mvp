import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

console.log('API URL configured:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/users/me'),
};

// Dashboard API
export const dashboardAPI = {
  getStudentDashboard: () => api.get('/dashboard/student'),
  getTeacherDashboard: () => api.get('/dashboard/teacher'),
  getGradebook: (classId) => api.get(`/dashboard/gradebook/${classId}`),
};

// Classes API
export const classesAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (classData) => api.post('/classes', classData),
  enroll: (id, enrollmentCode) => api.post(`/classes/${id}/enroll`, { enrollmentCode }),
};

// Courses API
export const coursesAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
};

// Lessons API
export const lessonsAPI = {
  getById: (id) => api.get(`/lessons/${id}`),
  complete: (id, classGroupId) => api.post(`/lessons/${id}/complete`, { classGroupId }),
  getByWeek: (weekId) => api.get(`/lessons/week/${weekId}`),
};

// Budget API
export const budgetAPI = {
  getAll: () => api.get('/budget'),
  getById: (id) => api.get(`/budget/${id}`),
  create: (budgetData) => api.post('/budget', budgetData),
  update: (id, budgetData) => api.patch(`/budget/${id}`, budgetData),
  delete: (id) => api.delete(`/budget/${id}`),
  calculate: (monthlyIncome) => api.post('/budget/calculate', { monthlyIncome }),
};

// Wealth Tracker API
export const wealthAPI = {
  getAll: (params) => api.get('/wealth-tracker', { params }),
  getById: (id) => api.get(`/wealth-tracker/${id}`),
  create: (data) => api.post('/wealth-tracker', data),
  update: (id, data) => api.patch(`/wealth-tracker/${id}`, data),
  delete: (id) => api.delete(`/wealth-tracker/${id}`),
  getAnalytics: () => api.get('/wealth-tracker/analytics/growth'),
};

export default api;
