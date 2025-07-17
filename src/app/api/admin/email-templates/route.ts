import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

// Validation schema for email templates
const emailTemplateSchema = z.object({
  template_type: z.string().min(1, 'Template type is required'),
  subject: z.string().min(1, 'Subject is required'),
  html_content: z.string().min(1, 'HTML content is required'),
  text_content: z.string().optional(),
  is_active: z.boolean().optional().default(true)
})

const updateEmailTemplateSchema = emailTemplateSchema.partial().extend({
  id: z.string().uuid('Invalid template ID')
})

/**
 * GET /api/admin/email-templates
 * Retrieve all email templates
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

    // Get all email templates
    const { data: templates, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('template_type')

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      templates: templates || []
    })

  } catch (error) {
    console.error('Error in GET /api/admin/email-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/email-templates
 * Create a new email template
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
    const validatedData = emailTemplateSchema.parse(body)

    // Check if template type already exists
    const { data: existingTemplate } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('template_type', validatedData.template_type)
      .single()

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'A template with this type already exists' },
        { status: 400 }
      )
    }

    // Create new email template
    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating email template:', error)
      return NextResponse.json(
        { error: 'Failed to create email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Email template created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/admin/email-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/email-templates
 * Update an existing email template
 */
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    await requireAdmin()

    const body = await request.json()
    const validatedData = updateEmailTemplateSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Check if template exists
    const { data: existingTemplate, error: fetchError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    // Check for template type conflicts if type is being changed
    if (updateData.template_type && updateData.template_type !== existingTemplate.template_type) {
      const { data: conflictTemplate } = await supabaseAdmin
        .from('email_templates')
        .select('id')
        .eq('template_type', updateData.template_type)
        .neq('id', id)
        .single()

      if (conflictTemplate) {
        return NextResponse.json(
          { error: 'A template with this type already exists' },
          { status: 400 }
        )
      }
    }

    // Update email template
    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating email template:', error)
      return NextResponse.json(
        { error: 'Failed to update email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Email template updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/admin/email-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/email-templates
 * Delete an email template
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if template exists
    const { data: existingTemplate, error: fetchError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    // Check if template is being used in any campaigns
    const { data: campaigns, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('id')
      .eq('template_id', id)
      .limit(1)

    if (campaignError) {
      console.error('Error checking template usage:', campaignError)
      return NextResponse.json(
        { error: 'Failed to check template usage' },
        { status: 500 }
      )
    }

    if (campaigns && campaigns.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is being used in campaigns' },
        { status: 400 }
      )
    }

    // Delete email template
    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting email template:', error)
      return NextResponse.json(
        { error: 'Failed to delete email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email template deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/email-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
