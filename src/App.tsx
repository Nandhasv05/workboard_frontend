import { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api, isLocalDev, redirectToPortalLogin } from './api';
import { hashRouting, portalLauncherUrl, routerBasename } from './utils/routing';
import AppLayout from './layouts/AppLayout';
import Boards from './pages/Boards';
import Board from './pages/Board';

import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initPortalAuth() {
      const params = new URLSearchParams(window.location.search);
      const devUser = isLocalDev ? params.get('portal_user') || params.get('username') || params.get('user') || 'nandhakumar' : null;
      const username = (window as any).__PORTAL_USER__ || devUser;
      if (!username) {
        window.location.replace(portalLauncherUrl());
        return;
      }
      try {
        const { data: authData } = await api.post('/auth/portal-session', { username });
        api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
        localStorage.setItem('currentUser', JSON.stringify(authData.user));
        setAuthenticated(true);
      } catch (err) {
        console.error('Portal Auth failed', err);
        redirectToPortalLogin();
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

  const routes = (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Boards />} />
        <Route path="boards" element={<Boards />} />
        <Route path="boards/:id" element={<Board />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return hashRouting
    ? <HashRouter>{routes}</HashRouter>
    : <BrowserRouter basename={routerBasename}>{routes}</BrowserRouter>;
}

export default App;
