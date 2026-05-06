'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Server, XCircle } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, StatusBadge, formatDateTime } from './_components'

export default function MaintenancePage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())

  return (
    <>
      <DashboardHeader title="System Maintenance" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">System Health Center</h1>
              <p className="text-muted-foreground">Every maintenance section below is now backed by live backend metrics.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{data ? `Updated ${formatDateTime(data.generatedAt)}` : 'Waiting for data'}</Badge>
              <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
            </div>
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: 'Healthy', value: data.overview.statusCounts.healthy, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Warning', value: data.overview.statusCounts.warning, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { label: 'Critical', value: data.overview.statusCounts.critical, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                  { label: 'Requests (24h)', value: data.overview.headline.requests24h, icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'WebSocket Clients', value: data.overview.headline.websocketClients, icon: Server, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.bg}`}>
                          <item.icon className={`h-6 w-6 ${item.color}`} />
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

              <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Platform Traffic</CardTitle>
                    <CardDescription>Real request volume, errors, and latency over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.overview.activitySeries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <Tooltip />
                        <Line yAxisId="left" type="monotone" dataKey="requests" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="errors" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="latency" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Live Footprint</CardTitle>
                    <CardDescription>Current usage right now</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Active Users (24h)</p>
                      <p className="mt-1 text-3xl font-bold">{data.overview.headline.activeUsers24h}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Users Online</p>
                      <p className="mt-1 text-3xl font-bold">{data.overview.headline.onlineUsers}</p>
                    </div>
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.overview.activitySeries}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="time" hide />
                          <YAxis hide />
                          <Tooltip />
                          <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {data.overview.sections.map((section) => (
                  <Card key={section.href} className="transition-colors hover:border-primary/40">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                        <StatusBadge status={section.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {section.metrics.map((metric) => (
                          <div key={metric.label} className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                            <p className="mt-1 text-lg font-semibold">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                      <Button asChild variant="outline" className="w-full justify-between">
                        <Link href={section.href}>
                          Open {section.title}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
