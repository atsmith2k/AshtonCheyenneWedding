/**
 * Migration runner script for the access_requests table
 * Run this script to create the access_requests table in your Supabase database
 * 
 * Usage:
 * 1. Make sure your SUPABASE_SERVICE_ROLE_KEY is set in your environment
 * 2. Run: npx tsx src/scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('🚀 Starting migration...')

    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'src/migrations/001_create_access_requests_table.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Loaded migration file: 001_create_access_requests_table.sql')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      // If the RPC function doesn't exist, try direct SQL execution
      if (error.message.includes('function exec_sql')) {
        console.log('📝 Executing migration SQL directly...')
        
        // Split the SQL into individual statements and execute them
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

        for (const statement of statements) {
          if (statement.trim()) {
            const { error: execError } = await supabase.rpc('exec', {
              sql: statement + ';'
            })
            
            if (execError) {
              console.error('❌ Error executing statement:', execError.message)
              console.error('Statement:', statement)
              throw execError
            }
          }
        }
      } else {
        throw error
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('📋 What was created:')
    console.log('  - access_requests table with proper schema')
    console.log('  - Indexes for performance optimization')
    console.log('  - Row Level Security (RLS) policies')
    console.log('  - Triggers for automatic timestamp updates')
    console.log('')
    console.log('🎉 Your access request system is ready to use!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Alternative manual migration instructions
function printManualInstructions() {
  console.log('')
  console.log('📋 Manual Migration Instructions:')
  console.log('If the automatic migration fails, you can run the SQL manually:')
  console.log('')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Navigate to the SQL Editor')
  console.log('3. Copy and paste the contents of:')
  console.log('   src/migrations/001_create_access_requests_table.sql')
  console.log('4. Execute the SQL')
  console.log('')
}

// Run the migration
if (require.main === module) {
  runMigration().catch((error) => {
    console.error('❌ Migration script failed:', error)
    printManualInstructions()
    process.exit(1)
  })
}

export { runMigration }
