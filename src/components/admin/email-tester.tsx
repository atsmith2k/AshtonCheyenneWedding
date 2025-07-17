'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Send, AlertTriangle, CheckCircle, Mail } from 'lucide-react'

interface EmailTesterProps {
  isOpen: boolean
  onClose: () => void
  templateId?: string
  templateType?: string
}

export function EmailTester({ isOpen, onClose, templateId, templateType }: EmailTesterProps) {
  const [testEmails, setTestEmails] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [customVariables, setCustomVariables] = useState('')
  const [sending, setSending] = useState(false)
  const [validationResults, setValidationResults] = useState<{
    valid: string[]
    invalid: Array<{ email: string; error: string }>
    suggestions: Array<{ original: string; suggested: string }>
  } | null>(null)
  const { toast } = useToast()

  const validateEmails = async () => {
    const emails = testEmails
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emails.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter at least one email address',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/admin/email-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emails })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setValidationResults(result.validation)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to validate emails',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error validating emails:', error)
      toast({
        title: 'Error',
        description: 'Failed to validate emails',
        variant: 'destructive'
      })
    }
  }

  const sendTestEmails = async () => {
    if (!validationResults || validationResults.valid.length === 0) {
      toast({
        title: 'Error',
        description: 'Please validate emails first and ensure at least one is valid',
        variant: 'destructive'
      })
      return
    }

    setSending(true)
    let successCount = 0
    let failureCount = 0

    try {
      // Parse custom variables if provided
      let variables = {}
      if (customVariables.trim()) {
        try {
          variables = JSON.parse(customVariables)
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Invalid JSON format for custom variables',
            variant: 'destructive'
          })
          setSending(false)
          return
        }
      }

      // Send test emails to all valid addresses
      for (const email of validationResults.valid) {
        try {
          const response = await fetch('/api/admin/email-templates/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              template_id: templateId,
              template_type: templateType,
              test_email: email,
              test_variables: variables,
              custom_subject: customSubject || undefined
            })
          })

          const result = await response.json()

          if (response.ok && result.success) {
            successCount++
          } else {
            failureCount++
            console.error(`Failed to send to ${email}:`, result.error)
          }
        } catch (error) {
          failureCount++
          console.error(`Error sending to ${email}:`, error)
        }

        // Add small delay between sends
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      toast({
        title: 'Test Complete',
        description: `Sent ${successCount} emails successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`
      })

      if (successCount > 0) {
        // Reset form on success
        setTestEmails('')
        setCustomSubject('')
        setCustomVariables('')
        setValidationResults(null)
        onClose()
      }

    } catch (error) {
      console.error('Error sending test emails:', error)
      toast({
        title: 'Error',
        description: 'Failed to send test emails',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const applySuggestion = (original: string, suggested: string) => {
    const updatedEmails = testEmails.replace(original, suggested)
    setTestEmails(updatedEmails)
    // Re-validate after applying suggestion
    setTimeout(validateEmails, 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Tester
          </DialogTitle>
          <DialogDescription>
            Send test emails to validate your template before sending to guests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="test_emails">Test Email Addresses</Label>
            <Textarea
              id="test_emails"
              value={testEmails}
              onChange={(e) => setTestEmails(e.target.value)}
              placeholder="Enter email addresses (one per line or comma-separated)&#10;example1@email.com&#10;example2@email.com"
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={validateEmails}
                disabled={!testEmails.trim()}
              >
                Validate Emails
              </Button>
            </div>
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className="space-y-3">
              {validationResults.valid.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{validationResults.valid.length} valid email(s):</strong>
                    <div className="mt-1 text-sm">
                      {validationResults.valid.join(', ')}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {validationResults.invalid.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{validationResults.invalid.length} invalid email(s):</strong>
                    <div className="mt-1 text-sm space-y-1">
                      {validationResults.invalid.map((item, index) => (
                        <div key={index}>
                          <strong>{item.email}:</strong> {item.error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {validationResults.suggestions.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Suggestions:</strong>
                    <div className="mt-1 space-y-2">
                      {validationResults.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">
                            Did you mean <strong>{suggestion.suggested}</strong> instead of <strong>{suggestion.original}</strong>?
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applySuggestion(suggestion.original, suggestion.suggested)}
                          >
                            Apply
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custom_subject">Custom Subject (Optional)</Label>
            <Input
              id="custom_subject"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Override template subject for testing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_variables">Custom Variables (Optional)</Label>
            <Textarea
              id="custom_variables"
              value={customVariables}
              onChange={(e) => setCustomVariables(e.target.value)}
              placeholder='{"guest_first_name": "Test", "wedding_date": "September 12, 2026"}'
              className="min-h-[80px] font-mono text-sm"
            />
            <p className="text-xs text-neutral-500">
              JSON format to override template variables for testing
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={sendTestEmails}
            disabled={sending || !validationResults || validationResults.valid.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : `Send Test (${validationResults?.valid.length || 0} emails)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
