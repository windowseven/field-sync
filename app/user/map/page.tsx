'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  MapPin, Navigation, Users, AlertTriangle, Loader2, Wifi, WifiOff, Crosshair
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import useSWR from 'swr'
import { fetcher } from '@/lib/api/swr-fetcher'
import { BaseMap, MapUser, MapZone } from '@/components/shared/map'
import { useGeolocation, useWsLocationBroadcast } from '@/hooks/use-geolocation'
import { zoneService, ApiZone } from '@/lib/api/zoneService'
import { projectService, ApiProject } from '@/lib/api/projectService'

const zoneColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6']

type ApiLocation = {
  user_id: string
  name?: string
  email?: string
  role: string
  status?: string
  lat: number
  lng: number
  accuracy?: number
  updated_at?: string
}

export default function UserMapPage() {
  const { data: profileData, error: profileError } = useSWR('/auth/profile', fetcher)
  const { data: teamData, error: teamError } = useSWR('/team/members', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  })

  const [zones, setZones] = useState<MapZone[]>([])
  const [locations, setLocations] = useState<ApiLocation[]>([])
  const [routeHistory, setRouteHistory] = useState<[number, number][]>([])
  const [locationSharing, setLocationSharing] = useState(true)
  const [isZonesLoading, setIsZonesLoading] = useState(true)
  const [showRoute, setShowRoute] = useState(false)

  const geo = useGeolocation(5000)

  useEffect(() => {
    if (locationSharing) {
      geo.startWatching()
    } else {
      geo.stopWatching()
    }
  }, [locationSharing])

  useWsLocationBroadcast(
    locationSharing ? geo.lat : null,
    locationSharing ? geo.lng : null,
    locationSharing ? geo.accuracy : null,
    locationSharing && geo.lat != null && geo.lng != null
  )

  useEffect(() => {
    const loadZones = async () => {
      try {
        setIsZonesLoading(true)
        const projects = await projectService.getAll()
        const activeProject = projects.find((p: ApiProject) => p.status === 'active') || projects[0]
        if (!activeProject) { setZones([]); return }

        const projectZones = await zoneService.getByProject(activeProject.id)
        const transformed: MapZone[] = projectZones.map((zone: ApiZone, i: number) => ({
          id: zone.id,
          name: zone.name,
          description: zone.description || '',
          color: zoneColors[i % zoneColors.length],
          team: '',
          status: 'active',
          coverage: 0,
          boundaries: zone.boundaries ? (typeof zone.boundaries === 'string' ? JSON.parse(zone.boundaries) : zone.boundaries) as [number, number][] : undefined,
        }))
        setZones(transformed)
      } catch {
        setZones([])
      } finally {
        setIsZonesLoading(false)
      }
    }
    loadZones()
  }, [])

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetcher('/locations')
        const locs: ApiLocation[] = res?.locations ?? []
        setLocations(locs)
      } catch {
        setLocations([])
      }
    }
    loadLocations()
  }, [])

  useEffect(() => {
    if (showRoute) {
      const loadRouteHistory = async () => {
        try {
          const res = await fetcher('/locations/my/history?hours=24')
          const history: any[] = res?.history ?? []
          const points: [number, number][] = history.map((h: any) => [h.lat, h.lng])
          setRouteHistory(points)
        } catch {
          setRouteHistory([])
        }
      }
      loadRouteHistory()
    } else {
      setRouteHistory([])
    }
  }, [showRoute])

  const user = profileData?.user || profileData || {}
  const members: any[] = Array.isArray(teamData) ? teamData : []
  const onlineTeam = members.filter((m) => m.status === 'online')

  const mapUsers: MapUser[] = useMemo(() => {
    const seen = new Set<string>()
    const result: MapUser[] = []
    for (const loc of locations) {
      if (seen.has(loc.user_id)) continue
      seen.add(loc.user_id)
      result.push({
        user_id: loc.user_id,
        name: loc.name,
        email: loc.email,
        role: loc.role,
        status: loc.status,
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy,
        updated_at: loc.updated_at,
      })
    }
    const currentUserId = user?.id || 'current-user'
    if (locationSharing && geo.lat != null && geo.lng != null && !seen.has(currentUserId)) {
      result.push({
        user_id: currentUserId,
        name: user?.name || 'You',
        role: user?.role || 'field_agent',
        status: 'online',
        lat: geo.lat,
        lng: geo.lng,
        accuracy: geo.accuracy ?? 15,
      })
    }
    return result
  }, [locations, geo.lat, geo.lng, geo.accuracy, locationSharing, user])

  const mapRoutes = useMemo(() => {
    if (!showRoute || routeHistory.length < 2) return []
    return [{
      id: 'my-route',
      color: '#3b82f6',
      weight: 3,
      points: routeHistory,
    }]
  }, [showRoute, routeHistory])

  const mapCenter: [number, number] | undefined = useMemo(() => {
    if (geo.lat != null && geo.lng != null) return [geo.lat, geo.lng]
    return undefined
  }, [geo.lat, geo.lng])

  if ((!profileData && !profileError) || (!teamData && !teamError)) {
    return (
      <>
        <DashboardHeader
          title="Field Map"
          rootCrumb={{ label: 'Field', href: '/user/home' }}
          breadcrumbs={[{ label: 'Interactive Map' }]}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Field Map"
        rootCrumb={{ label: 'Field', href: '/user/home' }}
        breadcrumbs={[{ label: 'Interactive Map' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Field Map</h1>
              <p className="text-sm text-muted-foreground">View your zone and nearby team members</p>
            </div>
            <div className="flex items-center gap-3">
              <Wifi className={cn('h-4 w-4', locationSharing ? 'text-emerald-500' : 'text-muted-foreground')} />
              <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
              <span className="text-sm text-muted-foreground">
                {locationSharing ? 'Location visible' : 'Location hidden'}
              </span>
            </div>
          </div>

          {/* Info bar */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Zone</p>
                  <p className="font-semibold">{user.assigned_zone || zones[0]?.name || 'Not assigned'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Navigation className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your Position</p>
                  <p className="font-semibold">
                    {geo.lat != null && geo.lng != null
                      ? `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`
                      : geo.error ? 'Unavailable' : 'Locating...'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team Online</p>
                  <p className="font-semibold">{onlineTeam.length} nearby</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Geolocation error */}
          {geo.error && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Unable to get your location</p>
                  <p className="text-xs text-muted-foreground">{geo.error}</p>
                </div>
                <Button size="sm" variant="outline" onClick={geo.startWatching}>Retry</Button>
              </CardContent>
            </Card>
          )}

          {/* Map */}
          <Card className="overflow-hidden">
            <div className="relative h-72 md:h-[500px]">
              {(isZonesLoading || (!geo.lat && !zones.length)) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <BaseMap
                  center={mapCenter}
                  zoom={15}
                  users={mapUsers}
                  zones={zones}
                  routes={mapRoutes}
                  showUsers={true}
                  showZones={true}
                  showCoverage={false}
                  showLabels={true}
                />
              )}

              {/* Center button */}
              <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shadow-sm bg-background"
                  onClick={() => geo.startWatching()}
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={showRoute ? 'default' : 'outline'}
                  className={cn('h-9 w-9 shadow-sm bg-background', showRoute && '!bg-blue-500 !text-white')}
                  onClick={() => setShowRoute(!showRoute)}
                  title="Show route history"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg p-3 border shadow-sm space-y-1.5">
                <p className="text-xs font-medium mb-1.5 pb-1.5 border-b">Legend</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Your position
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Team active
                </div>
                {showRoute && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <span className="h-0.5 w-5 bg-blue-500" /> Route history
                  </div>
                )}
              </div>
            </div>

            <CardContent className="p-3 flex items-center justify-between bg-muted/20 border-t">
              <div className="flex items-center gap-2">
                <div className={cn('h-2 w-2 rounded-full', locationSharing ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                <span className="text-xs text-muted-foreground">
                  {locationSharing ? 'Sharing location with your team' : 'Location hidden from team'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">OpenStreetMap via Leaflet</span>
            </CardContent>
          </Card>

          {/* Warning when location sharing is off */}
          {!locationSharing && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Location sharing disabled</p>
                  <p className="text-xs text-muted-foreground">Your team cannot see your position. Supervisors may not be able to assist without a location fix.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setLocationSharing(true)} className="shrink-0">
                  Enable
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Team proximity list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Nearby Team
              </CardTitle>
              <CardDescription>Team members in your area</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {members.length > 0 ? members.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', {
                    'bg-emerald-500': m.status === 'online',
                    'bg-amber-500': m.status === 'idle',
                    'bg-muted-foreground': m.status === 'offline' || !m.status,
                  })} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.name || m.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {m.status || 'offline'}
                  </Badge>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No team members nearby</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
