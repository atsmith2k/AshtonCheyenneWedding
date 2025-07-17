'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { SortableHeader, RSVPTableRow } from '@/components/admin/rsvp-table-components'
import { RSVPEditModal } from '@/components/admin/rsvp-edit-modal'
import { RSVPCreateModal } from '@/components/admin/rsvp-create-modal'
import { RSVPAnalytics } from '@/components/admin/rsvp-analytics'
import {
  Search,
  Download,
  Plus,
  Clock,
  Users,
  UserCheck,
  ChefHat,
  RefreshCw
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

interface RSVPStats {
  total: number
  attending: number
  notAttending: number
  pending: number
  responseRate: number
  mealBreakdown: Record<string, number>
  plusOnes: number
}

// API Response interfaces for type safety
interface GuestAPIResponse {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  invitation_code: string
  rsvp_status: 'pending' | 'attending' | 'not_attending'
  meal_preference: string | null
  dietary_restrictions: string | null
  plus_one_allowed: boolean
  plus_one_name: string | null
  plus_one_meal: string | null
  rsvp_submitted_at: string | null
  created_at: string
  updated_at: string
  guest_groups?: {
    group_name: string
  } | null
  group_name?: string | null
}

interface AdminGuestsAPIResponse {
  success: boolean
  data: GuestAPIResponse[]
}

export default function RSVPManagementPage() {
  const [rsvpEntries, setRsvpEntries] = useState<RSVPEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<RSVPEntry[]>([])
  const [stats, setStats] = useState<RSVPStats>({
    total: 0,
    attending: 0,
    notAttending: 0,
    pending: 0,
    responseRate: 0,
    mealBreakdown: {},
    plusOnes: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [mealFilter, setMealFilter] = useState<string>('all')
  const [plusOneFilter, setPlusOneFilter] = useState<string>('all')
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [sortField, setSortField] = useState<string>('last_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [editingEntry, setEditingEntry] = useState<RSVPEntry | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table')
  const { toast } = useToast()

  // Fetch RSVP data with proper error handling and type safety
  const fetchRSVPData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/guests')

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch RSVP data: ${response.status} ${errorText}`)
      }

      const apiResponse: AdminGuestsAPIResponse = await response.json()

      // Validate API response structure
      if (!apiResponse || typeof apiResponse !== 'object') {
        throw new Error('Invalid API response format')
      }

      if (!apiResponse.success) {
        throw new Error('API request was not successful')
      }

      if (!Array.isArray(apiResponse.data)) {
        console.error('API Response:', apiResponse)
        throw new Error('Expected guest data to be an array, but received: ' + typeof apiResponse.data)
      }

      // Transform API data to RSVPEntry format with defensive programming
      const entries: RSVPEntry[] = apiResponse.data.map((guest: GuestAPIResponse) => ({
        id: guest.id || '',
        first_name: guest.first_name || '',
        last_name: guest.last_name || '',
        email: guest.email || null,
        phone: guest.phone || null,
        group_name: guest.guest_groups?.group_name || guest.group_name || null,
        rsvp_status: guest.rsvp_status || 'pending',
        meal_preference: guest.meal_preference || null,
        dietary_restrictions: guest.dietary_restrictions || null,
        plus_one_allowed: Boolean(guest.plus_one_allowed),
        plus_one_name: guest.plus_one_name || null,
        plus_one_meal: guest.plus_one_meal || null,
        rsvp_submitted_at: guest.rsvp_submitted_at || null,
        created_at: guest.created_at || '',
        updated_at: guest.updated_at || ''
      }))

      setRsvpEntries(entries)
      calculateStats(entries)

      // Show success message only on manual refresh
      if (entries.length === 0) {
        toast({
          title: 'No Data',
          description: 'No guest data found. You may need to add guests first.',
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('Error fetching RSVP data:', error)

      // Provide more specific error messages
      let errorMessage = 'Failed to load RSVP data. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('Invalid API response')) {
          errorMessage = 'Server returned invalid data. Please contact support if this persists.'
        } else if (error.message.includes('array')) {
          errorMessage = 'Data format error. Please contact support.'
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })

      // Set empty state on error to prevent crashes
      setRsvpEntries([])
      setFilteredEntries([])
      setStats({
        total: 0,
        attending: 0,
        notAttending: 0,
        pending: 0,
        responseRate: 0,
        mealBreakdown: {},
        plusOnes: 0
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Calculate RSVP statistics with defensive programming
  const calculateStats = (entries: RSVPEntry[]) => {
    // Ensure entries is an array
    if (!Array.isArray(entries)) {
      console.warn('calculateStats received non-array input:', entries)
      entries = []
    }

    const total = entries.length
    const attending = entries.filter(e => e?.rsvp_status === 'attending').length
    const notAttending = entries.filter(e => e?.rsvp_status === 'not_attending').length
    const pending = entries.filter(e => e?.rsvp_status === 'pending').length
    const responseRate = total > 0 ? Math.round(((attending + notAttending) / total) * 100 * 100) / 100 : 0

    const mealBreakdown: Record<string, number> = {}
    entries.forEach(entry => {
      if (!entry) return

      if (entry.meal_preference && typeof entry.meal_preference === 'string') {
        mealBreakdown[entry.meal_preference] = (mealBreakdown[entry.meal_preference] || 0) + 1
      }
      if (entry.plus_one_meal && typeof entry.plus_one_meal === 'string') {
        mealBreakdown[entry.plus_one_meal] = (mealBreakdown[entry.plus_one_meal] || 0) + 1
      }
    })

    const plusOnes = entries.filter(e => e?.plus_one_name && typeof e.plus_one_name === 'string' && e.plus_one_name.trim().length > 0).length

    setStats({
      total,
      attending,
      notAttending,
      pending,
      responseRate,
      mealBreakdown,
      plusOnes
    })
  }

  // Filter and search entries with defensive programming
  useEffect(() => {
    // Ensure rsvpEntries is an array
    if (!Array.isArray(rsvpEntries)) {
      setFilteredEntries([])
      return
    }

    let filtered = [...rsvpEntries]

    // Apply search filter with null safety
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(entry => {
        if (!entry) return false

        const firstName = (entry.first_name || '').toLowerCase()
        const lastName = (entry.last_name || '').toLowerCase()
        const email = (entry.email || '').toLowerCase()
        const groupName = (entry.group_name || '').toLowerCase()

        return firstName.includes(term) ||
               lastName.includes(term) ||
               email.includes(term) ||
               groupName.includes(term)
      })
    }

    // Apply status filter with validation
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry?.rsvp_status === statusFilter)
    }

    // Apply meal filter with null safety
    if (mealFilter && mealFilter !== 'all') {
      filtered = filtered.filter(entry => {
        if (!entry) return false
        return entry.meal_preference === mealFilter || entry.plus_one_meal === mealFilter
      })
    }

    // Apply plus-one filter with validation
    if (plusOneFilter && plusOneFilter !== 'all') {
      if (plusOneFilter === 'has_plus_one') {
        filtered = filtered.filter(entry => entry?.plus_one_name && entry.plus_one_name.trim().length > 0)
      } else if (plusOneFilter === 'no_plus_one') {
        filtered = filtered.filter(entry => !entry?.plus_one_name || entry.plus_one_name.trim().length === 0)
      } else if (plusOneFilter === 'plus_one_allowed') {
        filtered = filtered.filter(entry => Boolean(entry?.plus_one_allowed))
      }
    }

    // Apply sorting with null safety
    filtered.sort((a, b) => {
      if (!a || !b) return 0

      let aValue = a[sortField as keyof RSVPEntry]
      let bValue = b[sortField as keyof RSVPEntry]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1

      // Convert to strings for comparison if needed
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredEntries(filtered)
  }, [rsvpEntries, searchTerm, statusFilter, mealFilter, plusOneFilter, sortField, sortDirection])

  // Load data on component mount
  useEffect(() => {
    fetchRSVPData()
  }, [fetchRSVPData])



  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading RSVP data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">RSVP Management</h1>
          <p className="text-muted-foreground">Manage all wedding RSVP responses and guest meal preferences</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchRSVPData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="wedding" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add RSVP
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('table')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'table'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            RSVP Table
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'table' && (
        <>
          {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Attending</p>
                <p className="text-2xl font-bold text-foreground">{stats.attending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-foreground">{stats.responseRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or group..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="attending">Attending</SelectItem>
                  <SelectItem value="not_attending">Not Attending</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={mealFilter} onValueChange={setMealFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Meal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meals</SelectItem>
                  <SelectItem value="chicken">Chicken</SelectItem>
                  <SelectItem value="beef">Beef</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="kids_meal">Kids Meal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={plusOneFilter} onValueChange={setPlusOneFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Plus One" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="has_plus_one">Has Plus One</SelectItem>
                  <SelectItem value="no_plus_one">No Plus One</SelectItem>
                  <SelectItem value="plus_one_allowed">Plus One Allowed</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RSVP Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <SortableHeader field="last_name" onSort={handleSort} currentSort={sortField} direction={sortDirection}>
                    Guest
                  </SortableHeader>
                  <SortableHeader field="group_name" onSort={handleSort} currentSort={sortField} direction={sortDirection}>
                    Group
                  </SortableHeader>
                  <SortableHeader field="rsvp_status" onSort={handleSort} currentSort={sortField} direction={sortDirection}>
                    Status
                  </SortableHeader>
                  <SortableHeader field="meal_preference" onSort={handleSort} currentSort={sortField} direction={sortDirection}>
                    Meal
                  </SortableHeader>
                  <th className="text-left p-4">Plus One</th>
                  <th className="text-left p-4">Dietary Restrictions</th>
                  <SortableHeader field="rsvp_submitted_at" onSort={handleSort} currentSort={sortField} direction={sortDirection}>
                    Submitted
                  </SortableHeader>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <RSVPTableRow
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntries.includes(entry.id)}
                    onSelect={handleSelectEntry}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                    onUpdate={handleUpdateEntry}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No RSVP entries found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || mealFilter !== 'all' || plusOneFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'No guests have been added yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedEntries.length > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedEntries.length} entries selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEntries([])}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdate('attending')}
                >
                  Mark Attending
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdate('not_attending')}
                >
                  Mark Not Attending
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkExport()}
                >
                  Export Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <RSVPAnalytics />
      )}

      {/* Modals */}
      <RSVPEditModal
        entry={editingEntry}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onUpdate={fetchRSVPData}
      />

      <RSVPCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={fetchRSVPData}
      />
    </div>
  )

  // Helper functions
  function handleSelectAll() {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([])
    } else {
      setSelectedEntries(filteredEntries.map(e => e.id))
    }
  }

  function handleSelectEntry(entryId: string) {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    )
  }

  function handleEditEntry(entry: RSVPEntry) {
    setEditingEntry(entry)
    setShowEditModal(true)
  }

  async function handleUpdateEntry(entryId: string, updates: Partial<RSVPEntry>) {
    // Validate inputs
    if (!entryId || typeof entryId !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid entry ID provided',
        variant: 'destructive'
      })
      return
    }

    if (!updates || typeof updates !== 'object') {
      toast({
        title: 'Error',
        description: 'Invalid update data provided',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/admin/guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entryId,
          firstName: updates.first_name,
          lastName: updates.last_name,
          email: updates.email,
          phone: updates.phone,
          groupId: updates.group_name, // This would need proper group ID mapping
          rsvpStatus: updates.rsvp_status,
          mealPreference: updates.meal_preference,
          dietaryRestrictions: updates.dietary_restrictions,
          plusOneName: updates.plus_one_name,
          plusOneMeal: updates.plus_one_meal,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update RSVP: ${response.status} ${errorText}`)
      }

      // Verify the response
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Update was not successful')
      }

      // Optimistic update with validation
      setRsvpEntries(prev => {
        if (!Array.isArray(prev)) return []
        return prev.map(entry =>
          entry?.id === entryId ? { ...entry, ...updates, updated_at: new Date().toISOString() } : entry
        )
      })

      toast({
        title: 'Success',
        description: 'RSVP updated successfully',
      })
    } catch (error) {
      console.error('Error updating RSVP:', error)

      let errorMessage = 'Failed to update RSVP. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid data provided. Please check your inputs.'
        } else if (error.message.includes('403') || error.message.includes('401')) {
          errorMessage = 'You do not have permission to perform this action.'
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  async function handleDeleteEntry(entryId: string) {
    // Validate input
    if (!entryId || typeof entryId !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid entry ID provided',
        variant: 'destructive'
      })
      return
    }

    if (!confirm('Are you sure you want to delete this RSVP entry? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/guests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [entryId] }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to delete RSVP: ${response.status} ${errorText}`)
      }

      // Verify the response
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Delete was not successful')
      }

      // Update state with validation
      setRsvpEntries(prev => {
        if (!Array.isArray(prev)) return []
        return prev.filter(entry => entry?.id !== entryId)
      })

      setSelectedEntries(prev => {
        if (!Array.isArray(prev)) return []
        return prev.filter(id => id !== entryId)
      })

      toast({
        title: 'Success',
        description: 'RSVP entry deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting RSVP:', error)

      let errorMessage = 'Failed to delete RSVP entry. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('403') || error.message.includes('401')) {
          errorMessage = 'You do not have permission to perform this action.'
        } else if (error.message.includes('404')) {
          errorMessage = 'RSVP entry not found. It may have already been deleted.'
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  async function handleBulkUpdate(status: 'attending' | 'not_attending') {
    try {
      const updates = selectedEntries.map(id => ({
        id,
        rsvpStatus: status,
      }))

      // Update each entry
      await Promise.all(
        updates.map(update =>
          fetch('/api/admin/guests', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(update),
          })
        )
      )

      // Optimistic update
      setRsvpEntries(prev =>
        prev.map(entry =>
          selectedEntries.includes(entry.id)
            ? { ...entry, rsvp_status: status }
            : entry
        )
      )

      setSelectedEntries([])

      toast({
        title: 'Success',
        description: `Updated ${selectedEntries.length} RSVP entries`,
      })
    } catch (error) {
      console.error('Error bulk updating RSVPs:', error)
      toast({
        title: 'Error',
        description: 'Failed to update RSVP entries. Please try again.',
        variant: 'destructive'
      })
    }
  }

  function handleExport(format: 'csv' | 'json') {
    const dataToExport = filteredEntries.map(entry => ({
      name: `${entry.first_name} ${entry.last_name}`,
      email: entry.email || '',
      group: entry.group_name || '',
      status: entry.rsvp_status,
      meal: entry.meal_preference || '',
      dietary_restrictions: entry.dietary_restrictions || '',
      plus_one: entry.plus_one_name || '',
      plus_one_meal: entry.plus_one_meal || '',
      submitted_at: entry.rsvp_submitted_at || '',
    }))

    if (format === 'csv') {
      const csv = convertToCSV(dataToExport)
      downloadFile(csv, 'rsvp-data.csv', 'text/csv')
    } else {
      const json = JSON.stringify(dataToExport, null, 2)
      downloadFile(json, 'rsvp-data.json', 'application/json')
    }
  }

  function handleBulkExport() {
    const selectedData = filteredEntries
      .filter(entry => selectedEntries.includes(entry.id))
      .map(entry => ({
        name: `${entry.first_name} ${entry.last_name}`,
        email: entry.email || '',
        group: entry.group_name || '',
        status: entry.rsvp_status,
        meal: entry.meal_preference || '',
        dietary_restrictions: entry.dietary_restrictions || '',
        plus_one: entry.plus_one_name || '',
        plus_one_meal: entry.plus_one_meal || '',
        submitted_at: entry.rsvp_submitted_at || '',
      }))

    const csv = convertToCSV(selectedData)
    downloadFile(csv, 'selected-rsvp-data.csv', 'text/csv')
  }

  function convertToCSV(data: any[]) {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
