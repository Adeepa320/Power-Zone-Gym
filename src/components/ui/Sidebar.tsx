'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsLeft, LogOut, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { Logo } from '@/components/layout/Logo';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Match only the exact path (for dashboard home links). */
  exact?: boolean;
}

/** Generic animated sidebar used by AdminSidebar and MemberSidebar. */
export function Sidebar({ items, roleLabel }: { items: NavItem[]; roleLabel: string }) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleCollapsed } = useStore();
  const { user, logout } = useAuth();

  // Close the mobile drawer on navigation
  useEffect(() => setSidebarOpen(false), [pathname, setSidebarOpen]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const content = (collapsed: boolean, mobile: boolean) => (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b border-white/5 px-4', collapsed ? 'justify-center' : 'justify-between')}>
        <Logo compact={collapsed} />
        {mobile ? (
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {!collapsed && (
        <p className="px-6 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/60">{roleLabel}</p>
      )}

      <nav className={cn('flex-1 space-y-1 px-3', collapsed && 'pt-6')}>
        {items.map((item, i) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i }}
            >
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  active ? 'text-white' : 'text-muted hover:bg-white/[0.04] hover:text-white',
                )}
              >
                {active && (
                  <motion.span
                    layoutId={mobile ? 'nav-active-mobile' : 'nav-active'}
                    className="absolute inset-0 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/15 to-violet/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {active && (
                  <motion.span
                    layoutId={mobile ? 'nav-bar-mobile' : 'nav-bar'}
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-glow"
                  />
                )}
                <Icon className={cn('relative h-[18px] w-[18px] shrink-0 transition-colors', active ? 'text-primary' : 'group-hover:text-primary')} />
                {!collapsed && <span className="relative">{item.label}</span>}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        {user && !collapsed && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5">
            <Avatar name={user.name ?? 'User'} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title="Sign out"
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-danger/10 hover:text-danger',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && 'Sign out'}
        </button>
        {!mobile && (
          <button
            onClick={toggleCollapsed}
            className={cn(
              'mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-muted/70 transition hover:text-white',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.span animate={{ rotate: collapsed ? 180 : 0 }}>
              <ChevronsLeft className="h-4 w-4" />
            </motion.span>
            {!collapsed && 'Collapse'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 76 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="glass-strong sticky top-0 z-30 hidden h-screen shrink-0 border-y-0 border-l-0 lg:block"
      >
        {content(sidebarCollapsed, false)}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="glass-strong fixed inset-y-0 left-0 z-50 w-72 border-y-0 border-l-0 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              {content(false, true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
