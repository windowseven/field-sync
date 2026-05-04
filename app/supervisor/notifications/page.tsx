'use client'

import * as React from 'react'
import {
  Bell, AlertTriangle, CheckCircle2, Info, MessageSquare,
  ClipboardList, Users, Trash2, CheckCheck, Filter, Radio,
  FileText, Shield, MapPin, FolderOpen, HelpCircle,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { notificationService, type ApiNotification } from '@/lib/api/notificationService'

interface Notification {
  id: string
  type: string
  title: string
  description: string
  from?: string
  time: string
  unread: boolean
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  alert: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Alert' },
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Success' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', label: 'Info' },
  message: { icon: MessageSquare, color: 'text-chart-2', bg: 'bg-chart-2/10', label: 'Message' },
  submission: { icon: ClipboardList, color: 'text-chart-3', bg: 'bg-chart-3/10', label: 'Submission' },
  system: { icon: Radio, color: 'text-muted-foreground', bg: 'bg-muted', label: 'System' },
  task: { icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Task' },
  form: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Form' },
  audit: { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Audit' },
  team: { icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Team' },
  location: { icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Location' },
  project: { icon: FolderOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Project' },
  security: { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Security' },
  help: { icon: HelpCircle, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Help' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Warning' },
}

export default function SupervisorNotificationsPage() {
  const [notifs, setNotifs] = React.useState<Notification[]>([])
  const [filter, setFilter] = React.useState('all')
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const data = await notificationService.getAll()
        const transformed = data.map((n: ApiNotification) => ({
          id: n.id,
          type: (n.type || 'info') as string,
          title: n.title,
          description: n.body,
          from: n.sender_name || 'System',
          time: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          unread: !n.is_read,
        }))
        setNotifs(transformed)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const unread = notifs.filter(n => n.unread)
  const filtered = filter === 'all' ? notifs : filter === 'unread' ? notifs.filter(n => n.unread) : notifs.filter(n => n.type === filter)

  function markAllRead() {
  }

  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  function dismiss(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  return (
    <>
      <DashboardHeader
        title="Notifications"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor' }}
        breadcrumbs={[{ label: 'Project Overview', href: '/supervisor' }, { label: 'Notifications' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                {unread.length > 0 && (
                  <Badge variant="destructive">{unread.length} unread</Badge>
                )}
              </div>
              <p className="text-muted-foreground">Help requests, task updates, and field alerts</p>
            </div>
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={unread.length === 0}>
              <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
            </Button>
          </div>

          {/* Type stats */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(typeConfig).map(([type, cfg]) => {
              const count = notifs.filter(n => n.type === type).length
              if (count === 0) return null
              const Icon = cfg.icon
              return (
                <div key={type} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer', cfg.bg, cfg.color)} onClick={() => setFilter(f => f === type ? 'all' : type)}>
                  <Icon className="h-3 w-3" />
                  {cfg.label} ({count})
                </div>
              )
            })}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="alert">Alerts</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="submission">Submissions</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filtered.length} notifications</span>
          </div>

          {/* Notification List */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No notifications to show</p>
                </CardContent>
              </Card>
            ) : filtered.map(notif => {
              const cfg = typeConfig[notif.type] || typeConfig.info
              const Icon = cfg.icon
              return (
                <Card key={notif.id} className={cn('transition-colors', notif.unread && 'border-primary/30 bg-primary/5')}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-full shrink-0', cfg.bg)}>
                        <Icon className={cn('h-4 w-4', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm', notif.unread ? 'font-semibold' : 'font-medium')}>{notif.title}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {notif.unread && <div className="h-2 w-2 rounded-full bg-primary" />}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{notif.time}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{notif.description}</p>
                        {notif.from && (
                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Users className="h-3 w-3" /> {notif.from}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {notif.unread && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(notif.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => dismiss(notif.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

        </div>
      </main>
    </>
  )
}

