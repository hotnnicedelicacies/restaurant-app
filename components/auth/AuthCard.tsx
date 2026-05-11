import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/constants/siteConfig';

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
  /** Slim top header text (e.g. "Sign in", "Reset password"). */
  topLabel?: string;
  /** Show "Admin" eyebrow tag in the corner (for admin sign-in). */
  adminBadge?: boolean;
  /** Walnut-on-walnut variant for admin sign-in. */
  onDark?: boolean;
}

/**
 * Shared auth-page shell: slim walnut topbar, centered cream card with brand
 * mark + heritage title + form slot + footer slot. Used by sign-in, sign-up,
 * forgot-password, and admin-sign-in.
 */
export default function AuthCard({
  eyebrow,
  title,
  sub,
  children,
  topLabel,
  adminBadge,
  onDark,
}: Props) {
  return (
    <>
      <header className="sticky top-0 z-50 bg-walnut text-cream">
        <div className="container flex h-[68px] items-center justify-between gap-6">
          <Link href={siteConfig.routes.home} className="flex items-center" aria-label="Home">
            <Image
              src="/logo.png"
              alt={siteConfig.name}
              width={140}
              height={140}
              className="h-10 w-auto"
            />
          </Link>
          {topLabel && (
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bronze">
              {topLabel}
            </span>
          )}
          <Link
            href={siteConfig.routes.home}
            className="border-b border-[rgba(241,229,205,0.22)] pb-px font-serif text-[14px] italic text-cream transition-colors hover:border-bronze hover:text-bronze"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <section
        className={`flex min-h-[calc(100vh-68px)] items-start justify-center px-4 py-[clamp(40px,6vw,88px)] sm:items-center ${
          onDark ? 'bg-walnut' : 'bg-cream-soft'
        }`}
      >
        <div className="relative w-full max-w-[460px] rounded-[2px] border border-rule bg-cream p-[clamp(28px,4vw,48px)]">
          {adminBadge && (
            <div className="absolute left-5 top-5 font-mono text-[9px] uppercase tracking-[0.24em] text-bronze-deep">
              Admin
            </div>
          )}

          <div className="mb-6 flex justify-center">
            <Image src="/logo.png" alt={siteConfig.name} width={140} height={140} className="h-13 w-auto" />
          </div>

          {eyebrow && (
            <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
              {eyebrow}
            </p>
          )}
          <h1 className="m-0 mb-2 text-center font-serif text-[clamp(28px,3.8vw,36px)] font-medium leading-[1.08] tracking-[-0.005em] text-walnut [&_em]:font-normal [&_em]:italic">
            {title}
          </h1>
          {sub && (
            <p className="m-0 mx-auto mb-7 max-w-[36ch] text-center font-serif text-[15px] italic leading-[1.5] text-ink-muted">
              {sub}
            </p>
          )}

          {children}
        </div>
      </section>
    </>
  );
}
