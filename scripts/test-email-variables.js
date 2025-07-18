#!/usr/bin/env node

/**
 * Test script to verify email template variable substitution
 * This script tests the email template processing without actually sending emails
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

// Mock template content (same as in the database)
const mockTemplate = {
  subject: 'Your Wedding Invitation Code - {{couple_names}}',
  html_content: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #ec4899;">{{couple_names}}</h1>
      <p>Hi {{guest_first_name}},</p>
      <p>Your invitation code: {{invitation_code}}</p>
      <p>Visit our website: {{website_url}}/landing</p>
    </div>
  `,
  text_content: `
    {{couple_names}} - Wedding Invitation Code
    
    Hi {{guest_first_name}},
    
    Your invitation code: {{invitation_code}}
    
    Use this code to access our wedding website: {{website_url}}/landing
    
    With love,
    {{couple_names}}
  `
}

// Mock template variables
const templateVariables = {
  couple_names: 'Ashton & Cheyenne',
  website_url: process.env.NEXT_PUBLIC_APP_URL || 'https://ashtonandcheyenne.com',
  guest_first_name: 'John',
  guest_last_name: 'Doe',
  guest_full_name: 'John Doe',
  invitation_code: 'ABC123'
}

// Template variable replacement function (same as in email service)
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
  processedContent = processedContent.replace(/{{[^}]+}}/g, '[UNREPLACED_VARIABLE]')

  return processedContent
}

console.log('🧪 Testing Email Template Variable Substitution')
console.log('=' .repeat(60))

console.log('\n📋 Environment Variables:')
console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || '[NOT SET]'}`)

console.log('\n🔧 Template Variables:')
Object.entries(templateVariables).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`)
})

console.log('\n📧 Processing Templates:')
console.log('-'.repeat(40))

// Test subject processing
const processedSubject = replaceTemplateVariables(mockTemplate.subject, templateVariables)
console.log('\n📌 Subject:')
console.log(`Original: ${mockTemplate.subject}`)
console.log(`Processed: ${processedSubject}`)

// Test HTML content processing
const processedHtml = replaceTemplateVariables(mockTemplate.html_content, templateVariables)
console.log('\n🌐 HTML Content:')
console.log('Original:')
console.log(mockTemplate.html_content.trim())
console.log('\nProcessed:')
console.log(processedHtml.trim())

// Test text content processing
const processedText = replaceTemplateVariables(mockTemplate.text_content, templateVariables)
console.log('\n📝 Text Content:')
console.log('Original:')
console.log(mockTemplate.text_content.trim())
console.log('\nProcessed:')
console.log(processedText.trim())

// Check for unreplaced variables
console.log('\n🔍 Validation:')
const hasUnreplacedVars = processedText.includes('[UNREPLACED_VARIABLE]') || 
                         processedHtml.includes('[UNREPLACED_VARIABLE]') ||
                         processedSubject.includes('[UNREPLACED_VARIABLE]')

if (hasUnreplacedVars) {
  console.log('❌ Found unreplaced variables!')
} else {
  console.log('✅ All variables replaced successfully!')
}

// Check specifically for website_url
const hasWebsiteUrl = processedText.includes(templateVariables.website_url) &&
                     processedHtml.includes(templateVariables.website_url)

if (hasWebsiteUrl) {
  console.log('✅ Website URL correctly substituted!')
} else {
  console.log('❌ Website URL not found in processed content!')
}

console.log('\n' + '='.repeat(60))
console.log('🎯 Test Complete!')
