'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  Users, FolderKanban, Activity, Server, Database, Shield, Zap,
  RefreshCw, ArrowUpRight, UserCheck, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, History, Megaphone, Power, Globe,
  Ban, FolderOpen,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dashboardService } from '@/lib/api/dashboardService'

const quickActions = [
  { label: 'Global Users', sub: 'Manage all accounts', icon: Users, href: '/dashboard/users' },
  { label: 'Projects', sub: 'View & moderate projects', icon: FolderKanban, href: '/dashboard/projects' },
  { label: 'Security Center', sub: 'Review threats & sessions', icon: Shield, href: '/dashboard/security' },
  { label: 'System Health', sub: 'Check infrastructure', icon: Server, href: '/dashboard/maintenance' },
  { label: 'Audit Logs', sub: 'Full activity trail', icon: History, href: '/dashboard/audit' },
  { label: 'Broadcast', sub: 'Send system messages', icon: Megaphone, href: '/dashboard/broadcast' },
  { label: 'Supervisors', sub: 'Monitor & moderate', icon: UserCheck, href: '/dashboard/supervisors' },
  { label: 'Emergency', sub: 'God mode controls', icon: Power, href: '/dashboard/emergency' },
]

const statusColors: Record<string, string> = { healthy: 'bg-emerald-500', warning: 'bg-amber-500', critical: 'bg-red-500' }

