import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { accessRequestSchema } from '@/lib/validation'
import { encrypt } from '@/lib/crypto'
import { sendEmail } from '@/lib/email-service'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

/**
 * POST /api/access-requests
 * Submit a new access request from a potential guest
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Add timestamp for validation
    const requestData = {
      ...body,
      timestamp: Date.now()
    }

    const validatedData = accessRequestSchema.parse(requestData)

    // Check for duplicate email submissions within 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: existingRequest, error: checkError } = await supabaseAdmin
      .from('access_requests')
      .select('id, email, created_at')
      .eq('email', validatedData.email.toLowerCase())
      .gte('created_at', twentyFourHoursAgo)
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { 
          error: 'An access request with this email was already submitted recently. Please wait 24 hours before submitting another request.',
          code: 'DUPLICATE_REQUEST'
        },
        { status: 409 }
      )
    }

    // Encrypt sensitive data
    const encryptedPhone = encrypt(validatedData.phone)
    const encryptedAddress = encrypt(validatedData.address)

    // Insert access request into database
    const { data: accessRequest, error: insertError } = await supabaseAdmin
      .from('access_requests')
      .insert({
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        phone: encryptedPhone,
        address: encryptedAddress,
        message: validatedData.message || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting access request:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit access request. Please try again.' },
        { status: 500 }
      )
    }

    // Send notification email to admins
    try {
      const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(email => email.trim()) || []
      
      for (const adminEmail of adminEmails) {
        await sendEmail({
          to: adminEmail,
          subject: 'New Wedding Access Request',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ec4899;">New Access Request</h2>
              <p>A new access request has been submitted for your wedding website:</p>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details</h3>
                <p><strong>Name:</strong> ${validatedData.name}</p>
                <p><strong>Email:</strong> ${validatedData.email}</p>
                <p><strong>Phone:</strong> ${validatedData.phone}</p>
                <p><strong>Address:</strong> ${validatedData.address}</p>
                ${validatedData.message ? `<p><strong>Message:</strong> ${validatedData.message}</p>` : ''}
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/access-requests" 
                   style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Review Request
                </a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px;">
                You can approve or deny this request from your admin dashboard.
              </p>
            </div>
          `,
          textContent: `
New Access Request

Name: ${validatedData.name}
Email: ${validatedData.email}
Phone: ${validatedData.phone}
Address: ${validatedData.address}
${validatedData.message ? `Message: ${validatedData.message}` : ''}

Review this request at: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/access-requests
          `
        })
      }
    } catch (emailError) {
      console.error('Error sending admin notification email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully. You will receive an email if your request is approved.',
      request_id: accessRequest.id
    })

  } catch (error) {
    console.error('Error processing access request:', error)

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

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/access-requests
 * Get access request status (for checking submission status)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const requestId = searchParams.get('request_id')

    if (!email && !requestId) {
      return NextResponse.json(
        { error: 'Email or request ID is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    let query = supabaseAdmin
      .from('access_requests')
      .select('id, status, created_at, updated_at')

    if (requestId) {
      query = query.eq('id', requestId)
    } else if (email) {
      query = query.eq('email', email.toLowerCase())
    }

    const { data: requests, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching access request:', error)
      return NextResponse.json(
        { error: 'Failed to check request status' },
        { status: 500 }
      )
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json(
        { error: 'No access request found' },
        { status: 404 }
      )
    }

    // Return the most recent request
    const request_data = requests[0]
    
    return NextResponse.json({
      request_id: request_data.id,
      status: request_data.status,
      submitted_at: request_data.created_at,
      updated_at: request_data.updated_at
    })

  } catch (error) {
    console.error('Error checking access request status:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
