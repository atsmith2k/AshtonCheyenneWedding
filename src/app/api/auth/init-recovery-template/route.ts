import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const RECOVERY_TEMPLATE = {
  template_type: 'invitation_recovery',
  subject: 'Your Wedding Invitation Code - {{couple_names}}',
  html_content: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ec4899; font-family: 'Georgia', serif; font-size: 28px;">
          {{couple_names}}
        </h1>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
          Wedding Invitation Code
        </p>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Hi {{guest_first_name}},
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        You requested your invitation code for our wedding website. Here it is:
      </p>

      <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; border: 2px solid #ec4899;">
        <h2 style="color: #be185d; font-size: 24px; letter-spacing: 3px; margin: 0; font-family: 'Courier New', monospace;">
          {{invitation_code}}
        </h2>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{website_url}}/landing"
           style="background: #ec4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Access Wedding Website
        </a>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Use this code to access our wedding website and submit your RSVP. We can't wait to celebrate with you!
      </p>

      <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 40px;">
        <p>
          With love,<br>
          <strong style="color: #ec4899;">{{couple_names}}</strong> ❤️
        </p>
      </div>
    </div>
  `,
  text_content: `
    {{couple_names}} - Wedding Invitation Code

    Hi {{guest_first_name}},

    You requested your invitation code for our wedding website. Here it is:

    Invitation Code: {{invitation_code}}

    Use this code to access our wedding website: {{website_url}}/landing

    We can't wait to celebrate with you!

    With love,
    {{couple_names}}
  `,
  is_active: true
}

/**
 * POST /api/auth/init-recovery-template
 * Initialize the invitation recovery email template
 * This endpoint can be called without admin auth since it's needed for public recovery functionality
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check if recovery template already exists
    const { data: existingTemplate, error: checkError } = await supabaseAdmin
      .from('email_templates')
      .select('id, template_type, subject, is_active')
      .eq('template_type', 'invitation_recovery')
      .single()

    if (existingTemplate && !checkError) {
      return NextResponse.json({
        success: true,
        message: 'Invitation recovery template already exists',
        template: {
          id: existingTemplate.id,
          template_type: existingTemplate.template_type,
          subject: existingTemplate.subject,
          is_active: existingTemplate.is_active
        }
      })
    }

    // Create the recovery template
    const { data: newTemplate, error: createError } = await supabaseAdmin
      .from('email_templates')
      .insert({
        ...RECOVERY_TEMPLATE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating recovery template:', createError)
      return NextResponse.json(
        { error: 'Failed to create recovery template', details: createError.message },
        { status: 500 }
      )
    }

    console.log('✅ Invitation recovery template created successfully')

    return NextResponse.json({
      success: true,
      message: 'Invitation recovery template created successfully',
      template: {
        id: newTemplate.id,
        template_type: newTemplate.template_type,
        subject: newTemplate.subject,
        is_active: newTemplate.is_active
      }
    })

  } catch (error) {
    console.error('Error initializing recovery template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/init-recovery-template
 * Check if recovery template exists
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check if recovery template exists
    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .select('id, template_type, subject, is_active, created_at')
      .eq('template_type', 'invitation_recovery')
      .single()

    if (error || !template) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: 'Invitation recovery template not found'
      })
    }

    return NextResponse.json({
      success: true,
      exists: true,
      template: {
        id: template.id,
        template_type: template.template_type,
        subject: template.subject,
        is_active: template.is_active,
        created_at: template.created_at
      }
    })

  } catch (error) {
    console.error('Error checking recovery template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
