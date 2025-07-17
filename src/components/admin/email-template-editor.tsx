'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { EmailPreview } from './email-preview'
import { Eye, Send } from 'lucide-react'

interface EmailTemplate {
  id?: string
  template_type: string
  subject: string
  html_content: string
  text_content?: string
  is_active: boolean
}

interface EmailTemplateEditorProps {
  isOpen: boolean
  onClose: () => void
  template?: EmailTemplate
  onSave: () => void
}

const TEMPLATE_TYPES = [
  { value: 'invitation', label: 'Wedding Invitation' },
  { value: 'rsvp_reminder', label: 'RSVP Reminder' },
  { value: 'save_the_date', label: 'Save the Date' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'update', label: 'Wedding Update' },
  { value: 'custom', label: 'Custom' }
]

const TEMPLATE_VARIABLES = [
  '{{guest_first_name}}',
  '{{guest_last_name}}',
  '{{guest_full_name}}',
  '{{invitation_code}}',
  '{{wedding_date}}',
  '{{wedding_time}}',
  '{{wedding_venue}}',
  '{{wedding_address}}',
  '{{rsvp_deadline}}',
  '{{website_url}}',
  '{{couple_names}}'
]

export function EmailTemplateEditor({ isOpen, onClose, template, onSave }: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState<EmailTemplate>({
    template_type: template?.template_type || '',
    subject: template?.subject || '',
    html_content: template?.html_content || '',
    text_content: template?.text_content || '',
    is_active: template?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = template?.id 
        ? '/api/admin/email-templates'
        : '/api/admin/email-templates'
      
      const method = template?.id ? 'PUT' : 'POST'
      const body = template?.id 
        ? { ...formData, id: template.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message
        })
        onSave()
        onClose()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save template',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendTest = async () => {
    const testEmail = prompt('Enter email address to send test email:')
    if (!testEmail) return

    try {
      const response = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: template?.id,
          test_email: testEmail,
          test_variables: {
            guest_first_name: 'Test',
            guest_last_name: 'Guest',
            guest_full_name: 'Test Guest',
            invitation_code: 'TEST123'
          }
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message
        })
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
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('html_content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + variable + after
      
      setFormData(prev => ({ ...prev, html_content: newText }))
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template?.id ? 'Edit Email Template' : 'Create Email Template'}
          </DialogTitle>
          <DialogDescription>
            Create or edit email templates for wedding communications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template_type">Template Type</Label>
              <Select
                value={formData.template_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="html_content">HTML Content</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmailPreview(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Full Preview
                </Button>
                {template?.id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendTest}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Textarea
                  id="html_content"
                  value={formData.html_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                  placeholder="Enter HTML email content"
                  className="min-h-[200px] font-mono text-sm"
                  required
                />
                
                {/* Template Variables */}
                <div className="mt-2">
                  <p className="text-sm text-neutral-600 mb-2">Available variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_VARIABLES.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded border"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {showPreview && (
                <div className="border rounded-lg p-4 bg-white">
                  <h4 className="font-medium mb-2">Preview:</h4>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.html_content }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text_content">Plain Text Content (Optional)</Label>
            <Textarea
              id="text_content"
              value={formData.text_content}
              onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
              placeholder="Enter plain text version (fallback for email clients that don't support HTML)"
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Template is active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (template?.id ? 'Update Template' : 'Create Template')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Email Preview Modal */}
      <EmailPreview
        isOpen={showEmailPreview}
        onClose={() => setShowEmailPreview(false)}
        template={formData.template_type && formData.subject && formData.html_content ? {
          id: template?.id || 'preview',
          template_type: formData.template_type,
          subject: formData.subject,
          html_content: formData.html_content,
          text_content: formData.text_content,
          is_active: formData.is_active
        } : undefined}
      />
    </Dialog>
  )
}
