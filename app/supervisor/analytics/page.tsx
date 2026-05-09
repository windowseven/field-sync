'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3, TrendingUp, Users, ClipboardList, MapPin,
  Clock, Award, Activity, Loader2, XCircle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { analyticsService } from '@/lib/api/analyticsService'
import { projectService } from '@/lib/api/projectService'

const AGENT_COLORS = ['#22c55e', '#06b6d4', '#3b82f6', '#f59e0b', '#ef4444']

export default function SupervisorAnalyticsPage() {
  const [period, setPeriod] = useState('week')
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const projects = await projectService.getAll()
        const activeProject = projects.find((p: any) => p.status === 'active') || projects[0]
        if (activeProject) {
          const data = await analyticsService.getProjectAnalytics(activeProject.id, period)
          setAnalytics(data)
        } else {
          const data = await analyticsService.getAdminAnalytics(period as any)
          setAnalytics(data)
        }
        setError(null)
      } catch (err) {
        console.error('Failed to load analytics:', err)
        setError('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [period])

  const submissionsByDate = analytics?.submissionsByDate
    ? analyticsService.transformSubmissionData(analytics.submissionsByDate)
    : []

  const teamMetrics = analytics?.teamMetrics
    ? analyticsService.transformTeamData(
        analytics.teamMetrics.map((t: any) => ({ team: t.name, completion: t.team_submissions || 0, team_size: t.team_size || 0 }))
      )
    : []

  const zoneData = analytics?.zonesPerformance?.map((z: any) => ({
    zone: z.name,
    hours: z.submissions || 0,
    agents: Math.round((z.submissions || 0) / 5) + 1,
  })) || []

  const topPerformers = teamMetrics
    .sort((a: any, b: any) => b.submissions - a.submissions)
    .slice(0, 5)
    .map((t: any, i: number) => ({
      name: t.name,
      team: t.name,
      submissions: t.submissions,
      rate: t.size > 0 ? `${Math.round(t.submissions / t.size)}/day` : 'N/A',
      color: AGENT_COLORS[i % AGENT_COLORS.length],
    }))

  const totalSubmissions = submissionsByDate.reduce((a: number, d: any) => a + d.total, 0)
  const approvedSubmissions = submissionsByDate.reduce((a: number, d: any) => a + d.approved, 0)
  const coveragePct = analytics?.project?.target_submissions > 0
    ? Math.round((totalSubmissions / analytics.project.target_submissions) * 100)
    : 0

  const coveragePie = [
    { name: 'Covered', value: Math.min(100, coveragePct), color: 'hsl(var(--primary))' },
    { name: 'Remaining', value: Math.max(0, 100 - coveragePct), color: 'hsl(var(--muted))' },
  ]

  return (
    <>
      <DashboardHeader
        title="Analytics"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor' }}
        breadcrumbs={[{ label: 'Project Overview', href: '/supervisor' }, { label: 'Analytics' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Project Analytics</h1>
              <p className="text-muted-foreground">Performance, coverage, and team statistics</p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="project">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && (
          <>
          {/* KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Submissions', value: totalSubmissions, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Coverage Progress', value: `${coveragePct}%`, icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Teams Active', value: teamMetrics.length, icon: Users, color: 'text-chart-2', bg: 'bg-chart-2/10' },
              { label: 'Project Target', value: analytics?.project?.target_submissions || 0, icon: Clock, color: 'text-chart-3', bg: 'bg-chart-3/10' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.bg)}>
                      <s.icon className={cn('h-5 w-5', s.color)} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submission trend + Coverage pie */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Submission Trend</CardTitle>
                <CardDescription>Daily form submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={submissionsByDate}>
                      <defs>
                        <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Area type="monotone" dataKey="total" name="Submissions" stroke="hsl(var(--primary))" fill="url(#gSub)" strokeWidth={2} />
                      <Area type="monotone" dataKey="approved" name="Approved" stroke="hsl(var(--chart-2))" fillOpacity={0} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overall Coverage</CardTitle>
                <CardDescription>Project area surveyed so far</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={coveragePie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                        {coveragePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-2">
                  <p className="text-3xl font-bold">{coveragePct}%</p>
                  <p className="text-xs text-muted-foreground">of target</p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Submissions</span>
                    <span className="font-medium">{totalSubmissions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Approved</span>
                    <span className="font-medium">{approvedSubmissions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Teams</span>
                    <span className="font-medium">{teamMetrics.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Submissions</CardTitle>
                <CardDescription>How teams are performing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="submissions" name="Submissions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="coverage" name="Coverage %" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zone Activity</CardTitle>
                <CardDescription>Submissions by zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis dataKey="zone" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="hours" name="Submissions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Top Teams
              </CardTitle>
              <CardDescription>Teams by submission count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((team: any, i: number) => (
                  <div key={team.name} className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback style={{ backgroundColor: team.color + '20', color: team.color }} className="text-xs">
                        {team.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{team.name}</p>
                      <p className="text-xs text-muted-foreground">{team.size || 0} members · {team.rate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{team.submissions}</p>
                      <p className="text-xs text-muted-foreground">submissions</p>
                    </div>
                    <div className="w-24">
                      <Progress value={topPerformers[0]?.submissions > 0 ? (team.submissions / topPerformers[0].submissions) * 100 : 0} className="h-1.5" />
                    </div>
                  </div>
                ))}
                {topPerformers.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">No team data available yet.</p>
                )}
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

