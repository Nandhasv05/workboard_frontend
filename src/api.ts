import axios from 'axios';

export const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const getBaseURL = () => {
  if (isLocalDev) return 'http://localhost:4000/api';
  return window.location.pathname.startsWith('/Workboard/TodoList') ? '/Workboard/TodoList/api' : '/TodoList/api';
};

export const redirectToPortalLogin = () => {
  if (!isLocalDev) window.location.href = '/EVOL/login.php';
};

export const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.response.use(undefined, error => {
  if (error?.response?.status === 401) redirectToPortalLogin();
  return Promise.reject(error);
});
