'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Gift,
  Home,
  Menu,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { SacAvatar } from '../ui/SacPrimitives';

export function MobileBottomDock({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const { user, unreadDirectMessages } = useAuth();

  const tabs = [
    {
      href: '/feed',
      label: 'Avisos',
      icon: Home,
      isActive: pathname.startsWith('/feed') || pathname === '/',
      badge: 0,
    },
    {
      href: '/chats',
      label: 'Chats',
      icon: MessageCircle,
      isActive: pathname.startsWith('/chats'),
      badge: unreadDirectMessages,
    },
    {
      href: '/polls',
      label: 'Encuestas',
      icon: BarChart3,
      isActive: pathname.startsWith('/polls'),
      badge: 0,
    },
    {
      href: '/giveaways',
      label: 'Sorteos',
      icon: Gift,
      isActive: pathname.startsWith('/giveaways'),
      badge: 0,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--theme-surface)]/95 backdrop-blur-md border-t border-[var(--theme-border)] shadow-lg">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center h-full py-1 transition-all cursor-pointer group',
                tab.isActive
                  ? 'text-[var(--theme-primary)]'
                  : 'text-[var(--theme-muted)] hover:text-[var(--theme-dark)]'
              )}
            >
              {/* Facebook-style top indicator line for active tab */}
              {tab.isActive ? (
                <div className="absolute top-0 left-3 right-3 h-[2.5px] rounded-full bg-[var(--theme-primary)]" />
              ) : null}

              <div className="relative">
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    tab.isActive ? 'scale-110' : 'group-active:scale-95'
                  )}
                />
                {tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-rose-600 text-white font-extrabold text-[9px] flex items-center justify-center border-2 border-[var(--theme-surface)]">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              <span
                className={cn(
                  'text-[10px] tracking-tight mt-0.5 leading-none',
                  tab.isActive ? 'font-bold text-[var(--theme-primary)]' : 'font-medium'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* Facebook Style "Menú" Tab (Opens full quick-access sheet) */}
        <button
          onClick={onOpenMenu}
          className="relative flex-1 flex flex-col items-center justify-center h-full py-1 text-[var(--theme-muted)] hover:text-[var(--theme-dark)] transition-all cursor-pointer group"
          title="Menú y accesos"
        >
          <div className="relative">
            <div className="p-0.5 rounded-full ring-1.5 ring-[var(--theme-border)] group-hover:ring-[var(--theme-primary)]">
              <SacAvatar src={user?.avatarUrl} name={user?.displayName || 'Usuario'} size={20} />
            </div>
            <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-dark)]">
              <Menu className="h-2.5 w-2.5" />
            </div>
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5 leading-none">
            Menú
          </span>
        </button>
      </div>
    </nav>
  );
}
