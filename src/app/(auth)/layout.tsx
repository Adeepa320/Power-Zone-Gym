import Link from 'next/link';
import { ArrowLeft, CalendarCheck, ClipboardList, CreditCard } from 'lucide-react';
import { HeroBackground } from '@/components/landing/GymShapes';
import { Logo } from '@/components/layout/Logo';
import { GYM } from '@/lib/constants';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const perks = [
    { icon: ClipboardList, text: 'Personal workout charts from your trainer' },
    { icon: CalendarCheck, text: 'One-tap attendance & streak tracking' },
    { icon: CreditCard, text: 'Pay your membership online, securely' },
  ];
  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1fr_minmax(0,620px)]">
        {/* Branding panel */}
        <aside className="hidden flex-col justify-between p-12 lg:flex">
          {/* ADD GYM PHOTO HERE LATER — background for the branding panel */}
          <Logo />
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight">
              Train hard. <span className="text-gradient">Track everything.</span>
            </h2>
            <p className="mt-4 text-muted">{GYM.tagline}</p>
            <ul className="mt-10 space-y-4">
              {perks.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary">
                    <p.icon className="h-5 w-5" />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted/60">© {new Date().getFullYear()} {GYM.name}</p>
        </aside>

        <main className="flex min-h-screen flex-col px-4 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <span className="lg:hidden">
              <Logo />
            </span>
            <Link href="/" className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
