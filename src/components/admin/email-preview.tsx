'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Eye, Send, Smartphone, Monitor, Mail } from 'lucide-react'

interface EmailTemplate {
  id: string
  template_type: string
  subject: string
  html_content: string
  text_content?: string
  is_active: boolean
}

interface EmailPreviewProps {
  isOpen: boolean
  onClose: () => void
  template?: EmailTemplate
}

const SAMPLE_VARIABLES = {
  guest_first_name: 'John',
  guest_last_name: 'Smith',
  guest_full_name: 'John Smith',
  invitation_code: 'ABC123XYZ',
  wedding_date: 'July 15, 2026',
  wedding_time: '4:00 PM',
  wedding_venue: 'Beautiful Garden Venue',
  wedding_address: '123 Wedding Lane, Love City, LC 12345',
  rsvp_deadline: 'June 1, 2026',
  website_url: 'https://ashtonandcheyenne.com',
  couple_names: 'Ashton & Cheyenne'
}

export function EmailPreview({ isOpen, onClose, template }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showTextVersion, setShowTextVersion] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [customVariables, setCustomVariables] = useState(SAMPLE_VARIABLES)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  // Process template content with variables
  const processContent = (content: string) => {
    let processed = content
    Object.entries(customVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      processed = processed.replace(regex, value)
    })
    // Remove any unreplaced variables
    processed = processed.replace(/{{[^}]+}}/g, '[Variable]')
    return processed
  }

  const processedSubject = template ? processContent(template.subject) : ''
  const processedHtmlContent = template ? processContent(template.html_content) : ''
  const processedTextContent = template?.text_content ? processContent(template.text_content) : ''

  const handleSendTest = async () => {
    if (!template || !testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive'
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: template.id,
          test_email: testEmail,
          test_variables: customVariables
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: `Test email sent to ${testEmail}`
        })
        setTestEmail('')
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send test email',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  if (!template) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Email Preview: {template.template_type.replace('_', ' ').toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Preview how your email will look to recipients
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Controls */}
          <div className="flex items-center justify-between p-4 border-b bg-neutral-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>View:</Label>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('desktop')}
                    className="rounded-r-none"
                  >
                    <Monitor className="w-4 h-4 mr-1" />
                    Desktop
                  </Button>
                  <Button
                    variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('mobile')}
                    className="rounded-l-none"
                  >
                    <Smartphone className="w-4 h-4 mr-1" />
                    Mobile
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label>Format:</Label>
                <div className="flex border rounded-lg">
                  <Button
                    variant={!showTextVersion ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setShowTextVersion(false)}
                    className="rounded-r-none"
                  >
                    HTML
                  </Button>
                  <Button
                    variant={showTextVersion ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setShowTextVersion(true)}
                    className="rounded-l-none"
                  >
                    Text
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-48"
                />
                <Button
                  onClick={handleSendTest}
                  disabled={sending || !validateEmail(testEmail)}
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div className="flex-1 overflow-auto bg-neutral-100 p-4">
            <div className={`mx-auto bg-white shadow-lg ${
              viewMode === 'desktop' ? 'max-w-2xl' : 'max-w-sm'
            }`}>
              {/* Email Header */}
              <div className="border-b p-4 bg-neutral-50">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600">From: Ashton & Cheyenne</span>
                </div>
                <div className="text-sm text-neutral-600 mb-1">
                  To: {testEmail || 'recipient@example.com'}
                </div>
                <div className="font-medium text-neutral-800">
                  Subject: {processedSubject}
                </div>
              </div>

              {/* Email Content */}
              <div className="p-4">
                {showTextVersion ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {processedTextContent || 'No text version available'}
                  </pre>
                ) : (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: processedHtmlContent }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Variable Customization */}
          <div className="border-t p-4 bg-neutral-50 max-h-48 overflow-auto">
            <Label className="text-sm font-medium mb-2 block">
              Customize Preview Variables:
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(customVariables).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-neutral-600">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <Input
                    value={value}
                    onChange={(e) => setCustomVariables(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))}
                    className="text-xs h-8"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
