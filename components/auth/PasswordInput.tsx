'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

/**
 * Password field with a show/hide toggle. Inherits all native input props.
 * The toggle button is positioned absolutely inside the field.
 */
export default function PasswordInput(props: Props) {
  const [show, setShow] = useState(false);
  const { className, ...rest } = props;
  return (
    <div className="relative flex items-center">
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        className={cn(
          'w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 pr-16 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted',
          className
        )}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 border-b border-bronze-deep pb-px font-serif text-[13px] italic text-bronze-deep transition-colors hover:border-walnut hover:text-walnut"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
