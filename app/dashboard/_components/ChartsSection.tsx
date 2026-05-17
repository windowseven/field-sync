'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const COLORS: Record<string, string> = {
  users: 'hsl(var(--primary))',
  submissions: 'hsl(var(--chart-2))',
  api: 'hsl(var(--chart-3))',
}

interface ChartsSectionProps {
  activityData: Array<{ time: string; users: number; submissions: number; api: number }>
  activityTotals: { users: number; submissions: number; api: number }
  userDistribution: Array<{ name: string; value: number; color: string }>
  projectActivity: Array<{ name: string; active: number; new: number }>
}

export function ChartsSection({ activityData, activityTotals, userDistribution, projectActivity }: ChartsSectionProps) {
  return (
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
            {(['users', 'submissions', 'api'] as const).map((key) => (
              <TabsContent key={key} value={key} className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[key]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS[key]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey={key} stroke={COLORS[key]} fill={`url(#grad-${key})`} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
            ))}
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

      <Card className="lg:col-span-2">
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
  )
}
