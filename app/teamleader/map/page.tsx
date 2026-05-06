'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Layers, Loader2, Crosshair, Route } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { projectService, ApiProject } from '@/lib/api/projectService'
import { zoneService, ApiZone } from '@/lib/api/zoneService'
import { teamService } from '@/lib/api/teamService'
import { fetcher } from '@/lib/api/swr-fetcher'
import { BaseMap, MapUser, MapZone, MapRoute } from '@/components/shared/map'
import { cn } from '@/lib/utils'

const zoneColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6']
const pathColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e']

type TeamMember = {
  id: string
  name?: string
  email?: string
  role?: string
  status?: string
}

export default function TeamLeaderMapPage() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [mapUsers, setMapUsers] = useState<MapUser[]>([])
  const [mapZones, setMapZones] = useState<MapZone[]>([])
  const [mapRoutes, setMapRoutes] = useState<MapRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showZones, setShowZones] = useState(true)
  const [showMembers, setShowMembers] = useState(true)
  const [showPaths, setShowPaths] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const [projectsData, membersRes] = await Promise.all([
          projectService.getAll(),
          fetcher('/team/members'),
        ])
        setProjects(projectsData)
        const members: TeamMember[] = Array.isArray(membersRes) ? membersRes : []
        setTeamMembers(members)
      } catch (err) {
        setError('Failed to load map data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetcher('/locations')
        const locs: any[] = res?.locations ?? []
        const seen = new Set<string>()
        const users: MapUser[] = []
        for (const loc of locs) {
          if (seen.has(loc.user_id)) continue
          seen.add(loc.user_id)
          users.push({
            user_id: loc.user_id,
            name: loc.name,
            email: loc.email,
            role: loc.role,
            status: loc.status,
            lat: Number(loc.lat ?? 0),
            lng: Number(loc.lng ?? 0),
            accuracy: loc.accuracy,
            updated_at: loc.updated_at,
          })
        }
        setMapUsers(users)
      } catch {
        setMapUsers([])
      }
    }
    loadLocations()
  }, [])

  useEffect(() => {
    async function loadZones() {
      try {
        const activeProject = projects.find((p) => p.status === 'active') || projects[0]
        if (!activeProject) { setMapZones([]); return }

        const zones = await zoneService.getByProject(activeProject.id)
        const transformed: MapZone[] = zones.map((zone: ApiZone, i: number) => {
          const boundaries = zone.boundaries
            ? (typeof zone.boundaries === 'string' ? JSON.parse(zone.boundaries) : zone.boundaries) as [number, number][]
            : undefined
          return {
            id: zone.id,
            name: zone.name,
            description: zone.description || '',
            color: zoneColors[i % zoneColors.length],
            boundaries,
          }
        })
        setMapZones(transformed)
      } catch {
        setMapZones([])
      }
    }
    if (projects.length > 0) loadZones()
  }, [projects])

  useEffect(() => {
    async function loadMovementPaths() {
      if (!showPaths) { setMapRoutes([]); return }
      try {
        const res = await fetcher('/team/movement-paths?hours=4')
        const data = res?.data ?? res
        const paths: any[] = data?.paths ?? []
        const routes: MapRoute[] = paths
          .filter((p: any) => p.points && p.points.length >= 2)
          .map((p: any, i: number) => ({
            id: `path-${p.user_id}`,
            color: pathColors[i % pathColors.length],
            weight: 3,
            points: p.points.map((pt: any) => [pt.lat, pt.lng] as [number, number]),
          }))
        setMapRoutes(routes)
      } catch {
        setMapRoutes([])
      }
    }
    loadMovementPaths()
  }, [showPaths])

  const project = projects.find((p) => p.status === 'active') || projects[0]
  const onlineMembers = teamMembers.filter((m) => m.status === 'online')

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading map data...</span>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">No active projects found</h2>
        <p className="text-muted-foreground">You need to be assigned to a project to view the map.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Map</h1>
          <p className="text-muted-foreground">{project.name} — {project.location || 'Site Location'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {onlineMembers.length} Online
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 flex items-center gap-1">
            {mapZones.length} Zones
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setShowMembers(!showMembers)}>
            <Users className="h-4 w-4 mr-1" />
            {showMembers ? 'Hide' : 'Show'} Members
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowZones(!showZones)}>
            <Layers className="h-4 w-4 mr-1" />
            {showZones ? 'Hide' : 'Show'} Zones
          </Button>
          <Button size="sm" variant={showPaths ? 'default' : 'outline'} onClick={() => setShowPaths(!showPaths)}>
            <Route className="h-4 w-4 mr-1" />
            {showPaths ? 'Hide' : 'Show'} Paths
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 h-[600px] overflow-hidden border-primary/10">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Zone Coverage</CardTitle>
            </div>
            <CardDescription>Live team locations and zone boundaries</CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-full">
            <div className="h-full relative">
              <BaseMap
                users={showMembers ? mapUsers : []}
                zones={showZones ? mapZones : []}
                routes={showPaths ? mapRoutes : []}
                showLabels={true}
                showCoverage={false}
              />
              <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
                <Button size="icon" variant="outline" className="h-9 w-9 shadow-sm bg-background">
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Map Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-10" size="sm" onClick={() => setShowMembers(!showMembers)}>
                <Users className="h-4 w-4 mr-2" />
                Track All Members ({mapUsers.length})
              </Button>
              <Button variant="outline" className="w-full justify-start h-10" size="sm" onClick={() => setShowZones(!showZones)}>
                <Layers className="h-4 w-4 mr-2" />
                Zone Boundaries
              </Button>
              <Button variant={showPaths ? 'default' : 'outline'} className="w-full justify-start h-10" size="sm" onClick={() => setShowPaths(!showPaths)}>
                <Route className="h-4 w-4 mr-2" />
                Movement Paths (4h)
              </Button>
              <Button className="w-full h-10 shadow-sm" size="sm">
                Center on Team
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Team Leader</span>
                  <div className="flex h-3 w-3 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.5)]" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Active Member</span>
                  <div className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Online</span>
                  <div className="flex h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Idle</span>
                  <div className="flex h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Offline</span>
                  <div className="flex h-3 w-3 rounded-full bg-slate-400" />
                </div>
              </div>
              {showPaths && mapRoutes.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Movement Paths</p>
                  <div className="space-y-1">
                    {mapRoutes.map((route, i) => (
                      <div key={route.id} className="flex items-center gap-2 text-xs">
                        <div className="h-0.5 w-6 flex-shrink-0" style={{ backgroundColor: route.color }} />
                        <span className="truncate">{teamMembers[i]?.name || `Member ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Team Members</CardTitle>
              <CardDescription className="text-xs">{teamMembers.length} total</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {teamMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No members found</p>
                ) : (
                  teamMembers.slice(0, 10).map((m) => (
                    <div key={m.id} className="flex items-center gap-2 py-1">
                      <div className={cn('h-2 w-2 rounded-full shrink-0', {
                        'bg-emerald-500': m.status === 'online',
                        'bg-amber-500': m.status === 'idle',
                        'bg-slate-400': !m.status || m.status === 'offline',
                      })} />
                      <span className="text-xs truncate flex-1">{m.name || m.email || 'Unknown'}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{m.status || 'offline'}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
