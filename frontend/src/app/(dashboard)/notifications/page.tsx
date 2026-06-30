'use client';

import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/common/Button';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => markAllAsRead.mutate()}
          disabled={markAllAsRead.isPending}
        >
          <CheckCheck className="h-4 w-4 mr-1" />
          Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.data?.map((notification) => (
          <div
            key={notification.id}
            className={`card p-4 flex items-start gap-3 ${
              !notification.isRead ? 'border-l-4 border-l-primary-500' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {notification.title}
              </p>
              <p className="text-sm text-slate-600 mt-0.5">
                {notification.message}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            {!notification.isRead && (
              <button
                onClick={() => markAsRead.mutate(notification.id)}
                className="text-slate-400 hover:text-primary-600"
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {notifications.data?.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">
              No notifications
            </h3>
            <p className="text-slate-500 mt-1">
              You&apos;re all caught up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
