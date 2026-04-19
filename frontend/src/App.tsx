
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import TextEncryptionPage from './pages/TextEncryptionPage';
import TextDecryptionPage from './pages/TextDecryptionPage';
import FileEncryptionPage from './pages/FileEncryptionPage';
import FileDecryptionPage from './pages/FileDecryptionPage';
import AuditLogPage from './pages/AuditLogPage';
import SignFilePage from './pages/SignFilePage';
import VerifySignaturePage from './pages/VerifySignaturePage';
import CheckIntegrityPage from './pages/CheckIntegrityPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import SessionWarning from './components/SessionWarning';

function App() {
  return (
    <AuthProvider>
      <Router>
        <SessionWarning />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute adminOnly>
                <UserManagement />
              </ProtectedRoute>
            } 
          />

          {/* Protected User Routes */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/text-encrypt" element={<ProtectedRoute><TextEncryptionPage /></ProtectedRoute>} />
          <Route path="/text-decrypt" element={<ProtectedRoute><TextDecryptionPage /></ProtectedRoute>} />
          <Route path="/file-encrypt" element={<ProtectedRoute><FileEncryptionPage /></ProtectedRoute>} />
          <Route path="/file-decrypt" element={<ProtectedRoute><FileDecryptionPage /></ProtectedRoute>} />
          <Route path="/sign-file" element={<ProtectedRoute><SignFilePage /></ProtectedRoute>} />
          <Route path="/verify-signature" element={<ProtectedRoute><VerifySignaturePage /></ProtectedRoute>} />
          <Route path="/check-integrity" element={<ProtectedRoute><CheckIntegrityPage /></ProtectedRoute>} />
          <Route path="/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
