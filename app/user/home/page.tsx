'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Play, Square, MapPin, FileText, ClipboardList,
  Users, RefreshCw, Bell, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Wifi, WifiOff, Zap, Loader2
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/AuthContext'
import { db } from '@/lib/db/syncDatabase'
import { useLiveQuery } from 'dexie-react-hooks'
import { http } from '@/lib/api/httpClient'

export type TaskStatus = 'pending' | 'in-progress' | 'completed'

type SessionState = 'stopped' | 'running' | 'paused'

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function UserHomePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [sessionState, setSessionState] = useState<SessionState>('stopped')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [startedAt, setStartedAt] = useState<string | null>(null)

  const syncItems = useLiveQuery(() => db.syncQueue.toArray()) || []
  const pendingSync = syncItems.filter(i => i.status === 'pending').length
  const failedSync = syncItems.filter(i => i.status === 'failed').length

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    if (sessionState !== 'running') return

    const baseTime = startedAt ? new Date(startedAt).getTime() : Date.now() - elapsedSeconds * 1000

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - baseTime) / 1000)
      setElapsedSeconds(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionState])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res: any = await http.get('/users/dashboard/stats')
      if (res.status === 'success') {
        setStats(res.data)
        const session = res.data?.session
        if (session?.status === 'online' && session?.startedAt) {
          setSessionState('running')
          setStartedAt(session.startedAt)
          const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
          setElapsedSeconds(elapsed)
        } else if (session?.status === 'idle') {
          setSessionState('paused')
        } else {
          setSessionState('stopped')
        }
      }
    } catch (error) {
      console.error('[Dashboard] Fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    setSessionState('running')
    setStartedAt(new Date().toISOString())
    setElapsedSeconds(0)
    try {
      await http.post('/users/session', { status: 'online' })
    } catch (err) {
      console.error('Session start failed', err)
      setSessionState('stopped')
    }
  }

  const handlePauseSession = async () => {
    setSessionState('paused')
    try {
      await http.post('/users/session', { status: 'idle' })
    } catch (err) {
      console.error('Session pause failed', err)
    }
  }

  const handleStopSession = async () => {
    setSessionState('stopped')
    setStartedAt(null)
    setElapsedSeconds(0)
    try {
      await http.post('/users/session', { status: 'offline' })
    } catch (err) {
      console.error('Session stop failed', err)
    }
  }

  const handleResumeSession = async () => {
    setSessionState('running')
    setStartedAt(new Date(Date.now() - elapsedSeconds * 1000).toISOString())
    try {
      await http.post('/users/session', { status: 'online' })
    } catch (err) {
      console.error('Session resume failed', err)
      setSessionState('paused')
    }
  }

  const quickStats = [
    {
      title: 'Tasks Done',
      value: stats ? `${stats.taskStats.completed}/${stats.taskStats.total}` : '0/0',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Forms Submitted',
      value: stats?.formStats.submitted || 0,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Nearby Team',
      value: `${stats?.nearbyTeammates ?? 0} online`,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Sync Status',
      value: failedSync > 0 ? `${failedSync} failed` : pendingSync > 0 ? `${pendingSync} pending` : 'All synced',
      icon: failedSync > 0 ? WifiOff : Wifi,
      color: failedSync > 0 ? 'text-destructive' : pendingSync > 0 ? 'text-amber-500' : 'text-emerald-500',
      bg: failedSync > 0 ? 'bg-destructive/10' : pendingSync > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
    },
  ]

  const taskStatusColor: Record<string, string> = {
    pending: 'text-muted-foreground bg-muted/60',
    'in-progress': 'text-amber-700 bg-amber-500/10 dark:text-amber-400',
    completed: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400',
  }

  const priorityDot: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-muted-foreground',
  }

  if (loading || !user) {
    return (
      <>
        <DashboardHeader title="My Dashboard" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </>
    )
  }

  const firstName = user.first_name || user.name?.split(' ')[0] || 'Agent'
  const urgentTask = stats?.latestTasks?.find((t: any) => t.priority === 'high' || t.status === 'in-progress')

  return (
    <>
      <DashboardHeader title="My Dashboard" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Welcome back, {firstName}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {stats?.assignedZones?.length > 0 ? (
                  stats.assignedZones.map((z: any) => z.name).join(', ')
                ) : (
                  'No zone assigned'
                )}
                <span className="text-border">-</span>
                <span>Team Alpha</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-sm">
                {sessionState === 'running' ? <><span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Active Session</> : sessionState === 'paused' ? <><span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" /> Paused</> : 'Session Not Started'}
              </Badge>
            </div>
          </div>

          {/* Session Control */}
          <Card className={cn(
            'border-2 transition-colors',
            sessionState !== 'stopped' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-dashed border-muted-foreground/30'
          )}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full shrink-0',
                    sessionState === 'running' ? 'bg-emerald-500/15' : sessionState === 'paused' ? 'bg-amber-500/15' : 'bg-muted'
                  )}>
                    <Clock className={cn('h-5 w-5', sessionState === 'running' ? 'text-emerald-500' : sessionState === 'paused' ? 'text-amber-500' : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold', sessionState === 'running' ? 'text-emerald-700 dark:text-emerald-400' : sessionState === 'paused' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
                      {sessionState === 'running' ? 'Session Active' : sessionState === 'paused' ? 'Session Paused' : 'Session Not Started'}
                    </p>
                    {sessionState !== 'stopped' ? (
                      <p className="text-xl font-mono font-bold tracking-wider tabular-nums">
                        {formatDuration(elapsedSeconds)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Start your session to begin tracking</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  {sessionState === 'stopped' ? (
                    <Button
                      size="sm"
                      onClick={handleStartSession}
                      className="gap-2 flex-1 sm:flex-none"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Start Session
                    </Button>
                  ) : sessionState === 'running' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePauseSession}
                        className="gap-2 flex-1 sm:flex-none border-amber-500/40 text-amber-600 hover:bg-amber-500/5"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" /> Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStopSession}
                        className="gap-2 flex-1 sm:flex-none border-destructive/40 text-destructive hover:bg-destructive/5"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" /> Stop
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={handleResumeSession}
                        className="gap-2 flex-1 sm:flex-none"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" /> Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStopSession}
                        className="gap-2 flex-1 sm:flex-none border-destructive/40 text-destructive hover:bg-destructive/5"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" /> Stop
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <Card key={stat.title} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Focus: Current Task */}
          {urgentTask && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <Zap className="h-5 w-5 shrink-0" />
                      Focus Right Now
                    </CardTitle>
                    <CardDescription>Your highest priority task</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 shrink-0 self-start sm:self-auto">
                    In Progress
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-base">{urgentTask.title}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> {urgentTask.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Due {urgentTask.deadline}
                    </span>
                  </div>
                </div>
                {urgentTask.linkedForm && (
                  <Button asChild className="gap-2">
                    <Link href={`/user/forms/${urgentTask.linkedForm}`}>
                      <FileText className="h-4 w-4" />
                      Open Form
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Today's Tasks + Quick Access */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary shrink-0" />
                      Today's Tasks
                    </CardTitle>
                    <CardDescription>Your assigned work for this session</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="self-start -ml-2 sm:ml-0 sm:self-auto">
                    <Link href="/user/tasks">
                      All Tasks <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.latestTasks?.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center rounded-lg p-3 bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', priorityDot[task.priority as keyof typeof priorityDot])} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          task.status === 'completed' && 'line-through text-muted-foreground'
                        )}>
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{task.deadline}</p>
                      </div>
                    </div>
                    <Badge className={cn('text-xs px-2 shrink-0 border-0 self-start sm:self-auto', taskStatusColor[task.status as keyof typeof taskStatusColor])}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status === 'completed' ? 'Done' : 'Pending'}
                    </Badge>
                  </div>
                ))}
                {(!stats?.latestTasks || stats.latestTasks.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No tasks for today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>Jump to any section</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Open Forms', desc: 'Fill and submit', icon: FileText, href: '/user/forms', color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'My Map', desc: 'View your zone', icon: MapPin, href: '/user/map', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Nearby Team', desc: 'See who is online', icon: Users, href: '/user/team', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Notifications', desc: 'Stay updated', icon: Bell, href: '/user/notifications', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  ].map((item) => (
                    <Button key={item.href} variant="outline" className="h-auto flex-col items-start p-4 gap-2" asChild>
                      <Link href={item.href}>
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.bg)}>
                          <item.icon className={cn('h-5 w-5', item.color)} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sync Nudge */}
          {(pendingSync > 0 || failedSync > 0) && (
            <Link href="/user/sync">
              <Card className={cn(
                'border cursor-pointer hover:shadow-md transition-all',
                failedSync > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5'
              )}>
                <CardContent className="p-4 flex items-center gap-3">
                  {failedSync > 0
                    ? <WifiOff className="h-5 w-5 text-destructive shrink-0" />
                    : <RefreshCw className="h-5 w-5 text-amber-500 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {failedSync > 0
                        ? `${failedSync} submission${failedSync > 1 ? 's' : ''} failed to sync`
                        : `${pendingSync} pending sync`}
                    </p>
                    <p className="text-xs text-muted-foreground">Tap to view sync status</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}

        </div>
      </main>
    </>
  )
}
