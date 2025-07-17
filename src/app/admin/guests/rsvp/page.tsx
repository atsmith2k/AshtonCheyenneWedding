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

  // Fetch RSVP data
  const fetchRSVPData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/guests')
      
      if (!response.ok) {
        throw new Error('Failed to fetch RSVP data')
      }

      const data = await response.json()
      const entries: RSVPEntry[] = data.guests.map((guest: any) => ({
        id: guest.id,
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        group_name: guest.guest_groups?.group_name || null,
        rsvp_status: guest.rsvp_status,
        meal_preference: guest.meal_preference,
        dietary_restrictions: guest.dietary_restrictions,
        plus_one_allowed: guest.plus_one_allowed,
        plus_one_name: guest.plus_one_name,
        plus_one_meal: guest.plus_one_meal,
        rsvp_submitted_at: guest.rsvp_submitted_at,
        created_at: guest.created_at,
        updated_at: guest.updated_at
      }))

      setRsvpEntries(entries)
      calculateStats(entries)
    } catch (error) {
      console.error('Error fetching RSVP data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load RSVP data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Calculate RSVP statistics
  const calculateStats = (entries: RSVPEntry[]) => {
    const total = entries.length
    const attending = entries.filter(e => e.rsvp_status === 'attending').length
    const notAttending = entries.filter(e => e.rsvp_status === 'not_attending').length
    const pending = entries.filter(e => e.rsvp_status === 'pending').length
    const responseRate = total > 0 ? ((attending + notAttending) / total) * 100 : 0

    const mealBreakdown: Record<string, number> = {}
    entries.forEach(entry => {
      if (entry.meal_preference) {
        mealBreakdown[entry.meal_preference] = (mealBreakdown[entry.meal_preference] || 0) + 1
      }
      if (entry.plus_one_meal) {
        mealBreakdown[entry.plus_one_meal] = (mealBreakdown[entry.plus_one_meal] || 0) + 1
      }
    })

    const plusOnes = entries.filter(e => e.plus_one_name).length

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

  // Filter and search entries
  useEffect(() => {
    let filtered = [...rsvpEntries]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.first_name.toLowerCase().includes(term) ||
        entry.last_name.toLowerCase().includes(term) ||
        entry.email?.toLowerCase().includes(term) ||
        entry.group_name?.toLowerCase().includes(term)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.rsvp_status === statusFilter)
    }

    // Apply meal filter
    if (mealFilter !== 'all') {
      filtered = filtered.filter(entry => 
        entry.meal_preference === mealFilter || entry.plus_one_meal === mealFilter
      )
    }

    // Apply plus-one filter
    if (plusOneFilter !== 'all') {
      if (plusOneFilter === 'has_plus_one') {
        filtered = filtered.filter(entry => entry.plus_one_name)
      } else if (plusOneFilter === 'no_plus_one') {
        filtered = filtered.filter(entry => !entry.plus_one_name)
      } else if (plusOneFilter === 'plus_one_allowed') {
        filtered = filtered.filter(entry => entry.plus_one_allowed)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof RSVPEntry] || ''
      let bValue = b[sortField as keyof RSVPEntry] || ''
      
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
        throw new Error('Failed to update RSVP')
      }

      // Optimistic update
      setRsvpEntries(prev =>
        prev.map(entry =>
          entry.id === entryId ? { ...entry, ...updates } : entry
        )
      )

      toast({
        title: 'Success',
        description: 'RSVP updated successfully',
      })
    } catch (error) {
      console.error('Error updating RSVP:', error)
      toast({
        title: 'Error',
        description: 'Failed to update RSVP. Please try again.',
        variant: 'destructive'
      })
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('Are you sure you want to delete this RSVP entry?')) {
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
        throw new Error('Failed to delete RSVP')
      }

      setRsvpEntries(prev => prev.filter(entry => entry.id !== entryId))
      setSelectedEntries(prev => prev.filter(id => id !== entryId))

      toast({
        title: 'Success',
        description: 'RSVP entry deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting RSVP:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete RSVP entry. Please try again.',
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
