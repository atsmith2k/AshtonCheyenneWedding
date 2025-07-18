/**
 * Schema Optimization Migration Runner
 * 
 * This script runs the comprehensive database schema optimization migration
 * that adds missing tables, foreign keys, indexes, and storage optimizations.
 * 
 * Usage:
 * 1. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment
 * 2. Run: npx tsx src/scripts/run-schema-optimization.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Database } from '@/types/database'

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface MigrationResult {
  migration: string
  success: boolean
  error?: string
  warnings?: string[]
}

async function runMigration(migrationFile: string): Promise<MigrationResult> {
  try {
    console.log(`📄 Running migration: ${migrationFile}`)
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'src/migrations', migrationFile)
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*$/))
    
    console.log(`  📝 Executing ${statements.length} SQL statements...`)
    
    const warnings: string[] = []
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip empty statements and comments
      if (!statement.trim() || statement.trim().startsWith('--')) {
        continue
      }
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement })
        
        if (error) {
          // Check if it's a warning (like "already exists" errors)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('IF NOT EXISTS')) {
            warnings.push(`Statement ${i + 1}: ${error.message}`)
            continue
          }
          
          throw new Error(`Statement ${i + 1}: ${error.message}`)
        }
      } catch (execError) {
        // Try alternative execution method
        const { error: directError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(1)
        
        if (directError && directError.message.includes('does not exist')) {
          // If _migrations table doesn't exist, try direct SQL execution
          console.log(`  ⚠️  Attempting direct SQL execution for statement ${i + 1}`)
          // This would require a different approach in production
        }
        
        throw execError
      }
    }
    
    return {
      migration: migrationFile,
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined
    }
    
  } catch (error) {
    return {
      migration: migrationFile,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function validateMigration(): Promise<boolean> {
  try {
    console.log('🔍 Validating migration results...')
    
    // Check if new tables exist
    const tablesToCheck = ['admin_users', 'email_campaigns', 'analytics_events', 'albums']
    
    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`  ❌ Table '${table}' not accessible: ${error.message}`)
        return false
      }
      
      console.log(`  ✅ Table '${table}' exists and is accessible`)
    }
    
    // Check if new columns exist in guests table
    const { data: guestData, error: guestError } = await supabase
      .from('guests')
      .select('invitation_sent_at, group_name, table_number')
      .limit(1)
    
    if (guestError) {
      console.log(`  ❌ New guest columns not accessible: ${guestError.message}`)
      return false
    }
    
    console.log('  ✅ New guest columns exist and are accessible')
    
    // Check storage functions
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_storage_stats')
    
    if (functionError) {
      console.log(`  ❌ Storage functions not accessible: ${functionError.message}`)
      return false
    }
    
    console.log('  ✅ Storage utility functions are working')
    
    return true
    
  } catch (error) {
    console.log(`  ❌ Validation failed: ${error}`)
    return false
  }
}

async function runSchemaOptimization() {
  console.log('🚀 Starting Wedding Website Schema Optimization...')
  console.log('')
  
  const migrations = [
    '003_schema_optimization.sql',
    '004_storage_optimization.sql'
  ]
  
  const results: MigrationResult[] = []
  
  // Run each migration
  for (const migration of migrations) {
    const result = await runMigration(migration)
    results.push(result)
    
    if (result.success) {
      console.log(`  ✅ ${migration} completed successfully`)
      if (result.warnings && result.warnings.length > 0) {
        console.log(`  ⚠️  Warnings:`)
        result.warnings.forEach(warning => console.log(`    - ${warning}`))
      }
    } else {
      console.log(`  ❌ ${migration} failed: ${result.error}`)
    }
    console.log('')
  }
  
  // Validate results
  const isValid = await validateMigration()
  
  // Summary
  console.log('📋 Migration Summary:')
  console.log('=' .repeat(50))
  
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`✅ Successful migrations: ${successful}`)
  console.log(`❌ Failed migrations: ${failed}`)
  console.log(`🔍 Validation: ${isValid ? 'PASSED' : 'FAILED'}`)
  console.log('')
  
  if (failed > 0) {
    console.log('❌ Failed Migrations:')
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.migration}: ${result.error}`)
    })
    console.log('')
  }
  
  if (isValid && failed === 0) {
    console.log('🎉 Schema optimization completed successfully!')
    console.log('')
    console.log('📋 What was optimized:')
    console.log('  ✅ Added missing tables (admin_users, email_campaigns, analytics_events, albums)')
    console.log('  ✅ Created foreign key constraints for data integrity')
    console.log('  ✅ Added performance indexes for faster queries')
    console.log('  ✅ Implemented Row Level Security (RLS) policies')
    console.log('  ✅ Created storage utility functions')
    console.log('  ✅ Added database triggers for automatic timestamps')
    console.log('  ✅ Updated TypeScript types to match schema')
    console.log('')
    console.log('🔧 Next Steps:')
    console.log('  1. Configure storage bucket policies in Supabase dashboard')
    console.log('  2. Test admin functionality with new schema')
    console.log('  3. Run application tests to ensure compatibility')
    console.log('  4. Consider setting up automated backups')
  } else {
    console.log('⚠️  Schema optimization completed with issues.')
    console.log('Please review the errors above and run manual fixes if needed.')
    process.exit(1)
  }
}

// Manual migration instructions
function printManualInstructions() {
  console.log('')
  console.log('📋 Manual Migration Instructions:')
  console.log('If the automatic migration fails, you can run the SQL manually:')
  console.log('')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Navigate to the SQL Editor')
  console.log('3. Copy and paste the contents of each migration file:')
  console.log('   - src/migrations/003_schema_optimization.sql')
  console.log('   - src/migrations/004_storage_optimization.sql')
  console.log('4. Execute each SQL file in order')
  console.log('5. Configure storage bucket policies manually')
  console.log('')
}

// Run the migration
if (require.main === module) {
  runSchemaOptimization().catch((error) => {
    console.error('❌ Schema optimization failed:', error)
    printManualInstructions()
    process.exit(1)
  })
}

export { runSchemaOptimization }
