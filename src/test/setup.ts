import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'

// Mock server setup
export const server = setupServer()

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset any request handlers that are declared in a test
afterEach(() => server.resetHandlers())

// Clean up after all tests are done
afterAll(() => server.close())