import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'
import { AuthProvider, useAuth } from './context/AuthContext'

// Lazy load components for code splitting
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })))
const Dashboard = lazy(() => import('./components/Dashboard'))
const StudentManager = lazy(() => import('./components/StudentManager'))
const ClassManager = lazy(() => import('./components/ClassManager'))
const PaymentManager = lazy(() => import('./components/PaymentManager'))
const CalendarView = lazy(() => import('./components/CalendarView'))
const AttendanceManager = lazy(() => import('./components/AttendanceManager'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white font-medium">Loading...</p>
    </div>
  </div>
)

// Main app content for authenticated users
function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main className="pb-16 sm:pb-20 md:pb-8 px-1 sm:px-2 md:px-0">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentManager />} />
            <Route path="/classes" element={<ClassManager />} />
            <Route path="/payments" element={<PaymentManager />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/attendance/:classId" element={<AttendanceManager />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
      <MobileNav />
    </div>
  );
}

// Main app wrapper with authentication logic
function AppWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} />
        
        {/* Landing page for non-authenticated users */}
        <Route 
          path="/" 
          element={
            !isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />
          } 
        />
        
        {/* Protected routes for authenticated users */}
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
  )
}

export default App
