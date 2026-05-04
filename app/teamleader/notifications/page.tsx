"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Bell, MessageCircle, HelpCircle, AlertTriangle, CheckCircle, Clock, User, Megaphone, Loader2, ArrowUpCircle, XCircle, CheckCircle2 } from 'lucide-react'
import { notificationService, ApiNotification } from '@/lib/api/notificationService'
import { helpRequestService, ApiHelpRequest } from '@/lib/api/helpRequestService'
import { fieldSyncSocket } from '@/lib/auth/socketManager'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

type NotificationType = 'help-request' | 'alert' | 'message' | 'task-update' | 'form' | 'system' | 'task' | 'announcement'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  sender: string
  status: 'unread' | 'read'
}

function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

function transformApiNotification(apiNotif: ApiNotification): Notification {
  const typeMap: Record<string, NotificationType> = {
    'task': 'task-update',
    'form': 'help-request',
    'message': 'message',
    'alert': 'alert',
    'system': 'alert',
    'announcement': 'announcement',
  }

  const apiType = apiNotif.type.toLowerCase() as keyof typeof typeMap
  const mappedType = typeMap[apiType] || 'message'

  return {
    id: apiNotif.id,
    type: mappedType,
    title: apiNotif.title,
    message: apiNotif.body,
    timestamp: formatRelativeTime(apiNotif.created_at),
    sender: apiNotif.user_id || 'System',
    status: apiNotif.is_read ? 'read' : 'unread',
  }
}

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bgColor: string }> = {
  'help-request': { icon: HelpCircle, color: 'border-l-orange-500', bgColor: 'bg-orange-500/10' },
  alert: { icon: AlertTriangle, color: 'border-l-destructive', bgColor: 'bg-destructive/10' },
  message: { icon: MessageCircle, color: 'border-l-primary', bgColor: 'bg-primary/10' },
  'task-update': { icon: CheckCircle, color: 'border-l-emerald-500', bgColor: 'bg-emerald-500/10' },
  form: { icon: HelpCircle, color: 'border-l-orange-500', bgColor: 'bg-orange-500/10' },
  system: { icon: AlertTriangle, color: 'border-l-destructive', bgColor: 'bg-destructive/10' },
  task: { icon: CheckCircle, color: 'border-l-emerald-500', bgColor: 'bg-emerald-500/10' },
  announcement: { icon: Megaphone, color: 'border-l-blue-500', bgColor: 'bg-blue-500/10' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [helpRequests, setHelpRequests] = useState<ApiHelpRequest[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all')
  const [loading, setLoading] = useState(true)
  const [respondDialog, setRespondDialog] = useState<ApiHelpRequest | null>(null)
  const [responseNote, setResponseNote] = useState('')
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [apiNotifications, pendingRequests] = await Promise.all([
          notificationService.getAll(),
          helpRequestService.getPending(),
        ])
        const transformed = apiNotifications.map(transformApiNotification)
        setNotifications(transformed)
        setHelpRequests(pendingRequests)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const unsubBroadcast = fieldSyncSocket.on('broadcast:new', (payload) => {
      const data = payload as any
      if (!data?.id) return
      setNotifications((prev) => [{
        id: data.id,
        type: 'alert' as NotificationType,
        title: data.title,
        message: data.message,
        timestamp: formatDistanceToNow(new Date(data.sentAt), { addSuffix: true }),
        sender: data.senderName || 'System',
        status: 'unread',
      }, ...prev])
    })

    return () => unsubBroadcast()
  }, [])

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  async function markAllRead() {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  async function markRead(id: string) {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  async function handleResponse(id: string, response: 'accepted' | 'rejected' | 'escalated') {
    setResponding(true)
    try {
      await helpRequestService.respond(id, response, responseNote)
      setHelpRequests(prev => prev.filter(r => r.id !== id))
      toast.success(`Help request ${response}`)
      setRespondDialog(null)
      setResponseNote('')
    } catch (error) {
      toast.error('Failed to respond to help request')
    } finally {
      setResponding(false)
    }
  }

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Help requests, alerts, and messages</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {unreadCount} New
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark All Read
          </Button>
        </div>
      </div>

      {helpRequests.length > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-orange-500" />
              Pending Help Requests
              <Badge variant="destructive">{helpRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {helpRequests.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-orange-500/5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{req.type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(req.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium">{req.user_name || req.user_id}</p>
                    <p className="text-sm text-muted-foreground truncate">{req.message}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setRespondDialog(req); setResponseNote(''); }}>
                      Respond
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: 'All', icon: Bell },
          { key: 'help-request', label: 'Help Requests', icon: HelpCircle },
          { key: 'alert', label: 'Alerts', icon: AlertTriangle },
          { key: 'message', label: 'Messages', icon: MessageCircle },
          { key: 'task-update', label: 'Task Updates', icon: CheckCircle },
        ] as const).map(f => (
          <Button
            key={f.key}
            variant={activeFilter === f.key ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setActiveFilter(f.key)}
          >
            <f.icon className="h-3 w-3" />
            {f.label}
          </Button>
        ))}
      </div>

      <Card className="flex flex-col h-[550px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">
            Live Feed
            {filtered.length !== notifications.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length} shown)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-6 pt-0 border-t">
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No notifications in this category</p>
                </div>
              )}
              {filtered.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.message
                const Icon = config.icon
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      'hover:shadow-md transition-all cursor-pointer border-l-4 p-4',
                      notification.status === 'unread' ? 'bg-accent/50' : 'hover:bg-accent/30',
                      config.color
                    )}
                    onClick={() => markRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bgColor)}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-sm truncate">{notification.title}</h4>
                          <Badge
                            variant={notification.status === 'unread' ? 'destructive' : 'secondary'}
                            className="text-xs ml-2 flex-shrink-0"
                          >
                            {notification.status === 'unread' ? 'NEW' : 'READ'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{notification.sender}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{notification.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-orange-500">
              {notifications.filter(n => n.type === 'help-request').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Help Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-destructive">
              {notifications.filter(n => n.type === 'alert').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-destructive uppercase font-semibold tracking-wide">Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">
              {notifications.filter(n => n.type === 'message').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Messages</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!respondDialog} onOpenChange={(open) => { if (!open) { setRespondDialog(null); setResponseNote(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Help Request</DialogTitle>
            <DialogDescription>
              {respondDialog?.user_name || 'Team member'} requested: {respondDialog?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Badge variant="outline" className="capitalize">{respondDialog?.type}</Badge>
            <Textarea
              placeholder="Add a note (optional)"
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleResponse(respondDialog!.id, 'rejected')}
              disabled={responding}
            >
              {responding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Decline
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleResponse(respondDialog!.id, 'escalated')}
              disabled={responding}
            >
              {responding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpCircle className="h-4 w-4 mr-2" />}
              Escalate
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleResponse(respondDialog!.id, 'accepted')}
              disabled={responding}
            >
              {responding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

