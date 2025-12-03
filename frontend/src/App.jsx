import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import LessonsView from './pages/LessonsView';
import BudgetCalculator from './pages/BudgetCalculator';
import WealthTracker from './pages/WealthTracker';
import Quiz from './pages/Quiz';
import ClassManagement from './pages/ClassManagement';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Dashboard Router - directs to appropriate dashboard based on role
function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'Student') {
    return <StudentDashboard />;
  }

  if (user?.role === 'Teacher' || user?.role === 'Facilitator') {
    return <TeacherDashboard />;
  }

  return <div>Unknown user role</div>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lessons/:classId"
            element={
              <ProtectedRoute>
                <LessonsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <BudgetCalculator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wealth-tracker"
            element={
              <ProtectedRoute>
                <WealthTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:lessonId"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <ClassManagement />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
