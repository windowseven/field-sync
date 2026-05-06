'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, CheckCircle2, Info, Clock, MapPin, Users, TrendingDown,
  Bell, Trash2, Archive
} from 'lucide-react';

const alerts = [
  {
    id: 1,
    type: 'critical',
    title: 'Zone A Coverage Drop',
    description: 'Coverage in Zone A has dropped to 78%. Immediate action required.',
    timestamp: new Date(Date.now() - 5 * 60000),
    icon: AlertCircle,
    read: false,
  },
  {
    id: 2,
    type: 'warning',
    title: 'Team Beta - Delayed Tasks',
    description: '5 tasks have exceeded their completion deadline in Team Beta.',
    timestamp: new Date(Date.now() - 15 * 60000),
    icon: Clock,
    read: false,
  },
  {
    id: 3,
    type: 'info',
    title: 'New User Registration',
    description: '25 new users registered and awaiting team assignment.',
    timestamp: new Date(Date.now() - 30 * 60000),
    icon: Users,
    read: false,
  },
  {
    id: 4,
    type: 'success',
    title: 'Zone D 100% Coverage Achieved',
    description: 'Team Delta successfully completed 100% coverage in Zone D.',
    timestamp: new Date(Date.now() - 2 * 3600000),
    icon: CheckCircle2,
    read: true,
  },
  {
    id: 5,
    type: 'warning',
    title: 'System Performance Degradation',
    description: 'API response times have increased by 40% in the last hour.',
    timestamp: new Date(Date.now() - 4 * 3600000),
    icon: TrendingDown,
    read: true,
  },
  {
    id: 6,
    type: 'info',
    title: 'Form Response Milestone',
    description: 'Over 10,000 form responses collected this month.',
    timestamp: new Date(Date.now() - 6 * 3600000),
    icon: Info,
    read: true,
  },
];

function getAlertStyles(type: string) {
  switch (type) {
    case 'critical':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        badge: 'bg-red-500/20 text-red-600',
        icon: 'text-red-500',
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-600',
        icon: 'text-amber-500',
      };
    case 'success':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-600',
        icon: 'text-emerald-500',
      };
    default:
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        badge: 'bg-blue-500/20 text-blue-600',
        icon: 'text-blue-500',
      };
  }
}

export default function AlertsPage() {
  const [alertsList, setAlertsList] = useState(alerts);
  const [filter, setFilter] = useState('all');

  const filteredAlerts = filter === 'all' 
    ? alertsList 
    : filter === 'unread'
    ? alertsList.filter(a => !a.read)
    : alertsList.filter(a => a.type === filter);

  const unreadCount = alertsList.filter(a => !a.read).length;

  const handleMarkAsRead = (id: number) => {
    setAlertsList(alertsList.map(a => a.id === id ? {...a, read: true} : a));
  };

  const handleDelete = (id: number) => {
    setAlertsList(alertsList.filter(a => a.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setAlertsList(alertsList.map(a => ({...a, read: true})));
  };

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts & Notifications</h1>
          <p className="mt-2 text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'unread', 'critical', 'warning', 'success', 'info'].map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === 'all' ? 'All Alerts' : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const styles = getAlertStyles(alert.type);
            const IconComponent = alert.icon;
            const relTime = Math.floor((Date.now() - alert.timestamp.getTime()) / 60000);
            const relTimeStr = relTime < 60 ? `${relTime}m ago` : 
                             relTime < 1440 ? `${Math.floor(relTime / 60)}h ago` :
                             `${Math.floor(relTime / 1440)}d ago`;

            return (
              <Card 
                key={alert.id}
                className={`border ${styles.border} ${!alert.read ? styles.bg : 'bg-background/50'} transition-colors hover:bg-background/80 cursor-pointer`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-background/50 flex-shrink-0 ${styles.icon}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{alert.title}</h3>
                            {!alert.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{relTimeStr}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={styles.badge}>
                            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                          </Badge>
                          <div className="flex gap-1">
                            {!alert.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(alert.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(alert.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border border-dashed border-border">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="font-semibold text-foreground">No alerts</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {filter === 'unread' 
                    ? 'You&apos;re all caught up! No unread alerts.' 
                    : `No ${filter} alerts to display.`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

