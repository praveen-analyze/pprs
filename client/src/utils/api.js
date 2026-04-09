import axios from 'axios';
import toast  from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    // Let the browser set multipart boundary automatically for FormData.
    delete config.headers['Content-Type'];
  }

  const token = localStorage.getItem('municipal_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('municipal_admin_token');
      localStorage.removeItem('municipal_admin_info');
      if (window.location.pathname.startsWith('/admin')) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => { window.location.href = '/admin/login'; }, 1500);
      }
    }
    if (status === 403) toast.error('You do not have permission to perform this action.');
    if (status >= 500) toast.error('Server error. Please try again later.');
    return Promise.reject(error);
  }
);

export async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data.categories;
}

export async function submitComplaint(formData) {
  const res = await api.post('/complaints', formData);
  return res.data;
}

export async function fetchComplaintByNo(complaintNo) {
  const res = await api.get(`/complaints/${complaintNo}`);
  return res.data.complaint;
}

export async function adminLogin(email, password) {
  const res = await api.post('/admin/login', { email, password });
  return res.data;
}

export async function fetchAdminComplaints(params = {}) {
  const res = await api.get('/admin/complaints', { params });
  return res.data;
}

export async function fetchComplaintById(id) {
  const res = await api.get(`/admin/complaints/${id}`);
  return res.data.complaint;
}

export async function updateComplaintStatus(id, payload) {
  const res = await api.patch(`/admin/complaints/${id}/status`, payload);
  return res.data;
}

export async function assignComplaintDept(id, department) {
  const res = await api.patch(`/admin/complaints/${id}/assign`, { department });
  return res.data;
}

export async function fetchStats() {
  const res = await api.get('/admin/stats');
  return res.data.stats;
}

export async function fetchMapData() {
  const res = await api.get('/admin/map');
  return res.data.complaints;
}

export async function fetchDepartments() {
  const res = await api.get('/admin/departments');
  return res.data.departments;
}

export default api;
