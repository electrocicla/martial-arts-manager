import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock server setup with default handlers
export const server = setupServer(
  // Default handler for refresh endpoint to avoid unhandled request errors
  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
  })
)

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset any request handlers that are declared in a test
afterEach(() => server.resetHandlers())

// Clean up after all tests are done
afterAll(() => server.close())