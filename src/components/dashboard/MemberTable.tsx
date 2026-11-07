'use client';

import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Table, type Column } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MEMBERSHIP_CATEGORIES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { MemberListItem } from '@/types';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export function CategoryBadge({ category }: { category: MemberListItem['membershipCategory'] }) {
  const c = MEMBERSHIP_CATEGORIES.find((x) => x.value === category);
  if (!c) return null;
  return (
    <Badge tone="neutral" className="border-transparent" style={{ background: `${c.color}1a`, color: c.color }}>
      {c.emoji} {c.short}
    </Badge>
  );
}

/** Members table — server-side sorted (controlled) to match pagination. */
export function MemberTable({
  members,
  sort,
  onSortChange,
}: {
  members: MemberListItem[];
  sort: { key: string; order: 'asc' | 'desc' };
  onSortChange: (s: { key: string; order: 'asc' | 'desc' }) => void;
}) {
  const router = useRouter();

  const columns: Column<MemberListItem>[] = [
    {
      key: 'name',
      header: 'Member',
      primary: true,
      sortValue: (m) => m.name,
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} src={m.profileImage} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium">
              {m.name}
              {!m.isActive && <Badge tone="neutral">Inactive</Badge>}
            </p>
            <p className="truncate text-xs text-muted">{m.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (m) => <span className="text-muted">{m.phone}</span> },
    {
      key: 'membershipCategory',
      header: 'Category',
      sortValue: (m) => m.membershipCategory,
      render: (m) => <CategoryBadge category={m.membershipCategory} />,
    },
    {
      key: 'registeredDate',
      header: 'Registered',
      sortValue: (m) => m.registeredDate,
      render: (m) => <span className="text-muted">{formatDate(m.registeredDate)}</span>,
    },
    {
      key: 'paymentStatus',
      header: 'This Month',
      sortValue: (m) => m.currentPayment?.status,
      render: (m) => <PaymentStatusBadge status={m.currentPayment?.status} />,
    },
  ];

  return (
    <Table
      columns={columns}
      data={members}
      rowKey={(m) => m._id}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={(m) => router.push(`/admin/members/${m._id}`)}
      empty={<EmptyState icon={Users} title="No members found" description="Try adjusting your search or filters." />}
    />
  );
}

export default MemberTable;
