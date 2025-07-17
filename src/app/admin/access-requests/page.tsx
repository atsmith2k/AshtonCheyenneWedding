'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useMobileDetection } from '@/hooks/use-mobile-detection'

interface AccessRequest {
  id: string
  name: string
  email: string
  phone: string
  address: string
  message: string | null
  status: 'pending' | 'approved' | 'denied'
  admin_notes: string | null
  invitation_code: string | null
  invitation_sent_at: string | null
  created_at: string
  updated_at: string
  approved_by: string | null
  approved_at: string | null
}

export default function AccessRequestsPage() {
  const { isMobile } = useMobileDetection()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'deny' | 'delete'>('approve')
  const [adminNotes, setAdminNotes] = useState('')
  const [sendInvitation, setSendInvitation] = useState(true)
  const [processing, setProcessing] = useState(false)

  const fetchRequests = async (status?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (status && status !== 'all') {
        params.append('status', status)
      }
      
      const response = await fetch(`/api/admin/access-requests?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch access requests')
      }
      
      setRequests(data.requests || [])
    } catch (err) {
      console.error('Error fetching access requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch access requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests(selectedStatus)
  }, [selectedStatus])

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
  }

  const handleViewDetails = (request: AccessRequest) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  const handleAction = (request: AccessRequest, action: 'approve' | 'deny' | 'delete') => {
    setSelectedRequest(request)
    setActionType(action)
    setAdminNotes('')
    setSendInvitation(action === 'approve')
    setShowActionModal(true)
  }

  const executeAction = async () => {
    if (!selectedRequest) return

    try {
      setProcessing(true)
      
      if (actionType === 'delete') {
        const response = await fetch(`/api/admin/access-requests/${selectedRequest.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete request')
        }
      } else {
        const response = await fetch(`/api/admin/access-requests/${selectedRequest.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: actionType === 'approve' ? 'approved' : 'denied',
            admin_notes: adminNotes || null,
            send_invitation: actionType === 'approve' ? sendInvitation : false
          })
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to ${actionType} request`)
        }
      }
      
      // Refresh the list
      await fetchRequests(selectedStatus)
      
      // Close modal
      setShowActionModal(false)
      setSelectedRequest(null)
      
    } catch (err) {
      console.error(`Error ${actionType}ing request:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${actionType} request`)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'denied':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length
  }

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Access Requests</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading access requests...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Access Requests</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRequests(selectedStatus)}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.denied}</p>
                <p className="text-xs text-muted-foreground">Denied</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={selectedStatus} onValueChange={handleStatusChange}>
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="denied">Denied ({stats.denied})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No access requests found</h3>
                <p className="text-muted-foreground">
                  {selectedStatus === 'all' 
                    ? 'No access requests have been submitted yet.'
                    : `No ${selectedStatus} access requests found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedStatus === 'all' ? 'All Access Requests' : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Requests`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.name}
                          </TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{formatDate(request.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(request)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {request.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleAction(request, 'approve')}>
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAction(request, 'deny')}>
                                      <UserX className="w-4 h-4 mr-2" />
                                      Deny
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleAction(request, 'delete')}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Access Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.address}</p>
              </div>
              
              {selectedRequest.message && (
                <div>
                  <Label className="text-sm font-medium">Message</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
              )}
              
              {selectedRequest.admin_notes && (
                <div>
                  <Label className="text-sm font-medium">Admin Notes</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.admin_notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p>{formatDate(selectedRequest.created_at)}</p>
                </div>
                {selectedRequest.approved_at && (
                  <div>
                    <Label className="text-sm font-medium">Approved</Label>
                    <p>{formatDate(selectedRequest.approved_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Access Request'}
              {actionType === 'deny' && 'Deny Access Request'}
              {actionType === 'delete' && 'Delete Access Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'This will approve the access request and optionally send an invitation email.'}
              {actionType === 'deny' && 'This will deny the access request.'}
              {actionType === 'delete' && 'This will permanently delete the access request. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType !== 'delete' && (
              <div>
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  className="mt-1"
                />
              </div>
            )}
            
            {actionType === 'approve' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="send-invitation"
                  checked={sendInvitation}
                  onChange={(e) => setSendInvitation(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="send-invitation" className="text-sm">
                  Send invitation email with access code
                </Label>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'delete' ? 'destructive' : 'default'}
              onClick={executeAction}
              disabled={processing}
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'approve' && <UserCheck className="w-4 h-4 mr-2" />}
                  {actionType === 'deny' && <UserX className="w-4 h-4 mr-2" />}
                  {actionType === 'delete' && <Trash2 className="w-4 h-4 mr-2" />}
                  {actionType === 'approve' && 'Approve Request'}
                  {actionType === 'deny' && 'Deny Request'}
                  {actionType === 'delete' && 'Delete Request'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
