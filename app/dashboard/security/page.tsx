'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Activity, AlertTriangle, ArrowRight, Globe, Shield, Users } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { securityService } from '@/lib/api/securityService'
import { SecurityPageState, SecurityRefreshButton, SecurityStatusBadge, formatDateTime } from './_components'

export default function SecurityPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('admin-security-snapshot', () => securityService.getAdminSecuritySnapshot())

  return (
    <>
      <DashboardHeader title="Security Center" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Security Center</h1>
              <p className="text-muted-foreground">Threats, sessions, access policies, and security monitoring from live backend telemetry.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{data ? `Updated ${formatDateTime(data.generatedAt)}` : 'Waiting for data'}</Badge>
              <SecurityRefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
            </div>
          </div>

          <SecurityPageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Active Threats', value: data.overview.metrics.activeThreats, icon: AlertTriangle, bg: 'bg-red-500/10 text-red-500' },
                  { label: 'Blocked (24h)', value: data.overview.metrics.blocked24h, icon: Shield, bg: 'bg-emerald-500/10 text-emerald-500' },
                  { label: 'Active Sessions', value: data.overview.metrics.activeSessions, icon: Activity, bg: 'bg-primary/10 text-primary' },
                  { label: 'Suspicious IPs', value: data.overview.metrics.suspiciousIps, icon: Globe, bg: 'bg-amber-500/10 text-amber-500' },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.bg}`}>
                          <item.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {data.overview.modules.map((module) => (
                  <Link key={module.href} href={module.href}>
                    <Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{module.title}</h3>
                            <p className="text-sm text-muted-foreground">{module.desc}</p>
                          </div>
                          <SecurityStatusBadge status={module.status} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{module.count}</span>
                          <span className="flex items-center text-xs text-primary">
                            Open
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Threat Activity</CardTitle>
                  <CardDescription>Detected security events and blocked requests over the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.overview.threatSeries}>
                      <defs>
                        <linearGradient id="securityThreats" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="securityBlocked" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="threats" stroke="hsl(var(--destructive))" fill="url(#securityThreats)" strokeWidth={2} />
                      <Area type="monotone" dataKey="blocked" stroke="hsl(var(--primary))" fill="url(#securityBlocked)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Threats</CardTitle>
                    <CardDescription>Latest security events derived from rate-limit, audit, and API error data</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/security/threats">
                      View All
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.overview.recentThreats.length === 0 && (
                      <div className="rounded-lg border p-4 text-sm text-muted-foreground">No recent security threats detected.</div>
                    )}
                    {data.overview.recentThreats.map((threat) => (
                      <div key={threat.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{threat.type}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {threat.ip} to {threat.target} · {threat.attempts} events
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <SecurityStatusBadge status={threat.status} />
                          <span className="text-xs text-muted-foreground">{formatDateTime(threat.lastSeen)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  )
}
