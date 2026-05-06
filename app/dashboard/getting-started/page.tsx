'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Users, FileText, BarChart3, Bell, Settings,
  CheckCircle2, ArrowRight, Play, BookOpen
} from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    id: 1,
    title: 'Set Up Your First Team',
    description: 'Create teams and assign team leaders to coordinate field operations.',
    icon: Users,
    href: '/dashboard/teams',
    status: 'pending',
  },
  {
    id: 2,
    title: 'Define Geographic Zones',
    description: 'Create zones for your field operations with specific boundaries and priorities.',
    icon: MapPin,
    href: '/dashboard/map',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Create Custom Forms',
    description: 'Build dynamic forms for data collection tailored to your field operations.',
    icon: FileText,
    href: '/dashboard/forms',
    status: 'pending',
  },
  {
    id: 4,
    title: 'Add Users and Assign Roles',
    description: 'Invite team members and assign appropriate roles (Admin, Team Leader, User).',
    icon: Users,
    href: '/dashboard/users',
    status: 'pending',
  },
  {
    id: 5,
    title: 'Monitor Live Tracking',
    description: 'Enable GPS tracking and monitor your team members in real-time.',
    icon: MapPin,
    href: '/dashboard/tracking',
    status: 'pending',
  },
  {
    id: 6,
    title: 'Review Analytics',
    description: 'Track performance metrics and analyze field operation data.',
    icon: BarChart3,
    href: '/dashboard/analytics',
    status: 'pending',
  },
];

const features = [
  {
    title: 'Real-Time Tracking',
    description: 'Live GPS tracking of all field team members with interactive maps.',
    icon: MapPin,
  },
  {
    title: 'Team Management',
    description: 'Organize teams, assign leaders, and manage team member assignments.',
    icon: Users,
  },
  {
    title: 'Dynamic Forms',
    description: 'Create multi-step forms with conditional logic for data collection.',
    icon: FileText,
  },
  {
    title: 'Analytics & Reports',
    description: 'Comprehensive analytics, performance metrics, and detailed reports.',
    icon: BarChart3,
  },
  {
    title: 'Notifications',
    description: 'Real-time alerts for critical events and system notifications.',
    icon: Bell,
  },
  {
    title: 'System Settings',
    description: 'Configure system settings, user roles, and security parameters.',
    icon: Settings,
  },
];

const resources = [
  {
    title: 'Documentation',
    description: 'Complete guide for all features and functionalities.',
    icon: BookOpen,
    href: '#',
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video guides for key features.',
    icon: Play,
    href: '#',
  },
  {
    title: 'API Reference',
    description: 'Technical documentation for API integration.',
    icon: FileText,
    href: '#',
  },
];

export default function GettingStartedPage() {
  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-foreground">Welcome to Field Operations Control Center</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Your centralized dashboard for managing field teams, tracking operations, and optimizing performance. Follow the setup wizard below to get started.
          </p>
          <div className="mt-6 flex gap-3">
            <Button size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
            <Button size="lg" variant="outline">
              Read Documentation
            </Button>
          </div>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Initial Setup Wizard</h2>
          <p className="mt-1 text-muted-foreground">Complete these steps to configure your field operations system</p>
        </div>

        <div className="grid gap-4">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <Link key={step.id} href={step.href}>
                <Card className="border border-border transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <IconComponent className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {idx + 1}
                          </span>
                          <h3 className="font-semibold text-foreground">{step.title}</h3>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">{step.status}</Badge>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Core Features</h2>
          <p className="mt-1 text-muted-foreground">Explore the main capabilities of your system</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <Card key={idx} className="border border-border">
                <CardContent className="pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
                    <IconComponent className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Teams', value: '0', icon: Users },
          { label: 'Active Users', value: '0', icon: Users },
          { label: 'Defined Zones', value: '0', icon: MapPin },
          { label: 'Custom Forms', value: '0', icon: FileText },
        ].map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <Card key={idx} className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <IconComponent className="h-5 w-5 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resources */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Learning Resources</h2>
          <p className="mt-1 text-muted-foreground">Get help and learn more about using the system</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {resources.map((resource, idx) => {
            const IconComponent = resource.icon;
            return (
              <a key={idx} href={resource.href}>
                <Card className="border border-border transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
                      <IconComponent className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-foreground">{resource.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-500">
                      Learn more <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

