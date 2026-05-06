'use client'

import * as React from 'react'
import {
  Shield, Search, Filter, Download,
  Clock, FileText, Users, Globe, Eye,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { fieldSyncSocket } from '@/lib/auth/socketManager'
import { auditService, type ApiAuditLog, type FrontendAuditLog } from '@/lib/api/auditService'
import { toast } from '@/components/ui/use-toast'

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<FrontendAuditLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [severityFilter, setSeverityFilter] = React.useState('all')

  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true)
        const data = await auditService.getAll()
        setLogs(data.map(log => auditService.transformForFrontend(log)))
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
        toast({
          title: 'Error',
          description: 'Failed to load audit logs. Please refresh.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [])

  React.useEffect(() => {
    const unsubscribe = fieldSyncSocket.on('audit_log', (data) => {
      const transformed = auditService.transformForFrontend(data as ApiAuditLog)
      setLogs((current) => {
        const deduped = current.filter((item) => item.id !== transformed.id)
        return [transformed, ...deduped]
      })
    })

    return unsubscribe
  }, [])

  const filtered = logs.filter(log => {
    const matchSearch = String(log.action || '').toLowerCase().includes(search.toLowerCase()) ||
                        String(log.details || '').toLowerCase().includes(search.toLowerCase()) ||
                        String(log.user || '').toLowerCase().includes(search.toLowerCase())
    const matchSeverity = severityFilter === 'all' || log.severity === severityFilter
    return matchSearch && matchSeverity
  })

  const severityConfig = {
    low: { label: 'Low', className: 'bg-emerald-500/10 text-emerald-500' },
    medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-500' },
    high: { label: 'High', className: 'bg-rose-500/10 text-rose-500' },
  }

  const categoryIcons = {
    user_management: Users,
    data_collection: FileText,
    project_config: Globe,
    security: Shield,
  } satisfies Record<FrontendAuditLog['category'], React.ElementType>

  return (
    <>
      <DashboardHeader
        title="Audit Logs"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects', href: '/supervisor/projects' }, { label: 'Audit Logs' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Project Audit Console</h1>
              <p className="text-muted-foreground">Immutable record of all project events and administrative actions</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export Logs
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search logs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="user">User Mgt</SelectItem>
                      <SelectItem value="data">Data Collection</SelectItem>
                      <SelectItem value="config">Project Config</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event & Details</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-10">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 animate-spin" />
                          Loading audit records...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((log) => {
                    const CategoryIcon = categoryIcons[log.category] || Shield
                    return (
                      <TableRow key={log.id} className="group">
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded bg-muted shrink-0 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                              <CategoryIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm leading-none mb-1">{log.action}</p>
                              <p className="text-xs text-muted-foreground max-w-md">{log.details}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.user}</p>
                            <p className="text-[10px] text-muted-foreground">{log.role}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={severityConfig[log.severity]?.className || ''}>
                            {severityConfig[log.severity]?.label || log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.timestamp}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Shield className="h-5 w-5 text-primary" />
                                  Log Entry Detail
                                </DialogTitle>
                                <DialogDescription>Project Activity Log #ID-{log.id}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Action</p>
                                    <p className="text-sm font-medium">{log.action}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Category</p>
                                    <Badge variant="outline">{log.category}</Badge>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Initiated By</p>
                                    <p className="text-sm font-medium">{log.user} ({log.role})</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">IP Address</p>
                                    <p className="text-sm font-mono text-muted-foreground">{log.ip}</p>
                                  </div>
                                  <div className="col-span-2 space-y-1 pt-2 border-t">
                                    <p className="text-xs font-bold uppercase text-muted-foreground">Raw Detail</p>
                                    <p className="text-sm bg-muted rounded p-3 font-mono leading-relaxed">
                                      {log.details}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Shield className="h-10 w-10 mb-2 opacity-20" />
                  <p>No audit entries match your current filters</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-muted-foreground">Showing live project events</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
