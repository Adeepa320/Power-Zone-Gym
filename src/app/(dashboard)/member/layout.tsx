import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { MemberSidebar } from '@/components/layout/MemberSidebar';

export const metadata: Metadata = { title: 'Member' };

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell sidebar={<MemberSidebar />}>{children}</DashboardShell>;
}
