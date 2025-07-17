import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock providers for testing
const MockToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="toast-provider">{children}</div>
}

const MockAdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="admin-auth-provider">{children}</div>
}

// All the providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockToastProvider>
      <MockAdminAuthProvider>
        {children}
      </MockAdminAuthProvider>
    </MockToastProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockGuest = (overrides = {}) => ({
  id: 'guest-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  invitation_code: 'ABC123',
  rsvp_status: 'pending',
  dietary_restrictions: null,
  plus_one_name: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockRSVP = (overrides = {}) => ({
  id: 'rsvp-123',
  guest_id: 'guest-123',
  attending: true,
  meal_preference: 'chicken',
  dietary_restrictions: 'None',
  plus_one_attending: false,
  plus_one_name: null,
  plus_one_meal: null,
  message: 'Looking forward to celebrating!',
  submitted_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockPhoto = (overrides = {}) => ({
  id: 'photo-123',
  guest_id: 'guest-123',
  filename: 'wedding-photo.jpg',
  file_path: '/photos/wedding-photo.jpg',
  file_size: 1024000,
  mime_type: 'image/jpeg',
  status: 'pending',
  uploaded_at: '2024-01-01T00:00:00Z',
  approved_at: null,
  ...overrides
})

export const createMockMessage = (overrides = {}) => ({
  id: 'message-123',
  guest_id: 'guest-123',
  subject: 'Test Message',
  message: 'This is a test message',
  is_urgent: false,
  status: 'new',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockEmailTemplate = (overrides = {}) => ({
  id: 'template-123',
  name: 'Test Template',
  type: 'invitation',
  subject: 'Test Subject',
  html_content: '<p>Test content</p>',
  text_content: 'Test content',
  variables: ['guest_name', 'invitation_code'],
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

// Mock API responses
export const mockApiResponse = (data: any, success = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : data,
  message: success ? 'Success' : 'Error'
})

// Mock form data
export const createMockFormData = (data: Record<string, any>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value)
    } else {
      formData.append(key, String(value))
    }
  })
  return formData
}

// Mock file for upload tests
export const createMockFile = (
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024
) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Test helpers for async operations
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
  }
}

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
  }
}

// Custom matchers for wedding-specific assertions
export const customMatchers = {
  toBeValidInvitationCode: (received: string) => {
    const isValid = /^[A-Z0-9]{6}$/.test(received)
    return {
      message: () => `expected ${received} to be a valid invitation code (6 uppercase alphanumeric characters)`,
      pass: isValid
    }
  },
  
  toBeValidEmail: (received: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(received)
    return {
      message: () => `expected ${received} to be a valid email address`,
      pass: isValid
    }
  }
}
