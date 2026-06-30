'use client';

import { Bell } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';

export function Header() {
  const { notifications } = useNotifications();
  const unreadCount = notifications.data?.filter((n) => !n.isRead).length || 0;

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-slate-500">Dashboard</h2>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
