import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return '/TodoList/api';
    }
  }
  return 'http://localhost:4000/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
});
