/**
 * Test suite for access request validation schemas
 * Tests the validation logic for the guest access request system
 */

import { accessRequestSchema, accessRequestUpdateSchema, bulkAccessRequestSchema } from '@/lib/validation'

describe('Access Request Validation', () => {
  describe('accessRequestSchema', () => {
    const validRequestData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Anytown, ST 12345',
      message: 'Looking forward to celebrating with you!',
      timestamp: Date.now(),
      honeypot: ''
    }

    it('should validate a complete valid request', () => {
      const result = accessRequestSchema.safeParse(validRequestData)
      expect(result.success).toBe(true)
    })

    it('should validate a minimal valid request without optional fields', () => {
      const minimalData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '5551234567',
        address: '456 Oak Ave, Another City, ST 67890',
        timestamp: Date.now(),
        honeypot: ''
      }
      const result = accessRequestSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    describe('name validation', () => {
      it('should reject names that are too short', () => {
        const data = { ...validRequestData, name: 'A' }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('at least 2 characters')
        }
      })

      it('should reject names that are too long', () => {
        const data = { ...validRequestData, name: 'A'.repeat(101) }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should require name field', () => {
        const data = { ...validRequestData }
        delete (data as any).name
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('email validation', () => {
      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user..name@example.com',
          'user@.com'
        ]

        invalidEmails.forEach(email => {
          const data = { ...validRequestData, email }
          const result = accessRequestSchema.safeParse(data)
          expect(result.success).toBe(false)
        })
      })

      it('should accept valid email formats', () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user123@test-domain.org'
        ]

        validEmails.forEach(email => {
          const data = { ...validRequestData, email }
          const result = accessRequestSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('phone validation', () => {
      it('should reject phone numbers that are too short', () => {
        const data = { ...validRequestData, phone: '123456789' }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept various phone number formats', () => {
        const validPhones = [
          '(555) 123-4567',
          '555-123-4567',
          '5551234567',
          '+1 555 123 4567',
          '555.123.4567'
        ]

        validPhones.forEach(phone => {
          const data = { ...validRequestData, phone }
          const result = accessRequestSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it('should reject phone numbers with invalid characters', () => {
        const data = { ...validRequestData, phone: '555-123-abcd' }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('address validation', () => {
      it('should reject addresses that are too short', () => {
        const data = { ...validRequestData, address: 'Short' }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject addresses that are too long', () => {
        const data = { ...validRequestData, address: 'A'.repeat(501) }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('security validation', () => {
      it('should reject requests with honeypot field filled', () => {
        const data = { ...validRequestData, honeypot: 'bot-content' }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject requests with expired timestamps', () => {
        const oneHourAgo = Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
        const data = { ...validRequestData, timestamp: oneHourAgo }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should accept requests with recent timestamps', () => {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
        const data = { ...validRequestData, timestamp: fiveMinutesAgo }
        const result = accessRequestSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('accessRequestUpdateSchema', () => {
    it('should validate admin approval with notes', () => {
      const updateData = {
        status: 'approved' as const,
        admin_notes: 'Approved - family friend',
        send_invitation: true
      }
      const result = accessRequestUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate admin denial', () => {
      const updateData = {
        status: 'denied' as const,
        admin_notes: 'Not on guest list'
      }
      const result = accessRequestUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status values', () => {
      const updateData = {
        status: 'invalid-status' as any,
        admin_notes: 'Test'
      }
      const result = accessRequestUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(false)
    })
  })

  describe('bulkAccessRequestSchema', () => {
    it('should validate bulk approval action', () => {
      const bulkData = {
        request_ids: ['123e4567-e89b-12d3-a456-426614174000'],
        action: 'approve' as const,
        admin_notes: 'Bulk approval',
        send_invitations: true
      }
      const result = bulkAccessRequestSchema.safeParse(bulkData)
      expect(result.success).toBe(true)
    })

    it('should require at least one request ID', () => {
      const bulkData = {
        request_ids: [],
        action: 'approve' as const
      }
      const result = bulkAccessRequestSchema.safeParse(bulkData)
      expect(result.success).toBe(false)
    })

    it('should validate UUID format for request IDs', () => {
      const bulkData = {
        request_ids: ['invalid-uuid'],
        action: 'approve' as const
      }
      const result = bulkAccessRequestSchema.safeParse(bulkData)
      expect(result.success).toBe(false)
    })
  })
})
