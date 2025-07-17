import { describe, it, expect } from 'vitest'
import {
  validateEmailFormat,
  isDisposableEmail,
  getDomainSuggestion,
  validateEmail,
  validateEmailList,
  normalizeEmail,
  isPersonalEmail,
  getEmailDomain
} from '../email-validation'

describe('Email Validation', () => {
  describe('validateEmailFormat', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.com',
        'email@123.123.123.123', // IP address (technically valid)
        'user_name@example-domain.com'
      ]

      validEmails.forEach(email => {
        expect(validateEmailFormat(email)).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing.domain@.com',
        'two@@domain.com',
        'domain@.com',
        '',
        null,
        undefined
      ]

      invalidEmails.forEach(email => {
        expect(validateEmailFormat(email as any)).toBe(false)
      })
    })

    it('should handle case insensitivity', () => {
      expect(validateEmailFormat('TEST@EXAMPLE.COM')).toBe(true)
      expect(validateEmailFormat('Test@Example.Com')).toBe(true)
    })

    it('should handle whitespace', () => {
      expect(validateEmailFormat('  test@example.com  ')).toBe(true)
    })
  })

  describe('isDisposableEmail', () => {
    it('should identify disposable email domains', () => {
      const disposableEmails = [
        'test@10minutemail.com',
        'user@guerrillamail.com',
        'temp@mailinator.com',
        'throwaway@tempmail.org'
      ]

      disposableEmails.forEach(email => {
        expect(isDisposableEmail(email)).toBe(true)
      })
    })

    it('should not flag legitimate email domains', () => {
      const legitimateEmails = [
        'test@gmail.com',
        'user@yahoo.com',
        'person@company.com',
        'email@university.edu'
      ]

      legitimateEmails.forEach(email => {
        expect(isDisposableEmail(email)).toBe(false)
      })
    })

    it('should handle case insensitivity', () => {
      expect(isDisposableEmail('TEST@MAILINATOR.COM')).toBe(true)
    })

    it('should handle invalid emails gracefully', () => {
      expect(isDisposableEmail('')).toBe(false)
      expect(isDisposableEmail('invalid')).toBe(false)
    })
  })

  describe('getDomainSuggestion', () => {
    it('should suggest corrections for common typos', () => {
      const typos = [
        { input: 'test@gmail.co', expected: 'gmail.com' },
        { input: 'user@yahoo.co', expected: 'yahoo.com' },
        { input: 'person@hotmai.com', expected: 'hotmail.com' },
        { input: 'email@outlok.com', expected: 'outlook.com' }
      ]

      typos.forEach(({ input, expected }) => {
        expect(getDomainSuggestion(input)).toBe(expected)
      })
    })

    it('should return null for correct domains', () => {
      const correctEmails = [
        'test@gmail.com',
        'user@yahoo.com',
        'person@company.com'
      ]

      correctEmails.forEach(email => {
        expect(getDomainSuggestion(email)).toBe(null)
      })
    })

    it('should handle invalid emails gracefully', () => {
      expect(getDomainSuggestion('')).toBe(null)
      expect(getDomainSuggestion('invalid')).toBe(null)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      const result = validateEmail('test@example.com')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty emails', () => {
      const result = validateEmail('')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email address is required')
    })

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      const result = validateEmail(longEmail)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email address is too long (maximum 254 characters)')
    })

    it('should reject invalid email formats', () => {
      const result = validateEmail('invalid-email')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email address must include a domain')
    })

    it('should provide warnings for disposable emails', () => {
      const result = validateEmail('test@mailinator.com')
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('This appears to be a temporary email address')
    })

    it('should provide suggestions for typos', () => {
      const result = validateEmail('test@gmail.co')
      
      expect(result.isValid).toBe(true)
      expect(result.suggestion).toBe('test@gmail.com')
    })

    it('should reject emails with local part too long', () => {
      const longLocalPart = 'a'.repeat(65) + '@example.com'
      const result = validateEmail(longLocalPart)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email local part is too long (maximum 64 characters)')
    })

    it('should reject emails starting or ending with period', () => {
      const invalidEmails = ['.test@example.com', 'test.@example.com']
      
      invalidEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Email address cannot start or end with a period')
      })
    })

    it('should reject emails with consecutive periods', () => {
      const result = validateEmail('test..user@example.com')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email address cannot contain consecutive periods')
    })

    it('should reject emails without domain', () => {
      const result = validateEmail('test@')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Email address must include a domain')
    })

    it('should reject emails with invalid TLD', () => {
      const invalidTLDs = ['test@domain', 'test@domain.a']
      
      invalidTLDs.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Email domain must have a valid top-level domain')
      })
    })
  })

  describe('validateEmailList', () => {
    it('should validate a list of emails', () => {
      const emails = [
        'valid1@example.com',
        'valid2@test.org',
        'invalid-email',
        'valid3@gmail.co' // Has suggestion
      ]

      const result = validateEmailList(emails)

      expect(result.valid).toHaveLength(3)
      expect(result.invalid).toHaveLength(1)
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].suggested).toBe('valid3@gmail.com')
    })

    it('should handle empty list', () => {
      const result = validateEmailList([])
      
      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(0)
      expect(result.suggestions).toHaveLength(0)
    })
  })

  describe('normalizeEmail', () => {
    it('should normalize email addresses', () => {
      expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
      expect(normalizeEmail('User@Domain.Org')).toBe('user@domain.org')
    })
  })

  describe('isPersonalEmail', () => {
    it('should identify personal email domains', () => {
      const personalEmails = [
        'test@gmail.com',
        'user@yahoo.com',
        'person@hotmail.com',
        'email@outlook.com',
        'user@icloud.com'
      ]

      personalEmails.forEach(email => {
        expect(isPersonalEmail(email)).toBe(true)
      })
    })

    it('should not flag business email domains', () => {
      const businessEmails = [
        'test@company.com',
        'user@university.edu',
        'person@government.gov',
        'email@startup.io'
      ]

      businessEmails.forEach(email => {
        expect(isPersonalEmail(email)).toBe(false)
      })
    })
  })

  describe('getEmailDomain', () => {
    it('should extract domain from email', () => {
      expect(getEmailDomain('test@example.com')).toBe('example.com')
      expect(getEmailDomain('user@DOMAIN.ORG')).toBe('domain.org')
    })

    it('should return null for invalid emails', () => {
      expect(getEmailDomain('invalid')).toBe(null)
      expect(getEmailDomain('')).toBe(null)
      expect(getEmailDomain('test@')).toBe(null)
    })
  })
})
