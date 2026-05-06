'use client';

import useSWR from 'swr';
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { analyticsService, type AdminAnalyticsRange } from '@/lib/api/analyticsService';

const taskDistributionColors: Record<string, string> = {
  completed: '#10b981',
  'in-progress': '#3b82f6',
  pending: '#f59e0b',
  draft: '#8b5cf6',
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<AdminAnalyticsRange>('week');
  const { data, isLoading } = useSWR(
    ['admin-analytics', timeRange],
    () => analyticsService.getAdminAnalytics(timeRange)
  );

  const overview = data?.overview;
  const dailyData = data?.activitySeries ?? [];
  const zonePerformance = data?.projectPerformance ?? [];
  const taskDistribution = (data?.taskDistribution ?? []).map((item) => ({
    ...item,
    color: taskDistributionColors[item.name] ?? '#ef4444',
  }));
  const teamPerformance = data?.teamPerformance ?? [];

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="mt-2 text-muted-foreground">Live platform analytics based on current backend data</p>
        </div>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as AdminAnalyticsRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading analytics...
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border bg-gradient-to-br from-background to-background/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{overview?.taskCompletionRate ?? 0}%</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <span>{overview?.completedTasks ?? 0} of {overview?.totalTasks ?? 0} tasks completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-background to-background/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{overview?.activeUsers ?? 0}</div>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <span>Currently online across the platform</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-background to-background/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Coverage Rate</p>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{overview?.coverageRate ?? 0}%</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <span>Average submission coverage across projects</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-background to-background/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{overview?.avgResponseMinutes ?? 0}m</div>
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <span>Average task completion turnaround</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Activity Trend</CardTitle>
            <CardDescription>Active users and submission outcomes in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="active" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActive)" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" fillOpacity={0.15} fill="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Current task status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Performance Metrics</CardTitle>
            <CardDescription>Completion and submission coverage across active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zonePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="zone" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="completion" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="coverage" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Team Performance Summary</CardTitle>
          <CardDescription>Task completion and live staffing across teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Team Name</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Avg Completion</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Active Members</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map((team, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-foreground">{team.team}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-24 rounded-full bg-background">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${team.avg}%` }} />
                        </div>
                        <span className="text-foreground font-semibold">{team.avg}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-foreground">{team.active}</td>
                    <td className="px-4 py-4 text-right">
                      <Badge className={team.active > 0 ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30' : 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30'}>
                        {team.active > 0 ? 'Active' : 'Idle'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!isLoading && teamPerformance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No team analytics available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
