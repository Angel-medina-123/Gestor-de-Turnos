import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminPanel } from './pages/AdminPanel';
import { SuperAdminPanel } from './pages/SuperAdminPanel';
import { AnalystPanel } from './pages/AnalystPanel';
import { ReportView } from './pages/ReportView';
import { Role } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: Role[] }> = ({ children, allowedRoles }) => {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect based on role
    switch(currentUser.role) {
        case Role.SUPER_ADMIN: return <Navigate to="/superadmin" replace />;
        case Role.ADMIN: return <Navigate to="/admin" replace />;
        case Role.ANALYST: return <Navigate to="/checklist" replace />;
    }
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    const { currentUser } = useContext(AuthContext);
    
    const getDefaultRoute = () => {
        if (!currentUser) return "/login";
        switch(currentUser.role) {
            case Role.SUPER_ADMIN: return "/superadmin";
            case Role.ADMIN: return "/admin";
            default: return "/checklist";
        }
    };

    return (
        <Routes>
            <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={getDefaultRoute()} />} />
            
            <Route path="/superadmin" element={
                <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                    <SuperAdminPanel />
                </ProtectedRoute>
            } />

            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <AdminPanel />
                </ProtectedRoute>
            } />
            
            <Route path="/checklist" element={
                <ProtectedRoute allowedRoles={[Role.ANALYST]}>
                    <AnalystPanel />
                </ProtectedRoute>
            } />

            <Route path="/report" element={
                <ProtectedRoute allowedRoles={[Role.ANALYST]}>
                    <ReportView />
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AuthProvider>
        <HashRouter>
           <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </DataProvider>
  );
};

export default App;