"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BarChart3, TrendingUp, Crown, LineChart as LineChartIcon, Loader2 } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import useSWR from 'swr'
import { fetcher } from '@/lib/api/swr-fetcher'

export default function PerformancePage() {
  const { data, error } = useSWR('/analytics/team-leader', fetcher)

  const isLoading = !data && !error
  
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading performance data...</span>
      </div>
    )
  }

  const performance = data || {
    topMembers: [],
    stats: { totalTasks: 0, totalForms: 0, avgCompletion: 0 },
    trends: [],
    radarData: []
  }

  const leaderboard = performance.topMembers || []
  const { totalTasks, totalForms, avgCompletion } = performance.stats || { totalTasks: 0, totalForms: 0, avgCompletion: 0 }
  const trendData = performance.trends || []
  const radarData = performance.radarData || []

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Performance</h1>
          <p className="text-muted-foreground">Leaderboard and performance metrics</p>
        </div>
        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm self-start shadow-sm border-none px-3 py-1">
          <TrendingUp className="h-4 w-4 mr-1.5" />
          Team Avg {avgCompletion}% Completion
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top performers in your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.length > 0 ? leaderboard.map((member: any, index: number) => (
                <div key={member.id || index} className={cn(
                  'flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-md', 
                  index === 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'border-transparent bg-muted/30'
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-full font-bold text-lg flex items-center justify-center shadow-inner', 
                    index === 0 ? 'bg-amber-500 text-white' : 'bg-primary/10 text-primary'
                  )}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">Tasks: {member.tasksCompleted} | Forms: {member.formsSubmitted}</p>
                  </div>
                  <div className="font-bold text-lg text-primary/80">
                    {member.totalScore || (member.tasksCompleted + member.formsSubmitted)}
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-muted-foreground italic">No performance data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Session Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold tracking-tight">{totalTasks}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Forms</p>
                <p className="text-3xl font-bold tracking-tight">{totalForms}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Avg Rate</p>
                <p className="text-3xl font-bold tracking-tight text-emerald-600">{avgCompletion}%</p>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-primary/5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Zone Coverage</span>
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600">Active</Badge>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Target Achievement</span>
                    <span>{Math.min(100, Math.round((totalForms / 50) * 100))}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                      style={{width: `${Math.min(100, (totalForms / 50) * 100)}%`}} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Task Efficiency</span>
                    <span>{avgCompletion}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.3)]" 
                      style={{width: `${avgCompletion}%`}} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/5 shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Daily task and form completion activity</CardDescription>
            </div>
            <LineChartIcon className="h-5 w-5 text-muted-foreground/50" />
          </div>
        </CardHeader>
        <CardContent className="h-[350px] w-full pr-4 pb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.length > 0 ? trendData : [
              { day: 'Mon', tasks: 0, forms: 0 },
              { day: 'Tue', tasks: 0, forms: 0 },
              { day: 'Wed', tasks: 0, forms: 0 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#888' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#888' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
              />
              <Legend iconType="circle" />
              <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Tasks" />
              <Line type="monotone" dataKey="forms" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Forms" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <Card className="border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Rankings Comparison
            </CardTitle>
            <CardDescription>Visualizing performance gaps across members</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData.length > 0 ? radarData : []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="rect" />
                <Bar dataKey="tasks" fill="#3b82f6" name="Tasks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forms" fill="#10b981" name="Forms" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle>Member Balance Radar</CardTitle>
            <CardDescription>Checking task/form ratio parity</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData.length > 0 ? radarData : []}>
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar 
                  name="Parity Score" 
                  dataKey="score" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.4} 
                  strokeWidth={2}
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

