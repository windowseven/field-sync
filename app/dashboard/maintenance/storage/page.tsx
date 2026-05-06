'use client'

import useSWR from 'swr'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Database, FolderArchive, HardDrive, Package } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, formatBytes, formatDateTime } from '../_components'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

export default function StoragePage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const storage = data?.storage

  return (
    <>
      <DashboardHeader title="Storage" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Storage</h1>
              <p className="text-muted-foreground">Real storage footprint across the database, logs, assets, build output, and backups.</p>
            </div>
            <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {storage && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Total Footprint', value: formatBytes(storage.totalSizeBytes), icon: HardDrive },
                  { label: 'Storage Segments', value: String(storage.breakdown.length), icon: Package },
                  { label: 'Largest Asset', value: storage.largestFiles[0] ? formatBytes(storage.largestFiles[0].size) : '0 B', icon: FolderArchive },
                  { label: 'Database Share', value: storage.breakdown[0] ? formatBytes(storage.breakdown[0].sizeBytes) : '0 B', icon: Database },
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
                <Card className="xl:col-span-1">
                  <CardHeader>
                    <CardTitle>Storage Breakdown</CardTitle>
                    <CardDescription>Current segment sizes</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={storage.breakdown} dataKey="sizeBytes" nameKey="label" innerRadius={70} outerRadius={100} paddingAngle={3}>
                          {storage.breakdown.map((entry, index) => (
                            <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatBytes(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Storage Segments</CardTitle>
                    <CardDescription>Actual directory and database size totals</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Segment</TableHead>
                          <TableHead>Path</TableHead>
                          <TableHead>Files / Tables</TableHead>
                          <TableHead>Size</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {storage.breakdown.map((item) => (
                          <TableRow key={item.label}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell className="font-mono text-xs">{item.path}</TableCell>
                            <TableCell>{item.fileCount}</TableCell>
                            <TableCell>{formatBytes(item.sizeBytes)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Largest Files and Tables</CardTitle>
                  <CardDescription>Real largest artifacts detected in the monitored storage targets</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path / Table</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Modified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storage.largestFiles.map((item) => (
                        <TableRow key={item.path}>
                          <TableCell className="font-mono text-xs">{item.path}</TableCell>
                          <TableCell>{formatBytes(item.size)}</TableCell>
                          <TableCell>{formatDateTime(item.modifiedAt)}</TableCell>
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
