import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <Header />
          <main className="pb-20 md:pb-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students"
                element={
                  <ProtectedRoute>
                    <StudentManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classes"
                element={
                  <ProtectedRoute>
                    <ClassManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <PaymentManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <CalendarView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/:classId"
                element={
                  <ProtectedRoute>
                    <AttendanceManager />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <MobileNav />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
