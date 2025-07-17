'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Users, Mail } from 'lucide-react'

interface EmailTemplate {
  id: string
  template_type: string
  subject: string
  html_content: string
  is_active: boolean
}

interface EmailCampaignCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EmailCampaignCreator({ isOpen, onClose, onSave }: EmailCampaignCreatorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    subject: '',
    recipient_filter: {
      rsvp_status: [] as string[],
      has_email: true
    },
    scheduled_at: ''
  })
  const [loading, setLoading] = useState(false)
  const [recipientCount, setRecipientCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
      fetchRecipientCount()
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.template_id) {
      const selectedTemplate = templates.find(t => t.id === formData.template_id)
      if (selectedTemplate) {
        setFormData(prev => ({ ...prev, subject: selectedTemplate.subject }))
      }
    }
  }, [formData.template_id, templates])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      const result = await response.json()

      if (response.ok && result.success) {
        setTemplates(result.templates.filter((t: EmailTemplate) => t.is_active))
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchRecipientCount = async () => {
    try {
      const response = await fetch('/api/admin/guests')
      const result = await response.json()

      if (response.ok && result.success) {
        const guestsWithEmail = result.guests.filter((g: any) => g.email)
        setRecipientCount(guestsWithEmail.length)
      }
    } catch (error) {
      console.error('Error fetching recipient count:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message
        })
        onSave()
        onClose()
        // Reset form
        setFormData({
          name: '',
          template_id: '',
          subject: '',
          recipient_filter: {
            rsvp_status: [],
            has_email: true
          },
          scheduled_at: ''
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create campaign',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRsvpStatusChange = (status: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      recipient_filter: {
        ...prev.recipient_filter,
        rsvp_status: checked
          ? [...prev.recipient_filter.rsvp_status, status]
          : prev.recipient_filter.rsvp_status.filter(s => s !== status)
      }
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Email Campaign</DialogTitle>
          <DialogDescription>
            Create a new email campaign to send to your wedding guests.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Save the Date Announcement"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_id">Email Template</Label>
            <Select
              value={formData.template_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an email template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{template.subject}</span>
                      <span className="text-xs text-neutral-500 capitalize">
                        ({template.template_type.replace('_', ' ')})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-sm text-neutral-500">
                No active email templates found. Create a template first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Email subject line"
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Recipients</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">All guests with email addresses</span>
                </div>
                <span className="text-sm font-medium">{recipientCount} recipients</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Filter by RSVP Status (optional)</Label>
                <div className="space-y-2">
                  {[
                    { value: 'pending', label: 'Pending' },
                    { value: 'attending', label: 'Attending' },
                    { value: 'not_attending', label: 'Not Attending' }
                  ].map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={status.value}
                        checked={formData.recipient_filter.rsvp_status.includes(status.value)}
                        onCheckedChange={(checked) => 
                          handleRsvpStatusChange(status.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={status.value} className="text-sm">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-500">
                  Leave unchecked to send to all guests regardless of RSVP status
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Schedule Send (Optional)</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
            />
            <p className="text-xs text-neutral-500">
              Leave empty to create as draft. You can send it immediately after creation.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.template_id}>
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
