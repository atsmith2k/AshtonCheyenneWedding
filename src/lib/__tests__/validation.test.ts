import { describe, it, expect, vi } from 'vitest'
import {
  rsvpSchema,
  messageSchema,
  contactSchema,
  adminGuestSchema,
  photoUploadSchema,
  fileValidation,
  invitationCodeSchema,
  adminLoginSchema,
  validateRSVPDeadline,
  validateOrigin,
  validateTimestamp
} from '../validation'

describe('Validation Schemas', () => {
  describe('rsvpSchema', () => {
    it('should validate valid RSVP data', () => {
      const validData = {
        guestId: '123e4567-e89b-12d3-a456-426614174000',
        attending: 'attending' as const,
        mealPreference: 'chicken' as const,
        dietaryRestrictions: 'No nuts',
        plusOneName: 'John Doe',
        plusOneMeal: 'vegetarian' as const,
        specialNotes: 'Looking forward to it!'
      }

      const result = rsvpSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require meal preference when attending', () => {
      const invalidData = {
        guestId: '123e4567-e89b-12d3-a456-426614174000',
        attending: 'attending' as const
        // Missing mealPreference
      }

      const result = rsvpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require plus one meal when plus one name is provided', () => {
      const invalidData = {
        guestId: '123e4567-e89b-12d3-a456-426614174000',
        attending: 'attending' as const,
        mealPreference: 'chicken' as const,
        plusOneName: 'John Doe'
        // Missing plusOneMeal
      }

      const result = rsvpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow not attending without meal preference', () => {
      const validData = {
        guestId: '123e4567-e89b-12d3-a456-426614174000',
        attending: 'not_attending' as const
      }

      const result = rsvpSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid guest ID format', () => {
      const invalidData = {
        guestId: 'invalid-uuid',
        attending: 'attending' as const,
        mealPreference: 'chicken' as const
      }

      const result = rsvpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('messageSchema', () => {
    it('should validate valid message data', () => {
      const validData = {
        guestId: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'Test Subject',
        message: 'This is a test message with enough content',
        isUrgent: false
      }

      const result = messageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject messages that are too short', () => {
      const invalidData = {
        guestId: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'Test',
        message: 'Short' // Too short
      }

      const result = messageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should default isUrgent to false', () => {
      const data = {
        guestId: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'Test Subject',
        message: 'This is a test message with enough content'
      }

      const result = messageSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isUrgent).toBe(false)
      }
    })
  })

  describe('contactSchema', () => {
    it('should validate valid contact data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-123-4567',
        subject: 'Wedding Question',
        message: 'I have a question about the wedding venue and timing.'
      }

      const result = contactSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject submissions with honeypot filled', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test',
        message: 'This is a test message',
        honeypot: 'bot-filled-this' // Bot detection
      }

      const result = contactSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow empty honeypot field', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test',
        message: 'This is a test message',
        honeypot: '' // Empty is valid
      }

      const result = contactSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('invitationCodeSchema', () => {
    it('should validate valid invitation codes', () => {
      const validCodes = ['ABC123DEF', 'xyz789abc', 'InViTe123']
      
      validCodes.forEach(code => {
        const result = invitationCodeSchema.safeParse({ invitationCode: code })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.invitationCode).toBe(code.toLowerCase().trim())
        }
      })
    })

    it('should reject codes with special characters', () => {
      const invalidCodes = ['ABC-123', 'ABC@123', 'ABC 123', 'ABC.123']
      
      invalidCodes.forEach(code => {
        const result = invitationCodeSchema.safeParse({ invitationCode: code })
        expect(result.success).toBe(false)
      })
    })

    it('should reject codes that are too short or too long', () => {
      const shortCode = 'ABC123'
      const longCode = 'A'.repeat(33)
      
      expect(invitationCodeSchema.safeParse({ invitationCode: shortCode }).success).toBe(false)
      expect(invitationCodeSchema.safeParse({ invitationCode: longCode }).success).toBe(false)
    })
  })
})

describe('File Validation', () => {
  describe('validateFile', () => {
    it('should validate valid image files', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }) // 1MB
      
      const result = fileValidation.validateFile(validFile)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject files with invalid types', () => {
      const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      const result = fileValidation.validateFile(invalidFile)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.')
    })

    it('should reject files that are too large', () => {
      const largeFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }) // 15MB
      
      const result = fileValidation.validateFile(largeFile)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File too large. Maximum size is 10MB.')
    })

    it('should validate file size limits', () => {
      expect(fileValidation.maxSize).toBe(10 * 1024 * 1024) // 10MB
    })

    it('should validate allowed file types', () => {
      const expectedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
      ]
      expect(fileValidation.allowedTypes).toEqual(expectedTypes)
    })
  })
})

describe('Security Validation Functions', () => {
  describe('validateRSVPDeadline', () => {
    it('should return valid when no deadline is set', () => {
      vi.stubGlobal('process', { env: { RSVP_DEADLINE: '' } })

      const result = validateRSVPDeadline()
      expect(result.isValid).toBe(true)
    })

    it('should return valid when deadline is in the future', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      vi.stubGlobal('process', { env: { RSVP_DEADLINE: futureDate.toISOString() } })

      const result = validateRSVPDeadline()
      expect(result.isValid).toBe(true)
    })

    it('should return invalid when deadline has passed', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      vi.stubGlobal('process', { env: { RSVP_DEADLINE: pastDate.toISOString() } })

      const result = validateRSVPDeadline()
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('RSVP deadline has passed')
    })
  })

  describe('validateOrigin', () => {
    it('should validate allowed origins', () => {
      vi.stubGlobal('process', { env: { NEXT_PUBLIC_APP_URL: 'https://wedding.example.com' } })

      const validRequest = new Request('https://wedding.example.com/api/test', {
        headers: { origin: 'https://wedding.example.com' }
      })

      expect(validateOrigin(validRequest)).toBe(true)
    })

    it('should reject invalid origins', () => {
      vi.stubGlobal('process', { env: { NEXT_PUBLIC_APP_URL: 'https://wedding.example.com' } })

      const invalidRequest = new Request('https://wedding.example.com/api/test', {
        headers: { origin: 'https://malicious.com' }
      })

      expect(validateOrigin(invalidRequest)).toBe(false)
    })

    it('should reject requests without origin header', () => {
      const noOriginRequest = new Request('https://wedding.example.com/api/test')
      
      expect(validateOrigin(noOriginRequest)).toBe(false)
    })
  })

  describe('validateTimestamp', () => {
    it('should return true for undefined timestamp', () => {
      expect(validateTimestamp()).toBe(true)
    })

    it('should validate recent timestamps', () => {
      const recentTimestamp = Date.now() - 60 * 1000 // 1 minute ago
      expect(validateTimestamp(recentTimestamp)).toBe(true)
    })

    it('should reject old timestamps', () => {
      const oldTimestamp = Date.now() - 10 * 60 * 1000 // 10 minutes ago
      expect(validateTimestamp(oldTimestamp)).toBe(false)
    })

    it('should reject future timestamps', () => {
      const futureTimestamp = Date.now() + 10 * 60 * 1000 // 10 minutes in future
      expect(validateTimestamp(futureTimestamp)).toBe(false)
    })
  })
})
