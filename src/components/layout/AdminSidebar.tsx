'use client';

import { CalendarCheck, ClipboardList, CreditCard, LayoutDashboard, Settings, Users } from 'lucide-react';
import { Sidebar, type NavItem } from '@/components/ui/Sidebar';

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/admin/charts', label: 'Workout Charts', icon: ClipboardList },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  return <Sidebar items={ADMIN_NAV} roleLabel="Admin Panel" />;
}

export default AdminSidebar;
