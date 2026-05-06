'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const data = [
  { time: '00:00', active: 12, forms: 4, coverage: 15 },
  { time: '02:00', active: 8, forms: 2, coverage: 18 },
  { time: '04:00', active: 5, forms: 1, coverage: 20 },
  { time: '06:00', active: 15, forms: 8, coverage: 25 },
  { time: '08:00', active: 42, forms: 24, coverage: 35 },
  { time: '10:00', active: 58, forms: 45, coverage: 48 },
  { time: '12:00', active: 65, forms: 52, coverage: 55 },
  { time: '14:00', active: 62, forms: 48, coverage: 62 },
  { time: '16:00', active: 55, forms: 38, coverage: 70 },
  { time: '18:00', active: 45, forms: 25, coverage: 75 },
  { time: '20:00', active: 28, forms: 12, coverage: 78 },
  { time: '22:00', active: 18, forms: 6, coverage: 80 },
]

export function ActivityChart() {
  const [timeRange, setTimeRange] = React.useState('24h')

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Real-time field operations activity</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.18 160)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.7 0.18 160)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.2 250)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.65 0.2 250)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.75 0.18 65)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.75 0.18 65)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.28 0.01 260)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="oklch(0.5 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(0.5 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.16 0.01 260)',
                  border: '1px solid oklch(0.28 0.01 260)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: 'oklch(0.95 0 0)', fontWeight: 600 }}
                itemStyle={{ color: 'oklch(0.7 0 0)' }}
              />
              <Area
                type="monotone"
                dataKey="active"
                name="Active Users"
                stroke="oklch(0.7 0.18 160)"
                strokeWidth={2}
                fill="url(#colorActive)"
              />
              <Area
                type="monotone"
                dataKey="forms"
                name="Form Submissions"
                stroke="oklch(0.65 0.2 250)"
                strokeWidth={2}
                fill="url(#colorForms)"
              />
              <Area
                type="monotone"
                dataKey="coverage"
                name="Coverage %"
                stroke="oklch(0.75 0.18 65)"
                strokeWidth={2}
                fill="url(#colorCoverage)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Active Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-info" />
            <span className="text-sm text-muted-foreground">Form Submissions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">Coverage %</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

