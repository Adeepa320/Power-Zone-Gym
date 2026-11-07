'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from './Logo';

/** Shared dashboard chrome: sidebar + top bar + animated page transitions. */
export function DashboardShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const { user, isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-ink-950/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="lg:hidden">
              <Logo compact href={isAdmin ? '/admin' : '/member'} />
            </span>
            <p className="hidden text-sm text-muted lg:block">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs capitalize text-muted">{user.role}</p>
              </div>
              <Avatar name={user.name ?? 'User'} size="sm" ring />
            </div>
          )}
        </header>
        {/* Subtle grid background */}
        <main className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
