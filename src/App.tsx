import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import StudentManager from './components/StudentManager'
import ClassManager from './components/ClassManager'
import PaymentManager from './components/PaymentManager'
import CalendarView from './components/CalendarView'
import AttendanceManager from './components/AttendanceManager'
import Dashboard from './components/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'
import { LandingPage } from './components/LandingPage'
import { AuthProvider, useAuth } from './context/AuthContext'

// Main app content for authenticated users
function AppContent() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <main className="pb-20 md:pb-8">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<StudentManager />} />
          <Route path="/classes" element={<ClassManager />} />
          <Route path="/payments" element={<PaymentManager />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/attendance/:classId" element={<AttendanceManager />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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
