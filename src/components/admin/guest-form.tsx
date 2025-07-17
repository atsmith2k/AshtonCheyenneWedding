'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'

// Guest form validation schema
const guestFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  groupId: z.string().optional(),
  plusOneAllowed: z.boolean().default(false),
  plusOneName: z.string().optional(),
  mealPreference: z.enum(['chicken', 'beef', 'fish', 'vegetarian', 'vegan', 'kids_meal', 'not_specified']).optional(),
  dietaryRestrictions: z.string().optional(),
  specialNotes: z.string().optional(),
  rsvpStatus: z.enum(['pending', 'attending', 'not_attending']).optional(),
})

type GuestFormData = z.infer<typeof guestFormSchema>

interface GuestGroup {
  id: string
  group_name: string
  max_guests: number
  guest_count: number
}

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  group_id: string | null
  plus_one_allowed: boolean
  plus_one_name: string | null
  meal_preference: string | null
  dietary_restrictions: string | null
  special_notes: string | null
  rsvp_status: 'pending' | 'attending' | 'not_attending'
}

interface GuestFormProps {
  guest?: Guest | null
  onSubmit: (data: GuestFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  showRsvpStatus?: boolean
}

export function GuestForm({ 
  guest, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  showRsvpStatus = false 
}: GuestFormProps) {
  const [groups, setGroups] = useState<GuestGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      firstName: guest?.first_name || '',
      lastName: guest?.last_name || '',
      email: guest?.email || '',
      phone: guest?.phone || '',
      groupId: guest?.group_id || 'no_group',
      plusOneAllowed: guest?.plus_one_allowed || false,
      plusOneName: guest?.plus_one_name || '',
      mealPreference: (guest?.meal_preference as any) || 'not_specified',
      dietaryRestrictions: guest?.dietary_restrictions || '',
      specialNotes: guest?.special_notes || '',
      rsvpStatus: guest?.rsvp_status || 'pending',
    },
  })

  const watchPlusOneAllowed = form.watch('plusOneAllowed')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/guest-groups')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setGroups(result.data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return

    setCreatingGroup(true)
    try {
      const response = await fetch('/api/admin/guest-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: newGroupName.trim(),
          maxGuests: 1
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setGroups(prev => [...prev, result.data])
        form.setValue('groupId', result.data.id)
        setNewGroupName('')
        setShowNewGroupForm(false)
      } else {
        console.error('Failed to create group:', result.error)
      }
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleSubmit = async (data: GuestFormData) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter email address" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Group Selection */}
        <FormField
          control={form.control}
          name="groupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guest Group</FormLabel>
              <div className="flex gap-2">
                <FormControl className="flex-1">
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loadingGroups}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_group">No Group</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.group_name} ({group.guest_count}/{group.max_guests})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewGroupForm(!showNewGroupForm)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Group Form */}
        {showNewGroupForm && (
          <div className="p-4 border rounded-lg bg-neutral-50">
            <div className="flex gap-2">
              <Input
                placeholder="New group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || creatingGroup}
              >
                {creatingGroup ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewGroupForm(false)
                  setNewGroupName('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Plus One Settings */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="plusOneAllowed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Allow Plus One</FormLabel>
                  <FormDescription>
                    Guest is allowed to bring a plus one
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {watchPlusOneAllowed && (
            <FormField
              control={form.control}
              name="plusOneName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plus One Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter plus one name (if known)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Meal Preferences and Dietary Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mealPreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal Preference</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dietaryRestrictions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dietary Restrictions</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Gluten-free, Nut allergy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Special Notes */}
        <FormField
          control={form.control}
          name="specialNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special notes or requirements..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Wedding party notes, accessibility needs, or other special requirements
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* RSVP Status (for editing existing guests) */}
        {showRsvpStatus && guest && (
          <FormField
            control={form.control}
            name="rsvpStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RSVP Status</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select RSVP status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="attending">Attending</SelectItem>
                      <SelectItem value="not_attending">Not Attending</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {guest ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              guest ? 'Update Guest' : 'Create Guest'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
