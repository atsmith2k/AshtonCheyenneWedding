#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required environment variables are properly set
 * for both local development and production deployment.
 * 
 * Usage:
 *   node scripts/validate-env.js
 *   npm run validate-env
 */

const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local if it exists
const envLocalPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      const value = valueParts.join('=').trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

// Required environment variables
const requiredVars = {
  client: {
    'NEXT_PUBLIC_SUPABASE_URL': {
      required: true,
      description: 'Supabase project URL',
      example: 'https://your-project-id.supabase.co',
      validate: (value) => {
        try {
          new URL(value)
          return value.includes('supabase.co')
        } catch {
          return false
        }
      }
    },
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY': {
      required: true,
      description: 'Supabase publishable key (modern SSR pattern)',
      example: 'sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      validate: (value) => value.startsWith('sb_publishable_')
    },
    'NEXT_PUBLIC_APP_URL': {
      required: true,
      description: 'Application URL',
      example: 'http://localhost:3001 (dev) or https://your-domain.vercel.app (prod)',
      validate: (value) => {
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      }
    }
  },
  server: {
    'SUPABASE_SERVICE_ROLE_KEY': {
      required: true,
      description: 'Supabase service role key (server-side only)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... or sb_secret_...',
      validate: (value) => value.startsWith('eyJ') || value.startsWith('sb_secret_')
    },
    'ADMIN_EMAIL': {
      required: true,
      description: 'Admin email address(es)',
      example: 'admin@example.com or admin1@example.com,admin2@example.com'
    },
    'NEXTAUTH_SECRET': {
      required: true,
      description: 'NextAuth secret key (32+ characters)',
      validate: (value) => value.length >= 32
    },
    'ENCRYPTION_KEY': {
      required: true,
      description: 'Encryption key for sensitive data (32+ characters)',
      validate: (value) => value.length >= 32
    }
  },
  optional: {
    'RESEND_API_KEY': {
      required: false,
      description: 'Resend API key for email functionality',
      example: 're_xxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx'
    },
    'RSVP_DEADLINE': {
      required: false,
      description: 'RSVP deadline in ISO format',
      example: '2026-07-01T23:59:59Z'
    }
  }
}

function validateEnvironment() {
  console.log('🔧 Environment Variable Validation\n')
  
  let hasErrors = false
  let hasWarnings = false
  
  // Check client-side variables
  console.log('📱 Client-side variables (NEXT_PUBLIC_):')
  Object.entries(requiredVars.client).forEach(([key, config]) => {
    const value = process.env[key]
    const isSet = !!value
    const isValid = isSet && (!config.validate || config.validate(value))
    
    if (isSet && isValid) {
      console.log(`  ✅ ${key}`)
    } else if (isSet && !isValid) {
      console.log(`  ❌ ${key} - Invalid format`)
      console.log(`     Expected: ${config.example || config.description}`)
      hasErrors = true
    } else {
      console.log(`  ❌ ${key} - Missing`)
      console.log(`     Description: ${config.description}`)
      console.log(`     Example: ${config.example || 'See documentation'}`)
      hasErrors = true
    }
  })
  
  console.log('\n🔒 Server-side variables:')
  Object.entries(requiredVars.server).forEach(([key, config]) => {
    const value = process.env[key]
    const isSet = !!value
    const isValid = isSet && (!config.validate || config.validate(value))
    
    if (isSet && isValid) {
      console.log(`  ✅ ${key}`)
    } else if (isSet && !isValid) {
      console.log(`  ❌ ${key} - Invalid format`)
      console.log(`     Expected: ${config.description}`)
      hasErrors = true
    } else {
      console.log(`  ❌ ${key} - Missing`)
      console.log(`     Description: ${config.description}`)
      if (config.example) {
        console.log(`     Example: ${config.example}`)
      }
      hasErrors = true
    }
  })
  
  console.log('\n🔧 Optional variables:')
  Object.entries(requiredVars.optional).forEach(([key, config]) => {
    const value = process.env[key]
    const isSet = !!value
    
    if (isSet) {
      console.log(`  ✅ ${key}`)
    } else {
      console.log(`  ⚠️  ${key} - Not set (optional)`)
      console.log(`     Description: ${config.description}`)
      hasWarnings = true
    }
  })
  
  console.log('\n📊 Summary:')
  if (!hasErrors) {
    console.log('✅ All required environment variables are properly configured!')
  } else {
    console.log('❌ Some required environment variables are missing or invalid.')
    console.log('\n🔧 To fix:')
    console.log('1. Copy .env.example to .env.local: cp .env.example .env.local')
    console.log('2. Fill in the missing values in .env.local')
    console.log('3. For Vercel deployment, add these variables in the Vercel dashboard')
    console.log('4. See docs/VERCEL_ENV_SETUP.md for detailed instructions')
  }
  
  if (hasWarnings) {
    console.log('\n⚠️  Some optional features may not work without the optional variables.')
  }
  
  console.log('\n📚 Documentation:')
  console.log('- Environment setup: docs/VERCEL_ENV_SETUP.md')
  console.log('- Deployment guide: docs/VERCEL_DEPLOYMENT_GUIDE.md')
  
  return !hasErrors
}

// Run validation
const isValid = validateEnvironment()
process.exit(isValid ? 0 : 1)
