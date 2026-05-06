'use client'

import * as React from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const zoneData = [
  { name: 'Zone A', coverage: 82, team: 'Alpha', color: 'oklch(0.7 0.18 160)' },
  { name: 'Zone B', coverage: 65, team: 'Beta', color: 'oklch(0.65 0.2 250)' },
  { name: 'Zone C', coverage: 91, team: 'Gamma', color: 'oklch(0.75 0.18 65)' },
  { name: 'Zone D', coverage: 100, team: 'Delta', color: 'oklch(0.65 0.22 330)' },
  { name: 'Zone E', coverage: 45, team: 'Echo', color: 'oklch(0.6 0.18 200)' },
  { name: 'Zone F', coverage: 28, team: 'Foxtrot', color: 'oklch(0.55 0.15 100)' },
]

export function ZoneCoverage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Zone Coverage</CardTitle>
          <CardDescription>Current coverage percentage by zone</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          Details
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="oklch(0.5 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="oklch(0.5 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                cursor={{ fill: 'oklch(0.25 0.01 260 / 0.5)' }}
                contentStyle={{
                  backgroundColor: 'oklch(0.16 0.01 260)',
                  border: '1px solid oklch(0.28 0.01 260)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: 'oklch(0.95 0 0)', fontWeight: 600 }}
                formatter={(value: number) => [`${value}%`, 'Coverage']}
              />
              <Bar dataKey="coverage" radius={[0, 4, 4, 0]} barSize={24}>
                {zoneData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {Math.round(zoneData.reduce((acc, z) => acc + z.coverage, 0) / zoneData.length)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Coverage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {zoneData.filter((z) => z.coverage >= 80).length}
            </p>
            <p className="text-xs text-muted-foreground">High Coverage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              {zoneData.filter((z) => z.coverage < 50).length}
            </p>
            <p className="text-xs text-muted-foreground">Need Attention</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

