'use client';

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-xl border bg-white/[0.04] text-sm text-white placeholder:text-muted/60 transition-all duration-200 focus:outline-none focus:bg-white/[0.06] disabled:opacity-60';
const fieldState = (error?: string) =>
  error
    ? 'border-danger/60 focus:border-danger focus:ring-2 focus:ring-danger/20'
    : 'border-white/10 hover:border-white/20 focus:border-primary/70 focus:ring-2 focus:ring-primary/20';

function FieldWrapper({
  id,
  label,
  error,
  hint,
  children,
  className,
  required,
}: {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium uppercase tracking-wider text-muted">
          {label}
          {required && <span className="ml-0.5 text-primary">*</span>}
        </label>
      )}
      {children}
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-danger"
            role="alert"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted/70">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, suffix, className, wrapperClassName, type = 'text', id, required, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <FieldWrapper id={inputId} label={label} error={error} hint={hint} className={wrapperClassName} required={required}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && show ? 'text' : type}
          aria-invalid={Boolean(error)}
          required={required}
          className={cn(
            fieldBase,
            fieldState(error),
            'h-11 px-3.5',
            icon && 'pl-10',
            (isPassword || suffix) && 'pr-11',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-white"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {!isPassword && suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">
            {suffix}
          </span>
        )}
      </div>
    </FieldWrapper>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, wrapperClassName, id, rows = 3, required, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper id={inputId} label={label} error={error} hint={hint} className={wrapperClassName} required={required}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={Boolean(error)}
        required={required}
        className={cn(fieldBase, fieldState(error), 'resize-none px-3.5 py-3', className)}
        {...props}
      />
    </FieldWrapper>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, icon, options, placeholder, className, wrapperClassName, id, required, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrapper id={inputId} label={label} error={error} hint={hint} className={wrapperClassName} required={required}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          required={required}
          className={cn(
            fieldBase,
            fieldState(error),
            'h-11 cursor-pointer appearance-none pl-3.5 pr-10',
            icon && 'pl-10',
            className,
          )}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldWrapper>
  );
});

export default Input;
