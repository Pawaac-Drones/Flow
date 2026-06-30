'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderKanban,
  CheckSquare,
  Bell,
  LayoutDashboard,
  MessageCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'WhatsApp', href: '/settings/whatsapp', icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <Link href="/projects" className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary-600" />
          <span className="text-lg font-bold text-slate-900">PawaacFlow</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
