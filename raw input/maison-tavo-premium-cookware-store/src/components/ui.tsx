import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../utils/cn';

export function Wordmark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('wordmark', light && 'text-ivory', className)} aria-label="Maison Tavo">
      <span className="wordmark-main">TAVO</span>
      <span className="wordmark-sub">MAISON</span>
    </span>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'dark' | 'light' | 'outline' | 'outline-light' | 'copper' | 'text';
  arrow?: boolean;
  full?: boolean;
}

export function Button({ children, className, variant = 'dark', arrow = false, full = false, ...props }: ButtonProps) {
  return (
    <button className={cn('button group', `button-${variant}`, full && 'w-full', className)} {...props}>
      <span className="button-label">{children}</span>
      {arrow && (
        <span className="button-icon" aria-hidden="true">
          <ArrowUpRight size={16} strokeWidth={1.6} />
        </span>
      )}
    </button>
  );
}

export function SectionLabel({ children, light = false, number }: { children: ReactNode; light?: boolean; number?: string }) {
  return (
    <div className={cn('section-label', light ? 'text-ivory/60 border-ivory/25' : 'text-ink/55 border-ink/20')}>
      {number && <span>{number}</span>}
      <span>{children}</span>
    </div>
  );
}

export function StarRating({ rating, count, light = false }: { rating: number; count?: number; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[11px] tracking-[0.08em]', light ? 'text-ivory/65' : 'text-ink/55')}>
      <span aria-label={`${rating} out of 5 stars`} className="tracking-[0.15em]">★★★★★</span>
      <span>{rating.toFixed(1)}{count !== undefined ? ` (${count})` : ''}</span>
    </span>
  );
}
