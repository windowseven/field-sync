'use client'

import useSWR from 'swr'
import { HardDrive, History, ShieldCheck } from 'lucide-react'

import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { maintenanceService } from '@/lib/api/maintenanceService'
import { PageState, RefreshButton, formatBytes, formatDateTime } from '../_components'

export default function BackupPage() {
  const { data, isLoading, error, mutate, isValidating } = useSWR('maintenance-snapshot', () => maintenanceService.getSnapshot())
  const backup = data?.backup

  return (
    <>
      <DashboardHeader title="Backup & Restore" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Backup & Restore</h1>
              <p className="text-muted-foreground">Real backup files and backup-related audit entries detected by the backend.</p>
            </div>
            <RefreshButton refreshing={isValidating} onRefresh={() => void mutate()} />
          </div>

          <PageState isLoading={isLoading} error={error instanceof Error ? error.message : undefined} />

          {backup && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Backup Directory', value: backup.exists ? 'Present' : 'Missing', icon: HardDrive, detail: backup.directory },
                  { label: 'Backup Files', value: String(backup.totalBackups), icon: ShieldCheck, detail: 'Detected on disk' },
                  { label: 'Stored Size', value: formatBytes(backup.totalSizeBytes), icon: HardDrive, detail: 'Across backup files' },
                  { label: 'Latest Backup', value: backup.latestBackupAt ? formatDateTime(backup.latestBackupAt) : 'None', icon: History, detail: 'Filesystem or audit log' },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-bold">{item.value}</p>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Backup Files</CardTitle>
                    <CardDescription>Real files found under the backup directory</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Modified</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backup.recentBackups.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                              No backup files are currently present on disk.
                            </TableCell>
                          </TableRow>
                        )}
                        {backup.recentBackups.map((item) => (
                          <TableRow key={item.path}>
                            <TableCell className="font-mono text-xs">{item.name}</TableCell>
                            <TableCell>{formatBytes(item.sizeBytes)}</TableCell>
                            <TableCell>{formatDateTime(item.modifiedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Backup Audit Trail</CardTitle>
                    <CardDescription>Real audit entries from the database</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Actor</TableHead>
                          <TableHead>When</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backup.auditTrail.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                              No backup-related audit entries found.
                            </TableCell>
                          </TableRow>
                        )}
                        {backup.auditTrail.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{item.action}</p>
                                <p className="text-xs text-muted-foreground">{item.detail}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.userName || 'system'}</TableCell>
                            <TableCell>{formatDateTime(item.timestamp)}</TableCell>
                          </TableRow>
                        ))}
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
