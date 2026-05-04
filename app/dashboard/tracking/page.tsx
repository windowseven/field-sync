'use client'

import * as React from 'react'
import {
  Filter,
  Layers,
  Maximize2,
  RefreshCw,
  Search,
  Radio,
  MapPin,
  Users,
  Navigation,
  Activity,
  Clock,
  MoreHorizontal,
  Eye,
  MessageSquare,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { http } from '@/lib/api/httpClient'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TrackedUser {
  id: string
  name: string
  avatar?: string
  team: string
  teamColor: string
  zone: string
  status: 'active' | 'idle' | 'offline' | 'moving'
  activity: string
  lastUpdate: string
  speed?: number
  distance?: number
  location: { lat: number; lng: number }
  path?: { lat: number; lng: number }[]
}

type LocationsResponse = {
  status: string
  data?: {
    locations?: Array<{
      user_id: string
      name?: string
      email?: string
      role?: string
      status?: string
      updated_at?: string
      lat?: number | string
      lng?: number | string
    }>
  }
}

const teamColorsMap: Record<string, string> = {
  admin: 'bg-chart-1',
  supervisor: 'bg-chart-2',
  team_leader: 'bg-chart-3',
  field_agent: 'bg-chart-4',
  'Team Alpha': 'bg-chart-1',
  'Team Beta': 'bg-chart-2',
  'Team Gamma': 'bg-chart-3',
  'Team Delta': 'bg-chart-4',
}

const defaultUsers: TrackedUser[] = []

const teamStats = [
  { team: 'Alpha', active: 3, idle: 1, offline: 0, color: 'bg-chart-1' },
  { team: 'Beta', active: 2, idle: 0, offline: 0, color: 'bg-chart-2' },
  { team: 'Gamma', active: 1, idle: 0, offline: 1, color: 'bg-chart-3' },
  { team: 'Delta', active: 1, idle: 0, offline: 0, color: 'bg-chart-4' },
]

function getStatusBadge(status: TrackedUser['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge className="h-5 bg-success/10 text-success hover:bg-success/20 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Active
        </Badge>
      )
    case 'idle':
      return (
        <Badge className="h-5 bg-warning/10 text-warning hover:bg-warning/20 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Idle
        </Badge>
      )
    case 'moving':
      return (
        <Badge className="h-5 bg-info/10 text-info hover:bg-info/20 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse" />
          Moving
        </Badge>
      )
    case 'offline':
      return (
        <Badge className="h-5 bg-destructive/10 text-destructive hover:bg-destructive/20 gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          Offline
        </Badge>
      )
  }
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return '—'
  const diff = Date.now() - t
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export default function TrackingPage() {
  const [trackedUsers, setTrackedUsers] = React.useState<TrackedUser[]>(defaultUsers)
  const [selectedTeam, setSelectedTeam] = React.useState('all')
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await http.get<LocationsResponse>('/locations')
      if (res?.status !== 'success') return
      const rows = res?.data?.locations ?? []
      const mapped: TrackedUser[] = rows.map((r) => ({
        id: r.user_id,
        name: r.name ?? r.email ?? r.user_id,
        team: r.role ?? 'field_agent',
        teamColor: teamColorsMap[r.role ?? 'field_agent'] ?? 'bg-chart-1',
        zone: '—',
        status: r.status === 'online' ? 'active' : r.status === 'idle' ? 'idle' : 'offline',
        activity: r.status === 'online' ? 'Active in field' : r.status === 'idle' ? 'Idle' : 'Offline',
        lastUpdate: timeAgo(r.updated_at ?? new Date().toISOString()),
        location: { lat: Number(r.lat ?? 0), lng: Number(r.lng ?? 0) },
      }))
      if (mapped.length > 0) setTrackedUsers(mapped)
    } catch (err) {
      console.error('Failed to fetch tracked users', err)
    }
  }, [])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers =
    selectedTeam === 'all'
      ? trackedUsers
      : trackedUsers.filter((u) => u.team.toLowerCase() === selectedTeam)

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchUsers().finally(() => setTimeout(() => setIsRefreshing(false), 1000))
  }

  const activeCount = trackedUsers.filter((u) => u.status === 'active').length
  const movingCount = trackedUsers.filter((u) => u.status === 'moving').length
  const idleCount = trackedUsers.filter((u) => u.status === 'idle').length
  const offlineCount = trackedUsers.filter((u) => u.status === 'offline').length

  return (
    <>
      <DashboardHeader
        title="Live Tracking"
        breadcrumbs={[{ label: 'Live Tracking' }]}
      />
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="mx-auto flex h-full max-w-[1800px] flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                Live Tracking
                <span className="flex h-3 w-3">
                  <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                </span>
              </h1>
              <p className="text-muted-foreground">
                Real-time GPS tracking of all field personnel
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
              <Button size="sm">
                <Maximize2 className="mr-2 h-4 w-4" />
                Fullscreen
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Activity className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Navigation className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{movingCount}</p>
                  <p className="text-xs text-muted-foreground">Moving</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{idleCount}</p>
                  <p className="text-xs text-muted-foreground">Idle</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Radio className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{offlineCount}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 gap-6 overflow-hidden">
            {/* Map Area */}
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b py-3">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-base">Live Map</CardTitle>
                  <div className="flex items-center gap-2">
                    {teamStats.map((team) => (
                      <div key={team.team} className="flex items-center gap-1.5">
                        <span className={cn('h-3 w-3 rounded-full', team.color)} />
                        <span className="text-xs text-muted-foreground">{team.team}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative h-full p-0">
                {/* Placeholder Map */}
                <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/50">
                  {/* Grid pattern */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(oklch(0.5 0 0 / 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, oklch(0.5 0 0 / 0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '50px 50px',
                    }}
                  />

                  {/* Zone overlays */}
                  <div className="absolute left-[10%] top-[15%] h-[35%] w-[25%] rounded-lg border-2 border-chart-1/50 bg-chart-1/10">
                    <span className="absolute left-2 top-2 text-xs font-medium text-chart-1">Zone A</span>
                  </div>
                  <div className="absolute left-[40%] top-[10%] h-[40%] w-[30%] rounded-lg border-2 border-chart-2/50 bg-chart-2/10">
                    <span className="absolute left-2 top-2 text-xs font-medium text-chart-2">Zone B</span>
                  </div>
                  <div className="absolute left-[15%] top-[55%] h-[35%] w-[35%] rounded-lg border-2 border-chart-3/50 bg-chart-3/10">
                    <span className="absolute left-2 top-2 text-xs font-medium text-chart-3">Zone C</span>
                  </div>
                  <div className="absolute left-[55%] top-[55%] h-[35%] w-[30%] rounded-lg border-2 border-chart-4/50 bg-chart-4/10">
                    <span className="absolute left-2 top-2 text-xs font-medium text-chart-4">Zone D</span>
                  </div>

                  {/* User markers */}
                  {filteredUsers.map((user) => (
                    <TooltipProvider key={user.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setSelectedUser(user.id)}
                            className={cn(
                              'absolute flex items-center justify-center transition-all',
                              selectedUser === user.id && 'z-10 scale-125'
                            )}
                            style={{
                              left: `${15 + Math.random() * 70}%`,
                              top: `${15 + Math.random() * 65}%`,
                            }}
                          >
                            <span
                              className={cn(
                                'absolute h-8 w-8 rounded-full opacity-30',
                                user.status === 'active' && 'animate-ping bg-success',
                                user.status === 'moving' && 'animate-ping bg-info',
                                user.status === 'idle' && 'bg-warning',
                                user.status === 'offline' && 'bg-destructive'
                              )}
                            />
                            <Avatar className={cn('h-8 w-8 border-2', user.teamColor.replace('bg-', 'border-'))}>
                              <AvatarFallback className="text-xs">
                                {user.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-3">
                          <div className="space-y-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">Team {user.team} - {user.zone}</p>
                            <p className="text-xs">{user.activity}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}

                  {/* Map placeholder text */}
                  <div className="absolute bottom-4 left-4 rounded-lg bg-card/80 px-3 py-2 backdrop-blur">
                    <p className="text-xs text-muted-foreground">
                      Interactive map - Connect to mapping service for full functionality
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="hidden w-80 flex-col gap-4 lg:flex">
              {/* Search and Filter */}
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-9" />
                  </div>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      <SelectItem value="alpha">Alpha</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="gamma">Gamma</SelectItem>
                      <SelectItem value="delta">Delta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              {/* Users List */}
              <Card className="flex-1 overflow-hidden">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Field Personnel</CardTitle>
                  <CardDescription>{filteredUsers.length} users tracked</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-420px)]">
                    <div className="space-y-1 px-4 pb-4">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user.id)}
                          className={cn(
                            'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent/50',
                            selectedUser === user.id && 'bg-accent'
                          )}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-xs">
                                {user.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                                user.status === 'active' && 'status-online',
                                user.status === 'moving' && 'bg-info',
                                user.status === 'idle' && 'status-idle',
                                user.status === 'offline' && 'status-offline'
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm truncate">{user.name}</span>
                              {getStatusBadge(user.status)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className={cn('h-2 w-2 rounded-full', user.teamColor)} />
                              <span>Team {user.team}</span>
                              <span className="text-border">|</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {user.zone}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {user.activity}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span>{user.lastUpdate}</span>
                              {user.speed && (
                                <span className="flex items-center gap-1">
                                  <Navigation className="h-3 w-3" />
                                  {user.speed} km/h
                                </span>
                              )}
                              {user.distance && (
                                <span>{user.distance} km traveled</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Broadcast
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Eye className="mr-2 h-4 w-4" />
                    Track All
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Group View
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <MapPin className="mr-2 h-4 w-4" />
                    Show Zones
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

