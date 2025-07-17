'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserPlus,
  Download,
  Upload,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Check,
  X,
  Clock,
  MoreHorizontal,
  Save,
  XCircle,
  ChevronUp,
  ChevronDown,
  BarChart3,
  EyeOff,
  Eye
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import {
  AddGuestModal,
  EditGuestModal,
  DeleteGuestModal,
  BulkDeleteModal
} from '@/components/admin/guest-modals'
import { GuestAnalytics } from '@/components/admin/guest-analytics'
import { useToast } from '@/hooks/use-toast'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  invitation_code: string
  group_id: string | null
  rsvp_status: 'pending' | 'attending' | 'not_attending'
  meal_preference: string | null
  dietary_restrictions: string | null
  special_notes: string | null
  plus_one_allowed: boolean
  plus_one_name: string | null
  group_name: string | null
  rsvp_submitted_at: string | null
}

export default function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterMeal, setFilterMeal] = useState('all')
  const [filterPlusOne, setFilterPlusOne] = useState('all')
  const [sortField, setSortField] = useState<string>('last_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [groups, setGroups] = useState<{id: string, group_name: string}[]>([])
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

  // Inline editing states
  const [editingCell, setEditingCell] = useState<{guestId: string, field: string} | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchGuests()
    fetchGroups()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const SortableHeader = ({ field, children }: { field: string, children: React.ReactNode }) => (
    <th
      className="text-left p-4 font-medium text-neutral-700 cursor-pointer hover:bg-neutral-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ?
            <ChevronUp className="w-4 h-4" /> :
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  )

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/guest-groups')
      const result = await response.json()

      if (response.ok && result.success) {
        setGroups(result.data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchGuests = async () => {
    try {
      const response = await fetch('/api/admin/guests')
      const result = await response.json()

      if (response.ok && result.success) {
        setGuests(result.data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch guests',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching guests:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const startInlineEdit = (guestId: string, field: string, currentValue: string) => {
    setEditingCell({ guestId, field })
    setEditingValue(currentValue || '')
  }

  const cancelInlineEdit = () => {
    setEditingCell(null)
    setEditingValue('')
  }

  const saveInlineEdit = async () => {
    if (!editingCell) return

    setSavingEdit(true)
    try {
      const guest = guests.find(g => g.id === editingCell.guestId)
      if (!guest) return

      const updateData: any = {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        groupId: guest.group_id,
        plusOneAllowed: guest.plus_one_allowed,
        plusOneName: guest.plus_one_name,
        mealPreference: guest.meal_preference,
        dietaryRestrictions: guest.dietary_restrictions,
        specialNotes: guest.special_notes,
        rsvpStatus: guest.rsvp_status,
      }

      // Update the specific field
      if (editingCell.field === 'rsvp_status') {
        updateData.rsvpStatus = editingValue
      } else if (editingCell.field === 'meal_preference') {
        updateData.mealPreference = editingValue
      }

      const response = await fetch('/api/admin/guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        await refreshData() // Refresh the list and analytics
        toast({
          title: 'Success',
          description: 'Guest updated successfully',
        })
        setEditingCell(null)
        setEditingValue('')
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
      setSavingEdit(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const refreshData = async () => {
    await fetchGuests()
    setAnalyticsRefresh(prev => prev + 1)
  }

  const handleExport = async (format: 'csv' | 'json' = 'csv', selectedOnly: boolean = false) => {
    try {
      const params = new URLSearchParams({ format })

      if (selectedOnly && selectedGuests.length > 0) {
        params.append('ids', selectedGuests.join(','))
      }

      const response = await fetch(`/api/admin/guests/export?${params}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `wedding-guests-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: 'Success',
          description: `Guest data exported successfully as ${format.toUpperCase()}`,
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to export guest data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error exporting guests:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during export',
        variant: 'destructive',
      })
    }
  }

  const filteredAndSortedGuests = guests
    .filter(guest => {
      const matchesSearch =
        guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.group_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        filterStatus === 'all' ||
        guest.rsvp_status === filterStatus

      const matchesGroup =
        filterGroup === 'all' ||
        guest.group_name === filterGroup

      const matchesMeal =
        filterMeal === 'all' ||
        guest.meal_preference === filterMeal

      const matchesPlusOne =
        filterPlusOne === 'all' ||
        (filterPlusOne === 'allowed' && guest.plus_one_allowed) ||
        (filterPlusOne === 'not_allowed' && !guest.plus_one_allowed) ||
        (filterPlusOne === 'with_name' && guest.plus_one_name)

      return matchesSearch && matchesStatus && matchesGroup && matchesMeal && matchesPlusOne
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof Guest]
      let bValue: any = b[sortField as keyof Guest]

      // Handle null values
      if (aValue === null) aValue = ''
      if (bValue === null) bValue = ''

      // Convert to string for comparison
      aValue = String(aValue).toLowerCase()
      bValue = String(bValue).toLowerCase()

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const filteredGuests = filteredAndSortedGuests

  const stats = {
    total: guests.length,
    attending: guests.filter(g => g.rsvp_status === 'attending').length,
    notAttending: guests.filter(g => g.rsvp_status === 'not_attending').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length
  }

  const handleSelectGuest = (guestId: string) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    )
  }

  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(filteredGuests.map(g => g.id))
    }
  }

  const getRSVPStatusIcon = (status: string) => {
    switch (status) {
      case 'attending':
        return <Check className="w-4 h-4 text-green-600" />
      case 'not_attending':
        return <X className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getRSVPStatusText = (status: string) => {
    switch (status) {
      case 'attending':
        return 'Attending'
      case 'not_attending':
        return 'Not Attending'
      default:
        return 'Pending'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-800">Guest Management</h1>
        <div className="wedding-card p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 bg-neutral-200 rounded w-1/4" />
            <div className="h-4 bg-neutral-200 rounded w-full" />
            <div className="h-4 bg-neutral-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Guest Management</h1>
          <p className="text-neutral-600">Manage your wedding guest list and RSVPs</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            {showAnalytics ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Analytics
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Show Analytics
              </>
            )}
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export All as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export All as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="wedding"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Guests</p>
              <p className="text-2xl font-bold text-neutral-800">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Attending</p>
              <p className="text-2xl font-bold text-green-600">{stats.attending}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Not Attending</p>
              <p className="text-2xl font-bold text-red-600">{stats.notAttending}</p>
            </div>
            <X className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Analytics */}
      {showAnalytics && (
        <div className="wedding-card p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Guest Analytics</h2>
          <GuestAnalytics refreshTrigger={analyticsRefresh} />
        </div>
      )}

      {/* Filters */}
      <div className="wedding-card p-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="wedding-input pl-10"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="wedding-input"
            >
              <option value="all">All RSVP Status</option>
              <option value="attending">Attending</option>
              <option value="not_attending">Not Attending</option>
              <option value="pending">Pending RSVP</option>
            </select>

            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="wedding-input"
            >
              <option value="all">All Groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.group_name}>
                  {group.group_name}
                </option>
              ))}
            </select>

            <select
              value={filterMeal}
              onChange={(e) => setFilterMeal(e.target.value)}
              className="wedding-input"
            >
              <option value="all">All Meals</option>
              <option value="chicken">Chicken</option>
              <option value="beef">Beef</option>
              <option value="fish">Fish</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="kids_meal">Kids Meal</option>
            </select>

            <select
              value={filterPlusOne}
              onChange={(e) => setFilterPlusOne(e.target.value)}
              className="wedding-input"
            >
              <option value="all">All Plus One</option>
              <option value="allowed">Plus One Allowed</option>
              <option value="not_allowed">No Plus One</option>
              <option value="with_name">Plus One Named</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterGroup('all')
                setFilterMeal('all')
                setFilterPlusOne('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedGuests.length > 0 && (
        <div className="wedding-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              {selectedGuests.length} guest{selectedGuests.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('csv', true)}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json', true)}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Table */}
      <div className="wedding-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <SortableHeader field="last_name">Name</SortableHeader>
                <SortableHeader field="email">Email</SortableHeader>
                <SortableHeader field="group_name">Group</SortableHeader>
                <SortableHeader field="rsvp_status">RSVP Status</SortableHeader>
                <SortableHeader field="meal_preference">Meal</SortableHeader>
                <th className="text-left p-4 font-medium text-neutral-700">Plus One</th>
                <th className="text-left p-4 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b hover:bg-neutral-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedGuests.includes(guest.id)}
                      onChange={() => handleSelectGuest(guest.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-neutral-800">
                        {guest.first_name} {guest.last_name}
                      </p>
                      <p className="text-sm text-neutral-500">{guest.phone}</p>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-600">{guest.email || 'No email'}</td>
                  <td className="p-4 text-neutral-600">{guest.group_name || 'No group'}</td>
                  <td className="p-4">
                    {editingCell?.guestId === guest.id && editingCell?.field === 'rsvp_status' ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingValue}
                          onValueChange={setEditingValue}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="attending">Attending</SelectItem>
                            <SelectItem value="not_attending">Not Attending</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={saveInlineEdit}
                          disabled={savingEdit}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelInlineEdit}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-1 rounded"
                        onClick={() => startInlineEdit(guest.id, 'rsvp_status', guest.rsvp_status)}
                      >
                        {getRSVPStatusIcon(guest.rsvp_status)}
                        <span className="text-sm">{getRSVPStatusText(guest.rsvp_status)}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-neutral-600">
                    {editingCell?.guestId === guest.id && editingCell?.field === 'meal_preference' ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingValue}
                          onValueChange={setEditingValue}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Not specified</SelectItem>
                            <SelectItem value="chicken">Chicken</SelectItem>
                            <SelectItem value="beef">Beef</SelectItem>
                            <SelectItem value="fish">Fish</SelectItem>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="kids_meal">Kids Meal</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={saveInlineEdit}
                          disabled={savingEdit}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelInlineEdit}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-neutral-50 p-1 rounded"
                        onClick={() => startInlineEdit(guest.id, 'meal_preference', guest.meal_preference || '')}
                      >
                        {guest.meal_preference || '-'}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {guest.plus_one_allowed ? (
                      guest.plus_one_name ? (
                        <span className="text-green-600 text-sm">{guest.plus_one_name}</span>
                      ) : (
                        <span className="text-yellow-600 text-sm">Allowed</span>
                      )
                    ) : (
                      <span className="text-neutral-400 text-sm">Not allowed</span>
                    )}
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedGuest(guest)
                            setShowEditModal(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Guest
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Reminder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedGuest(guest)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Guest
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-800 mb-2">
            No Guests Found
          </h3>
          <p className="text-neutral-600 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Start by adding your first wedding guest.'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button
              variant="wedding"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Guest
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <AddGuestModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onGuestAdded={refreshData}
      />

      <EditGuestModal
        guest={selectedGuest}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onGuestUpdated={refreshData}
      />

      <DeleteGuestModal
        guest={selectedGuest}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onGuestDeleted={refreshData}
      />

      <BulkDeleteModal
        selectedGuests={guests.filter(g => selectedGuests.includes(g.id))}
        open={showBulkDeleteModal}
        onOpenChange={setShowBulkDeleteModal}
        onGuestsDeleted={() => {
          refreshData()
          setSelectedGuests([])
        }}
      />
    </div>
  )
}
