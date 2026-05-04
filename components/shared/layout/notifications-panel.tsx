'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Bell,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { fieldSyncSocket } from '@/lib/auth/socketManager';
import { useUnreadNotifications, useNotificationListener } from '@/hooks/use-notifications';
import { notificationService } from '@/lib/api/notificationService';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'critical':
    case 'warning':
    case 'alert':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
}

export function NotificationsPanel() {
  const pathname = usePathname();
  const roleRoot = pathname.split('/')[1] || 'dashboard';
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = useUnreadNotifications();
  useNotificationListener();
  const [open, setOpen] = useState(false);
  const hasLoaded = useRef(false);

  const fetchNotifications = async () => {
    try {
      const all = await notificationService.getAll();
      setNotifications(all.slice(0, 5));
      hasLoaded.current = true;
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const unsubNotif = fieldSyncSocket.on('notification:new', () => {
      fetchNotifications();
    });

    const unsubBroadcast = fieldSyncSocket.on('broadcast:new', () => {
      fetchNotifications();
    });

    return () => {
      unsubNotif();
      unsubBroadcast();
    };
  }, []);

  const getNotificationsLink = () => {
    if (roleRoot === 'supervisor') return '/supervisor/notifications';
    if (roleRoot === 'teamleader') return '/teamleader/notifications';
    if (roleRoot === 'user') return '/user/notifications';
    return '/admin/notifications';
  };

  const handleDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await notificationService.markAsRead(id);
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetchNotifications();
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'now';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'now';
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAllAsRead}
              className="h-auto py-0 text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors ${
                  !notification.is_read ? 'bg-blue-500/5' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification.id)}
                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.body || notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Link href={getNotificationsLink()}>
              <DropdownMenuItem className="text-center text-blue-600 cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
