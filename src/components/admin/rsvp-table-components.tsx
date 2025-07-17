'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  MoreHorizontal,
  Check,
  X,
  Clock,
  Save,
  XCircle
} from 'lucide-react'

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

interface SortableHeaderProps {
  field: string
  onSort: (field: string) => void
  currentSort: string
  direction: 'asc' | 'desc'
  children: React.ReactNode
}

export function SortableHeader({ field, onSort, currentSort, direction, children }: SortableHeaderProps) {
  const isActive = currentSort === field

  return (
    <th className="text-left p-4">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
      >
        {children}
        {isActive && (
          direction === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        )}
      </button>
    </th>
  )
}

interface RSVPTableRowProps {
  entry: RSVPEntry
  isSelected: boolean
  onSelect: (entryId: string) => void
  onEdit: (entry: RSVPEntry) => void
  onDelete: (entryId: string) => void
  onUpdate: (entryId: string, updates: Partial<RSVPEntry>) => void
}

export function RSVPTableRow({ 
  entry, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onUpdate 
}: RSVPTableRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    rsvp_status: entry.rsvp_status,
    meal_preference: entry.meal_preference || '',
    dietary_restrictions: entry.dietary_restrictions || '',
    plus_one_name: entry.plus_one_name || '',
    plus_one_meal: entry.plus_one_meal || ''
  })

  const handleSave = () => {
    onUpdate(entry.id, {
      rsvp_status: editData.rsvp_status,
      meal_preference: editData.meal_preference || null,
      dietary_restrictions: editData.dietary_restrictions || null,
      plus_one_name: editData.plus_one_name || null,
      plus_one_meal: editData.plus_one_meal || null
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      rsvp_status: entry.rsvp_status,
      meal_preference: entry.meal_preference || '',
      dietary_restrictions: entry.dietary_restrictions || '',
      plus_one_name: entry.plus_one_name || '',
      plus_one_meal: entry.plus_one_meal || ''
    })
    setIsEditing(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'attending':
        return <Badge variant="default" className="bg-green-100 text-green-800">Attending</Badge>
      case 'not_attending':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Not Attending</Badge>
      default:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const getMealDisplay = (meal: string | null) => {
    if (!meal) return '-'
    return meal.charAt(0).toUpperCase() + meal.slice(1).replace('_', ' ')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(entry.id)}
          className="rounded"
        />
      </td>
      
      <td className="p-4">
        <div>
          <div className="font-medium text-foreground">
            {entry.first_name} {entry.last_name}
          </div>
          {entry.email && (
            <div className="text-sm text-muted-foreground">{entry.email}</div>
          )}
        </div>
      </td>
      
      <td className="p-4">
        <span className="text-sm text-muted-foreground">
          {entry.group_name || '-'}
        </span>
      </td>
      
      <td className="p-4">
        {isEditing ? (
          <Select
            value={editData.rsvp_status}
            onValueChange={(value: 'pending' | 'attending' | 'not_attending') =>
              setEditData(prev => ({ ...prev, rsvp_status: value }))
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="attending">Attending</SelectItem>
              <SelectItem value="not_attending">Not Attending</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          getStatusBadge(entry.rsvp_status)
        )}
      </td>
      
      <td className="p-4">
        {isEditing ? (
          <Select
            value={editData.meal_preference || 'none'}
            onValueChange={(value) =>
              setEditData(prev => ({ ...prev, meal_preference: value === 'none' ? '' : value }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select meal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="chicken">Chicken</SelectItem>
              <SelectItem value="beef">Beef</SelectItem>
              <SelectItem value="fish">Fish</SelectItem>
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="kids_meal">Kids Meal</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm">{getMealDisplay(entry.meal_preference)}</span>
        )}
      </td>
      
      <td className="p-4">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              placeholder="Plus one name"
              value={editData.plus_one_name}
              onChange={(e) =>
                setEditData(prev => ({ ...prev, plus_one_name: e.target.value }))
              }
              className="w-[150px]"
            />
            {editData.plus_one_name && (
              <Select
                value={editData.plus_one_meal || 'none'}
                onValueChange={(value) =>
                  setEditData(prev => ({ ...prev, plus_one_meal: value === 'none' ? '' : value }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plus one meal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="chicken">Chicken</SelectItem>
                  <SelectItem value="beef">Beef</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="kids_meal">Kids Meal</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div className="text-sm">
            {entry.plus_one_name ? (
              <div>
                <div className="font-medium">{entry.plus_one_name}</div>
                {entry.plus_one_meal && (
                  <div className="text-muted-foreground">
                    {getMealDisplay(entry.plus_one_meal)}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                {entry.plus_one_allowed ? 'Allowed' : 'Not allowed'}
              </span>
            )}
          </div>
        )}
      </td>
      
      <td className="p-4">
        {isEditing ? (
          <Input
            placeholder="Dietary restrictions"
            value={editData.dietary_restrictions}
            onChange={(e) =>
              setEditData(prev => ({ ...prev, dietary_restrictions: e.target.value }))
            }
            className="w-[200px]"
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {entry.dietary_restrictions || '-'}
          </span>
        )}
      </td>
      
      <td className="p-4">
        <span className="text-sm text-muted-foreground">
          {formatDate(entry.rsvp_submitted_at)}
        </span>
      </td>
      
      <td className="p-4">
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(entry)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(entry.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  )
}
