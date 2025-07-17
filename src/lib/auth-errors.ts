/**
 * Authentication error handling utilities
 * Provides consistent error messages and handling across the application
 */

export interface AuthError {
  code: string
  message: string
  userMessage: string
  statusCode: number
}

export const AUTH_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  
  // Authorization errors
  INSUFFICIENT_PRIVILEGES: 'INSUFFICIENT_PRIVILEGES',
  ADMIN_ACCESS_REQUIRED: 'ADMIN_ACCESS_REQUIRED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  
  // Session errors
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_SESSION: 'INVALID_SESSION',
  SESSION_REFRESH_FAILED: 'SESSION_REFRESH_FAILED',
  
  // Security errors
  CSRF_PROTECTION: 'CSRF_PROTECTION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_ORIGIN: 'INVALID_ORIGIN',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
} as const

export const AUTH_ERRORS: Record<string, AuthError> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: {
    code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    message: 'Invalid login credentials',
    userMessage: 'Invalid email or password. Please check your credentials and try again.',
    statusCode: 401
  },
  
  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]: {
    code: AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED,
    message: 'Email not confirmed',
    userMessage: 'Please confirm your email address before signing in. Check your inbox for a confirmation link.',
    statusCode: 401
  },
  
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: {
    code: AUTH_ERROR_CODES.USER_NOT_FOUND,
    message: 'User not found',
    userMessage: 'No account found with this email address.',
    statusCode: 404
  },
  
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: {
    code: AUTH_ERROR_CODES.WEAK_PASSWORD,
    message: 'Password too weak',
    userMessage: 'Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.',
    statusCode: 400
  },
  
  [AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]: {
    code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
    message: 'Email already exists',
    userMessage: 'An account with this email address already exists.',
    statusCode: 409
  },
  
  [AUTH_ERROR_CODES.INSUFFICIENT_PRIVILEGES]: {
    code: AUTH_ERROR_CODES.INSUFFICIENT_PRIVILEGES,
    message: 'Insufficient privileges',
    userMessage: 'You do not have permission to perform this action.',
    statusCode: 403
  },
  
  [AUTH_ERROR_CODES.ADMIN_ACCESS_REQUIRED]: {
    code: AUTH_ERROR_CODES.ADMIN_ACCESS_REQUIRED,
    message: 'Admin access required',
    userMessage: 'This area is restricted to administrators only.',
    statusCode: 403
  },
  
  [AUTH_ERROR_CODES.ACCOUNT_DISABLED]: {
    code: AUTH_ERROR_CODES.ACCOUNT_DISABLED,
    message: 'Account disabled',
    userMessage: 'Your account has been disabled. Please contact an administrator.',
    statusCode: 403
  },
  
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: {
    code: AUTH_ERROR_CODES.SESSION_EXPIRED,
    message: 'Session expired',
    userMessage: 'Your session has expired. Please sign in again.',
    statusCode: 401
  },
  
  [AUTH_ERROR_CODES.INVALID_SESSION]: {
    code: AUTH_ERROR_CODES.INVALID_SESSION,
    message: 'Invalid session',
    userMessage: 'Your session is invalid. Please sign in again.',
    statusCode: 401
  },
  
  [AUTH_ERROR_CODES.SESSION_REFRESH_FAILED]: {
    code: AUTH_ERROR_CODES.SESSION_REFRESH_FAILED,
    message: 'Session refresh failed',
    userMessage: 'Unable to refresh your session. Please sign in again.',
    statusCode: 401
  },
  
  [AUTH_ERROR_CODES.CSRF_PROTECTION]: {
    code: AUTH_ERROR_CODES.CSRF_PROTECTION,
    message: 'CSRF protection triggered',
    userMessage: 'Security check failed. Please refresh the page and try again.',
    statusCode: 403
  },
  
  [AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    code: AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message: 'Rate limit exceeded',
    userMessage: 'Too many requests. Please wait a moment before trying again.',
    statusCode: 429
  },
  
  [AUTH_ERROR_CODES.INVALID_ORIGIN]: {
    code: AUTH_ERROR_CODES.INVALID_ORIGIN,
    message: 'Invalid origin',
    userMessage: 'Request origin not allowed. Please ensure you are accessing the site correctly.',
    statusCode: 403
  },
  
  [AUTH_ERROR_CODES.SERVER_ERROR]: {
    code: AUTH_ERROR_CODES.SERVER_ERROR,
    message: 'Internal server error',
    userMessage: 'An unexpected error occurred. Please try again later.',
    statusCode: 500
  },
  
  [AUTH_ERROR_CODES.DATABASE_ERROR]: {
    code: AUTH_ERROR_CODES.DATABASE_ERROR,
    message: 'Database error',
    userMessage: 'A database error occurred. Please try again later.',
    statusCode: 500
  },
  
  [AUTH_ERROR_CODES.CONFIGURATION_ERROR]: {
    code: AUTH_ERROR_CODES.CONFIGURATION_ERROR,
    message: 'Configuration error',
    userMessage: 'A configuration error occurred. Please contact support.',
    statusCode: 500
  }
}

/**
 * Create a standardized auth error response
 */
export function createAuthError(code: string, customMessage?: string): AuthError {
  const baseError = AUTH_ERRORS[code] || AUTH_ERRORS[AUTH_ERROR_CODES.SERVER_ERROR]
  
  return {
    ...baseError,
    userMessage: customMessage || baseError.userMessage
  }
}

/**
 * Map Supabase auth errors to our standardized errors
 */
export function mapSupabaseAuthError(error: any): AuthError {
  const message = error?.message?.toLowerCase() || ''
  
  if (message.includes('invalid login credentials')) {
    return AUTH_ERRORS[AUTH_ERROR_CODES.INVALID_CREDENTIALS]
  }
  
  if (message.includes('email not confirmed')) {
    return AUTH_ERRORS[AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]
  }
  
  if (message.includes('user not found')) {
    return AUTH_ERRORS[AUTH_ERROR_CODES.USER_NOT_FOUND]
  }
  
  if (message.includes('password') && message.includes('weak')) {
    return AUTH_ERRORS[AUTH_ERROR_CODES.WEAK_PASSWORD]
  }
  
  if (message.includes('email') && message.includes('already')) {
    return AUTH_ERRORS[AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]
  }
  
  if (message.includes('session') && message.includes('expired')) {
    return AUTH_ERRORS[AUTH_ERROR_CODES.SESSION_EXPIRED]
  }
  
  if (message.includes('session') && message.includes('invalid')) {
    return AUTH_ERRORS[AUTH_ERROR_CODES.INVALID_SESSION]
  }
  
  // Default to server error for unknown Supabase errors
  return AUTH_ERRORS[AUTH_ERROR_CODES.SERVER_ERROR]
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return error && typeof error === 'object' && 'code' in error && error.code in AUTH_ERRORS
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (isAuthError(error)) {
    return error.userMessage
  }
  
  if (error?.message) {
    const mappedError = mapSupabaseAuthError(error)
    return mappedError.userMessage
  }
  
  return AUTH_ERRORS[AUTH_ERROR_CODES.SERVER_ERROR].userMessage
}
