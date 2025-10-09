import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import StudentManager from './components/StudentManager'
import ClassManager from './components/ClassManager'
import PaymentManager from './components/PaymentManager'
import CalendarView from './components/CalendarView'
import AttendanceManager from './components/AttendanceManager'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold text-center">Martial Arts Manager</h1>
        </header>
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<div className="p-4 text-center max-w-md mx-auto">Welcome to Martial Arts Manager<br/>Manage your students, classes, payments, and more.</div>} />
            <Route path="/students" element={<StudentManager />} />
            <Route path="/classes" element={<ClassManager />} />
            <Route path="/payments" element={<PaymentManager />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/attendance/:classId" element={<AttendanceManager />} />
          </Routes>
        </main>
        <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-2 md:hidden">
          <Link to="/students" className="text-center text-blue-600 flex-1 py-2">Students</Link>
          <Link to="/classes" className="text-center text-blue-600 flex-1 py-2">Classes</Link>
          <Link to="/payments" className="text-center text-blue-600 flex-1 py-2">Payments</Link>
          <Link to="/calendar" className="text-center text-blue-600 flex-1 py-2">Calendar</Link>
        </nav>
      </div>
    </Router>
  )
}

export default App
