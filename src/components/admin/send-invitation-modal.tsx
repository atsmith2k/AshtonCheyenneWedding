'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, AlertTriangle, CheckCircle, XCircle, Users } from 'lucide-react'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string | null
  invitation_sent_at: string | null
}

interface EmailTemplate {
  id: string
  template_type: string
  subject: string
  html_content: string
  text_content?: string
}

interface SendInvitationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guests: Guest[]
  onInvitationsSent: () => void
}

interface SendResult {
  sent: Array<{
    guest_id: string
    guest_name: string
    email: string
    status: string
  }>
  errors: Array<{
    guest_id: string
    guest_name: string
    email: string
    error: string
  }>
  guests_without_email: Array<{
    guest_id: string
    guest_name: string
  }>
  summary: {
    total_requested: number
    sent_successfully: number
    failed: number
    no_email: number
  }
}

export function SendInvitationModal({ 
  open, 
  onOpenChange, 
  guests, 
  onInvitationsSent 
}: SendInvitationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const { toast } = useToast()

  // Filter guests with and without email
  const guestsWithEmail = guests.filter(guest => guest.email)
  const guestsWithoutEmail = guests.filter(guest => !guest.email)
  const guestsAlreadySent = guestsWithEmail.filter(guest => guest.invitation_sent_at)
  const guestsNotSent = guestsWithEmail.filter(guest => !guest.invitation_sent_at)

  useEffect(() => {
    if (open) {
      fetchTemplates()
      setSendResult(null)
      setShowResults(false)
      setCustomMessage('')
    }
  }, [open])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await fetch('/api/admin/email-templates')
      const result = await response.json()

      if (response.ok && result.success) {
        setTemplates(result.data)
        // Auto-select invitation template if available
        const invitationTemplate = result.data.find((t: EmailTemplate) => t.template_type === 'invitation')
        if (invitationTemplate) {
          setSelectedTemplateId(invitationTemplate.id)
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load email templates',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive'
      })
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSendInvitations = async () => {
    if (guestsWithEmail.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'None of the selected guests have email addresses',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/send-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_ids: guests.map(g => g.id),
          template_id: selectedTemplateId || undefined,
          custom_message: customMessage.trim() || undefined,
          send_immediately: true
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSendResult(result.data)
        setShowResults(true)
        onInvitationsSent()
        
        toast({
          title: 'Success',
          description: result.message,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send invitations',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast({
        title: 'Error',
        description: 'Failed to send invitations',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false)
      setShowResults(false)
      setSendResult(null)
      setCustomMessage('')
    }
  }

  if (showResults && sendResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Invitation Results
            </DialogTitle>
            <DialogDescription>
              Summary of invitation sending results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sendResult.summary.sent_successfully}</div>
                <div className="text-sm text-green-700">Sent Successfully</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{sendResult.summary.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{sendResult.summary.no_email}</div>
                <div className="text-sm text-yellow-700">No Email</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{sendResult.summary.total_requested}</div>
                <div className="text-sm text-blue-700">Total Requested</div>
              </div>
            </div>

            {/* Successful sends */}
            {sendResult.sent.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Successfully Sent ({sendResult.sent.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {sendResult.sent.map((item) => (
                    <div key={item.guest_id} className="text-sm p-2 bg-green-50 rounded">
                      <strong>{item.guest_name}</strong> - {item.email}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {sendResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Failed to Send ({sendResult.errors.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {sendResult.errors.map((item) => (
                    <div key={item.guest_id} className="text-sm p-2 bg-red-50 rounded border-l-2 border-red-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong>{item.guest_name}</strong> - {item.email}
                          <div className="text-red-600 text-xs mt-1">{item.error}</div>
                        </div>
                        {item.error_category && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.error_category === 'timeout' ? 'bg-yellow-100 text-yellow-800' :
                            item.error_category === 'invalid_email' ? 'bg-orange-100 text-orange-800' :
                            item.error_category === 'rate_limit' ? 'bg-purple-100 text-purple-800' :
                            item.error_category === 'network' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.error_category.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Error summary and retry suggestions */}
                <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-sm text-red-700 font-medium mb-2">Common Solutions:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    <li>• For timeout errors: Try sending to fewer guests at once</li>
                    <li>• For invalid email errors: Update guest email addresses</li>
                    <li>• For rate limit errors: Wait a few minutes before retrying</li>
                    <li>• For network errors: Check your internet connection</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Guests without email */}
            {sendResult.guests_without_email.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  No Email Address ({sendResult.guests_without_email.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {sendResult.guests_without_email.map((item) => (
                    <div key={item.guest_id} className="text-sm p-2 bg-yellow-50 rounded">
                      <strong>{item.guest_name}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            {sendResult.errors.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  // Reset to retry mode with failed guests
                  setShowResults(false)
                  setSendResult(null)
                  // The guests prop already contains the failed guests from parent
                }}
              >
                Retry Failed ({sendResult.errors.length})
              </Button>
            )}
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Invitations
          </DialogTitle>
          <DialogDescription>
            Send digital invitations to {guests.length} selected guest{guests.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Guest Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{guests.length}</div>
              <div className="text-sm text-blue-700">Total Selected</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{guestsWithEmail.length}</div>
              <div className="text-sm text-green-700">With Email</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{guestsAlreadySent.length}</div>
              <div className="text-sm text-yellow-700">Already Sent</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{guestsWithoutEmail.length}</div>
              <div className="text-sm text-red-700">No Email</div>
            </div>
          </div>

          {/* Warnings */}
          {guestsWithoutEmail.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {guestsWithoutEmail.length} guest{guestsWithoutEmail.length !== 1 ? 's' : ''} will be skipped (no email address)
              </p>
            </div>
          )}

          {guestsAlreadySent.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Users className="w-4 h-4" />
                <span className="font-medium">Note</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {guestsAlreadySent.length} guest{guestsAlreadySent.length !== 1 ? 's have' : ' has'} already received invitations. They will receive new ones if you proceed.
              </p>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              disabled={loadingTemplates}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select a template"} />
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
            {templates.length === 0 && !loadingTemplates && (
              <p className="text-sm text-red-600">
                No email templates found. Please create an invitation template first.
              </p>
            )}
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Message (Optional)</Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message that will be included in the invitation..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-neutral-500">
              This message will be added to the template as a highlighted note.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitations}
              disabled={isLoading || guestsWithEmail.length === 0 || !selectedTemplateId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send {guestsWithEmail.length} Invitation{guestsWithEmail.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
