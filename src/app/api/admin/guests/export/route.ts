import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdminFromRequest, logAdminAction } from '@/lib/admin-auth'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const selectedIds = searchParams.get('ids')?.split(',')

    // Build query
    let query = supabaseAdmin
      .from('guests')
      .select(`
        *,
        guest_groups (
          group_name
        )
      `)

    // Filter by selected IDs if provided
    if (selectedIds && selectedIds.length > 0) {
      query = query.in('id', selectedIds)
    }

    const { data: guests, error } = await query.order('last_name')

    if (error) {
      console.error('Error fetching guests for export:', error)
      return NextResponse.json(
        { error: 'Failed to fetch guests' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction('EXPORT_GUESTS', {
      adminEmail: adminUser.email,
      format,
      guestCount: guests.length,
      selectedIds: selectedIds || 'all'
    })

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Group',
        'RSVP Status',
        'Meal Preference',
        'Dietary Restrictions',
        'Plus One Allowed',
        'Plus One Name',
        'Special Notes',
        'Invitation Code',
        'RSVP Submitted At',
        'Created At'
      ]

      const csvRows = guests.map(guest => [
        guest.first_name || '',
        guest.last_name || '',
        guest.email || '',
        guest.phone || '',
        guest.guest_groups?.group_name || '',
        guest.rsvp_status || '',
        guest.meal_preference || '',
        guest.dietary_restrictions || '',
        guest.plus_one_allowed ? 'Yes' : 'No',
        guest.plus_one_name || '',
        guest.special_notes || '',
        guest.invitation_code || '',
        guest.rsvp_submitted_at || '',
        guest.created_at || ''
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => 
          row.map(field => 
            typeof field === 'string' && field.includes(',') 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wedding-guests-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      // Generate JSON
      const jsonData = guests.map(guest => ({
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        groupName: guest.guest_groups?.group_name,
        rsvpStatus: guest.rsvp_status,
        mealPreference: guest.meal_preference,
        dietaryRestrictions: guest.dietary_restrictions,
        plusOneAllowed: guest.plus_one_allowed,
        plusOneName: guest.plus_one_name,
        specialNotes: guest.special_notes,
        invitationCode: guest.invitation_code,
        rsvpSubmittedAt: guest.rsvp_submitted_at,
        createdAt: guest.created_at
      }))

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="wedding-guests-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Unsupported export format' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in guest export API:', error)

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
