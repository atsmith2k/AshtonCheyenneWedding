import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

const DEFAULT_TEMPLATES = [
  {
    template_type: 'invitation',
    subject: 'You\'re Invited to Ashton & Cheyenne\'s Wedding! 💕',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ec4899; font-family: 'Georgia', serif; font-size: 32px; margin-bottom: 10px;">
            {{couple_names}}
          </h1>
          <p style="color: #6b7280; font-size: 18px; margin: 0;">
            are getting married!
          </p>
        </div>

        <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="color: #be185d; text-align: center; margin-bottom: 20px;">
            You're Invited! 💐
          </h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Dear {{guest_first_name}},
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We are thrilled to invite you to celebrate our special day! Your presence would mean the world to us as we begin this beautiful journey together.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #be185d; margin-bottom: 15px; text-align: center;">Wedding Details</h3>
            <p style="margin: 8px 0; color: #374151;"><strong>📅 Date:</strong> {{wedding_date}}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>🕐 Time:</strong> {{wedding_time}}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>📍 Venue:</strong> {{wedding_venue}}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>📍 Address:</strong> {{wedding_address}}</p>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="{{website_url}}/invitation?code={{invitation_code}}" 
             style="background: #ec4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            RSVP Now
          </a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
            Please RSVP by {{rsvp_deadline}}
          </p>
        </div>

        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>We can't wait to celebrate with you!</p>
          <p style="margin-top: 20px;">
            With love,<br>
            <strong style="color: #ec4899;">{{couple_names}}</strong> ❤️
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

      Please RSVP by visiting: {{website_url}}/invitation?code={{invitation_code}}
      RSVP Deadline: {{rsvp_deadline}}

      We can't wait to celebrate with you!

      With love,
      {{couple_names}}
    `,
    is_active: true
  },
  {
    template_type: 'rsvp_reminder',
    subject: 'RSVP Reminder - {{couple_names}} Wedding',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ec4899; font-family: 'Georgia', serif; font-size: 28px;">
            RSVP Reminder
          </h1>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px;">
          <p style="color: #92400e; font-weight: bold; margin: 0;">
            ⏰ Friendly Reminder
          </p>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi {{guest_first_name}},
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We hope you're as excited as we are for our upcoming wedding! We noticed we haven't received your RSVP yet, and we'd love to know if you'll be able to join us on our special day.
        </p>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #be185d; margin-bottom: 15px;">Quick Reminder:</h3>
          <p style="margin: 8px 0; color: #374151;"><strong>Wedding Date:</strong> {{wedding_date}}</p>
          <p style="margin: 8px 0; color: #374151;"><strong>RSVP Deadline:</strong> {{rsvp_deadline}}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{website_url}}/invitation?code={{invitation_code}}" 
             style="background: #ec4899; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            RSVP Now
          </a>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for taking the time to respond. Your presence would mean so much to us!
        </p>

        <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
          <p>
            With love,<br>
            <strong style="color: #ec4899;">{{couple_names}}</strong>
          </p>
        </div>
      </div>
    `,
    text_content: `
      RSVP Reminder - {{couple_names}} Wedding

      Hi {{guest_first_name}},

      We hope you're as excited as we are for our upcoming wedding! We noticed we haven't received your RSVP yet, and we'd love to know if you'll be able to join us on our special day.

      Quick Reminder:
      Wedding Date: {{wedding_date}}
      RSVP Deadline: {{rsvp_deadline}}

      Please RSVP by visiting: {{website_url}}/invitation?code={{invitation_code}}

      Thank you for taking the time to respond. Your presence would mean so much to us!

      With love,
      {{couple_names}}
    `,
    is_active: true
  },
  {
    template_type: 'thank_you',
    subject: 'Thank You from {{couple_names}}! 💕',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ec4899; font-family: 'Georgia', serif; font-size: 28px;">
            Thank You! 💕
          </h1>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Dear {{guest_first_name}},
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We are overwhelmed with gratitude for the love, joy, and celebration you brought to our wedding day. Your presence made our special day even more meaningful and memorable.
        </p>

        <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
          <h2 style="color: #be185d; margin-bottom: 15px;">
            Our Hearts Are Full ❤️
          </h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for being part of our love story and for helping us celebrate the beginning of our journey as husband and wife.
          </p>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We are so blessed to have friends and family like you in our lives. The memories we created together will be treasured forever.
        </p>

        <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 40px;">
          <p>
            With all our love and gratitude,<br>
            <strong style="color: #ec4899;">{{couple_names}}</strong>
          </p>
        </div>
      </div>
    `,
    text_content: `
      Thank You from {{couple_names}}!

      Dear {{guest_first_name}},

      We are overwhelmed with gratitude for the love, joy, and celebration you brought to our wedding day. Your presence made our special day even more meaningful and memorable.

      Thank you for being part of our love story and for helping us celebrate the beginning of our journey as husband and wife.

      We are so blessed to have friends and family like you in our lives. The memories we created together will be treasured forever.

      With all our love and gratitude,
      {{couple_names}}
    `,
    is_active: true
  }
]

/**
 * POST /api/admin/email-templates/initialize
 * Initialize default email templates
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
    await requireAdmin()

    // Check if templates already exist
    const { data: existingTemplates, error: checkError } = await supabaseAdmin
      .from('email_templates')
      .select('template_type')

    if (checkError) {
      console.error('Error checking existing templates:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing templates' },
        { status: 500 }
      )
    }

    const existingTypes = existingTemplates?.map(t => t.template_type) || []
    const templatesToCreate = DEFAULT_TEMPLATES.filter(
      template => !existingTypes.includes(template.template_type)
    )

    if (templatesToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Default templates already exist',
        created: 0
      })
    }

    // Insert new templates
    const { data: createdTemplates, error } = await supabaseAdmin
      .from('email_templates')
      .insert(templatesToCreate.map(template => ({
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))
      .select()

    if (error) {
      console.error('Error creating default templates:', error)
      return NextResponse.json(
        { error: 'Failed to create default templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Created ${templatesToCreate.length} default email templates`,
      created: templatesToCreate.length,
      templates: createdTemplates
    })

  } catch (error) {
    console.error('Error in POST /api/admin/email-templates/initialize:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
