'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { Button } from '@/components/ui/Button';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#plans', label: 'Plans' },
  { href: '#info', label: 'Visit Us' },
];

/** Public landing-page navbar. Becomes a glass bar once scrolled. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-white/10 bg-ink-950/70 backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted transition hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Link href={isAdmin ? '/admin' : '/member'}>
              <Button size="sm" icon={<LayoutDashboard className="h-4 w-4" />}>
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Member Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Join Now</Button>
              </Link>
            </>
          )}
        </div>
        <button className="rounded-lg p-2 text-muted hover:text-white md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-ink-950/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-white">
                  {l.label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-3">
                {isAuthenticated ? (
                  <Link href={isAdmin ? '/admin' : '/member'} className="col-span-2">
                    <Button fullWidth>Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="secondary" fullWidth>
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button fullWidth>Join Now</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Navbar;
