import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { PaymentStatus } from '@/types';

const map = {
  paid: { tone: 'success', label: 'Paid', icon: CheckCircle2 },
  pending: { tone: 'warning', label: 'Pending', icon: Clock3 },
  overdue: { tone: 'danger', label: 'Overdue', icon: AlertCircle },
} as const;

/** Green = paid, yellow = pending (current month), red = overdue (past months). */
export function PaymentStatusBadge({ status }: { status: PaymentStatus | null | undefined }) {
  if (!status) return <Badge tone="neutral">No record</Badge>;
  const m = map[status];
  const Icon = m.icon;
  return (
    <Badge tone={m.tone} dot={status !== 'paid'} pulse={status !== 'paid'} icon={status === 'paid' ? <Icon /> : undefined}>
      {m.label}
    </Badge>
  );
}

export default PaymentStatusBadge;
