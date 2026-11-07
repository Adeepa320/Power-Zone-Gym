'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';

/** Counts up from 0 to `value` when scrolled into view. */
export function AnimatedCounter({
  value,
  duration = 1.2,
  format = (n) => Math.round(n).toLocaleString('en-US'),
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const from = useRef(0);

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    from.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, duration]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}

export default AnimatedCounter;
