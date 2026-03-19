import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/admin/AdminLayout';
import StudentLayout from './layouts/student/StudentLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage';
import GroupsPage from './pages/admin/GroupsPage';
import StudentsPage from './pages/admin/StudentsPage';
import ExamsPage from './pages/admin/ExamsPage';
import ExamFormPage from './pages/admin/ExamFormPage';
import ExamDetailPage from './pages/admin/ExamDetailPage';
import ResultsPage from './pages/admin/ResultsPage';
import ReportsPage from './pages/admin/ReportsPage';

// Student pages
import StudentDashboard from './pages/student/DashboardPage';
import StudentExamsPage from './pages/student/ExamsPage';
import ExamPage from './pages/student/ExamPage';
import StudentResultsPage from './pages/student/ResultsPage';
import ProfilePage from './pages/student/ProfilePage';

function AppRoutes() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={role === 'admin' ? '/admin' : '/student'} replace /> : <LoginPage />
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="exams/new" element={<ExamFormPage />} />
        <Route path="exams/:id" element={<ExamDetailPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={
        <ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="exams" element={<StudentExamsPage />} />
        <Route path="results" element={<StudentResultsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Student exam-taking (full screen, no layout) */}
      <Route path="/student/exams/:id/take" element={
        <ProtectedRoute requiredRole="student"><ExamPage /></ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1f35',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
