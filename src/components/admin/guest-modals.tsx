'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { GuestForm } from './guest-form'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Trash2 } from 'lucide-react'

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
  group_name?: string | null
}

interface GuestFormData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  groupId?: string
  plusOneAllowed: boolean
  plusOneName?: string
  mealPreference?: string
  dietaryRestrictions?: string
  specialNotes?: string
  rsvpStatus?: 'pending' | 'attending' | 'not_attending'
}

interface AddGuestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuestAdded: () => void
}

export function AddGuestModal({ open, onOpenChange, onGuestAdded }: AddGuestModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (data: GuestFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          groupId: data.groupId || null,
          plusOneAllowed: data.plusOneAllowed,
          mealPreference: data.mealPreference || null,
          dietaryRestrictions: data.dietaryRestrictions || null,
          specialNotes: data.specialNotes || null,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: 'Guest created successfully',
        })
        onGuestAdded()
        onOpenChange(false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create guest',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating guest:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Guest</DialogTitle>
          <DialogDescription>
            Create a new guest entry for your wedding
          </DialogDescription>
        </DialogHeader>
        <GuestForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}

interface EditGuestModalProps {
  guest: Guest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuestUpdated: () => void
}

export function EditGuestModal({ guest, open, onOpenChange, onGuestUpdated }: EditGuestModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (data: GuestFormData) => {
    if (!guest) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: guest.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          groupId: data.groupId || null,
          plusOneAllowed: data.plusOneAllowed,
          plusOneName: data.plusOneName || null,
          mealPreference: data.mealPreference || null,
          dietaryRestrictions: data.dietaryRestrictions || null,
          specialNotes: data.specialNotes || null,
          rsvpStatus: data.rsvpStatus,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: 'Guest updated successfully',
        })
        onGuestUpdated()
        onOpenChange(false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update guest',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating guest:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Guest</DialogTitle>
          <DialogDescription>
            Update guest information and RSVP details
          </DialogDescription>
        </DialogHeader>
        {guest && (
          <GuestForm
            guest={guest}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
            showRsvpStatus={true}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface DeleteGuestModalProps {
  guest: Guest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuestDeleted: () => void
}

export function DeleteGuestModal({ guest, open, onOpenChange, onGuestDeleted }: DeleteGuestModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!guest) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/guests?id=${guest.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: 'Guest deleted successfully',
        })
        onGuestDeleted()
        onOpenChange(false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete guest',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting guest:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Guest</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <strong>
              {guest?.first_name} {guest?.last_name}
            </strong>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Guest
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface BulkDeleteModalProps {
  selectedGuests: Guest[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuestsDeleted: () => void
}

export function BulkDeleteModal({ selectedGuests, open, onOpenChange, onGuestsDeleted }: BulkDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleBulkDelete = async () => {
    if (selectedGuests.length === 0) return

    setIsLoading(true)
    try {
      const guestIds = selectedGuests.map(g => g.id).join(',')
      const response = await fetch(`/api/admin/guests?ids=${guestIds}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: `Successfully deleted ${selectedGuests.length} guest(s)`,
        })
        onGuestsDeleted()
        onOpenChange(false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete guests',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting guests:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Multiple Guests</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedGuests.length} selected guest(s)? 
            This action cannot be undone.
            <div className="mt-2 max-h-32 overflow-y-auto">
              <ul className="text-sm">
                {selectedGuests.map((guest) => (
                  <li key={guest.id}>
                    • {guest.first_name} {guest.last_name}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBulkDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedGuests.length} Guest(s)
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
