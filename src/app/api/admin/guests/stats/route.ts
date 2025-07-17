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

    // Get all guests with group information
    const { data: guests, error } = await supabaseAdmin
      .from('guests')
      .select(`
        *,
        guest_groups (
          group_name
        )
      `)

    if (error) {
      console.error('Error fetching guests for stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch guest statistics' },
        { status: 500 }
      )
    }

    // Calculate comprehensive statistics
    const stats = {
      // Basic counts
      totalGuests: guests.length,
      totalGroups: new Set(guests.map(g => g.group_id).filter(Boolean)).size,
      
      // RSVP statistics
      rsvp: {
        attending: guests.filter(g => g.rsvp_status === 'attending').length,
        notAttending: guests.filter(g => g.rsvp_status === 'not_attending').length,
        pending: guests.filter(g => g.rsvp_status === 'pending').length,
        responseRate: guests.length > 0 ? 
          Math.round(((guests.filter(g => g.rsvp_status !== 'pending').length) / guests.length) * 100) : 0
      },

      // Meal preferences
      meals: {
        chicken: guests.filter(g => g.meal_preference === 'chicken').length,
        beef: guests.filter(g => g.meal_preference === 'beef').length,
        fish: guests.filter(g => g.meal_preference === 'fish').length,
        vegetarian: guests.filter(g => g.meal_preference === 'vegetarian').length,
        vegan: guests.filter(g => g.meal_preference === 'vegan').length,
        kidsMenu: guests.filter(g => g.meal_preference === 'kids_meal').length,
        notSpecified: guests.filter(g => !g.meal_preference).length
      },

      // Plus one statistics
      plusOnes: {
        allowed: guests.filter(g => g.plus_one_allowed).length,
        withNames: guests.filter(g => g.plus_one_name).length,
        notAllowed: guests.filter(g => !g.plus_one_allowed).length
      },

      // Dietary restrictions
      dietaryRestrictions: {
        withRestrictions: guests.filter(g => g.dietary_restrictions).length,
        withoutRestrictions: guests.filter(g => !g.dietary_restrictions).length
      },

      // Contact information completeness
      contactInfo: {
        withEmail: guests.filter(g => g.email).length,
        withPhone: guests.filter(g => g.phone).length,
        withBoth: guests.filter(g => g.email && g.phone).length,
        withNeither: guests.filter(g => !g.email && !g.phone).length
      },

      // Group breakdown
      groupBreakdown: Object.entries(
        guests.reduce((acc, guest) => {
          const groupName = guest.guest_groups?.group_name || 'No Group'
          if (!acc[groupName]) {
            acc[groupName] = {
              total: 0,
              attending: 0,
              notAttending: 0,
              pending: 0
            }
          }
          acc[groupName].total++
          if (guest.rsvp_status === 'attending') acc[groupName].attending++
          else if (guest.rsvp_status === 'not_attending') acc[groupName].notAttending++
          else acc[groupName].pending++
          return acc
        }, {} as Record<string, any>)
      ).map(([groupName, stats]: [string, any]) => ({
        groupName,
        total: stats.total,
        attending: stats.attending,
        notAttending: stats.notAttending,
        pending: stats.pending
      })),

      // Timeline statistics
      timeline: {
        recentRSVPs: guests
          .filter(g => g.rsvp_submitted_at)
          .sort((a, b) => new Date(b.rsvp_submitted_at!).getTime() - new Date(a.rsvp_submitted_at!).getTime())
          .slice(0, 10)
          .map(g => ({
            guestName: `${g.first_name} ${g.last_name}`,
            rsvpStatus: g.rsvp_status,
            submittedAt: g.rsvp_submitted_at
          })),
        
        rsvpsByDay: guests
          .filter(g => g.rsvp_submitted_at)
          .reduce((acc, guest) => {
            const date = new Date(guest.rsvp_submitted_at!).toISOString().split('T')[0]
            acc[date] = (acc[date] || 0) + 1
            return acc
          }, {} as Record<string, number>)
      },

      // Special requirements
      specialRequirements: {
        withNotes: guests.filter(g => g.special_notes).length,
        childrenAttending: guests.filter(g => g.children_attending).length
      }
    }

    // Log admin action
    await logAdminAction('VIEW_GUEST_STATISTICS', {
      adminEmail: adminUser.email,
      statsGenerated: Object.keys(stats)
    })

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error in guest stats API:', error)

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
