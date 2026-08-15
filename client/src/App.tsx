import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DemoBar } from './components/common/DemoBar';
import { Breadcrumbs } from './components/common/Breadcrumbs';
import { LoginPage } from './pages/LoginPage';
import { ControlTowerPage } from './pages/ControlTowerPage';
import { TrackingPage } from './pages/TrackingPage';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';
import { YardPage } from './pages/YardPage';
import { DockPage } from './pages/DockPage';
import { ExceptionPage } from './pages/ExceptionPage';
import { AppointmentPage } from './pages/AppointmentPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CustomerTrackingPage } from './pages/CustomerTrackingPage';
import { AdminPage } from './pages/AdminPage';
import { api } from './services/api';
import { getSocket } from './services/socket';

/**
 * Route Guard Component that validates whether the current active role has permission to view the route.
 */
const ProtectedRoute: React.FC<{
  path: string;
  element: React.ReactElement;
}> = ({ path, element }) => {
  const { currentRole, hasAccessTo } = useAuth();

  if (!hasAccessTo(path)) {
    // If not authorized, redirect to their home page
    const fallbackPath = currentRole === 'CUSTOMER' ? '/customer-tracking' : '/control-tower';
    return <Navigate to={fallbackPath} replace />;
  }

  return element;
};

const MainLayout: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const [activeExceptionsCount, setActiveExceptionsCount] = useState(0);

  const fetchExceptionsCount = async () => {
    try {
      const list = await api.getExceptions();
      setActiveExceptionsCount(list.filter(e => e.status === 'ACTIVE').length);
    } catch (err) {
      console.error('Error loading exceptions count:', err);
    }
  };

  useEffect(() => {
    fetchExceptionsCount();
    const socket = getSocket();
    socket.on('OPERATIONAL_STATE_CHANGED', fetchExceptionsCount);
    socket.on('DOCK_FAILURE_EVENT', fetchExceptionsCount);
    socket.on('DEMO_RESET_EVENT', fetchExceptionsCount);

    return () => {
      socket.off('OPERATIONAL_STATE_CHANGED', fetchExceptionsCount);
      socket.off('DOCK_FAILURE_EVENT', fetchExceptionsCount);
      socket.off('DEMO_RESET_EVENT', fetchExceptionsCount);
    };
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      <Header />
      {/* Simulation toolbar only visible to internal warehouse operations roles */}
      {currentRole !== 'CUSTOMER' && (
        <DemoBar onSimulationTriggered={fetchExceptionsCount} />
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar activeExceptionsCount={activeExceptionsCount} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Breadcrumbs />
          <Routes>
            <Route
              path="/control-tower"
              element={<ProtectedRoute path="/control-tower" element={<ControlTowerPage />} />}
            />
            <Route
              path="/tracking"
              element={<ProtectedRoute path="/tracking" element={<TrackingPage />} />}
            />
            <Route
              path="/shipments/:id"
              element={<ProtectedRoute path="/shipments" element={<ShipmentDetailPage />} />}
            />
            <Route
              path="/yard"
              element={<ProtectedRoute path="/yard" element={<YardPage />} />}
            />
            <Route
              path="/docks"
              element={<ProtectedRoute path="/docks" element={<DockPage />} />}
            />
            <Route
              path="/exceptions"
              element={<ProtectedRoute path="/exceptions" element={<ExceptionPage />} />}
            />
            <Route
              path="/appointments"
              element={<ProtectedRoute path="/appointments" element={<AppointmentPage />} />}
            />
            <Route
              path="/analytics"
              element={<ProtectedRoute path="/analytics" element={<AnalyticsPage />} />}
            />
            <Route
              path="/customer-tracking"
              element={<ProtectedRoute path="/customer-tracking" element={<CustomerTrackingPage />} />}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute path="/admin" element={<AdminPage />} />}
            />
            <Route
              path="*"
              element={
                <Navigate
                  to={currentRole === 'CUSTOMER' ? '/customer-tracking' : '/control-tower'}
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
