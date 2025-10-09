import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Martial Arts Manager</h1>
        </header>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<div className="text-center">Welcome to Martial Arts Manager</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
