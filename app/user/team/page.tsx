'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Users, MapPin, Clock, MessageCircle, Star,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { teamService, type ApiMyTeamInfo } from '@/lib/api/teamService'
import { useAuth } from '@/lib/auth/AuthContext'

type MemberStatus = 'online' | 'idle' | 'offline'

const statusConfig: Record<MemberStatus, { label: string; dot: string; text: string; bg: string }> = {
  online: { label: 'Online', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  idle: { label: 'Idle', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  offline: { label: 'Offline', dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted/50' },
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

export default function UserTeamPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ApiMyTeamInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await teamService.getMyTeamMembers()
        setData(res)
      } catch (err) {
        console.error('Failed to load team members', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const members = data?.members ?? []

  const myLocation = useMemo(() => {
    if (!user) return null
    const me = members.find((m) => m.id === user.id)
    if (me?.lat == null || me?.lng == null) return null
    return { lat: Number(me.lat), lng: Number(me.lng) }
  }, [members, user])

  const computedMembers = useMemo(() => {
    return members.map((m) => {
      const status: MemberStatus =
        m.status === 'online' ? 'online' : m.status === 'idle' ? 'idle' : 'offline'

      const hasCoords = m.lat != null && m.lng != null
      const coords = hasCoords ? { lat: Number(m.lat), lng: Number(m.lng) } : null
      const distanceKm =
        myLocation && coords ? haversineKm(myLocation, coords) : null

      return {
        ...m,
        statusForUi: status,
        locationLabel: coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Unknown',
        distanceLabel: distanceKm != null ? `${distanceKm.toFixed(1)} km` : '',
        lastSeenLabel: m.last_seen ? new Date(m.last_seen).toLocaleString() : 'Unknown',
      }
    })
  }, [members, myLocation])

  const onlineCount = computedMembers.filter((m) => m.statusForUi === 'online').length
  const idleCount = computedMembers.filter((m) => m.statusForUi === 'idle').length
  const offlineCount = computedMembers.filter((m) => m.statusForUi === 'offline').length

  if (loading) {
    return (
      <>
        <DashboardHeader
          title="Nearby Team"
          rootCrumb={{ label: 'Field', href: '/user/home' }}
          breadcrumbs={[{ label: 'Nearby Team' }]}
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
        title="Nearby Team"
        rootCrumb={{ label: 'Field', href: '/user/home' }}
        breadcrumbs={[{ label: 'Nearby Team' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nearby Team</h1>
            <p className="text-sm text-muted-foreground">
              {data?.team?.name ?? 'My Team'}
            </p>
          </div>

          {/* Summary */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{onlineCount}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">{idleCount}</p>
                  <p className="text-xs text-muted-foreground">Idle</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/60">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{offlineCount}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </CardTitle>
              <CardDescription>{computedMembers.length} members in your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {computedMembers.length > 0 ? computedMembers.map((member) => {
                  const sc = statusConfig[member.statusForUi]
                  return (
                    <div key={member.id} className={cn(
                      'rounded-lg border p-4 transition-shadow hover:shadow-md',
                      member.is_team_leader && 'border-primary/20 bg-primary/[0.02]'
                    )}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold',
                              member.is_team_leader ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-muted text-muted-foreground'
                            )}>
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className={cn(
                              'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                              sc.dot
                            )} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium leading-tight truncate">{member.name}</p>
                              {member.is_team_leader && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 gap-0.5 shrink-0">
                                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Leader
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" /> {member.locationLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" /> {member.lastSeenLabel}
                          </span>
                          {member.distanceLabel && (
                            <span className="font-medium text-primary">{member.distanceLabel}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Badge className={cn('text-xs px-2 border-0 flex-1 justify-center', sc.bg, sc.text)}>
                            {sc.label}
                          </Badge>
                          {member.statusForUi !== 'offline' && (
                            <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1 px-2 flex-1">
                              <Link href="/user/help">
                                <MessageCircle className="h-3 w-3" /> Contact
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No team members found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
