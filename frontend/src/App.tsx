
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
import AdminFeedback from './pages/AdminFeedback';
import SupportPage from './pages/SupportPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import SessionWarning from './components/SessionWarning';
import MainLayout from './components/MainLayout';

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
          <Route 
            path="/admin/feedback" 
            element={
              <ProtectedRoute adminOnly>
                <AdminFeedback />
              </ProtectedRoute>
            } 
          />

          {/* Protected User Routes */}
          <Route path="/" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
          <Route path="/text-encrypt" element={<ProtectedRoute><MainLayout><TextEncryptionPage /></MainLayout></ProtectedRoute>} />
          <Route path="/text-decrypt" element={<ProtectedRoute><MainLayout><TextDecryptionPage /></MainLayout></ProtectedRoute>} />
          <Route path="/file-encrypt" element={<ProtectedRoute><MainLayout><FileEncryptionPage /></MainLayout></ProtectedRoute>} />
          <Route path="/file-decrypt" element={<ProtectedRoute><MainLayout><FileDecryptionPage /></MainLayout></ProtectedRoute>} />
          <Route path="/sign-file" element={<ProtectedRoute><MainLayout><SignFilePage /></MainLayout></ProtectedRoute>} />
          <Route path="/verify-signature" element={<ProtectedRoute><MainLayout><VerifySignaturePage /></MainLayout></ProtectedRoute>} />
          <Route path="/check-integrity" element={<ProtectedRoute><MainLayout><CheckIntegrityPage /></MainLayout></ProtectedRoute>} />
          <Route path="/audit-log" element={<ProtectedRoute><MainLayout><AuditLogPage /></MainLayout></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><MainLayout><SupportPage /></MainLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
