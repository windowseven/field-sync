'use client'

import useSWR from 'swr'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Database, HardDrive, Layers } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, StatusBadge, formatBytes, formatDuration } from '../_components'

export default function DatabasePage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const database = data?.database

  return (
    <>
      <DashboardHeader title="Database" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Database Health</h1>
              <p className="text-muted-foreground">Live MySQL connection, table size, and write activity metrics.</p>
            </div>
            <div className="flex items-center gap-2">
              {database && <StatusBadge status={database.connected ? 'healthy' : 'critical'} />}
              <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
            </div>
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {database && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Active Connections', value: `${database.activeConnections}/${database.maxConnections}`, icon: Activity, detail: `${database.runningConnections} running` },
                  { label: 'Database Size', value: formatBytes(database.totalSizeBytes), icon: HardDrive, detail: `${database.tableCount} tables` },
                  { label: 'Total Rows', value: database.totalRows.toLocaleString(), icon: Layers, detail: 'Across all tables' },
                  { label: 'DB Uptime', value: formatDuration(database.uptimeSeconds), icon: Database, detail: database.connected ? 'Connected' : 'Disconnected' },
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

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Write Volume</CardTitle>
                    <CardDescription>Real submission throughput over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={database.activity}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Audit Table Activity</CardTitle>
                    <CardDescription>Real audit insert volume over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={database.activity}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="audits" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Table Footprint</CardTitle>
                  <CardDescription>Live table sizes from <code>information_schema</code></CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Indexes</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {database.tables.map((table) => (
                        <TableRow key={table.name}>
                          <TableCell className="font-mono text-sm">{table.name}</TableCell>
                          <TableCell>{table.rowCount.toLocaleString()}</TableCell>
                          <TableCell>{formatBytes(table.totalBytes)}</TableCell>
                          <TableCell>{table.indexes}</TableCell>
                          <TableCell><StatusBadge status={table.status === 'warning' ? 'warning' : 'healthy'} /></TableCell>
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
