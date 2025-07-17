import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/migrate/invitation-tracking
 * Apply database migration to add invitation tracking fields
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdmin()

    // Check if the column already exists by trying to query it
    let columnExists = false
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('guests')
        .select('invitation_sent_at')
        .limit(1)

      columnExists = !testError
    } catch (error) {
      console.log('Column does not exist yet, proceeding with migration...')
    }

    if (columnExists) {
      return NextResponse.json({
        success: true,
        message: 'Invitation tracking migration already applied',
        results: [{ step: 1, status: 'skipped', message: 'Column already exists' }]
      })
    }

    // Since we can't execute DDL directly through Supabase client,
    // we'll provide instructions for manual execution
    const migrationSQL = `
-- Add invitation tracking to guests table
ALTER TABLE guests
ADD COLUMN invitation_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX idx_guests_invitation_sent_at ON guests(invitation_sent_at);

-- Add comment to document the field
COMMENT ON COLUMN guests.invitation_sent_at IS 'Timestamp when digital invitation email was last sent to this guest';
`

    // For now, we'll return the SQL that needs to be executed manually
    // In a production environment, this would typically be handled by a proper migration system
    return NextResponse.json({
      success: false,
      message: 'Database migration required',
      migration_sql: migrationSQL,
      instructions: [
        '1. Connect to your Supabase database using the SQL editor or psql',
        '2. Execute the provided SQL migration script',
        '3. Verify the migration by checking that the invitation_sent_at column exists in the guests table',
        '4. The invitation system will then be fully functional'
      ],
      note: 'This migration adds the invitation_sent_at field to track when digital invitations are sent to guests'
    })

    // Verify the migration by checking if we can query the new column
    try {
      const { data: testData, error: testError } = await supabaseAdmin!
        .from('guests')
        .select('id, invitation_sent_at')
        .limit(1)

      if (testError) {
        return NextResponse.json({
          success: false,
          error: 'Migration verification failed',
          details: testError?.message || 'Unknown error'
        }, { status: 500 })
      }

      // Log the migration
      console.log(`Admin ${adminUser.email} applied invitation tracking migration`)

      return NextResponse.json({
        success: true,
        message: 'Invitation tracking migration applied successfully',
        verification: 'Column access verified'
      })

    } catch (verificationError) {
      const errorMessage = verificationError instanceof Error ? (verificationError as Error).message : 'Unknown error'
      return NextResponse.json({
        success: false,
        error: 'Migration completed but verification failed',
        details: errorMessage
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error applying invitation tracking migration:', error)

    // Handle authorization errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
