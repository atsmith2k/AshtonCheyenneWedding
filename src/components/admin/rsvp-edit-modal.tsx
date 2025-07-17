'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface RSVPEntry {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  group_name: string | null
  rsvp_status: 'pending' | 'attending' | 'not_attending'
  meal_preference: string | null
  dietary_restrictions: string | null
  plus_one_allowed: boolean
  plus_one_name: string | null
  plus_one_meal: string | null
  rsvp_submitted_at: string | null
  created_at: string
  updated_at: string
}

interface RSVPEditModalProps {
  entry: RSVPEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function RSVPEditModal({ entry, open, onOpenChange, onUpdate }: RSVPEditModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    rsvp_status: 'pending' as 'pending' | 'attending' | 'not_attending',
    meal_preference: '',
    dietary_restrictions: '',
    plus_one_allowed: false,
    plus_one_name: '',
    plus_one_meal: ''
  })
  const { toast } = useToast()

  // Update form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        first_name: entry.first_name,
        last_name: entry.last_name,
        email: entry.email || '',
        phone: entry.phone || '',
        rsvp_status: entry.rsvp_status,
        meal_preference: entry.meal_preference || '',
        dietary_restrictions: entry.dietary_restrictions || '',
        plus_one_allowed: entry.plus_one_allowed,
        plus_one_name: entry.plus_one_name || '',
        plus_one_meal: entry.plus_one_meal || ''
      })
    }
  }, [entry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entry.id,
          firstName: formData.first_name,
          lastName: formData.last_name,
          email: formData.email || null,
          phone: formData.phone || null,
          rsvpStatus: formData.rsvp_status,
          mealPreference: formData.meal_preference || null,
          dietaryRestrictions: formData.dietary_restrictions || null,
          plusOneAllowed: formData.plus_one_allowed,
          plusOneName: formData.plus_one_name || null,
          plusOneMeal: formData.plus_one_meal || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update RSVP')
      }

      toast({
        title: 'Success',
        description: 'RSVP updated successfully',
      })

      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating RSVP:', error)
      toast({
        title: 'Error',
        description: 'Failed to update RSVP. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit RSVP - {entry.first_name} {entry.last_name}</DialogTitle>
          <DialogDescription>
            Update guest information and RSVP details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* RSVP Status */}
          <div>
            <Label htmlFor="rsvp_status">RSVP Status</Label>
            <Select
              value={formData.rsvp_status}
              onValueChange={(value: 'pending' | 'attending' | 'not_attending') =>
                handleInputChange('rsvp_status', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="attending">Attending</SelectItem>
                <SelectItem value="not_attending">Not Attending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meal Preference */}
          {formData.rsvp_status === 'attending' && (
            <div>
              <Label htmlFor="meal_preference">Meal Preference</Label>
              <Select
                value={formData.meal_preference || 'not_specified'}
                onValueChange={(value) => handleInputChange('meal_preference', value === 'not_specified' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified">Not specified</SelectItem>
                  <SelectItem value="chicken">Chicken</SelectItem>
                  <SelectItem value="beef">Beef</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="kids_meal">Kids Meal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dietary Restrictions */}
          <div>
            <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
            <Textarea
              id="dietary_restrictions"
              value={formData.dietary_restrictions}
              onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
              placeholder="Any dietary restrictions or allergies..."
              rows={3}
            />
          </div>

          {/* Plus One Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="plus_one_allowed"
                checked={formData.plus_one_allowed}
                onCheckedChange={(checked) => handleInputChange('plus_one_allowed', checked)}
              />
              <Label htmlFor="plus_one_allowed">Plus One Allowed</Label>
            </div>

            {formData.plus_one_allowed && (
              <div className="space-y-4 pl-6 border-l-2 border-muted">
                <div>
                  <Label htmlFor="plus_one_name">Plus One Name</Label>
                  <Input
                    id="plus_one_name"
                    value={formData.plus_one_name}
                    onChange={(e) => handleInputChange('plus_one_name', e.target.value)}
                    placeholder="Plus one's name"
                  />
                </div>

                {formData.plus_one_name && formData.rsvp_status === 'attending' && (
                  <div>
                    <Label htmlFor="plus_one_meal">Plus One Meal Preference</Label>
                    <Select
                      value={formData.plus_one_meal || 'not_specified'}
                      onValueChange={(value) => handleInputChange('plus_one_meal', value === 'not_specified' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified">Not specified</SelectItem>
                        <SelectItem value="chicken">Chicken</SelectItem>
                        <SelectItem value="beef">Beef</SelectItem>
                        <SelectItem value="fish">Fish</SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="kids_meal">Kids Meal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
