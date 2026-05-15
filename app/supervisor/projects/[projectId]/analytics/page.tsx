'use client'

import * as React from 'react'
import {
  TrendingUp, TrendingDown, Users, ClipboardList, Clock,
  MapPin, Download, Filter, Calendar, BarChart3, PieChart as PieChartIcon,
  Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Cell, Pie,
} from 'recharts'
import { cn } from '@/lib/utils'

import { analyticsService, ProjectAnalytics } from '@/lib/api/analyticsService'
import { useParams } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

export default function AnalyticsPage() {
  const { projectId } = useParams() as { projectId: string }
  const [data, setData] = React.useState<ProjectAnalytics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const res = await analyticsService.getProjectAnalytics(projectId)
        if (res) setData(res)
      } catch (err) {
        console.error('Failed to fetch analytics', err)
        toast({
          title: 'Error',
          description: 'Failed to load project analytics.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    if (projectId) fetchAnalytics()
  }, [projectId])

  const submissionData = React.useMemo(() => {
    return analyticsService.transformSubmissionData(data?.submissionsByDate || [])
  }, [data])

  const teamData = React.useMemo(() => {
    return analyticsService.transformTeamData(data?.teamMetrics || [])
  }, [data])

  const categoryData = React.useMemo(() => {
    if (!data?.zonesPerformance) return []
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4']
    return data.zonesPerformance.slice(0, 5).map((z, i) => ({
      name: z.name,
      value: z.submissions,
      color: colors[i % colors.length],
      key: `zone-${z.name}-${i}`
    }))
  }, [data])

  const totalSubmissions = data?.submissionsByDate?.reduce((acc, curr) => acc + curr.count, 0) || 0
  const approvedSubmissions = data?.submissionsByDate?.filter(s => s.status === 'approved').reduce((acc, curr) => acc + curr.count, 0) || 0
  const approvalRate = totalSubmissions > 0 ? ((approvedSubmissions / totalSubmissions) * 100).toFixed(1) : '0'
  const activeAgents = data?.teamMetrics?.reduce((acc, curr) => acc + curr.team_size, 0) || 0

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <BarChart3 className="h-10 w-10 animate-pulse text-primary/30 mb-4" />
        <p className="text-muted-foreground font-medium">Synthesizing field data...</p>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Project Analytics"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects', href: '/supervisor/projects' }, { label: 'Analytics' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Project Insight & Analytics</h1>
              <p className="text-muted-foreground">Comprehensive performance data and field intelligence</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" /> Last 7 Days
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Export Report
              </Button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Submissions', value: totalSubmissions.toLocaleString(), trend: '+0.0%', isUp: true, icon: ClipboardList },
              { label: 'Approval Rate', value: `${approvalRate}%`, trend: '+0.0%', isUp: true, icon: BarChart3 },
              { label: 'Active Personnel', value: activeAgents.toString(), trend: '+0.0%', isUp: true, icon: Users },
              { label: 'Project Goal', value: data?.project?.target_submissions?.toLocaleString() || '0', trend: 'Target', isUp: true, icon: TrendingUp },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                    <div className={cn('flex items-center text-[10px] font-bold', kpi.isUp ? 'text-emerald-500' : 'text-rose-500')}>
                      {kpi.isUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                      {kpi.trend} <span className="text-muted-foreground ml-1 font-normal italic">periodic insight</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                    <kpi.icon className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Daily Volume Bar Chart */}
            <Card className="lg:col-span-2 shadow-sm border-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-base">Submission Volume</CardTitle>
                  <CardDescription>Daily total vs approved submissions</CardDescription>
                </div>
                <Select defaultValue="week">
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Weekly View</SelectItem>
                    <SelectItem value="month">Monthly View</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={submissionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dx={-10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="approved" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Pie Chart */}
            <Card className="shadow-sm border-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Zone Distribution</CardTitle>
                <CardDescription>Submissions divided by operational zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {categoryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black tracking-tighter">{totalSubmissions}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total</span>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {categoryData.map((cat: any) => (
                    <div key={cat.key || cat.name} className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </div>
                      <span className="font-bold">{totalSubmissions > 0 ? Math.round((cat.value / totalSubmissions) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Team Efficiency Table/List */}
            <Card className="shadow-sm border-primary/5">
              <CardHeader>
                <CardTitle className="text-base font-bold">Team Output Metrics</CardTitle>
                <CardDescription>Comparative performance across project teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teamData.length > 0 ? teamData.map((team: any) => (
                    <div key={team.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          < Badge variant="outline" className="h-5 px-1.5 text-[9px] uppercase font-black border-primary/20 text-primary bg-primary/5">Operational Unit</Badge>
                          <span className="text-sm font-bold tracking-tight">{team.name}</span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">{team.submissions} records</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] mb-1.5">
                            <span className="text-muted-foreground uppercase font-black tracking-widest leading-none">Relative Capacity</span>
                            <span className="font-black text-primary leading-none">{team.coverage}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-primary/5 border border-primary/5 overflow-hidden p-0.5">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${team.coverage}%` }} />
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-[10px] font-black text-emerald-500 flex items-center justify-end leading-none">
                            <TrendingUp className="h-3 w-3 mr-0.5" /> 2.4%
                          </span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-10 text-center text-muted-foreground italic text-sm">No team data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Field Activity Heatmap (Visual Mock) */}
            <Card className="shadow-sm border-primary/5">
              <CardHeader>
                <CardTitle className="text-base font-bold">Field Persistence Density</CardTitle>
                <CardDescription>Geographic concentration of tactical submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] w-full rounded-xl bg-primary/[0.02] border border-primary/5 relative overflow-hidden group">
                  {/* Mock Heatmap Visualization */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-40 transition-opacity">
                    <Activity className="h-16 w-16 text-primary animate-pulse" />
                  </div>
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md border border-primary/10 rounded-xl p-3 space-y-2.5 shadow-lg">
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Saturation Legend</p>
                    <div className="h-2 w-32 bg-gradient-to-r from-primary/10 via-primary/50 to-primary rounded-full" />
                    <div className="flex justify-between text-[9px] text-muted-foreground font-black uppercase tracking-tighter">
                      <span>Sparse</span>
                      <span>Critical</span>
                    </div>
                  </div>
                  {/* Mock clusters */}
                  <div className="absolute top-[20%] left-[30%] h-24 w-24 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute top-[45%] left-[55%] h-32 w-32 bg-primary/15 rounded-full blur-3xl" />
                  <div className="absolute top-[65%] left-[40%] h-24 w-24 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                </div>
                <div className="mt-5 flex items-center justify-between text-xs pt-4 border-t border-primary/5 font-medium">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Nairobi Sector Delta highest saturation</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-lg px-3 uppercase tracking-wider">Expand Intelligence</Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </>
  )
}
