'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavLink({
  href,
  count,
  children,
}: {
  href: string;
  count?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={`admin-nav__link ${isActive ? 'is-active' : ''}`}>
      {children}
      {typeof count === 'number' && count > 0 && (
        <span className="admin-nav__count">{count}</span>
      )}
    </Link>
  );
}
