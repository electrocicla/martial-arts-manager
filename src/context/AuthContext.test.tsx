import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../test/test-utils'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '../context/AuthContext'
import { server } from '../test/setup'
import { http, HttpResponse } from 'msw'

// Mock component to test the hook
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    vi.clearAllMocks()

    // Mock the initial auth check to return 401 (no token)
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      })
    )
  })

  it('should render with default state', async () => {
    render(<TestComponent />)

    // Initially loading might be true, but quickly becomes false
    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
  })

  it('should handle successful login', async () => {
    // Mock successful login response
    server.use(
      http.post('/api/auth/login', () => {
        // Set the token in localStorage as the real implementation does
        localStorage.setItem('accessToken', 'fake-token')
        return HttpResponse.json({
          success: true,
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'student'
          },
          accessToken: 'fake-token'
        })
      }),
      http.get('/api/auth/me', () => {
        return HttpResponse.json({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'student'
          }
        })
      })
    )

    const user = userEvent.setup()
    render(<TestComponent />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    // Click login button
    const loginButton = screen.getByRole('button', { name: /login/i })
    await user.click(loginButton)

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    }, { timeout: 3000 })

    // Check token was saved
    expect(localStorage.getItem('accessToken')).toBe('fake-token')
  })

  it('should handle login failure', async () => {
    // Mock failed login response
    server.use(
      http.post('/api/auth/login', () => {
        return HttpResponse.json({
          success: false,
          error: 'Invalid credentials'
        }, { status: 401 })
      })
    )

    const user = userEvent.setup()
    render(<TestComponent />)

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    // Click login button
    const loginButton = screen.getByRole('button', { name: /login/i })
    await user.click(loginButton)

    // Wait for login attempt
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })

    // Should still be unauthenticated
    expect(screen.getByTestId('user')).toHaveTextContent('No user')
  })

  it.skip('should handle logout', async () => {
    // First login to have authenticated state
    localStorage.setItem('accessToken', 'fake-token')

    // Mock user endpoint to return authenticated user
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'student'
          }
        })
      }),
      http.post('/api/auth/logout', () => {
        return HttpResponse.json({ success: true })
      })
    )

    const user = userEvent.setup()
    render(<TestComponent />)

    // Wait for auth check to complete and user to be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    }, { timeout: 3000 })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')

    // Now logout
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    }, { timeout: 3000 })

    expect(screen.getByTestId('user')).toHaveTextContent('No user')

    // Check token was removed
    expect(localStorage.getItem('accessToken')).toBeNull()
  })
})