import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from './hooks/useAuthState';
import { useUserRole } from './hooks/useUserRole';
import { CustomerProvider } from './context/CustomerContext';
import { TimerProvider } from './context/TimerContext';
import useLocalStorage from 'use-local-storage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Team from './pages/Team';
import Orders from './pages/Orders';
import Invoices from './pages/Invoices';
import TimeTracking from './pages/TimeTracking';
import MyTasks from './pages/MyTasks';
import Settings from './pages/Settings';

function RouteTracker() {
  const location = useLocation();
  const [, setLastVisitedPage] = useLocalStorage('lastVisitedPage', '/dashboard');

  useEffect(() => {
    if (location.pathname !== '/login') {
      setLastVisitedPage(location.pathname);
    }
  }, [location, setLastVisitedPage]);

  return null;
}

function App() {
  const { user, loading: authLoading } = useAuthState();
  const { role, loading: roleLoading } = useUserRole(user);
  const [lastVisitedPage] = useLocalStorage('lastVisitedPage', '/dashboard');

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || role === 'inaktiv') {
    return (
      <CustomerProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login isInactive={role === 'inaktiv'} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </CustomerProvider>
    );
  }

  return (
    <TimerProvider>
      <CustomerProvider>
        <Router>
          <RouteTracker />
          <div className="min-h-screen bg-gray-100">
            <div className="transition-all duration-300">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/team" element={<Team />} />
                <Route path="/mytasks" element={<MyTasks />} />
                <Route path="/schedule" element={<TimeTracking />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/" element={<Navigate to={lastVisitedPage} replace />} />
                <Route path="*" element={<Navigate to={lastVisitedPage} replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </CustomerProvider>
    </TimerProvider>
  );
}

export default App;