import type { Metadata } from 'next';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import CartContents from '@/components/cart/CartContents';
import { siteConfig } from '@/constants/siteConfig';
import { getActiveZones } from '@/lib/data/zones';

export const metadata: Metadata = {
  title: 'Your basket',
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  // Show a "from £X" delivery indicator computed from the cheapest active
  // zone in the admin-controlled `delivery_zones` table — the customer
  // hasn't entered a postcode yet, so we can't bind the exact fee.
  const zones = await getActiveZones();
  // When zones haven't loaded (cold cache + DB down) we hide the "from"
  // indicator rather than show a stale business value.
  const minDeliveryFee = zones.length > 0 ? Math.min(...zones.map((z) => z.baseFeeGbp)) : null;

  return (
    <>
      <SiteHeader />
      <main>
        <nav aria-label="Breadcrumb" className="border-b border-rule bg-cream-soft">
          <div className="container flex items-center gap-2.5 py-3.5 font-serif text-[13px]">
            <a href={siteConfig.routes.home} className="italic text-ink-muted transition-colors hover:text-walnut">
              Home
            </a>
            <span className="text-bronze">·</span>
            <a href={siteConfig.routes.menu} className="italic text-ink-muted transition-colors hover:text-walnut">
              Menu
            </a>
            <span className="text-bronze">·</span>
            <span className="font-medium tracking-[0.08em] text-walnut [font-variant:small-caps]">Your basket</span>
          </div>
        </nav>

        <section className="container py-[clamp(32px,5vw,56px)] pb-[clamp(48px,7vw,88px)]">
          <CartContents minDeliveryFee={minDeliveryFee} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
