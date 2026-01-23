import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, state, replace }: { to: string; state?: unknown; replace?: boolean }) => {
      mockNavigate(to, state, replace)
      return <div data-testid="navigate" data-to={to} />
    },
    useLocation: () => ({ pathname: '/dashboard' }),
  }
})

// Mock Skeleton component
vi.mock('./ui/Skeleton', () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Custom render without AuthProvider
const customRender = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockUseAuth.mockClear()
  })

  it('should show loading skeleton when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      refreshAuth: vi.fn(),
      error: null,
    })

    customRender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6) // 1 header + 4 grid items + 1 main content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      refreshAuth: vi.fn(),
      error: null,
    })

    customRender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/login', { from: { pathname: '/dashboard' } }, true)
  })

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'student' },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      refreshAuth: vi.fn(),
      error: null,
    })

    customRender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should deny access when role requirement not met', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'student' },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      refreshAuth: vi.fn(),
      error: null,
    })

    customRender(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument()
    expect(screen.getByText('Required role: admin')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should allow access when user has required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      refreshAuth: vi.fn(),
      error: null,
    })

    customRender(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should allow admin access to any role requirement', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      refreshAuth: vi.fn(),
      error: null,
    })

    customRender(
      <ProtectedRoute requiredRole="instructor">
        <div>Instructor Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Instructor Content')).toBeInTheDocument()
  })
})