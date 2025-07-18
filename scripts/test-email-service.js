#!/usr/bin/env node

/**
 * Test script to verify the email service template processing
 * This simulates the email service behavior without sending actual emails
 */

const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envLocalPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      const value = valueParts.join('=').trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

// Simulate the email service functions
function getDefaultVariables() {
  return {
    couple_names: 'Ashton & Cheyenne',
    wedding_date: 'September 12, 2026',
    wedding_venue: 'The Otisco Disco',
    website_url: process.env.NEXT_PUBLIC_APP_URL || 'https://ashtonandcheyenne.com',
    rsvp_deadline: 'September 1, 2026'
  }
}

function getGuestVariables(guestData) {
  return {
    guest_first_name: guestData.first_name,
    guest_last_name: guestData.last_name,
    guest_full_name: `${guestData.first_name} ${guestData.last_name}`,
    invitation_code: guestData.invitation_code
  }
}

function replaceTemplateVariables(content, variables) {
  let processedContent = content

  // Replace all variables in the format {{variable_name}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      processedContent = processedContent.replace(regex, value)
    }
  })

  // Remove any unreplaced variables
  processedContent = processedContent.replace(/{{[^}]+}}/g, '[UNREPLACED]')

  return processedContent
}

// Mock template (invitation_recovery)
const mockTemplate = {
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

      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #fef7ff; border: 2px solid #ec4899; border-radius: 8px; padding: 20px; display: inline-block;">
          <p style="color: #ec4899; font-size: 24px; font-weight: bold; margin: 0; font-family: 'Courier New', monospace;">
            {{invitation_code}}
          </p>
        </div>
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

// Mock guest data
const mockGuest = {
  first_name: 'John',
  last_name: 'Doe',
  invitation_code: 'ABC123',
  email: 'john.doe@example.com'
}

// Mock additional variables
const additionalVariables = {
  website_url: process.env.NEXT_PUBLIC_APP_URL || 'https://ashtonandcheyenne.com'
}

console.log('🧪 Testing Email Service Template Processing')
console.log('=' .repeat(60))

console.log('\n📋 Environment Check:')
console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || '[NOT SET]'}`)

// Simulate the email service processing
const defaultVariables = getDefaultVariables()
const guestVariables = getGuestVariables(mockGuest)

const allVariables = {
  ...defaultVariables,
  ...guestVariables,
  ...additionalVariables
}

console.log('\n🔧 Combined Variables:')
Object.entries(allVariables).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`)
})

// Process template
const processedSubject = replaceTemplateVariables(mockTemplate.subject, allVariables)
const processedHtmlContent = replaceTemplateVariables(mockTemplate.html_content, allVariables)
const processedTextContent = replaceTemplateVariables(mockTemplate.text_content, allVariables)

console.log('\n📧 Processed Email Content:')
console.log('-'.repeat(40))

console.log('\n📌 Subject:')
console.log(processedSubject)

console.log('\n📝 Text Content:')
console.log(processedTextContent.trim())

// Validation
console.log('\n🔍 Validation:')
const hasUnreplacedVars = [processedSubject, processedHtmlContent, processedTextContent]
  .some(content => content.includes('[UNREPLACED]'))

if (hasUnreplacedVars) {
  console.log('❌ Found unreplaced variables!')
} else {
  console.log('✅ All variables replaced successfully!')
}

// Check for the specific website URL link
const expectedLink = `${allVariables.website_url}/landing`
const hasCorrectLink = processedTextContent.includes(expectedLink)

console.log(`\n🔗 Website Link Check:`)
console.log(`Expected: ${expectedLink}`)
console.log(`Found in text: ${hasCorrectLink ? '✅ YES' : '❌ NO'}`)

if (hasCorrectLink) {
  console.log('✅ Website URL link is correctly formatted!')
} else {
  console.log('❌ Website URL link is missing or incorrect!')
}

console.log('\n' + '='.repeat(60))
console.log('🎯 Email Service Test Complete!')
