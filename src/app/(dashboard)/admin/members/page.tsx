'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, UserPlus, Users, X } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Table';
import { SkeletonTable } from '@/components/ui/Loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MemberTable } from '@/components/dashboard/MemberTable';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { MEMBERSHIP_CATEGORIES, PAGE_SIZE } from '@/lib/constants';
import type { MemberListItem, Paginated } from '@/types';

export default function MembersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [active, setActive] = useState('true');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; order: 'asc' | 'desc' }>({ key: 'registeredDate', order: 'desc' });
  const [addOpen, setAddOpen] = useState(false);
  const debounced = useDebounce(search);

  // Reset to page 1 when filters change
  useEffect(() => setPage(1), [debounced, category, paymentStatus, active]);

  const query = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort: sort.key, order: sort.order, active });
    if (debounced) p.set('search', debounced);
    if (category) p.set('category', category);
    if (paymentStatus) p.set('paymentStatus', paymentStatus);
    return p.toString();
  }, [page, sort, debounced, category, paymentStatus, active]);

  const { data, error, isLoading, mutate } = useFetch<Paginated<MemberListItem>>(`/api/members?${query}`);
  const hasFilters = Boolean(search || category || paymentStatus || active !== 'true');

  return (
    <>
      <PageHeader
        title="Members"
        description="Search, filter and manage every gym member."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Members' }]}
        actions={
          <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
            Add member
          </Button>
        }
      />

      <div className="glass mb-6 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_160px_auto]">
        <Input placeholder="Search name, email or phone…" icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select
          icon={<Filter />}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="All categories"
          options={MEMBERSHIP_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        />
        <Select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          placeholder="Any payment status"
          options={[
            { value: 'paid', label: 'Paid' },
            { value: 'pending', label: 'Pending' },
            { value: 'overdue', label: 'Overdue' },
          ]}
        />
        <Select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
            { value: 'all', label: 'All members' },
          ]}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            icon={<X className="h-4 w-4" />}
            onClick={() => {
              setSearch('');
              setCategory('');
              setPaymentStatus('');
              setActive('true');
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {error ? (
        <EmptyState icon={Users} title="Could not load members" description={error.message} action={<Button onClick={() => mutate()}>Retry</Button>} />
      ) : isLoading && !data ? (
        <SkeletonTable />
      ) : data && data.total === 0 && !hasFilters ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Members appear here as soon as they register online or you add them."
          action={<Button onClick={() => setAddOpen(true)}>Add first member</Button>}
        />
      ) : (
        data && (
          <>
            <MemberTable
              members={data.items}
              sort={sort}
              onSortChange={(s) => {
                setSort(s);
                setPage(1);
              }}
            />
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} label="members" />
          </>
        )
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Register new member" size="lg">
        <RegisterForm
          mode="admin"
          onSuccess={(m) => {
            setAddOpen(false);
            mutate();
            router.push(`/admin/members/${m._id}`);
          }}
        />
      </Modal>
    </>
  );
}
