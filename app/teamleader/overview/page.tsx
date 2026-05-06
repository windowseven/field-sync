"use client"
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users2, MapPin, ListCheck, FileText, Clock, AlertCircle, Activity, Loader2, Play, Square, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { http } from '@/lib/api/httpClient'
import { teamService } from '@/lib/api/teamService'
import { zoneService } from '@/lib/api/zoneService'
import { projectService } from '@/lib/api/projectService'

export default function TeamLeaderOverview() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noTeam, setNoTeam] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [teamName, setTeamName] = useState('')
  const [zoneCount, setZoneCount] = useState(0)
  const [zoneNames, setZoneNames] = useState<string[]>([])
  const [inZoneCount, setInZoneCount] = useState(0)
  const [outOfZoneCount, setOutOfZoneCount] = useState(0)
  const [idleCount, setIdleCount] = useState(0)
  const [recentActivity, setRecentActivity] = useState<string[]>([])

  useEffect(() => {
    fetchOverview()
  }, [])

  useEffect(() => {
    if (sessionActive && sessionStartedAt) {
      const updateElapsed = () => {
        setElapsedSeconds(Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000))
      }
      updateElapsed()
      const interval = setInterval(updateElapsed, 1000)
      return () => clearInterval(interval)
    }
  }, [sessionActive, sessionStartedAt])

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const fetchOverview = async () => {
    try {
      setLoading(true)
      setNoTeam(false)
      const [statsRes, breachesRes] = await Promise.all([
        http.get('/team/stats'),
        http.get('/team/zone-breaches').catch(() => null),
      ])

      if (statsRes.status === 'success') {
        const d = statsRes.data
        setTeamName(d.teamName || 'Team')
        setSessionActive(d.session?.active ?? false)
        setSessionStartedAt(d.session?.startedAt ?? null)
        setStats({
          totalMembers: d.totalMembers,
          activeMembers: d.activeMembers,
          pendingTasks: d.pendingTasks,
          completedTasks: d.completedTasks,
          todaySubmissions: d.todaySubmissions,
        })

        if (d.session?.active && d.session?.startedAt) {
          setElapsedSeconds(Math.floor((Date.now() - new Date(d.session.startedAt).getTime()) / 1000))
        }
      }

      if (breachesRes?.status === 'success') {
        setInZoneCount(breachesRes.data.inZoneCount || 0)
        setOutOfZoneCount(breachesRes.data.outOfZoneCount || 0)
      }

      try {
        const projectsRes = await projectService.getAll()
        const activeProject = projectsRes.find((p: any) => p.status === 'active') || projectsRes[0]
        if (activeProject) {
          const zones = await zoneService.getByProject(activeProject.id)
          setZoneCount(zones.length)
          setZoneNames(zones.map((z: any) => z.name))
        }
      } catch {
        setZoneCount(0)
      }

      setIdleCount(0)
      setRecentActivity([
        'Team session initialized',
        'Awaiting field submissions...',
      ])
    } catch (error: any) {
      const isNoTeam = error?.status === 404 || error?.message?.includes('No team assigned')
      if (isNoTeam) {
        setNoTeam(true)
      } else {
        console.error('[TL Overview] Fetch failed:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    try {
      const res = await http.post('/team/session', { action: 'start' })
      if (res.status === 'success') {
        setSessionActive(true)
        setSessionStartedAt(new Date().toISOString())
        fetchOverview()
      }
    } catch (err) {
      console.error('Failed to start session:', err)
    }
  }

  const handleEndSession = async () => {
    try {
      const res = await http.post('/team/session', { action: 'end' })
      if (res.status === 'success') {
        setSessionActive(false)
        setSessionStartedAt(null)
        setElapsedSeconds(0)
        fetchOverview()
      }
    } catch (err) {
      console.error('Failed to end session:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (noTeam) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              No Team Assigned
            </CardTitle>
            <CardDescription>You have not been assigned to a team yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please contact your supervisor to be assigned to a team.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statsCards = [
    { title: 'Active Members', value: `${stats.activeMembers}/${stats.totalMembers}`, icon: Users2, color: 'bg-emerald-500/10 text-emerald-500' },
    { title: 'Pending Tasks', value: stats.pendingTasks.toString(), icon: ListCheck, color: 'bg-orange-500/10 text-orange-500' },
    { title: 'Today Submissions', value: stats.todaySubmissions.toString(), icon: FileText, color: 'bg-blue-500/10 text-blue-500' },
    { title: 'Completed Tasks', value: stats.completedTasks.toString(), icon: Activity, color: 'bg-purple-500/10 text-purple-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground">{teamName} — {zoneCount} Zone{zoneCount !== 1 ? 's' : ''} Assigned</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            {sessionActive ? formatDuration(elapsedSeconds) : '--:--:--'}
          </Badge>
          <Badge className={cn('text-sm', sessionActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-muted text-muted-foreground')}>
            {sessionActive ? 'Active' : 'Stopped'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', stat.color.split(' ')[1])}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your team session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/teamleader/map"
                className="h-12 rounded-lg border bg-card hover:bg-accent text-card-foreground shadow-sm transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Map className="h-4 w-4" />
                View Map
              </Link>
              <Link
                href="/teamleader/members"
                className="h-12 rounded-lg border bg-card hover:bg-accent text-card-foreground shadow-sm transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Users2 className="h-4 w-4" />
                Members
              </Link>
              {sessionActive ? (
                <Button variant="destructive" className="col-span-2 h-12 shadow-md" onClick={handleEndSession}>
                  <Square className="h-4 w-4 mr-2 fill-current" />
                  End Session
                </Button>
              ) : (
                <Button className="col-span-2 h-12 shadow-md" onClick={handleStartSession}>
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  Start Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Status</CardTitle>
            <CardDescription>Team activity overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Time</span>
              <Badge className="text-xs font-mono">{formatDuration(elapsedSeconds)}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>In Zone</span>
                <Badge variant="default">{inZoneCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Outside Zone</span>
                <Badge variant="destructive">{outOfZoneCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Idle {'>'}5min</span>
                <Badge variant="secondary">{idleCount}</Badge>
              </div>
            </div>
            {zoneNames.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Assigned Zones</p>
                <div className="flex flex-wrap gap-1">
                  {zoneNames.map((name, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last team updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">{activity}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

