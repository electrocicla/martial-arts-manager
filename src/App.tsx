import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load components
const LandingPage = lazy(() => import('./components/LandingPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const StudentManager = lazy(() => import('./components/StudentManager'));
const ClassManager = lazy(() => import('./components/ClassManager'));
const PaymentManager = lazy(() => import('./components/PaymentManager'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const AttendanceManager = lazy(() => import('./components/AttendanceManager'));
const BeltTesting = lazy(() => import('./pages/BeltTesting'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Loading component with DaisyUI
const LoadingSpinner = () => (
  <div className="min-h-screen bg-base-100 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="text-base-content font-medium animate-pulse">Loading Dojo Manager...</p>
    </div>
  </div>
);

// Main app content for authenticated users
function AppContent() {
  useEffect(() => {
    // Set dark theme
    document.documentElement.setAttribute('data-theme', 'martial');
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
      <Header />
      <main className="md:ml-64 min-h-screen">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentManager />} />
            <Route path="/classes" element={<ClassManager />} />
            <Route path="/payments" element={<PaymentManager />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/attendance/:classId" element={<AttendanceManager />} />
            <Route path="/belt-testing" element={<BeltTesting />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
      <MobileNav />
    </div>
  );
}

// Main app wrapper with authentication
function AppWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Set dark theme globally
    document.documentElement.setAttribute('data-theme', 'martial');
    document.documentElement.classList.add('dark');
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
      <Router>
        <AppWrapper />
      </Router>
    </AuthProvider>
  );
}

export default App;
