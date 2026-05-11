import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { siteConfig } from '@/constants/siteConfig';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      {/* Slim header (less escape distraction) */}
      <header className="sticky top-0 z-50 bg-walnut text-cream">
        <div className="container flex h-[68px] items-center justify-between gap-6">
          <Link href={siteConfig.routes.home} className="flex items-center" aria-label="Home">
            <Image src="/logo.png" alt={siteConfig.name} width={140} height={140} className="h-10 w-auto" />
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bronze">
            Secure checkout · Stripe
          </span>
          <Link
            href={siteConfig.routes.cart}
            className="border-b border-[rgba(241,229,205,0.22)] pb-px font-serif text-[14px] italic text-cream transition-colors hover:border-bronze hover:text-bronze"
          >
            ← Back to cart
          </Link>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="border-b border-rule bg-cream-soft">
        <div className="container flex items-center gap-2.5 py-3.5 font-serif text-[13px]">
          <Link href={siteConfig.routes.home} className="italic text-ink-muted transition-colors hover:text-walnut">
            Home
          </Link>
          <span className="text-bronze">·</span>
          <Link href={siteConfig.routes.cart} className="italic text-ink-muted transition-colors hover:text-walnut">
            Cart
          </Link>
          <span className="text-bronze">·</span>
          <span className="font-medium tracking-[0.08em] text-walnut [font-variant:small-caps]">
            Checkout
          </span>
        </div>
      </nav>

      <main className="container py-[clamp(32px,5vw,56px)] pb-[clamp(48px,7vw,88px)]">
        <CheckoutForm />
      </main>

      <footer className="bg-walnut py-4 text-center font-serif text-[12px] italic text-[#F1E5CD8C]">
        <div className="container">
          © {new Date().getFullYear()} {siteConfig.name} · Middlesbrough, UK · Secure checkout via Stripe · 5★ FSA hygiene
        </div>
      </footer>
    </>
  );
}
