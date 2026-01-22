import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomSlidingMenu from './components/layout/BottomSlidingMenu';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';

// Lazy load components
const LandingPage = lazy(() => import('./components/LandingPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const StudentManager = lazy(() => import('./components/StudentManager'));
const ClassManager = lazy(() => import('./components/ClassManager'));
const PaymentManager = lazy(() => import('./components/PaymentManager'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const AttendanceManager = lazy(() => import('./components/AttendanceManager'));
const Attendance = lazy(() => import('./pages/Attendance'));
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const BeltTesting = lazy(() => import('./pages/BeltTesting'));
const Analytics = lazy(() => import('./pages/Analytics'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Loading component with DaisyUI
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="text-base-content font-medium animate-pulse">Loading Hamarr...</p>
    </div>
  </div>
);

// Main app content for authenticated users
function AppContent() {
  useEffect(() => {
    // Set dark theme by default
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <Header />
      <main className="md:ml-64 min-h-screen main-content">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentManager />} />
            <Route path="/classes" element={<ClassManager />} />
            <Route path="/payments" element={<PaymentManager />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/attendance/:classId" element={<AttendanceManager />} />
            <Route path="/my-attendance" element={<StudentAttendance />} />
            <Route path="/belt-testing" element={<BeltTesting />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
      <BottomSlidingMenu />
    </div>
  );
}

// Main app wrapper with authentication
function AppWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Set dark theme globally by default
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Landing page */}
        <Route 
          path="/" 
          element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppWrapper />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
