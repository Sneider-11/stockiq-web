'use client';

import { useEffect, useRef, useState } from 'react';

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

interface Props {
  value: number;
  format?: 'integer' | 'cop' | 'percent';
  duration?: number; // ms
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedNumber({ value, format = 'integer', duration = 1000, className }: Props) {
  const [current, setCurrent] = useState(0);
  const rafRef   = useRef<number>(0);
  const spanRef  = useRef<HTMLSpanElement>(null);
  const started  = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed  = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased    = easeOutCubic(progress);
            setCurrent(eased * value);
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 },
    );

    if (spanRef.current) observer.observe(spanRef.current);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  let display = '';
  if (format === 'cop')     display = COP.format(Math.round(current));
  else if (format === 'percent') display = `${Math.round(current)}%`;
  else                      display = Math.round(current).toLocaleString('es-CO');

  return <span ref={spanRef} className={className}>{display}</span>;
}
