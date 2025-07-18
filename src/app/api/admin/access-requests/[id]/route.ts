import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessRequestUpdateSchema } from '@/lib/validation'
import { decrypt } from '@/lib/crypto'
import { approveAccessRequestWorkflow } from '@/lib/guest-creation'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/access-requests/[id]
 * Get a specific access request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdmin()

    // Await params in Next.js 15
    const { id } = await params

    const { data: accessRequest, error } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !accessRequest) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      )
    }

    // Decrypt sensitive data for admin view
    const decryptedRequest = {
      ...accessRequest,
      phone: decrypt(accessRequest.phone),
      address: decrypt(accessRequest.address)
    }

    return NextResponse.json(decryptedRequest)

  } catch (error) {
    console.error('Error fetching access request:', error)
    
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
 * PATCH /api/admin/access-requests/[id]
 * Update an access request (approve/deny)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdmin()

    // Await params in Next.js 15
    const { id } = await params

    const body = await request.json()
    const validatedData = accessRequestUpdateSchema.parse(body)

    // Handle approval workflow with automated guest creation
    if (validatedData.status === 'approved') {
      const workflowResult = await approveAccessRequestWorkflow(
        id,
        adminUser.id,
        validatedData.admin_notes,
        validatedData.send_invitation
      )

      if (!workflowResult.success) {
        return NextResponse.json(
          { error: workflowResult.error || 'Failed to approve access request' },
          { status: 400 }
        )
      }

      // Fetch the updated request to return to client
      const { data: updatedRequest, error: fetchError } = await supabaseAdmin
        .from('access_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !updatedRequest) {
        return NextResponse.json(
          { error: 'Failed to fetch updated request' },
          { status: 500 }
        )
      }

      // Return success with guest creation details
      const responseData = {
        ...updatedRequest,
        phone: decrypt(updatedRequest.phone),
        address: decrypt(updatedRequest.address)
      }

      return NextResponse.json({
        success: true,
        request: responseData,
        guest_created: true,
        guest_id: workflowResult.guestId,
        invitation_code: workflowResult.invitationCode,
        invitation_sent: validatedData.send_invitation
      })
    }

    // Handle denial or other status updates (non-approval workflow)
    const now = new Date().toISOString()
    const updateData: any = {
      status: validatedData.status,
      updated_at: now,
      admin_notes: validatedData.admin_notes || null
    }

    if (validatedData.status === 'denied') {
      updateData.approved_by = null
      updateData.approved_at = null
    }

    // Update the access request
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('access_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating access request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update access request' },
        { status: 500 }
      )
    }

    // Return the updated request with decrypted data for admin view
    const responseData = {
      ...updatedRequest,
      phone: decrypt(updatedRequest.phone),
      address: decrypt(updatedRequest.address)
    }

    return NextResponse.json({
      success: true,
      request: responseData,
      guest_created: false
    })

  } catch (error) {
    console.error('Error updating access request:', error)

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

/**
 * DELETE /api/admin/access-requests/[id]
 * Delete an access request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdmin()

    // Await params in Next.js 15
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('access_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting access request:', error)
      return NextResponse.json(
        { error: 'Failed to delete access request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Access request deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting access request:', error)
    
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
