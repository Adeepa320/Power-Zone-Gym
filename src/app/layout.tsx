import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { GYM } from '@/lib/constants';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: `${GYM.name} — ${GYM.tagline}`, template: `%s · ${GYM.name}` },
  description: 'Membership, payments, attendance and personalised workout charts — all in one place.',
  icons: { icon: '/icons/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
