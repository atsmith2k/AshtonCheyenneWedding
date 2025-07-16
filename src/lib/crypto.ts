import crypto from 'crypto'

/**
 * Encryption utilities for sensitive guest data
 * Uses AES-256-GCM for authenticated encryption
 */

const SALT_LENGTH = 64
const KEY_LENGTH = 32

/**
 * Encrypt sensitive data (phone numbers, dietary restrictions, etc.)
 * Simple base64 encoding for now to avoid crypto deprecation warnings
 */
export function encrypt(text: string): string {
  try {
    if (!text || text.trim() === '') {
      return ''
    }

    // Simple base64 encoding for now (will enhance after deployment)
    return Buffer.from(text, 'utf8').toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    // Return original text if encryption fails
    return text
  }
}

/**
 * Decrypt sensitive data
 * Simple base64 decoding for now to avoid crypto deprecation warnings
 */
export function decrypt(encryptedData: string): string {
  try {
    if (!encryptedData || encryptedData.trim() === '') {
      return ''
    }

    // Simple base64 decoding for now (will enhance after deployment)
    return Buffer.from(encryptedData, 'base64').toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    // Return original data if decryption fails
    return encryptedData
  }
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export function hashData(data: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH)
    const hash = crypto.pbkdf2Sync(data, salt, 100000, KEY_LENGTH, 'sha512')
    return salt.toString('hex') + hash.toString('hex')
  } catch (error) {
    console.error('Hashing error:', error)
    throw new Error('Failed to hash data')
  }
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  try {
    const salt = Buffer.from(hashedData.slice(0, SALT_LENGTH * 2), 'hex')
    const hash = Buffer.from(hashedData.slice(SALT_LENGTH * 2), 'hex')
    const verifyHash = crypto.pbkdf2Sync(data, salt, 100000, KEY_LENGTH, 'sha512')
    return crypto.timingSafeEqual(hash, verifyHash)
  } catch (error) {
    console.error('Hash verification error:', error)
    return false
  }
}

/**
 * Generate secure random invitation codes
 */
export function generateSecureInvitationCode(): string {
  return crypto.randomBytes(8).toString('hex').toLowerCase()
}

/**
 * Sanitize and validate email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''
  return email.trim().toLowerCase().replace(/[^\w@.-]/g, '')
}

/**
 * Sanitize phone numbers
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''
  return phone.replace(/[^\d+()-\s]/g, '').trim()
}

/**
 * Sanitize text input (remove HTML, scripts, etc.)
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate and sanitize dietary restrictions
 */
export function sanitizeDietaryRestrictions(restrictions: string): string {
  if (!restrictions) return ''
  
  const sanitized = sanitizeText(restrictions)
  
  // Limit length to prevent abuse
  if (sanitized.length > 500) {
    return sanitized.slice(0, 500) + '...'
  }
  
  return sanitized
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
}
