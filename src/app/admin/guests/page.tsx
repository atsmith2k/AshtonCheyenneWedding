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
  Clock
} from 'lucide-react'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  invitation_code: string
  rsvp_status: 'pending' | 'attending' | 'not_attending'
  meal_preference: string | null
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
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      const response = await fetch('/api/admin/guests')
      const result = await response.json()

      if (response.ok && result.success) {
        setGuests(result.data)
      }
    } catch (error) {
      console.error('Error fetching guests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.group_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = 
      filterStatus === 'all' || 
      guest.rsvp_status === filterStatus

    return matchesSearch && matchesFilter
  })

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
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="wedding">
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

      {/* Filters */}
      <div className="wedding-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
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
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="wedding-input"
            >
              <option value="all">All Guests</option>
              <option value="attending">Attending</option>
              <option value="not_attending">Not Attending</option>
              <option value="pending">Pending RSVP</option>
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
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
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
              <Button size="sm" variant="outline">
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
                <th className="text-left p-4 font-medium text-neutral-700">Name</th>
                <th className="text-left p-4 font-medium text-neutral-700">Email</th>
                <th className="text-left p-4 font-medium text-neutral-700">Group</th>
                <th className="text-left p-4 font-medium text-neutral-700">RSVP Status</th>
                <th className="text-left p-4 font-medium text-neutral-700">Meal</th>
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
                    <div className="flex items-center gap-2">
                      {getRSVPStatusIcon(guest.rsvp_status)}
                      <span className="text-sm">{getRSVPStatusText(guest.rsvp_status)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-600">
                    {guest.meal_preference || '-'}
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
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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
            <Button variant="wedding">
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Guest
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
