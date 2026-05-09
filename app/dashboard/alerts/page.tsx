'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, CheckCircle2, Info, Clock,
  Bell, Trash2, XCircle, Loader2
} from 'lucide-react';
import { http } from '@/lib/api/httpClient';

const ICON_MAP: Record<string, React.ElementType> = {
  AlertCircle, CheckCircle2, Info, Clock,
};

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

interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  read: boolean;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function AlertsPage() {
  const [alertsList, setAlertsList] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await http.get<{ status: string; data: Alert[] }>('/alerts');
      setAlertsList(response.data);
      setError(null);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = filter === 'all'
    ? alertsList
    : filter === 'unread'
    ? alertsList.filter(a => !a.read)
    : alertsList.filter(a => a.type === filter);

  const unreadCount = alertsList.filter(a => !a.read).length;

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts & Notifications</h1>
          <p className="mt-2 text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
      </div>

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

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-3">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
          <Button variant="ghost" size="sm" className="ml-auto h-6" onClick={loadAlerts}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const styles = getAlertStyles(alert.type);
              const IconComponent = ICON_MAP[alert.icon] || Info;

              return (
                <Card
                  key={alert.id}
                  className={`border ${styles.border} ${!alert.read ? styles.bg : 'bg-background/50'} transition-colors hover:bg-background/80`}
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
                            <p className="mt-2 text-xs text-muted-foreground">{relativeTime(alert.timestamp)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={styles.badge}>
                              {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                            </Badge>
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
                      ? "You're all caught up! No unread alerts."
                      : `No ${filter} alerts to display.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

