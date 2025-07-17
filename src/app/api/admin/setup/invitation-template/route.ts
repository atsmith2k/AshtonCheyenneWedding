import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

const INVITATION_TEMPLATE = {
  template_type: 'invitation',
  subject: 'You\'re Invited to Ashton & Cheyenne\'s Wedding! 💕',
  html_content: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ec4899; font-family: 'Georgia', serif; font-size: 32px; margin-bottom: 10px;">
          {{couple_names}}
        </h1>
        <p style="color: #6b7280; font-size: 18px; margin: 0;">
          are getting married!
        </p>
      </div>

      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h2 style="color: #be185d; text-align: center; margin-bottom: 20px; font-size: 24px;">
          You're Invited! 💐
        </h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Dear {{guest_first_name}},
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We are thrilled to invite you to celebrate our special day! Your presence would mean the world to us as we begin this beautiful journey together.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899;">
          <h3 style="color: #be185d; margin-bottom: 15px; text-align: center; font-size: 18px;">Wedding Details</h3>
          <p style="margin: 8px 0; color: #374151;"><strong>📅 Date:</strong> {{wedding_date}}</p>
          <p style="margin: 8px 0; color: #374151;"><strong>🕐 Time:</strong> {{wedding_time}}</p>
          <p style="margin: 8px 0; color: #374151;"><strong>📍 Venue:</strong> {{wedding_venue}}</p>
          <p style="margin: 8px 0; color: #374151;"><strong>📍 Address:</strong> {{wedding_address}}</p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Your Invitation Code:</strong> {{invitation_code}}
          </p>
          <p style="margin: 5px 0 0 0; color: #92400e; font-size: 12px;">
            Use this code to access our wedding website and submit your RSVP.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <a href="{{website_url}}/invitation?code={{invitation_code}}" 
           style="background: #ec4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
          RSVP Now
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
          Please RSVP by {{rsvp_deadline}}
        </p>
      </div>

      <div style="text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p>We can't wait to celebrate with you!</p>
        <p style="margin-top: 20px;">
          With love,<br>
          <strong style="color: #ec4899;">{{couple_names}}</strong> ❤️
        </p>
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
          If you have any questions, please don't hesitate to reach out to us.
        </p>
      </div>
    </div>
  `,
  text_content: `
{{couple_names}} - Wedding Invitation

Dear {{guest_first_name}},

You're invited to celebrate our wedding!

Wedding Details:
Date: {{wedding_date}}
Time: {{wedding_time}}
Venue: {{wedding_venue}}
Address: {{wedding_address}}

Your Invitation Code: {{invitation_code}}

Please RSVP by visiting: {{website_url}}/invitation?code={{invitation_code}}
RSVP Deadline: {{rsvp_deadline}}

We can't wait to celebrate with you!

With love,
{{couple_names}}
  `,
  is_active: true
}

/**
 * POST /api/admin/setup/invitation-template
 * Initialize the default invitation email template
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

    // Check if invitation template already exists
    const { data: existingTemplate, error: checkError } = await supabaseAdmin
      .from('email_templates')
      .select('id, template_type, subject')
      .eq('template_type', 'invitation')
      .single()

    if (existingTemplate && !checkError) {
      return NextResponse.json({
        success: true,
        message: 'Invitation template already exists',
        template: {
          id: existingTemplate.id,
          template_type: existingTemplate.template_type,
          subject: existingTemplate.subject
        }
      })
    }

    // Create the invitation template
    const { data: newTemplate, error: createError } = await supabaseAdmin
      .from('email_templates')
      .insert(INVITATION_TEMPLATE)
      .select()
      .single()

    if (createError) {
      console.error('Error creating invitation template:', createError)
      return NextResponse.json(
        { error: 'Failed to create invitation template', details: createError.message },
        { status: 500 }
      )
    }

    // Log the action
    console.log(`Admin ${adminUser.email} initialized invitation email template`)

    return NextResponse.json({
      success: true,
      message: 'Invitation email template created successfully',
      template: {
        id: newTemplate.id,
        template_type: newTemplate.template_type,
        subject: newTemplate.subject
      }
    })

  } catch (error) {
    console.error('Error initializing invitation template:', error)

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

/**
 * GET /api/admin/setup/invitation-template
 * Check if invitation template exists
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

    // Check if invitation template exists
    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .select('id, template_type, subject, is_active')
      .eq('template_type', 'invitation')
      .single()

    if (error || !template) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'Invitation template not found'
      })
    }

    return NextResponse.json({
      success: true,
      exists: true,
      template: {
        id: template.id,
        template_type: template.template_type,
        subject: template.subject,
        is_active: template.is_active
      }
    })

  } catch (error) {
    console.error('Error checking invitation template:', error)

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
