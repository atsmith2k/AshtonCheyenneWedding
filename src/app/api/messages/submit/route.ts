import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - this route uses database operations
export const dynamic = 'force-dynamic'
import { z } from 'zod'

// Message validation schema
const messageSchema = z.object({
  guestId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  isUrgent: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()

    // Validate request data
    const validatedData = messageSchema.parse(body)

    // Check if guest exists
    const { data: guest, error: guestError } = await supabaseAdmin
      .from('guests')
      .select('id, first_name, last_name, email')
      .eq('id', validatedData.guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Insert message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        guest_id: validatedData.guestId,
        subject: validatedData.subject,
        message: validatedData.message,
        is_urgent: validatedData.isUrgent,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error inserting message:', messageError)
      return NextResponse.json(
        { error: 'Failed to submit message' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: 'message_submit',
        guest_id: validatedData.guestId,
        metadata: {
          subject: validatedData.subject,
          is_urgent: validatedData.isUrgent
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Message submitted successfully',
      data: message
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get all messages for admin (with guest information)
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        guests (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Transform the data to match frontend expectations
    // Supabase returns joined data under the table name 'guests', but frontend expects 'guest'
    const transformedMessages = messages?.map(message => ({
      ...message,
      guest: message.guests || null, // Transform 'guests' to 'guest' and handle null case
      guests: undefined // Remove the original 'guests' property
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedMessages
    })

  } catch (error) {
    console.error('Error in messages GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
