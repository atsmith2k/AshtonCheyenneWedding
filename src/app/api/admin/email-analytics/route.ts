import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/email-analytics
 * Get email analytics and statistics
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

    // Get campaign statistics
    const { data: campaigns, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')

    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError)
      return NextResponse.json(
        { error: 'Failed to fetch campaign data' },
        { status: 500 }
      )
    }

    // Get email logs for detailed analytics
    const { data: emailLogs, error: logsError } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching email logs:', logsError)
      return NextResponse.json(
        { error: 'Failed to fetch email logs' },
        { status: 500 }
      )
    }

    // Calculate overall statistics
    const totalCampaigns = campaigns?.length || 0
    const totalEmailsSent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0
    const totalDelivered = campaigns?.reduce((sum, c) => sum + (c.delivered_count || 0), 0) || 0
    const totalOpened = campaigns?.reduce((sum, c) => sum + (c.opened_count || 0), 0) || 0
    const totalClicked = campaigns?.reduce((sum, c) => sum + (c.clicked_count || 0), 0) || 0
    const totalBounced = campaigns?.reduce((sum, c) => sum + (c.bounced_count || 0), 0) || 0

    // Calculate rates
    const deliveryRate = totalEmailsSent > 0 ? (totalDelivered / totalEmailsSent) * 100 : 0
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0
    const bounceRate = totalEmailsSent > 0 ? (totalBounced / totalEmailsSent) * 100 : 0

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentLogs = emailLogs?.filter(log => 
      new Date(log.sent_at) >= thirtyDaysAgo
    ) || []

    // Group by date for chart data
    const dailyStats: Record<string, {
      date: string
      sent: number
      delivered: number
      opened: number
      clicked: number
      bounced: number
    }> = {}

    recentLogs.forEach(log => {
      const date = new Date(log.sent_at).toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0
        }
      }
      
      dailyStats[date].sent++
      if (log.delivery_status === 'delivered') dailyStats[date].delivered++
      if (log.opened_at) dailyStats[date].opened++
      if (log.clicked_at) dailyStats[date].clicked++
      if (log.bounced_at) dailyStats[date].bounced++
    })

    const chartData = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Get campaign performance
    const campaignPerformance = campaigns?.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      sent_count: campaign.sent_count || 0,
      delivered_count: campaign.delivered_count || 0,
      opened_count: campaign.opened_count || 0,
      clicked_count: campaign.clicked_count || 0,
      bounced_count: campaign.bounced_count || 0,
      delivery_rate: campaign.sent_count > 0 ? ((campaign.delivered_count || 0) / campaign.sent_count) * 100 : 0,
      open_rate: campaign.delivered_count > 0 ? ((campaign.opened_count || 0) / campaign.delivered_count) * 100 : 0,
      click_rate: campaign.opened_count > 0 ? ((campaign.clicked_count || 0) / campaign.opened_count) * 100 : 0,
      bounce_rate: campaign.sent_count > 0 ? ((campaign.bounced_count || 0) / campaign.sent_count) * 100 : 0,
      sent_at: campaign.sent_at,
      completed_at: campaign.completed_at
    })) || []

    // Get template usage statistics
    const { data: templates, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select(`
        id,
        template_type,
        subject,
        email_campaigns (
          id,
          sent_count,
          delivered_count,
          opened_count,
          clicked_count
        )
      `)

    const templateStats = templates?.map(template => {
      const campaignStats = template.email_campaigns || []
      const totalSent = campaignStats.reduce((sum: number, c: any) => sum + (c.sent_count || 0), 0)
      const totalDelivered = campaignStats.reduce((sum: number, c: any) => sum + (c.delivered_count || 0), 0)
      const totalOpened = campaignStats.reduce((sum: number, c: any) => sum + (c.opened_count || 0), 0)
      const totalClicked = campaignStats.reduce((sum: number, c: any) => sum + (c.clicked_count || 0), 0)

      return {
        id: template.id,
        template_type: template.template_type,
        subject: template.subject,
        campaigns_count: campaignStats.length,
        total_sent: totalSent,
        total_delivered: totalDelivered,
        total_opened: totalOpened,
        total_clicked: totalClicked,
        open_rate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        click_rate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0
      }
    }) || []

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          total_campaigns: totalCampaigns,
          total_emails_sent: totalEmailsSent,
          total_delivered: totalDelivered,
          total_opened: totalOpened,
          total_clicked: totalClicked,
          total_bounced: totalBounced,
          delivery_rate: Math.round(deliveryRate * 100) / 100,
          open_rate: Math.round(openRate * 100) / 100,
          click_rate: Math.round(clickRate * 100) / 100,
          bounce_rate: Math.round(bounceRate * 100) / 100
        },
        chart_data: chartData,
        campaign_performance: campaignPerformance,
        template_stats: templateStats,
        recent_activity: recentLogs.slice(0, 50) // Last 50 activities
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/email-analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
