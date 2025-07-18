import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdminFromRequest } from '@/lib/admin-auth'
import { MessageAnalytics } from '@/types/analytics'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/messages/analytics
 * Get comprehensive message analytics for the admin dashboard
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

    // Get all messages with guest information
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        guest_id,
        subject,
        message,
        response,
        status,
        is_urgent,
        created_at,
        responded_at
      `)

    if (error) {
      console.error('Error fetching message analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch message analytics' },
        { status: 500 }
      )
    }

    // Calculate basic statistics
    const totalMessages = messages.length
    const newMessages = messages.filter(m => m.status === 'new').length
    const respondedMessages = messages.filter(m => m.status === 'responded').length
    const archivedMessages = messages.filter(m => m.status === 'archived').length
    const urgentMessages = messages.filter(m => m.is_urgent).length
    
    const responseRate = totalMessages > 0 
      ? ((respondedMessages + archivedMessages) / totalMessages) * 100 
      : 0

    // Calculate average response time for responded messages
    const respondedWithTimes = messages.filter(m => 
      m.status === 'responded' && m.responded_at && m.created_at
    )
    
    const totalResponseTime = respondedWithTimes.reduce((sum, message) => {
      const created = new Date(message.created_at).getTime()
      const responded = new Date(message.responded_at!).getTime()
      return sum + (responded - created)
    }, 0)
    
    const averageResponseTimeHours = respondedWithTimes.length > 0 
      ? (totalResponseTime / respondedWithTimes.length) / (1000 * 60 * 60)
      : 0

    // Calculate timeline statistics
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentMessages = messages.filter(m => 
      new Date(m.created_at) >= sevenDaysAgo
    ).length

    // Calculate messages by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const messagesByDay: Record<string, number> = {}
    let peakDay = ''
    let peakCount = 0
    
    messages
      .filter(m => new Date(m.created_at) >= thirtyDaysAgo)
      .forEach(message => {
        const date = new Date(message.created_at).toISOString().split('T')[0]
        messagesByDay[date] = (messagesByDay[date] || 0) + 1
        
        if (messagesByDay[date] > peakCount) {
          peakCount = messagesByDay[date]
          peakDay = date
        }
      })

    // Calculate category statistics
    const urgentCount = urgentMessages
    const generalCount = totalMessages - urgentCount
    const responseNeeded = newMessages + messages.filter(m => 
      m.status === 'responded' && !m.response
    ).length
    const informationalCount = messages.filter(m => 
      m.status === 'archived' || (m.status === 'responded' && m.response)
    ).length

    // Calculate guest engagement statistics
    const uniqueGuests = new Set(messages.map(m => m.guest_id)).size
    const guestMessageCounts: Record<string, number> = {}
    
    messages.forEach(message => {
      guestMessageCounts[message.guest_id] = (guestMessageCounts[message.guest_id] || 0) + 1
    })
    
    const repeatMessagers = Object.values(guestMessageCounts).filter(count => count > 1).length
    const averageMessagesPerGuest = uniqueGuests > 0 ? totalMessages / uniqueGuests : 0

    const analytics: MessageAnalytics = {
      overview: {
        total_messages: totalMessages,
        new_messages: newMessages,
        responded_messages: respondedMessages,
        archived_messages: archivedMessages,
        urgent_messages: urgentMessages,
        response_rate: Math.round(responseRate * 100) / 100,
        average_response_time_hours: Math.round(averageResponseTimeHours * 100) / 100
      },
      timeline: {
        messages_by_day: messagesByDay,
        recent_messages_7_days: recentMessages,
        peak_messaging_day: peakDay
      },
      categories: {
        urgent_count: urgentCount,
        general_count: generalCount,
        response_needed: responseNeeded,
        informational: informationalCount
      },
      guest_engagement: {
        unique_guests_messaging: uniqueGuests,
        repeat_messagers: repeatMessagers,
        average_messages_per_guest: Math.round(averageMessagesPerGuest * 100) / 100
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Error in message analytics API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message analytics' },
      { status: 500 }
    )
  }
}
