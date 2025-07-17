import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/invitation-stats
 * Get invitation statistics for the admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    await requireAdmin()

    // Get all guests with invitation tracking info
    const { data: guests, error } = await supabaseAdmin
      .from('guests')
      .select('id, email, invitation_sent_at, rsvp_status')

    if (error) {
      console.error('Error fetching invitation stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitation statistics' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalGuests = guests.length
    const guestsWithEmail = guests.filter(g => g.email).length
    const guestsWithoutEmail = totalGuests - guestsWithEmail
    
    const invitationsSent = guests.filter(g => g.invitation_sent_at).length
    const invitationsNotSent = guestsWithEmail - invitationsSent
    
    const sentAndResponded = guests.filter(g => 
      g.invitation_sent_at && g.rsvp_status !== 'pending'
    ).length
    
    const sentButPending = guests.filter(g => 
      g.invitation_sent_at && g.rsvp_status === 'pending'
    ).length

    // Calculate response rate
    const responseRate = invitationsSent > 0 
      ? Math.round((sentAndResponded / invitationsSent) * 100) 
      : 0

    // Get recent invitation activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentInvitations = guests.filter(g => 
      g.invitation_sent_at && new Date(g.invitation_sent_at) >= sevenDaysAgo
    ).length

    // Breakdown by RSVP status for invited guests
    const rsvpBreakdown = {
      attending: guests.filter(g => g.invitation_sent_at && g.rsvp_status === 'attending').length,
      not_attending: guests.filter(g => g.invitation_sent_at && g.rsvp_status === 'not_attending').length,
      pending: guests.filter(g => g.invitation_sent_at && g.rsvp_status === 'pending').length
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_guests: totalGuests,
          guests_with_email: guestsWithEmail,
          guests_without_email: guestsWithoutEmail,
          invitations_sent: invitationsSent,
          invitations_not_sent: invitationsNotSent,
          response_rate_percentage: responseRate,
          recent_invitations_7_days: recentInvitations
        },
        invitation_status: {
          sent_and_responded: sentAndResponded,
          sent_but_pending: sentButPending,
          not_sent: invitationsNotSent,
          no_email: guestsWithoutEmail
        },
        rsvp_breakdown: rsvpBreakdown,
        percentages: {
          invitation_coverage: guestsWithEmail > 0 
            ? Math.round((invitationsSent / guestsWithEmail) * 100) 
            : 0,
          response_rate: responseRate,
          email_coverage: totalGuests > 0 
            ? Math.round((guestsWithEmail / totalGuests) * 100) 
            : 0
        }
      }
    })

  } catch (error) {
    console.error('Error in invitation stats API:', error)

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