export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false)
  const { data: rawData, isLoading, mutate } = useSWR('admin-dashboard-stats', () => dashboardService.getAdminStats())
  const { data: healthData } = useSWR('admin-system-health', () => dashboardService.getSystemHealth())

  const handleRefresh = async () => {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  const platformStats = [
    { 
      title: 'Total Users', 
      value: rawData ? rawData.platformStats.totalUsers : 0, 
      change: 'Active', 
      up: true, 
      icon: Users, 
      breakdown: { 
        Admins: rawData?.platformStats.admins || 0,
        Supervisors: rawData?.platformStats.supervisors || 0,
        Agents: rawData?.platformStats.fieldAgents || 0,
        Online: rawData?.platformStats.onlineUsers || 0,
      } 
    },
    {
      title: 'Projects',
      value: rawData ? rawData.projectStats.totalProjects : 0,
      change: 'Active',
      up: true,
      icon: FolderKanban,
      breakdown: {
        Active: rawData?.projectStats.activeProjects || 0,
        'Avg Progress': `${rawData?.projectStats.avgProgress || 0}%`
      }
    },
    {
      title: 'Submissions',
      value: rawData ? rawData.submissions : 0,
      change: '+0%',
      up: true,
      icon: Database,
      breakdown: {
        Recent: rawData?.recentActivity || 0
      }
    },
    {
      title: 'Live Sessions',
      value: rawData ? rawData.platformStats.onlineUsers : 0,
      change: 'Now',
      up: true,
      icon: Activity,
      breakdown: {
        'Field Agents': rawData?.platformStats.fieldAgents || 0,
        'Team Leaders': rawData?.platformStats.teamLeaders || 0
      }
    }
  ]

  const activityData = useMemo(
    () => rawData?.activitySeries ?? [],
    [rawData]
  )

  const activityTotals = useMemo(
    () => ({
      users: activityData.reduce((sum, item) => sum + item.users, 0),
      submissions: activityData.reduce((sum, item) => sum + item.submissions, 0),
      api: activityData.reduce((sum, item) => sum + item.api, 0),
    }),
    [activityData]
  )

  const heapUsedMb = healthData ? Math.round(healthData.memory.heapUsed / 1024 / 1024) : 0
  const rssMb = healthData ? Math.round(healthData.memory.rss / 1024 / 1024) : 0
  const healthStatus = healthData?.database === 'Connected' ? 'healthy' : 'warning'
  const systemHealth = [
    {
      title: 'API Gateway',
      metrics: [
        { label: 'Uptime', value: rawData ? `${Math.floor(rawData.systemHealth.uptime / 3600)}h` : '0h' },
        { label: 'Requests 24h', value: activityTotals.api.toLocaleString() }
      ],
      status: rawData ? 'healthy' : 'warning'
    },
    {
      title: 'Database',
      metrics: [
        { label: 'Status', value: healthData?.database || 'Unknown' },
        { label: 'Pool', value: healthData?.poolActive ? 'Active' : 'Inactive' }
      ],
      status: healthStatus
    },
    {
      title: 'Memory',
      metrics: [
        { label: 'Heap', value: healthData ? `${heapUsedMb} MB` : '-' },
        { label: 'RSS', value: healthData ? `${rssMb} MB` : '-' }
      ],
      status: heapUsedMb > 512 ? 'warning' : 'healthy'
    }
  ]

  const userDistribution = [
    { name: 'Admins', value: rawData?.platformStats.admins || 1, color: '#3b82f6' },
    { name: 'Supervisors', value: rawData?.platformStats.supervisors || 1, color: '#eab308' },
    { name: 'Field Agents', value: rawData?.platformStats.fieldAgents || 1, color: '#22c55e' }
  ]

  const recentActivity = [
     { message: `${rawData?.recentActivity || 0} audit events in the last 24h`, sub: 'Audit stream', time: rawData?.systemHealth.timestamp ? new Date(rawData.systemHealth.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(), icon: CheckCircle2, bg: 'bg-emerald-500/10', color: 'text-emerald-500' }
  ]

  const projectActivity = [
    { name: 'Current', active: rawData?.projectStats.activeProjects || 0, new: 0 }
  ]

  return (
    <>
      <DashboardHeader title="System Overview" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {isLoading && <div className="text-sm text-muted-foreground animate-pulse">Loading platform statistics...</div>}
          
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Platform Control Center</h1>
              <p className="text-muted-foreground">System-wide overview · Admin sees everything, controls the platform</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} /> Refresh
            </Button>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">System Health</CardTitle>
                  <CardDescription>Real-time status of all platform services</CardDescription>
                </div>
                <Badge variant="secondary" className={healthStatus === 'healthy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {healthStatus === 'healthy' ? 'All Systems Operational' : 'Needs Attention'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {systemHealth.map((s) => (
                <div key={s.title} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
                  <div className={cn('h-2.5 w-2.5 rounded-full animate-pulse shrink-0', statusColors[s.status])} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.title}</p>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      {s.metrics.map((m, i) => (
                        <span key={i} className="text-xs text-muted-foreground">
                          {m.label}: <span className="text-foreground">{m.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Platform KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformStats.map((stat) => (
              <Card key={stat.title} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className={cn('font-mono', stat.up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500')}>
                      {stat.up ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(stat.breakdown).map(([key, value]) => (
                      <span key={key} className="text-xs text-muted-foreground">
                        {key}: <span className="text-foreground font-medium">{String(value)}</span>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>Real 24-hour activity from audit logs, submissions, and live API traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="users">
                  <TabsList className="mb-4">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="submissions">Submissions</TabsTrigger>
                    <TabsTrigger value="api">API Calls</TabsTrigger>
                  </TabsList>
                  {(['users', 'submissions', 'api'] as const).map((key) => {
                    const colors: Record<string, string> = { users: 'hsl(var(--primary))', submissions: 'hsl(var(--chart-2))', api: 'hsl(var(--chart-3))' }
                    return (
                      <TabsContent key={key} value={key} className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activityData}>
                            <defs>
                              <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors[key]} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={colors[key]} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey={key} stroke={colors[key]} fill={`url(#grad-${key})`} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </TabsContent>
                    )
                  })}
                </Tabs>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Active User Hits</p>
                    <p className="mt-1 text-2xl font-bold">{activityTotals.users}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Submissions in 24h</p>
                    <p className="mt-1 text-2xl font-bold">{activityTotals.submissions}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">API Requests in 24h</p>
                    <p className="mt-1 text-2xl font-bold">{activityTotals.api}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown by role across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={userDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="hsl(var(--background))" strokeWidth={2}>
                        {userDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {userDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity + Project Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system events and admin actions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/audit">
                      View All <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-full shrink-0', a.bg)}>
                        <a.icon className={cn('h-4 w-4', a.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.message}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.sub} · {a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
                <CardDescription>Active and new projects this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectActivity}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="active" name="Active" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="new" name="New" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump to any admin section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {quickActions.map((action) => (
                  <Button key={action.href} variant="outline" className="h-auto flex-col items-start p-4 gap-2" asChild>
                    <Link href={action.href}>
                      <action.icon className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.sub}</p>
                      </div>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  )
}
