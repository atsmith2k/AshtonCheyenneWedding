# Testing Strategy - Wedding Website

This document outlines the comprehensive testing strategy for the wedding website application, designed to support Test-Driven Development (TDD) workflows.

## 🧪 Testing Stack

### Core Testing Tools
- **Vitest** - Fast unit/integration test runner (replaces Jest)
- **React Testing Library** - Component testing with user-centric approach
- **Playwright** - End-to-end testing across browsers
- **MSW (Mock Service Worker)** - API mocking for reliable tests
- **Testing Library Jest DOM** - Additional DOM matchers

### Why This Stack?
- **Vitest**: 5-10x faster than Jest, better TypeScript support, Vite-native
- **React Testing Library**: Encourages testing user behavior over implementation
- **Playwright**: Modern E2E testing with excellent debugging tools
- **MSW**: Intercepts network requests at the service worker level

## 📁 Test Organization

```
src/
├── __tests__/
│   └── setup.ts                    # Global test setup
├── mocks/
│   ├── handlers.ts                 # MSW API handlers
│   ├── server.ts                   # MSW server (Node.js)
│   └── browser.ts                  # MSW browser setup
├── lib/
│   └── __tests__/
│       ├── validation.test.ts      # Unit tests
│       └── email-validation.test.ts
├── components/
│   └── ui/
│       └── __tests__/
│           └── button.test.tsx     # Component tests
├── app/
│   └── api/
│       └── __tests__/
│           └── *.integration.test.ts # API integration tests
└── hooks/
    └── __tests__/
        └── *.test.ts               # Hook tests

tests/                              # Playwright E2E tests
├── auth.test.ts
├── global-setup.ts
└── global-teardown.ts
```

## 🎯 Testing Pyramid

### Unit Tests (70%)
Test individual functions, utilities, and hooks in isolation.

**Examples:**
- Validation schemas and functions
- Email validation utilities
- Crypto functions
- Custom hooks
- Utility functions

**Run with:**
```bash
npm run test:unit
```

### Integration Tests (20%)
Test component interactions and API endpoints.

**Examples:**
- API route handlers
- Component integration with providers
- Database operations
- Form submissions

**Run with:**
```bash
npm run test:integration
```

### E2E Tests (10%)
Test complete user workflows across the application.

**Examples:**
- Guest RSVP flow
- Admin authentication
- Photo upload and moderation
- Email sending workflows

**Run with:**
```bash
npm run test:e2e
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All Tests
```bash
npm run test:all
```

### 3. Development Workflow
```bash
# Watch mode for TDD
npm run test:watch

# Coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

## 📝 Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest'
import { validateEmail } from '../email-validation'

describe('validateEmail', () => {
  it('should validate correct email formats', () => {
    const result = validateEmail('test@example.com')
    expect(result.isValid).toBe(true)
  })
})
```

### Component Test Example
```typescript
import { render, screen } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Integration Test Example
```typescript
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../api/wedding-info/route'

describe('Wedding Info API', () => {
  it('should return published wedding information', async () => {
    const request = new NextRequest('http://localhost:3000/api/wedding-info')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

## 🎭 Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

1. **Red**: Write a failing test
2. **Green**: Write minimal code to make it pass
3. **Refactor**: Improve code while keeping tests green

### TDD Example Workflow

```bash
# 1. Start with a failing test
npm run test:watch

# 2. Write the test first
# src/lib/__tests__/new-feature.test.ts

# 3. Watch it fail (Red)
# 4. Implement minimal code (Green)
# 5. Refactor and improve (Refactor)
```

## 🔧 Configuration

### Vitest Configuration
- **Environment**: jsdom for DOM testing
- **Setup**: Global test setup with mocks
- **Coverage**: 70% threshold for all metrics
- **Timeout**: 10 seconds for async operations

### Playwright Configuration
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Parallel**: Full parallelization
- **Retries**: 2 retries on CI
- **Screenshots**: On failure only
- **Video**: Retain on failure

## 🎯 Wedding-Specific Testing

### Critical Test Areas

1. **Authentication & Security**
   - Admin login/logout flows
   - Invitation code validation
   - CSRF protection
   - Rate limiting

2. **Guest Management**
   - RSVP submission and validation
   - Guest data encryption/decryption
   - Dietary restrictions handling

3. **Photo System**
   - File upload validation
   - Image processing
   - Moderation workflow

4. **Email System**
   - Template rendering
   - Email delivery
   - Invitation sending

5. **Mobile Experience**
   - Touch gestures
   - Responsive design
   - Mobile-specific features

### Test Data Management

- **Mock Data**: Use factory functions for consistent test data
- **Database**: Isolated test environment
- **Files**: Mock file uploads with proper validation
- **External APIs**: Mock all external services (Supabase, Resend)

## 📊 Coverage Goals

- **Overall**: 70% minimum
- **Critical paths**: 90% (auth, RSVP, payments)
- **UI components**: 80%
- **Utilities**: 95%

## 🐛 Debugging Tests

### Vitest Debugging
```bash
# Run specific test file
npm run test src/lib/__tests__/validation.test.ts

# Debug mode
npm run test:ui

# Coverage for specific file
npm run test:coverage -- src/lib/validation.ts
```

### Playwright Debugging
```bash
# Interactive mode
npm run test:e2e:ui

# Debug specific test
npx playwright test tests/auth.test.ts --debug

# Generate test code
npx playwright codegen localhost:3000
```

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:e2e
    npm run test:coverage
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit test runner
npx husky add .husky/pre-commit "npm run test:unit"
```

## 📚 Best Practices

### Do's
- ✅ Write tests before implementation (TDD)
- ✅ Test user behavior, not implementation details
- ✅ Use descriptive test names
- ✅ Keep tests isolated and independent
- ✅ Mock external dependencies
- ✅ Test error conditions and edge cases

### Don'ts
- ❌ Test implementation details
- ❌ Write tests that depend on other tests
- ❌ Mock everything (test real integrations when possible)
- ❌ Ignore flaky tests
- ❌ Skip accessibility testing

## 🔗 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🆘 Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in vitest.config.ts
2. **Mock not working**: Check mock setup in __tests__/setup.ts
3. **Playwright browser not found**: Run `npx playwright install`
4. **Coverage too low**: Add more unit tests for utilities

### Getting Help

- Check existing test examples in the codebase
- Review error messages carefully
- Use `console.log` for debugging (remove before commit)
- Ask team members for code review on test approaches
