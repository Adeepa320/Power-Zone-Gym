import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { GYM } from '@/lib/constants';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">{GYM.tagline} Train with expert coaches, track every rep, and pay your membership online in seconds.</p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            <li><Link href="/register" className="hover:text-primary">Join Now</Link></li>
            <li><Link href="/login" className="hover:text-primary">Member Login</Link></li>
            <li><a href="#plans" className="hover:text-primary">Membership Plans</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{GYM.address}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{GYM.phone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{GYM.email}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-muted/70">
        © {new Date().getFullYear()} {GYM.name}. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
