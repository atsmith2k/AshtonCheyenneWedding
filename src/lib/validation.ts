import { z } from 'zod'
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDietaryRestrictions } from './crypto'

/**
 * Comprehensive validation schemas for wedding website forms
 * Includes sanitization and security measures
 */

// Custom validation functions
const sanitizedString = (maxLength: number = 255) =>
  z.string()
    .transform((val: string): string => sanitizeText(val))
    .refine(val => val.length <= maxLength, `Must be ${maxLength} characters or less`)

const sanitizedEmail = () =>
  z.string()
    .email('Invalid email format')
    .transform((val: string): string => sanitizeEmail(val))
    .refine(val => val.length <= 254, 'Email too long')

const sanitizedPhone = () =>
  z.string()
    .optional()
    .transform((val: string | undefined): string => val ? sanitizePhone(val) : '')
    .refine(val => !val || /^[\d+()-\s]{7,20}$/.test(val), 'Invalid phone number format')

// RSVP Form Validation
export const rsvpSchema = z.object({
  guestId: z.string().uuid('Invalid guest ID'),
  attending: z.enum(['attending', 'not_attending'], {
    required_error: 'Please select attendance status'
  }),
  mealPreference: z.enum([
    'chicken', 'beef', 'fish', 'vegetarian', 'vegan', 'kids_meal'
  ]).optional(),
  dietaryRestrictions: z.string()
    .optional()
    .transform(val => val ? sanitizeDietaryRestrictions(val) : '')
    .refine(val => !val || val.length <= 500, 'Dietary restrictions too long'),
  childrenAttending: z.boolean().optional(),
  plusOneName: sanitizedString(100).optional(),
  plusOneMeal: z.enum([
    'chicken', 'beef', 'fish', 'vegetarian', 'vegan', 'kids_meal'
  ]).optional(),
  specialNotes: sanitizedString(1000).optional(),
  // Security fields
  timestamp: z.number().optional(),
  csrfToken: z.string().optional()
}).refine(data => {
  // If attending, meal preference is required
  if (data.attending === 'attending' && !data.mealPreference) {
    return false
  }
  // If plus one name provided, plus one meal is required
  if (data.plusOneName && data.attending === 'attending' && !data.plusOneMeal) {
    return false
  }
  return true
}, {
  message: 'Missing required fields for attendance'
})

// Guest Message Form Validation
export const messageSchema = z.object({
  guestId: z.string().uuid('Invalid guest ID'),
  subject: sanitizedString(200),
  message: sanitizedString(2000),
  isUrgent: z.boolean().optional().default(false),
  // Security fields
  timestamp: z.number().optional(),
  csrfToken: z.string().optional()
}).refine(data => {
  // Prevent spam by checking message length
  if (data.message.length < 10) {
    return false
  }
  return true
}, {
  message: 'Message too short'
})

// Contact Form Validation
export const contactSchema = z.object({
  name: sanitizedString(100),
  email: sanitizedEmail(),
  phone: sanitizedPhone(),
  subject: sanitizedString(200),
  message: sanitizedString(2000),
  // Security fields
  timestamp: z.number().optional(),
  csrfToken: z.string().optional(),
  honeypot: z.string().optional() // Bot detection
}).refine(data => {
  // Honeypot field should be empty (bot detection)
  if (data.honeypot && data.honeypot.length > 0) {
    return false
  }
  return true
}, {
  message: 'Invalid submission'
})

// Admin Guest Creation Validation
export const adminGuestSchema = z.object({
  firstName: sanitizedString(50),
  lastName: sanitizedString(50),
  email: sanitizedEmail().optional(),
  phone: sanitizedPhone(),
  groupId: z.string().uuid().optional(),
  plusOneAllowed: z.boolean().default(false),
  // Security fields
  csrfToken: z.string().optional()
})

// Photo Upload Validation
export const photoUploadSchema = z.object({
  guestId: z.string().uuid().optional(),
  caption: sanitizedString(500).optional(),
  albumId: z.string().uuid().optional(),
  // Security fields
  csrfToken: z.string().optional()
})

