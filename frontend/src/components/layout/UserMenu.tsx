'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { clearTokens } from '@/lib/auth';

export function UserMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Avatar name={user?.displayName} size="sm" />
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {user?.displayName || 'User'}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
