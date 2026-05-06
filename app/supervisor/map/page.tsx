'use client'

import * as React from 'react'
import {
  Users, MapPin, Radio, Layers, RefreshCw, Filter, Clock, Loader2,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { http } from '@/lib/api/httpClient'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { BaseMap, MapUser } from '@/components/shared/map'
import { fetcher } from '@/lib/api/swr-fetcher'
import { zoneService, ApiZone } from '@/lib/api/zoneService'
import { projectService, ApiProject } from '@/lib/api/projectService'

const zoneColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6']

type Agent = {
  id: string
  name: string
  team: string
  zone: string
  status: 'active' | 'idle' | 'offline'
  lastUpdate: string
  lat: number
  lng: number
}

export default function SupervisorMapPage() {
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [mapUsers, setMapUsers] = React.useState<MapUser[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [zonesVisible, setZonesVisible] = React.useState(true)
  const [teamFilter, setTeamFilter] = React.useState('all')
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)

  const timeAgo = React.useCallback((iso: string) => {
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t)) return '—'
    const diff = Date.now() - t
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return `${sec}s ago`
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    return `${Math.floor(hr / 24)}d ago`
  }, [])

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [locsRes, projects] = await Promise.all([
        http.get<any>('/locations'),
        projectService.getAll(),
      ])

      const rows = locsRes?.data?.locations ?? []
      const mapped: Agent[] = rows.map((r: any) => ({
        id: r.user_id,
        name: r.name ?? r.email ?? r.user_id,
        team: r.role ?? 'field_agent',
        zone: '—',
        status: r.status === 'online' ? 'active' : r.status === 'idle' ? 'idle' : 'offline',
        lastUpdate: timeAgo(r.updated_at ?? new Date().toISOString()),
        lat: Number(r.lat ?? 0),
        lng: Number(r.lng ?? 0),
      }))
      setAgents(mapped)

      const seen = new Set<string>()
      const users: MapUser[] = []
      for (const r of rows) {
        if (seen.has(r.user_id)) continue
        seen.add(r.user_id)
        users.push({
          user_id: r.user_id,
          name: r.name ?? r.email,
          role: r.role,
          status: r.status,
          lat: Number(r.lat ?? 0),
          lng: Number(r.lng ?? 0),
          accuracy: r.accuracy,
          updated_at: r.updated_at,
        })
      }
      setMapUsers(users)
    } catch (err) {
      console.error('Failed to fetch live agents', err)
    } finally {
      setIsLoading(false)
    }
  }, [timeAgo])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredAgents = teamFilter === 'all' ? agents : agents.filter(a => a.team === teamFilter)
  const filteredUsers = teamFilter === 'all' ? mapUsers : mapUsers.filter(u => u.role === teamFilter)
  const activeCount = agents.filter(a => a.status === 'active').length

  return (
    <>
      <DashboardHeader
        title="Live Map"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor' }}
        breadcrumbs={[{ label: 'Project Overview', href: '/supervisor' }, { label: 'Live Map' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Live Map</h1>
                <Badge variant="default" className="gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                  Live
                </Badge>
              </div>
              <p className="text-muted-foreground">Live tracking of field agents across all projects</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setRefreshing(true)
                await fetchData()
                setTimeout(() => setRefreshing(false), 400)
              }}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} /> Refresh
            </Button>
          </div>

          {/* Live stats bar */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeCount} agents in field</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{agents.filter(a => a.status === 'idle').length} idle</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Radio className="h-3.5 w-3.5" />
              <span>{mapUsers.length} tracked users</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {/* Map */}
            <div className="lg:col-span-3 space-y-3">
              {/* Map Controls */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    <SelectItem value="field_agent">Field Agents</SelectItem>
                    <SelectItem value="team_leader">Team Leaders</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch id="zones" checked={zonesVisible} onCheckedChange={setZonesVisible} />
                  <Label htmlFor="zones" className="text-xs cursor-pointer flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> Show Zones
                  </Label>
                </div>
              </div>

              {/* Map Canvas */}
              <div className="h-[500px] rounded-lg overflow-hidden border border-border">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center bg-muted/30">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <BaseMap
                    users={filteredUsers}
                    zones={[]}
                    showLabels={true}
                    showCoverage={false}
                  />
                )}
              </div>
            </div>

            {/* Agents Panel */}
            <div className="space-y-3">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Field Agents</CardTitle>
                  <CardDescription className="text-xs">{filteredAgents.length} agents visible</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[560px]">
                    <div className="p-3 space-y-2">
                      {filteredAgents.map(agent => (
                        <div
                          key={agent.id}
                          className={cn(
                            'flex items-start gap-2.5 rounded-lg p-2.5 cursor-pointer hover:bg-accent transition-colors',
                            selectedAgent === agent.id && 'bg-accent'
                          )}
                          onClick={() => setSelectedAgent(a => a === agent.id ? null : agent.id)}
                        >
                          <div className="relative shrink-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px]">
                                {agent.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background', {
                              'bg-emerald-500 animate-pulse': agent.status === 'active',
                              'bg-amber-500': agent.status === 'idle',
                              'bg-muted-foreground': agent.status === 'offline',
                            })} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{agent.name}</p>
                            <p className="text-[10px] text-muted-foreground">{agent.team}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">{agent.zone}</span>
                            </div>
                            {selectedAgent === agent.id && (
                              <div className="mt-2 space-y-1 border-t border-border pt-2">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">Last update</span>
                                  <span className="font-medium">{agent.lastUpdate}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-muted-foreground">Coordinates</span>
                                  <span className="font-mono">{agent.lat.toFixed(3)}, {agent.lng.toFixed(3)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{agent.lastUpdate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
