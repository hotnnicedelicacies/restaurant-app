import type { Metadata } from 'next';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PageHero from '@/components/layout/PageHero';
import DeliveryAreas from '@/components/home/DeliveryAreas';
import ContactForm from '@/components/contact/ContactForm';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';
import { getHours, type WeekDay } from '@/lib/data/hours';

const ALL_DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with ${siteConfig.name}. WhatsApp, phone, email, and where we deliver across Teesside.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.contact) },
  openGraph: {
    title: `Contact ${siteConfig.name}`,
    description: 'WhatsApp, phone, email — and where we deliver across Teesside.',
    type: 'website',
    images: [absoluteUrl('/og-image.jpg')],
  },
};

const CONTACT_PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  url: absoluteUrl(siteConfig.routes.contact),
  name: `Contact ${siteConfig.name}`,
  description: 'Get in touch — WhatsApp, phone, email, and kitchen hours.',
  mainEntity: {
    '@type': 'Organization',
    name: siteConfig.name,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Middlesbrough',
      addressRegion: 'North Yorkshire',
      addressCountry: 'GB',
    },
  },
};

const CHANNELS: {
  label: string;
  value: string;
  caption: string;
  cta: { label: string; href: string };
}[] = [
  {
    label: 'WhatsApp',
    value: siteConfig.contact.whatsappDisplay,
    caption: 'Fastest reply · live orders, custom requests',
    cta: { label: 'Open chat →', href: `https://wa.me/${siteConfig.contact.whatsapp}` },
  },
  {
    label: 'Phone',
    value: siteConfig.contact.phone,
    caption: 'Available during kitchen hours',
    cta: { label: 'Call →', href: `tel:${siteConfig.contact.phone}` },
  },
  {
    label: 'Email',
    value: siteConfig.contact.email,
    caption: 'For invoices, larger orders, press',
    cta: { label: 'Email us →', href: `mailto:${siteConfig.contact.email}` },
  },
  {
    label: 'Instagram',
    value: '@hotnnicedelicacies',
    caption: "Today's kitchen, behind the scenes",
    cta: { label: 'Follow →', href: siteConfig.social.instagram },
  },
];

export default async function ContactPage() {
  const hours = await getHours();
  const openSet = new Set<string>(hours.days);
  const HOURS = ALL_DAYS.map((day) => ({
    day,
    value: openSet.has(day) ? hours.timeLong : 'Closed',
    closed: !openSet.has(day),
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(CONTACT_PAGE_SCHEMA) }}
      />
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Say hello · Middlesbrough"
          title={<>Get in <em>touch.</em></>}
          sub="The quickest way to reach us is WhatsApp — we answer between the kitchen passes."
        />

        <section className="py-[clamp(56px,8vw,96px)]">
          <div className="container">
            <div className="grid items-start gap-[clamp(40px,6vw,80px)] md:grid-cols-[1.1fr_1fr]">
              {/* LEFT: channels + hours */}
              <div>
                <div className="t-mono mb-2.5">Find us</div>
                <h2 className="t-display-m mb-2">Reach the <em>kitchen</em></h2>
                <p className="t-body-l mb-5">
                  If your question is about a live order, WhatsApp gets the fastest reply.
                </p>

                <div className="mt-2 flex flex-col border-t border-rule">
                  {CHANNELS.map((ch) => (
                    <div
                      key={ch.label}
                      className="grid items-center gap-4 border-b border-rule py-[18px] sm:grid-cols-[90px_1fr_auto]"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">
                        {ch.label}
                      </span>
                      <span className="font-serif text-[17px] text-walnut">
                        {ch.value}
                        <em className="mt-0.5 block text-[14px] italic text-ink-muted">
                          {ch.caption}
                        </em>
                      </span>
                      <a
                        href={ch.cta.href}
                        target={ch.cta.href.startsWith('http') ? '_blank' : undefined}
                        rel={ch.cta.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="font-serif text-[14px] italic text-bronze-deep border-b border-bronze-deep pb-px sm:justify-self-end"
                      >
                        {ch.cta.label}
                      </a>
                    </div>
                  ))}
                </div>

                {/* HOURS */}
                <div className="mt-8 rounded-[2px] border border-rule bg-cream-soft p-6">
                  <h3 className="m-0 mb-4 font-serif text-[18px] font-medium tracking-[0.14em] text-bronze-deep [font-variant:small-caps]">
                    Kitchen hours
                  </h3>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0 font-serif text-[15px] text-walnut">
                    {HOURS.map((h) => (
                      <li
                        key={h.day}
                        className={`flex justify-between ${h.closed ? 'italic text-ink-muted' : ''}`}
                      >
                        <b className="font-medium tracking-[0.08em] [font-variant:small-caps]">{h.day}</b>
                        <span>{h.value}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="m-0 mt-3 border-t border-rule pt-3 font-serif text-[13.5px] italic text-ink-muted">
                    Order by{' '}
                    <b className="font-medium not-italic tracking-[0.08em] text-walnut [font-variant:small-caps]">
                      10am
                    </b>{' '}
                    for same-day delivery. Anything later goes onto the next day's list.
                  </p>
                </div>
              </div>

              {/* RIGHT: form */}
              <div>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        <DeliveryAreas />
      </main>
      <SiteFooter />
    </>
  );
}
