import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/shared/Toast';
import { Home } from './components/session/Home';
import { SessionCreate } from './components/session/SessionCreate';
import { SessionJoin } from './components/session/SessionJoin';
import { SessionLobby } from './components/session/SessionLobby';
import { PlaySession } from './components/play/PlaySession';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AssetCreate } from './components/admin/AssetCreate';
import { useSessionStore } from './stores/sessionStore';
import { useRealtime } from './hooks/useRealtime';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSessionStore((state) => state.session);
  const currentUser = useSessionStore((state) => state.currentUser);

  if (!session || !currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main app with realtime connection
const AppContent: React.FC = () => {
  const session = useSessionStore((state) => state.session);

  // Set up realtime subscriptions when in a session
  useRealtime();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<SessionCreate />} />
      <Route path="/join" element={<SessionJoin />} />
      <Route
        path="/lobby"
        element={
          <ProtectedRoute>
            <SessionLobby />
          </ProtectedRoute>
        }
      />
      <Route
        path="/play"
        element={
          <ProtectedRoute>
            <PlaySession />
          </ProtectedRoute>
        }
      />
      {/* Admin routes */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/assets/new" element={<AssetCreate />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
