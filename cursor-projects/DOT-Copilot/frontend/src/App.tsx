import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components';
import { useToast } from './hooks/useToast';
import {
  Index,
  ResetPassword,
  NotFound,
  DriverDashboard,
  Supervisor,
  TrainingBuilder,
  UserManagement,
} from './pages';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  const { ToastContainer } = useToast();

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/reset-pw" element={<ResetPassword />} />
        <Route path="/404" element={<NotFound />} />

        {/* Protected routes with layout */}
        <Route element={<Layout />}>
          <Route
            path="/driver-dashboard"
            element={
              <ProtectedRoute>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute>
                <Supervisor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training-builder"
            element={
              <ProtectedRoute>
                <TrainingBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
