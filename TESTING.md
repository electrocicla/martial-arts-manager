# Testing Setup

This project uses Vitest for unit and integration testing with React Testing Library.

## Test Structure

- `src/test/setup.ts` - Global test setup with MSW server and jest-dom
- `src/test/test-utils.tsx` - Custom render utilities with providers
- `src/**/*.test.ts(x)` - Test files colocated with source files

## Running Tests

```bash
# Run all tests once
pnpm test:run

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Categories

### Unit Tests
- **Hooks**: Custom React hooks (useLocalStorage, useAuth, etc.)
- **Services**: API service classes (StudentService, etc.)
- **Utilities**: Helper functions and utilities

### Integration Tests
- **Components**: React components with full rendering
- **Context**: Authentication and app state management
- **Routing**: Protected routes and navigation

## Testing Patterns

### API Mocking
Uses MSW (Mock Service Worker) for API request mocking:
```typescript
server.use(
  http.get('/api/students', () => {
    return HttpResponse.json(mockStudents)
  })
)
```

### Component Testing
Uses custom render with providers:
```typescript
import { render } from '../test/test-utils'

render(<MyComponent />)
```

### Hook Testing
Uses `renderHook` from React Testing Library:
```typescript
import { renderHook } from '@testing-library/react'

const { result } = renderHook(() => useMyHook())
```

## Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >85%
- **Lines**: >80%

## Best Practices

1. **Colocate tests** with source files
2. **Mock external dependencies** (APIs, localStorage, etc.)
3. **Test user interactions** with userEvent
4. **Test error states** and edge cases
5. **Use descriptive test names** and assertions
6. **Keep tests fast** and isolated