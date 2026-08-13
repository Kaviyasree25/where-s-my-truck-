import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DemoBar } from './components/common/DemoBar';
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

const MainLayout: React.FC = () => {
  const { currentUser } = useAuth();
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header />
      <DemoBar onSimulationTriggered={fetchExceptionsCount} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeExceptionsCount={activeExceptionsCount} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/control-tower" element={<ControlTowerPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
            <Route path="/yard" element={<YardPage />} />
            <Route path="/docks" element={<DockPage />} />
            <Route path="/exceptions" element={<ExceptionPage />} />
            <Route path="/appointments" element={<AppointmentPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/customer-tracking" element={<CustomerTrackingPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/control-tower" replace />} />
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
