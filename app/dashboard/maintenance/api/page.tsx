'use client'

import useSWR from 'swr'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Clock, Globe, ShieldAlert } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, StatusBadge, formatDateTime } from '../_components'

export default function ApiMonitorPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const api = data?.api

  return (
    <>
      <DashboardHeader title="API Monitor" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">API Monitor</h1>
              <p className="text-muted-foreground">Live request counts, endpoint latency, and recent HTTP failures from the backend runtime.</p>
            </div>
            <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {api && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Requests (24h)', value: String(api.totalRequests), icon: Activity },
                  { label: 'Errors (24h)', value: String(api.totalErrors), icon: ShieldAlert },
                  { label: 'Avg Latency', value: `${api.avgLatencyMs} ms`, icon: Clock },
                  { label: 'P99 Latency', value: `${api.p99LatencyMs} ms`, icon: Globe },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-6 w-6 text-primary" />
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
                    <CardTitle>Request Volume and Latency</CardTitle>
                    <CardDescription>Real request telemetry over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={api.series}>
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
                    <CardTitle>By HTTP Method</CardTitle>
                    <CardDescription>Method mix from real requests</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={api.methodBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="method" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Endpoint Performance</CardTitle>
                  <CardDescription>Real request aggregation by method and route</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Avg Latency</TableHead>
                        <TableHead>P99</TableHead>
                        <TableHead>Error Rate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {api.endpoints.map((endpoint) => (
                        <TableRow key={endpoint.endpoint}>
                          <TableCell className="font-mono text-xs">{endpoint.endpoint}</TableCell>
                          <TableCell>{endpoint.requests}</TableCell>
                          <TableCell>{endpoint.avgLatency} ms</TableCell>
                          <TableCell>{endpoint.p99} ms</TableCell>
                          <TableCell>{endpoint.errorRate}%</TableCell>
                          <TableCell><StatusBadge status={endpoint.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent API Errors</CardTitle>
                  <CardDescription>Newest 4xx/5xx responses captured by the runtime monitor</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {api.recentErrors.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No API errors have been captured since the current backend process started.
                          </TableCell>
                        </TableRow>
                      )}
                      {api.recentErrors.map((entry) => (
                        <TableRow key={`${entry.time}-${entry.endpoint}-${entry.status}`}>
                          <TableCell>{formatDateTime(entry.time)}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.method} {entry.endpoint}</TableCell>
                          <TableCell>{entry.status}</TableCell>
                          <TableCell>{entry.durationMs} ms</TableCell>
                          <TableCell className="font-mono text-xs">{entry.ip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  )
}
