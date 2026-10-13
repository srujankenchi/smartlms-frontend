import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClassConnect from './pages/chat/ClassConnect';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect root to appropriate dashboard
  const getHomePath = () => {
    if (!isAuthenticated) return '/login';
    switch (user?.role) {
      case 'ROLE_ADMIN':   return '/admin/dashboard';
      case 'ROLE_TEACHER': return '/teacher/dashboard';
      default:             return '/student/dashboard';
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Student routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute roles={['ROLE_STUDENT', 'ROLE_ADMIN']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute roles={['ROLE_TEACHER', 'ROLE_ADMIN']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['ROLE_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Class Connect — Shared classroom group chat */}
        <Route
          path="/class-connect"
          element={
            <ProtectedRoute roles={['ROLE_STUDENT', 'ROLE_TEACHER', 'ROLE_ADMIN']}>
              <ClassConnect />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to={getHomePath()} replace />} />
        <Route path="*" element={<Navigate to={getHomePath()} replace />} />
      </Routes>
    </>
  );
}

export default App;
