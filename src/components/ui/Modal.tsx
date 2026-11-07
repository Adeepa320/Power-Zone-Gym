'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Prevent closing via backdrop / Escape while an action is running. */
  locked?: boolean;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, onClose, title, description, children, footer, size = 'md', locked }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !locked && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, locked, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !locked && onClose()}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={cn(
              'glass-strong relative flex max-h-[92vh] w-full flex-col rounded-t-3xl sm:rounded-2xl',
              sizes[size],
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                  {title && <h2 className="text-lg font-semibold">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  disabled={locked}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-white/10 px-6 py-4 sm:flex-row sm:justify-end">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Confirmation dialog for destructive actions. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      locked={loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center py-2 text-center">
        <motion.div
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
            tone === 'danger' ? 'bg-danger/15 text-danger' : 'bg-primary/15 text-primary',
          )}
        >
          <AlertTriangle className="h-7 w-7" />
        </motion.div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-muted">{message}</div>
      </div>
    </Modal>
  );
}

export default Modal;
