/**
 * Email validation utilities for the wedding website
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Common disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'throwaway.email',
  'temp-mail.org',
  'yopmail.com',
  'maildrop.cc',
  'sharklasers.com',
  'guerrillamailblock.com'
]

// Common typos in popular email domains
const DOMAIN_SUGGESTIONS: Record<string, string> = {
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlook.co': 'outlook.com',
  'outlok.com': 'outlook.com'
}

export interface EmailValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
  warnings?: string[]
}

/**
 * Validate email address format
 */
export function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  return EMAIL_REGEX.test(email.trim().toLowerCase())
}

/**
 * Check if email domain is disposable
 */
export function isDisposableEmail(email: string): boolean {
  if (!email) return false
  
  const domain = email.split('@')[1]?.toLowerCase()
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain)
}

/**
 * Get domain suggestion for common typos
 */
export function getDomainSuggestion(email: string): string | null {
  if (!email) return null

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null

  return DOMAIN_SUGGESTIONS[domain] || null
}

/**
 * Comprehensive email validation
 */
export function validateEmail(email: string): EmailValidationResult {
  const trimmedEmail = email?.trim().toLowerCase()
  
  if (!trimmedEmail) {
    return {
      isValid: false,
      error: 'Email address is required'
    }
  }

  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      error: 'Email address is too long (maximum 254 characters)'
    }
  }

  if (!validateEmailFormat(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    }
  }

  const warnings: string[] = []
  let suggestion: string | undefined

  // Check for disposable email
  if (isDisposableEmail(trimmedEmail)) {
    warnings.push('This appears to be a temporary email address')
  }

  // Check for domain typos
  const domainSuggestion = getDomainSuggestion(trimmedEmail)
  if (domainSuggestion) {
    const [localPart] = trimmedEmail.split('@')
    suggestion = `${localPart}@${domainSuggestion}`
  }

  // Check for common issues
  const [localPart, domain] = trimmedEmail.split('@')
  
  if (localPart.length > 64) {
    return {
      isValid: false,
      error: 'Email local part is too long (maximum 64 characters)'
    }
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'Email address cannot start or end with a period'
    }
  }

  if (localPart.includes('..')) {
    return {
      isValid: false,
      error: 'Email address cannot contain consecutive periods'
    }
  }

  if (!domain || domain.length === 0) {
    return {
      isValid: false,
      error: 'Email address must include a domain'
    }
  }

  if (domain.length > 253) {
    return {
      isValid: false,
      error: 'Email domain is too long'
    }
  }

  // Check for valid TLD
  const tldParts = domain.split('.')
  if (tldParts.length < 2 || tldParts[tldParts.length - 1].length < 2) {
    return {
      isValid: false,
      error: 'Email domain must have a valid top-level domain'
    }
  }

  return {
    isValid: true,
    suggestion,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validate multiple email addresses
 */
export function validateEmailList(emails: string[]): {
  valid: string[]
  invalid: Array<{ email: string; error: string }>
  suggestions: Array<{ original: string; suggested: string }>
} {
  const valid: string[] = []
  const invalid: Array<{ email: string; error: string }> = []
  const suggestions: Array<{ original: string; suggested: string }> = []

  emails.forEach(email => {
    const result = validateEmail(email)
    
    if (result.isValid) {
      valid.push(email.trim().toLowerCase())
    } else {
      invalid.push({
        email,
        error: result.error || 'Invalid email'
      })
    }

    if (result.suggestion) {
      suggestions.push({
        original: email,
        suggested: result.suggestion
      })
    }
  })

  return { valid, invalid, suggestions }
}

/**
 * Normalize email address for storage
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Check if email is likely a personal email (vs business)
 */
export function isPersonalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  const personalDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'live.com',
    'msn.com',
    'comcast.net',
    'verizon.net'
  ]
  
  return personalDomains.includes(domain)
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string | null {
  const parts = email.split('@')
  return parts.length === 2 ? parts[1].toLowerCase() : null
}

/**
 * Check if two emails are the same (normalized comparison)
 */
export function emailsMatch(email1: string, email2: string): boolean {
  return normalizeEmail(email1) === normalizeEmail(email2)
}
