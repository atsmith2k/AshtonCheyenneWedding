import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessRequestUpdateSchema, bulkAccessRequestSchema } from '@/lib/validation'
import { decrypt } from '@/lib/crypto'
import { approveAccessRequestWorkflow } from '@/lib/guest-creation'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/access-requests
 * Get all access requests for admin management
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
    const adminUser = await requireAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('access_requests')
      .select('*', { count: 'exact' })

    // Filter by status if provided
    if (status && ['pending', 'approved', 'denied'].includes(status)) {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    const { data: requests, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching access requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch access requests' },
        { status: 500 }
      )
    }

    // Decrypt sensitive data for admin view
    const decryptedRequests = requests?.map(request => ({
      ...request,
      phone: decrypt(request.phone),
      address: decrypt(request.address)
    })) || []

    return NextResponse.json({
      requests: decryptedRequests,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in admin access requests GET:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/access-requests
 * Bulk actions on access requests
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

    const body = await request.json()
    const validatedData = bulkAccessRequestSchema.parse(body)

    const { request_ids, action, admin_notes, send_invitations } = validatedData

    // Fetch the requests to be updated
    const { data: requests, error: fetchError } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .in('id', request_ids)

    if (fetchError) {
      console.error('Error fetching requests for bulk action:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json(
        { error: 'No requests found with the provided IDs' },
        { status: 404 }
      )
    }

    const results = []
    const now = new Date().toISOString()

    for (const accessRequest of requests) {
      try {
        if (action === 'delete') {
          // Delete the request
          const { error: deleteError } = await supabaseAdmin
            .from('access_requests')
            .delete()
            .eq('id', accessRequest.id)

          if (deleteError) {
            results.push({
              request_id: accessRequest.id,
              success: false,
              error: 'Failed to delete request'
            })
          } else {
            results.push({
              request_id: accessRequest.id,
              success: true,
              action: 'deleted'
            })
          }
        } else if (action === 'approve') {
          // Use the automated approval workflow
          const workflowResult = await approveAccessRequestWorkflow(
            accessRequest.id,
            adminUser.id,
            admin_notes,
            send_invitations
          )

          if (workflowResult.success) {
            results.push({
              request_id: accessRequest.id,
              success: true,
              action: 'approved',
              guest_created: true,
              guest_id: workflowResult.guestId,
              invitation_code: workflowResult.invitationCode,
              send_invitation: send_invitations
            })
          } else {
            results.push({
              request_id: accessRequest.id,
              success: false,
              error: workflowResult.error || 'Failed to approve request'
            })
          }
        } else {
          // Handle denial
          const updateData: any = {
            status: 'denied',
            updated_at: now,
            admin_notes: admin_notes || null
          }

          const { error: updateError } = await supabaseAdmin
            .from('access_requests')
            .update(updateData)
            .eq('id', accessRequest.id)

          if (updateError) {
            results.push({
              request_id: accessRequest.id,
              success: false,
              error: 'Failed to update request'
            })
          } else {
            results.push({
              request_id: accessRequest.id,
              success: true,
              action: 'denied'
            })
          }
        }
      } catch (requestError) {
        console.error(`Error processing request ${accessRequest.id}:`, requestError)
        results.push({
          request_id: accessRequest.id,
          success: false,
          error: 'Unexpected error processing request'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    })

  } catch (error) {
    console.error('Error in bulk access request action:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
