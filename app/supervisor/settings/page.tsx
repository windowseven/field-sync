'use client'

import * as React from 'react'
import {
  User, Mail, Shield, Bell, Lock, Globe,
  Camera, Save, Laptop, Smartphone, CheckCircle2,
  Trash2, Plus,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ThemeSettingsCard } from '@/components/shared/settings/theme-settings-card'

export default function SupervisorSettingsPage() {
  return (
    <>
      <DashboardHeader
        title="Personal Settings"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects', href: '/supervisor/projects' }, { label: 'Settings' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-8">

          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Personal Settings</h1>
            <p className="text-muted-foreground text-lg">Manage your account preferences, notifications, and security</p>
          </div>

          <ThemeSettingsCard />

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-muted/50 border h-11 p-1">
              <TabsTrigger value="profile" className="px-6">Profile</TabsTrigger>
              <TabsTrigger value="notifications" className="px-6">Notifications</TabsTrigger>
              <TabsTrigger value="security" className="px-6">Security</TabsTrigger>
              <TabsTrigger value="account" className="px-6">Account</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details and how others see you on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                        <AvatarImage src="/avatars/supervisor.jpg" />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary">AD</AvatarFallback>
                      </Avatar>
                      <Button variant="secondary" size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg border border-background opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" defaultValue="Field" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" defaultValue="Supervisor" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="email" className="pl-9" defaultValue="supervisor@fieldsync.io" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Platform Role</Label>
                      <Input id="role" defaultValue="Operations Supervisor" disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Input id="bio" placeholder="Briefly describe your role and experience..." />
                    </div>
                  </div>
                  <Button className="gap-2">
                    <Save className="h-4 w-4" /> Save Profile Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how and when you receive updates about your projects.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { title: 'Project Alerts', desc: 'Notify me of high-severity operational issues', default: true },
                      { title: 'Team Activity', desc: 'Daily summary of team progress and submissions', default: true },
                      { title: 'Security Notices', desc: 'Alerts about new logins and security changes', default: true },
                      { title: 'System Updates', desc: 'Monthly newsletter and feature announcements', default: false },
                    ].map((n) => (
                      <div key={n.title} className="flex items-center justify-between gap-4 py-2 border-b last:border-0 border-muted">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.desc}</p>
                        </div>
                        <Switch defaultChecked={n.default} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Secure your account with multi-factor authentication and password management.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-emerald-600">Password is secure</p>
                          <p className="text-xs text-emerald-600/80">Last changed 42 days ago. Strong password detected.</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600">
                          Change Password
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <p className="text-sm font-semibold">Active Sessions</p>
                      {[
                        { device: 'MacBook Pro — Chrome', loc: 'Nairobi, Kenya', time: 'Active Now', icon: Laptop },
                        { device: 'iPhone 15 — Mobile App', loc: 'Nairobi, Kenya', time: '2h ago', icon: Smartphone },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <s.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{s.device}</p>
                              <p className="text-[10px] text-muted-foreground">{s.loc} • {s.time}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive">Revoke</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" /> Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible actions for your supervisor account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-destructive">Delete Account</p>
                      <p className="text-xs text-destructive/80">Permanently delete your account and all personal settings.</p>
                    </div>
                    <Button variant="destructive" size="sm">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </>
  )
}

