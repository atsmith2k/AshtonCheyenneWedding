'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Send, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react'

// Client-side validation schema (without server-side sanitization)
const accessRequestFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(/^[\d\s\-\+\(\)\.]+$/, 'Please enter a valid phone number'),
  address: z.string()
    .min(10, 'Please provide a complete address')
    .max(500, 'Address is too long'),
  message: z.string()
    .max(1000, 'Message is too long')
    .optional(),
  honeypot: z.string().optional() // Bot detection field
})

type AccessRequestFormData = z.infer<typeof accessRequestFormSchema>

interface AccessRequestFormProps {
  onSuccess?: () => void
  className?: string
}

export function AccessRequestForm({ onSuccess, className }: AccessRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<AccessRequestFormData>({
    resolver: zodResolver(accessRequestFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      message: '',
      honeypot: '' // Hidden field for bot detection
    }
  })

  const onSubmit = async (data: AccessRequestFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Add timestamp for server-side validation
      const requestData = {
        ...data,
        timestamp: Date.now()
      }

      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.code === 'DUPLICATE_REQUEST') {
          setSubmitError('You have already submitted an access request recently. Please wait 24 hours before submitting another request.')
        } else if (result.details) {
          // Handle validation errors
          const errorMessages = result.details.map((detail: any) => detail.message).join(', ')
          setSubmitError(`Please fix the following errors: ${errorMessages}`)
        } else {
          setSubmitError(result.error || 'Failed to submit access request. Please try again.')
        }
        return
      }

      // Success
      setIsSuccess(true)
      form.reset()
      
      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error('Error submitting access request:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className={`max-w-2xl mx-auto ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-serif text-primary">Request Submitted Successfully!</h2>
            <p className="text-muted-foreground">
              Thank you for your interest in our wedding. We have received your access request 
              and will review it shortly. If approved, you will receive an email with your 
              invitation code and instructions to access our wedding website.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/landing')}
                variant="wedding"
                className="w-full sm:w-auto"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`max-w-2xl mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-serif text-primary">
          Request Wedding Access
        </CardTitle>
        <p className="text-muted-foreground">
          Please fill out this form to request access to our wedding website. 
          We'll review your request and send you an invitation code if approved.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Honeypot field for bot detection */}
            <FormField
              control={form.control}
              name="honeypot"
              render={({ field }) => (
                <div style={{ display: 'none' }}>
                  <Input {...field} tabIndex={-1} autoComplete="off" />
                </div>
              )}
            />

            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your full name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="your.email@example.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="(555) 123-4567"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Field */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Home Address *
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your complete home address including city, state, and zip code"
                      className="min-h-[100px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message Field */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Message for the Couple (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share a message with Ashton & Cheyenne..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Alert */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="wedding"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting Request...
                </>
              ) : (
                <>
                  Submit Access Request
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              * Required fields. We'll review your request and contact you via email if approved.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
