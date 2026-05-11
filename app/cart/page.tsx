import type { Metadata } from 'next';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import CartContents from '@/components/cart/CartContents';
import { siteConfig } from '@/constants/siteConfig';

export const metadata: Metadata = {
  title: 'Your basket',
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <nav aria-label="Breadcrumb" className="border-b border-[--color-border] bg-[--color-cream-soft]">
          <div className="container flex items-center gap-2.5 py-3.5 font-serif text-[13px]">
            <a href={siteConfig.routes.home} className="italic text-[--color-ink-muted] transition-colors hover:text-[--color-walnut]">
              Home
            </a>
            <span className="text-[--color-bronze]">·</span>
            <a href={siteConfig.routes.menu} className="italic text-[--color-ink-muted] transition-colors hover:text-[--color-walnut]">
              Menu
            </a>
            <span className="text-[--color-bronze]">·</span>
            <span className="font-medium tracking-[0.08em] text-[--color-walnut] [font-variant:small-caps]">Your basket</span>
          </div>
        </nav>

        <section className="container py-[clamp(32px,5vw,56px)] pb-[clamp(48px,7vw,88px)]">
          <CartContents />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
