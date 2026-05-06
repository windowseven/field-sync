'use client'

import {
  BarChart3, TrendingUp, Users, ClipboardList, MapPin,
  Clock, Award, Activity,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const dailySubmissions = [
  { date: 'Mar 1', submissions: 22, agents: 28 },
  { date: 'Mar 8', submissions: 45, agents: 35 },
  { date: 'Mar 15', submissions: 38, agents: 32 },
  { date: 'Mar 22', submissions: 61, agents: 40 },
  { date: 'Mar 29', submissions: 55, agents: 38 },
  { date: 'Apr 5', submissions: 72, agents: 42 },
  { date: 'Apr 9', submissions: 48, agents: 39 },
]

const teamSubmissions = [
  { team: 'Alpha', submissions: 87, target: 110, coverage: 79 },
  { team: 'Beta', submissions: 72, target: 106, coverage: 68 },
  { team: 'Gamma', submissions: 50, target: 91, coverage: 55 },
  { team: 'Delta', submissions: 22, target: 130, coverage: 50 },
  { team: 'Echo', submissions: 61, target: 104, coverage: 64 },
]

const zoneTime = [
  { zone: 'Zone A', hours: 142, agents: 9 },
  { zone: 'Zone C', hours: 128, agents: 8 },
  { zone: 'Zone E', hours: 97, agents: 7 },
  { zone: 'Zone F', hours: 88, agents: 10 },
  { zone: 'Zone H', hours: 114, agents: 8 },
]

const topAgents = [
  { name: 'Sarah Johnson', team: 'Alpha', submissions: 87, rate: '12/day', color: '#22c55e' },
  { name: 'Kojo Acheampong', team: 'Echo', submissions: 61, rate: '9/day', color: '#06b6d4' },
  { name: 'Mwangi Njoroge', team: 'Echo', submissions: 61, rate: '9/day', color: '#06b6d4' },
  { name: 'James Kariuki', team: 'Beta', submissions: 56, rate: '8/day', color: '#3b82f6' },
  { name: 'Kwame Asante', team: 'Alpha', submissions: 43, rate: '6/day', color: '#22c55e' },
]

const teamRadar = [
  { subject: 'Speed', Alpha: 90, Beta: 75, Gamma: 60 },
  { subject: 'Coverage', Alpha: 79, Beta: 68, Gamma: 55 },
  { subject: 'Accuracy', Alpha: 85, Beta: 80, Gamma: 70 },
  { subject: 'Attendance', Alpha: 95, Beta: 88, Gamma: 72 },
  { subject: 'Response', Alpha: 88, Beta: 72, Gamma: 65 },
]

const coveragePie = [
  { name: 'Covered', value: 67, color: 'hsl(var(--primary))' },
  { name: 'Remaining', value: 33, color: 'hsl(var(--muted))' },
]

export default function SupervisorAnalyticsPage() {
  const [period, setPeriod] = useState('week')

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

          {/* KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Submissions', value: '292', change: '+48 this week', icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Coverage Progress', value: '67%', change: '+12% this week', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Avg. Daily Agents', value: '36', change: 'of 42 members', icon: Users, color: 'text-chart-2', bg: 'bg-chart-2/10' },
              { label: 'Avg. Time per Zone', value: '114h', change: 'total field hours', icon: Clock, color: 'text-chart-3', bg: 'bg-chart-3/10' },
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
                  <p className="text-xs text-primary mt-1">{s.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submission trend + Coverage pie */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Submission Trend</CardTitle>
                <CardDescription>Daily form submissions and active agent count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySubmissions}>
                      <defs>
                        <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gAgents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Area type="monotone" dataKey="submissions" name="Submissions" stroke="hsl(var(--primary))" fill="url(#gSub)" strokeWidth={2} />
                      <Area type="monotone" dataKey="agents" name="Active Agents" stroke="hsl(var(--chart-2))" fill="url(#gAgents)" strokeWidth={2} />
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
                  <p className="text-3xl font-bold">67%</p>
                  <p className="text-xs text-muted-foreground">of target area</p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Zones Completed</span>
                    <span className="font-medium">1 / 12</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Zones Active</span>
                    <span className="font-medium">5 / 12</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Zones Pending</span>
                    <span className="font-medium">6 / 12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Submissions vs Target</CardTitle>
                <CardDescription>How each team is performing against their targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamSubmissions}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="team" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="submissions" name="Submissions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" name="Target" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Radar Comparison</CardTitle>
                <CardDescription>Multi-dimensional performance for top 3 teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={teamRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar name="Alpha" dataKey="Alpha" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                      <Radar name="Beta" dataKey="Beta" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} />
                      <Radar name="Gamma" dataKey="Gamma" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.15} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Top Performers
              </CardTitle>
              <CardDescription>Most active field agents this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAgents.map((agent, i) => (
                  <div key={agent.name} className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback style={{ backgroundColor: agent.color + '20', color: agent.color }} className="text-xs">
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.team} · {agent.rate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{agent.submissions}</p>
                      <p className="text-xs text-muted-foreground">submissions</p>
                    </div>
                    <div className="w-24">
                      <Progress value={agent.submissions / topAgents[0].submissions * 100} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  )
}

