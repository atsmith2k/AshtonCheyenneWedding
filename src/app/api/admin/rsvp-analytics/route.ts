import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdminFromRequest } from '@/lib/admin-auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/rsvp-analytics
 * Get comprehensive RSVP analytics for the admin dashboard
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
    await requireAdminFromRequest(request)

    // Get all guests with RSVP data
    const { data: guests, error } = await supabaseAdmin
      .from('guests')
      .select(`
        id,
        rsvp_status,
        meal_preference,
        dietary_restrictions,
        plus_one_allowed,
        plus_one_name,
        plus_one_meal,
        rsvp_submitted_at,
        created_at
      `)

    if (error) {
      console.error('Error fetching RSVP analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch RSVP analytics' },
        { status: 500 }
      )
    }

    // Calculate basic statistics
    const total = guests.length
    const attending = guests.filter(g => g.rsvp_status === 'attending').length
    const notAttending = guests.filter(g => g.rsvp_status === 'not_attending').length
    const pending = guests.filter(g => g.rsvp_status === 'pending').length
    const responseRate = total > 0 ? ((attending + notAttending) / total) * 100 : 0

    // Calculate meal preferences breakdown
    const mealBreakdown: Record<string, number> = {}
    guests.forEach(guest => {
      if (guest.meal_preference) {
        mealBreakdown[guest.meal_preference] = (mealBreakdown[guest.meal_preference] || 0) + 1
      }
      if (guest.plus_one_meal) {
        mealBreakdown[guest.plus_one_meal] = (mealBreakdown[guest.plus_one_meal] || 0) + 1
      }
    })

    // Calculate plus-one statistics
    const plusOneAllowed = guests.filter(g => g.plus_one_allowed).length
    const plusOneConfirmed = guests.filter(g => g.plus_one_name).length
    const plusOneRate = plusOneAllowed > 0 ? (plusOneConfirmed / plusOneAllowed) * 100 : 0

    // Calculate dietary restrictions statistics
    const withDietaryRestrictions = guests.filter(g => 
      g.dietary_restrictions && g.dietary_restrictions.trim().length > 0
    ).length
    const dietaryRestrictionsRate = total > 0 ? (withDietaryRestrictions / total) * 100 : 0

    // Calculate response timeline (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentResponses = guests.filter(g => 
      g.rsvp_submitted_at && new Date(g.rsvp_submitted_at) >= thirtyDaysAgo
    )

    // Group responses by day for timeline
    const responseTimeline: Record<string, number> = {}
    recentResponses.forEach(guest => {
      if (guest.rsvp_submitted_at) {
        const date = new Date(guest.rsvp_submitted_at).toISOString().split('T')[0]
        responseTimeline[date] = (responseTimeline[date] || 0) + 1
      }
    })

    // Calculate total meal count (including plus ones)
    const totalMeals = attending + guests.filter(g => 
      g.rsvp_status === 'attending' && g.plus_one_name
    ).length

    // Most common dietary restrictions
    const dietaryRestrictionsList = guests
      .filter(g => g.dietary_restrictions && g.dietary_restrictions.trim().length > 0)
      .map(g => g.dietary_restrictions!.toLowerCase().trim())
    
    const dietaryRestrictionsCount: Record<string, number> = {}
    dietaryRestrictionsList.forEach(restriction => {
      // Split by common separators and count individual restrictions
      const restrictions = restriction.split(/[,;]/).map((r: string) => r.trim()).filter((r: string) => r.length > 0)
      restrictions.forEach((r: string) => {
        dietaryRestrictionsCount[r] = (dietaryRestrictionsCount[r] || 0) + 1
      })
    })

    // Sort dietary restrictions by frequency
    const topDietaryRestrictions = Object.entries(dietaryRestrictionsCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([restriction, count]) => ({ restriction, count }))

    // Calculate completion rate (guests with all required info)
    const completeRSVPs = guests.filter(g => {
      if (g.rsvp_status === 'pending') return false
      if (g.rsvp_status === 'attending') {
        // For attending guests, check if they have meal preference
        if (!g.meal_preference) return false
        // If they have a plus one, check if plus one has meal preference
        if (g.plus_one_name && !g.plus_one_meal) return false
      }
      return true
    }).length

    const completionRate = total > 0 ? (completeRSVPs / total) * 100 : 0

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          total,
          attending,
          notAttending,
          pending,
          responseRate: Math.round(responseRate * 100) / 100,
          completionRate: Math.round(completionRate * 100) / 100
        },
        meals: {
          totalMeals,
          breakdown: mealBreakdown
        },
        plusOnes: {
          allowed: plusOneAllowed,
          confirmed: plusOneConfirmed,
          rate: Math.round(plusOneRate * 100) / 100
        },
        dietaryRestrictions: {
          total: withDietaryRestrictions,
          rate: Math.round(dietaryRestrictionsRate * 100) / 100,
          topRestrictions: topDietaryRestrictions
        },
        timeline: {
          recentResponses: recentResponses.length,
          dailyBreakdown: responseTimeline
        }
      }
    })

  } catch (error) {
    console.error('Error generating RSVP analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
