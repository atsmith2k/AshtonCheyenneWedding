/**
 * Environment Variable Validation
 * 
 * This file validates and provides debugging information for environment variables
 * to help identify configuration issues in both development and production.
 */

interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  debug: Record<string, any>
}

/**
 * Validates all required environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const debug: Record<string, any> = {}

  // Check if we're on client or server side
  const isClient = typeof window !== 'undefined'
  debug.environment = isClient ? 'client' : 'server'
  debug.nodeEnv = process.env.NODE_ENV

  // Required client-side variables (NEXT_PUBLIC_)
  const clientVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }

  // Required server-side variables
  const serverVars = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY
  }

  // Validate client-side variables
  Object.entries(clientVars).forEach(([key, value]) => {
    debug[key] = value ? '✓ Set' : '✗ Missing'
    
    if (!value) {
      errors.push(`${key} is required but not set`)
    } else if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      try {
        new URL(value)
        debug[`${key}_format`] = '✓ Valid URL'
      } catch {
        errors.push(`${key} is not a valid URL: ${value}`)
        debug[`${key}_format`] = '✗ Invalid URL'
      }
    }
  })

  // Validate server-side variables (only on server)
  if (!isClient) {
    Object.entries(serverVars).forEach(([key, value]) => {
      debug[key] = value ? '✓ Set' : '✗ Missing'
      
      if (!value) {
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
          errors.push(`${key} is required for admin operations`)
        } else if (key === 'ADMIN_EMAIL') {
          warnings.push(`${key} is not set - admin features will be disabled`)
        } else {
          warnings.push(`${key} is not set`)
        }
      }
    })
  }

  // Additional validations
  if (clientVars.NEXT_PUBLIC_SUPABASE_URL && clientVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Check if Supabase URL and key seem to match
    const url = clientVars.NEXT_PUBLIC_SUPABASE_URL
    const key = clientVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (url.includes('supabase.co') && !key.startsWith('eyJ')) {
      warnings.push('Supabase anon key format looks suspicious - should start with "eyJ"')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    debug
  }
}

/**
 * Logs environment validation results
 */
export function logEnvironmentStatus(): void {
  const result = validateEnvironment()
  
  console.log('🔧 Environment Validation Results:')
  console.log('Environment:', result.debug.environment)
  console.log('Node Environment:', result.debug.nodeEnv)
  
  if (result.isValid) {
    console.log('✅ All required environment variables are set')
  } else {
    console.error('❌ Environment validation failed:')
    result.errors.forEach(error => console.error(`  - ${error}`))
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:')
    result.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🐛 Debug info:', result.debug)
  }
}

/**
 * Throws an error if environment is not valid
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironment()
  
  if (!result.isValid) {
    const errorMessage = [
      'Environment validation failed:',
      ...result.errors.map(error => `  - ${error}`),
      '',
      'Please check your environment variables in .env.local',
      'See .env.example for required variables'
    ].join('\n')
    
    throw new Error(errorMessage)
  }
}

/**
 * Gets environment info for debugging
 */
export function getEnvironmentInfo() {
  const result = validateEnvironment()
  return {
    isValid: result.isValid,
    environment: result.debug.environment,
    nodeEnv: result.debug.nodeEnv,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    errors: result.errors,
    warnings: result.warnings
  }
}
