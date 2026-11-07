'use client';

import { CalendarCheck, ClipboardList, CreditCard, LayoutDashboard, UserRound } from 'lucide-react';
import { Sidebar, type NavItem } from '@/components/ui/Sidebar';

export const MEMBER_NAV: NavItem[] = [
  { href: '/member', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/member/my-chart', label: 'My Workout Plan', icon: ClipboardList },
  { href: '/member/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/member/payments', label: 'Payments', icon: CreditCard },
  { href: '/member/profile', label: 'My Profile', icon: UserRound },
];

export function MemberSidebar() {
  return <Sidebar items={MEMBER_NAV} roleLabel="Member Area" />;
}

export default MemberSidebar;
