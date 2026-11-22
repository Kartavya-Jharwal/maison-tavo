import type { ButtonHTMLAttributes } from 'react';
export function Button({children, variant='dark', full=false, className='', ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {variant?: string; full?: boolean}) {
  return <button type="button" className={`button button-${variant} ${full ? 'w-full' : ''} ${className}`} {...props}><span className="button-label">{children}</span></button>;
}
