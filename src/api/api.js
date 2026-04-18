import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7250/api', // Đảm bảo đúng Port Backend của bạn
  timeout: 10000, // Đợi tối đa 10s để tránh lỗi Timeout
});

// Tự động đính kèm Token vào Header cho mọi yêu cầu
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;