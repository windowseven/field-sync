'use client'

import useSWR from 'swr'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Cpu, HardDrive, MemoryStick, Server, Wifi } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, StatusBadge, formatBytes, formatDuration } from '../_components'

export default function ServerStatusPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const server = data?.server

  return (
    <>
      <DashboardHeader title="Server Status" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Server Status</h1>
              <p className="text-muted-foreground">Live runtime metrics from the active backend process and websocket server.</p>
            </div>
            <div className="flex items-center gap-2">
              {server && <StatusBadge status={server.status} />}
              <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
            </div>
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {server && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Uptime', value: formatDuration(server.uptimeSeconds), icon: Server, detail: server.hostname },
                  { label: 'System Memory', value: `${server.memory.systemUsedPercent}%`, icon: MemoryStick, detail: formatBytes(server.memory.rss) },
                  { label: 'CPU Load', value: `${server.cpuLoadPercent}%`, icon: Cpu, detail: `${server.cpuCores} cores` },
                  { label: 'WebSocket Clients', value: String(server.websocket.total), icon: Wifi, detail: server.nodeVersion },
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
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Traffic and Errors</CardTitle>
                    <CardDescription>Live request activity over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={server.requests}>
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
                    <CardTitle>Runtime Footprint</CardTitle>
                    <CardDescription>Current process memory</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">RSS</p>
                      <p className="text-2xl font-bold">{formatBytes(server.memory.rss)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Heap Used</p>
                      <p className="text-2xl font-bold">{formatBytes(server.memory.heapUsed)}</p>
                    </div>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { name: 'Heap Used', value: server.memory.heapUsed },
                            { name: 'Heap Total', value: server.memory.heapTotal },
                            { name: 'RSS', value: server.memory.rss },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                          <YAxis hide />
                          <Tooltip formatter={(value) => formatBytes(Number(value))} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Connection Roles</CardTitle>
                    <CardDescription>Current websocket presence by role</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(server.websocket.byRole).length === 0 && (
                      <p className="text-sm text-muted-foreground">No connected websocket clients right now.</p>
                    )}
                    {Object.entries(server.websocket.byRole).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium capitalize">{role.replace('_', ' ')}</span>
                        <span className="text-lg font-semibold">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Runtime Metadata</CardTitle>
                    <CardDescription>Server identity and request totals</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        <TableRow><TableCell>Hostname</TableCell><TableCell>{server.hostname}</TableCell></TableRow>
                        <TableRow><TableCell>Platform</TableCell><TableCell>{server.platform}</TableCell></TableRow>
                        <TableRow><TableCell>Node Version</TableCell><TableCell>{server.nodeVersion}</TableCell></TableRow>
                        <TableRow><TableCell>Total Requests (24h)</TableCell><TableCell>{server.requestTotals.total}</TableCell></TableRow>
                        <TableRow><TableCell>Average Latency</TableCell><TableCell>{server.requestTotals.avgLatencyMs} ms</TableCell></TableRow>
                        <TableRow><TableCell>Error Rate</TableCell><TableCell>{server.requestTotals.errorRate}%</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
