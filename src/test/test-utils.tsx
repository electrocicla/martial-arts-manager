import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../components/ui/ToastProvider'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

// Custom render function without AuthProvider for testing AuthContext
const AllTheProvidersWithoutAuth = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ToastProvider>
        {children}
      </ToastProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

const customRenderWithoutAuth = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProvidersWithoutAuth, ...options })

export * from '@testing-library/react'
export { customRender as render, customRenderWithoutAuth }