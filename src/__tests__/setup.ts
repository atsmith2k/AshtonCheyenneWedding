import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from '../mocks/server'
import React from 'react'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
  notFound: vi.fn()
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { src, alt, ...props })
  }
}))

// Mock environment variables
vi.mock('@/lib/env-validation', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: 'test-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    ADMIN_EMAIL: 'admin@test.com',
    ADMIN_PASSWORD_HASH: 'test-hash',
    ENCRYPTION_KEY: 'test-encryption-key-32-characters',
    RESEND_API_KEY: 'test-resend-key',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
  }
}))

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis()
    }))
  },
  supabaseAdmin: {
    auth: {
      admin: {
        getUserById: vi.fn(),
        createUser: vi.fn(),
        updateUserById: vi.fn()
      }
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis()
    }))
  }
}))

// Mock Supabase server client
vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        getUserById: vi.fn(),
        createUser: vi.fn(),
        updateUserById: vi.fn()
      }
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis()
    }))
  }
}))

// Mock crypto utilities
vi.mock('@/lib/crypto', () => ({
  encryptGuestData: vi.fn((data) => `encrypted_${JSON.stringify(data)}`),
  decryptGuestData: vi.fn((data) => JSON.parse(data.replace('encrypted_', ''))),
  hashPassword: vi.fn((password) => `hashed_${password}`),
  verifyPassword: vi.fn((password, hash) => hash === `hashed_${password}`),
  sanitizeText: vi.fn((text) => text?.trim() || ''),
  sanitizeEmail: vi.fn((email) => email?.trim().toLowerCase() || ''),
  sanitizePhone: vi.fn((phone) => phone?.trim() || ''),
  sanitizeDietaryRestrictions: vi.fn((restrictions) => restrictions?.trim() || '')
}))

// Mock email service
vi.mock('@/lib/email-service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, id: 'test-email-id' }),
  sendTestEmail: vi.fn().mockResolvedValue({ success: true, trackingId: 'test-tracking-id' }),
  sendInvitationEmail: vi.fn().mockResolvedValue({ success: true, id: 'test-invitation-id' })
}))

// Setup MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  // Clean up DOM after each test
  cleanup()
  
  // Reset MSW handlers
  server.resetHandlers()
  
  // Clear all mocks
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
})

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))
