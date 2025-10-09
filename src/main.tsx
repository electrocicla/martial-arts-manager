import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import { AppProvider } from './context/AppContext'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </AppProvider>
  </React.StrictMode>,
)
