import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Boards from './pages/Boards';
import Board from './pages/Board';

import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initPortalAuth() {
      try {
        const params = new URLSearchParams(window.location.search);
        const userParam = params.get('portal_user') || params.get('username') || params.get('user');
        const username = userParam || localStorage.getItem('portal_user') || 'admin';
        
        localStorage.setItem('portal_user', username);

        const { data: authData } = await api.post('/auth/portal-session', { username });
        api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
        localStorage.setItem('currentUser', JSON.stringify(authData.user));
        setAuthenticated(true);
      } catch (err) {
        console.error('Portal Auth failed', err);
      } finally {
        setLoading(false);
      }
    }
    initPortalAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7]">
        <LoadingSpinner 
          size="xl" 
          variant="primary" 
          label="Loading Evlov Workspace..." 
          sublabel="Syncing your projects and team activity" 
        />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1d2125] text-red-400">
        Authentication failed.
      </div>
    );
  }

  return (
    <BrowserRouter basename={typeof window !== 'undefined' && window.location.pathname.startsWith('/TodoList') ? '/TodoList' : '/'}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Boards />} />
          <Route path="boards" element={<Boards />} />
          <Route path="boards/:id" element={<Board />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id/board" element={<Board />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
