'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
      <Home className="h-3.5 w-3.5" />
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 opacity-50" />
          {c.href && i < items.length - 1 ? (
            <Link href={c.href} className="transition hover:text-primary">
              {c.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-white/80' : undefined}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Page title block with optional breadcrumbs and action buttons. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}

export default PageHeader;
