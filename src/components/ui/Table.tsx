'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  /** Provide to make the column sortable (client-side). */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  className?: string;
  headerClassName?: string;
  /** Hide this field in the mobile card layout. */
  hideOnMobile?: boolean;
  /** Use this column as the mobile card title. */
  primary?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  className?: string;
  /** Controlled server-side sorting. When provided, client-side sorting is disabled. */
  sort?: { key: string; order: 'asc' | 'desc' };
  onSortChange?: (sort: { key: string; order: 'asc' | 'desc' }) => void;
  initialSort?: { key: string; order: 'asc' | 'desc' };
}

/**
 * Responsive data table:
 *  - desktop: sortable table with rows animating in from the left
 *  - mobile: stacked cards
 */
export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  empty,
  className,
  sort: controlledSort,
  onSortChange,
  initialSort,
}: TableProps<T>) {
  const [localSort, setLocalSort] = useState<{ key: string; order: 'asc' | 'desc' } | undefined>(initialSort);
  const sort = controlledSort ?? localSort;

  const rows = useMemo(() => {
    if (controlledSort || !sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const dir = sort.order === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      const na = va instanceof Date ? va.getTime() : va;
      const nb = vb instanceof Date ? vb.getTime() : vb;
      if (typeof na === 'string' && typeof nb === 'string') return na.localeCompare(nb) * dir;
      return ((na as number) - (nb as number)) * dir;
    });
  }, [data, sort, columns, controlledSort]);

  function toggleSort(key: string) {
    const next: { key: string; order: 'asc' | 'desc' } =
      sort?.key === key ? { key, order: sort.order === 'asc' ? 'desc' : 'asc' } : { key, order: 'asc' };
    if (onSortChange) onSortChange(next);
    else setLocalSort(next);
  }

  if (data.length === 0 && empty) return <>{empty}</>;

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];

  return (
    <div className={className}>
      {/* Desktop table */}
      <div className="glass hidden overflow-hidden rounded-2xl md:block">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {columns.map((col) => {
                  const sortable = Boolean(col.sortValue) || (Boolean(controlledSort) && Boolean(col.sortValue));
                  const active = sort?.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={cn(
                        'whitespace-nowrap px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted',
                        col.headerClassName,
                      )}
                    >
                      {sortable ? (
                        <button
                          onClick={() => toggleSort(col.key)}
                          className={cn('inline-flex items-center gap-1.5 transition hover:text-white', active && 'text-primary')}
                        >
                          {col.header}
                          {active ? (
                            sort?.order === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial>
                {rows.map((row, i) => (
                  <motion.tr
                    key={rowKey(row)}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ delay: Math.min(i * 0.035, 0.4), type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-b border-white/5 transition-colors last:border-0',
                      onRowClick && 'cursor-pointer hover:bg-white/[0.04]',
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-5 py-3.5 align-middle', col.className)}>
                        {col.render(row, i)}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row, i) => (
          <motion.div
            key={rowKey(row)}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn('glass rounded-2xl p-4', onRowClick && 'cursor-pointer active:scale-[0.99]')}
          >
            <div className="mb-3">{primaryCol.render(row, i)}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {columns
                .filter((c) => c !== primaryCol && !c.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-muted">{col.header}</dt>
                    <dd className="mt-0.5 truncate text-sm">{col.render(row, i)}</dd>
                  </div>
                ))}
            </dl>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
  label = 'results',
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) return <p className="mt-4 text-xs text-muted">{total} {label}</p>;

  const pages: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted">
        Page {page} of {totalPages} · {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-2 text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-sm transition',
                p === page ? 'bg-primary text-ink-950 font-semibold' : 'text-muted hover:bg-white/10 hover:text-white',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-lg p-2 text-muted transition hover:bg-white/10 hover:text-white disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default Table;