// File Upload Validation
export const fileValidation = {
  // Allowed image types
  allowedTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  
  // Maximum file size (10MB)
  maxSize: 10 * 1024 * 1024,
  
  // Maximum dimensions
  maxWidth: 4000,
  maxHeight: 4000,
  
  // Validate file
  validateFile: (file: File) => {
    const errors: string[] = []
    
    // Check file type
    if (!fileValidation.allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.')
    }
    
    // Check file size
    if (file.size > fileValidation.maxSize) {
      errors.push('File too large. Maximum size is 10MB.')
    }
    
    // Check file name
    const sanitizedName = sanitizeText(file.name)
    if (sanitizedName !== file.name) {
      errors.push('Invalid characters in filename.')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Invitation Code Validation
export const invitationCodeSchema = z.object({
  invitationCode: z.string()
    .min(8, 'Invitation code too short')
    .max(32, 'Invitation code too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Invalid invitation code format')
    .transform(val => val.toLowerCase().trim()),
  // Security fields
  timestamp: z.number().optional(),
  csrfToken: z.string().optional()
})

// Admin Login Validation
export const adminLoginSchema = z.object({
  email: sanitizedEmail(),
  password: z.string().min(1, 'Password is required'),
  // Security fields
  timestamp: z.number().optional(),
  csrfToken: z.string().optional()
})

// Rate Limiting Validation
export const rateLimitSchema = z.object({
  action: z.string(),
  identifier: z.string(), // IP address or user ID
  timestamp: z.number(),
  count: z.number().default(1)
})

// Access Request Validation
export const accessRequestSchema = z.object({
  name: sanitizedString(100).min(2, 'Name must be at least 2 characters'),
  email: sanitizedEmail(),
  phone: sanitizedPhone().min(10, 'Phone number must be at least 10 digits'),
  address: sanitizedString(500).min(10, 'Please provide a complete address'),
  message: sanitizedString(1000).optional(),
  // Security fields
  timestamp: z.number().optional(),
  csrfToken: z.string().optional(),
  honeypot: z.string().optional() // Bot detection
}).refine(data => {
  // Honeypot field should be empty (bot detection)
  if (data.honeypot && data.honeypot.length > 0) {
    return false
  }
  return true
}, {
  message: 'Invalid submission'
}).refine(data => {
  // Basic timestamp validation (submission within last hour)
  if (data.timestamp) {
    const now = Date.now()
    const submissionTime = data.timestamp
    const oneHour = 60 * 60 * 1000
    if (Math.abs(now - submissionTime) > oneHour) {
      return false
    }
  }
  return true
}, {
  message: 'Submission expired, please try again'
})

// Admin Access Request Management Validation
export const accessRequestUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'denied']),
  admin_notes: sanitizedString(1000).optional(),
  send_invitation: z.boolean().optional().default(false)
})

// Bulk Access Request Actions
export const bulkAccessRequestSchema = z.object({
  request_ids: z.array(z.string().uuid()).min(1, 'At least one request must be selected'),
  action: z.enum(['approve', 'deny', 'delete']),
  admin_notes: sanitizedString(1000).optional(),
  send_invitations: z.boolean().optional().default(false)
})

// RSVP Deadline Validation
export function validateRSVPDeadline(): { isValid: boolean; message?: string } {
  try {
    const deadline = process.env.RSVP_DEADLINE
    if (!deadline) {
      return { isValid: true } // No deadline set
    }
    
    const deadlineDate = new Date(deadline)
    const now = new Date()
    
    if (now > deadlineDate) {
      return {
        isValid: false,
        message: 'RSVP deadline has passed. Please contact the couple directly.'
      }
    }
    
    return { isValid: true }
  } catch (error) {
    console.error('Error validating RSVP deadline:', error)
    return { isValid: true } // Allow if validation fails
  }
}

// Security Headers Validation
export const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

// Validate request origin
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://localhost:3000'
  ].filter(Boolean)
  
  if (!origin) return false
  return allowedOrigins.includes(origin)
}

// Validate request timing (prevent replay attacks)
export function validateTimestamp(timestamp?: number): boolean {
  if (!timestamp) return true // Optional field
  
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000
  
  // Request must be within 5 minutes
  return Math.abs(now - timestamp) <= fiveMinutes
}
