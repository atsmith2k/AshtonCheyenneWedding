import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

const PHOTO_EMAIL_TEMPLATES = [
  {
    template_type: 'photo_approved',
    subject: 'Your Photos Have Been Approved! 📸',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ec4899; font-family: 'Georgia', serif; font-size: 32px; margin-bottom: 10px;">
            {{couple_names}}
          </h1>
          <p style="color: #6b7280; font-size: 18px; margin: 0;">
            Wedding Photo Update
          </p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #15803d; margin-top: 0; margin-bottom: 15px;">
            🎉 Great News, {{guest_first_name}}!
          </h2>
          <p style="color: #166534; margin-bottom: 15px;">
            Your {{photo_count}} photo{{photo_count > 1 ? 's have' : ' has'}} been approved and {{photo_count > 1 ? 'are' : 'is'}} now live in our wedding gallery!
          </p>
          <div style="background: white; border-radius: 6px; padding: 15px; margin-top: 15px;">
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong>Approved Photos:</strong><br>
              {{photos_list}}
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="{{website_url}}/wedding/photos" 
             style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Gallery
          </a>
        </div>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">Thank You for Sharing!</h3>
          <p style="color: #6b7280; margin-bottom: 15px;">
            We love seeing our special moments through your eyes. Your photos help us relive the joy and create lasting memories.
          </p>
          <p style="color: #6b7280; margin: 0;">
            Feel free to upload more photos anytime - we'd love to see them all!
          </p>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            With love,<br>
            {{couple_names}}
          </p>
        </div>
      </div>
    `,
    text_content: `
Dear {{guest_first_name}},

Great news! Your {{photo_count}} photo{{photo_count > 1 ? 's have' : ' has'}} been approved and {{photo_count > 1 ? 'are' : 'is'}} now live in our wedding gallery!

Approved Photos:
{{photos_list}}

You can view the gallery at: {{website_url}}/wedding/photos

Thank you for sharing these special moments with us. We love seeing our wedding through your eyes!

Feel free to upload more photos anytime - we'd love to see them all.

With love,
{{couple_names}}
    `,
    is_active: true
  },
  {
    template_type: 'photo_denied',
    subject: 'Photo Upload Update - Action Needed 📸',
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ec4899; font-family: 'Georgia', serif; font-size: 32px; margin-bottom: 10px;">
            {{couple_names}}
          </h1>
          <p style="color: #6b7280; font-size: 18px; margin: 0;">
            Wedding Photo Update
          </p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">
            📸 Photo Review Update
          </h2>
          <p style="color: #92400e; margin-bottom: 15px;">
            Hi {{guest_first_name}}, we've reviewed your recent photo upload{{photo_count > 1 ? 's' : ''}} and have some feedback for you.
          </p>
          <div style="background: white; border-radius: 6px; padding: 15px; margin-top: 15px;">
            <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
              <strong>Photos needing attention:</strong><br>
              {{photos_list}}
            </p>
            {{#if moderation_notes}}
            <div style="background: #fef2f2; border-left: 4px solid #f87171; padding: 12px; margin-top: 15px;">
              <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Feedback:</strong><br>
                {{moderation_notes}}
              </p>
            </div>
            {{/if}}
          </div>
        </div>

        <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #0369a1; margin-top: 0; margin-bottom: 15px;">What's Next?</h3>
          <p style="color: #0c4a6e; margin-bottom: 15px;">
            Don't worry - this happens sometimes! You can:
          </p>
          <ul style="color: #0c4a6e; margin-bottom: 15px; padding-left: 20px;">
            <li>Review the feedback above</li>
            <li>Make any necessary adjustments to your photos</li>
            <li>Upload new versions when ready</li>
          </ul>
          <p style="color: #0c4a6e; margin: 0;">
            We're here to help if you have any questions!
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="{{website_url}}/wedding/photos?tab=upload" 
             style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Upload New Photos
          </a>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Thank you for understanding,<br>
            {{couple_names}}
          </p>
        </div>
      </div>
    `,
    text_content: `
Dear {{guest_first_name}},

We've reviewed your recent photo upload{{photo_count > 1 ? 's' : ''}} and have some feedback for you.

Photos needing attention:
{{photos_list}}

{{#if moderation_notes}}
Feedback: {{moderation_notes}}
{{/if}}

What's Next?
- Review the feedback above
- Make any necessary adjustments to your photos  
- Upload new versions when ready

You can upload new photos at: {{website_url}}/wedding/photos

We're here to help if you have any questions!

Thank you for understanding,
{{couple_names}}
    `,
    is_active: true
  }
]

/**
 * POST /api/admin/email-templates/photo-notifications
 * Initialize photo notification email templates
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

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[]
    }

    for (const template of PHOTO_EMAIL_TEMPLATES) {
      try {
        // Check if template already exists
        const { data: existing, error: checkError } = await supabaseAdmin
          .from('email_templates')
          .select('id')
          .eq('template_type', template.template_type)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError
        }

        if (existing) {
          // Update existing template
          const { error: updateError } = await supabaseAdmin
            .from('email_templates')
            .update({
              subject: template.subject,
              html_content: template.html_content,
              text_content: template.text_content,
              is_active: template.is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          if (updateError) {
            throw updateError
          }

          results.updated++
        } else {
          // Create new template
          const { error: insertError } = await supabaseAdmin
            .from('email_templates')
            .insert({
              template_type: template.template_type,
              subject: template.subject,
              html_content: template.html_content,
              text_content: template.text_content,
              is_active: template.is_active,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (insertError) {
            throw insertError
          }

          results.created++
        }
      } catch (error) {
        console.error(`Error processing template ${template.template_type}:`, error)
        results.errors.push(`${template.template_type}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Photo notification templates initialized: ${results.created} created, ${results.updated} updated`,
      data: results
    })

  } catch (error) {
    console.error('Error initializing photo notification templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
