import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/constants/siteConfig';
import { getHours } from '@/lib/data/hours';

/**
 * Customer-facing footer. Walnut band, four columns on desktop, stacks on
 * mobile. Bottom row contains the four legal links per UK PECR/GDPR best
 * practice (always-visible, one click away).
 */
export default async function SiteFooter() {
  const hours = await getHours();
  return (
    <footer className="border-t border-[rgba(241,229,205,0.22)] bg-walnut pt-14 pb-6 text-cream">
      <div className="container">
        <div className="grid grid-cols-1 gap-10 border-b border-[rgba(241,229,205,0.22)] pb-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Image
              src="/logo.png"
              alt={siteConfig.name}
              width={120}
              height={120}
              className="mb-4 h-14 w-auto"
            />
            <p className="m-0 mb-5 max-w-[30ch] font-serif text-[15px] italic leading-[1.5] text-[#F1E5CDB8]">
              A small home kitchen in Middlesbrough — Italian &amp; West African, delivered hot.
            </p>
            <div className="flex flex-col gap-1.5 font-serif text-[13px]">
              <span className="font-medium text-bronze [font-variant:small-caps]">
                ★ ★ ★ ★ ★ &nbsp;Hygiene · FSA
              </span>
              <a
                href={siteConfig.foodHygiene.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start border-b border-[rgba(241,229,205,0.3)] pb-px text-[13px] italic text-[#F1E5CDBF] transition-colors hover:text-bronze"
              >
                Verify our rating →
              </a>
            </div>
          </div>

          {/* Visit */}
          <FooterColumn title="Visit">
            <Link href={siteConfig.routes.home}>Home</Link>
            <Link href={siteConfig.routes.menu}>Menu</Link>
            <Link href={siteConfig.routes.about}>About</Link>
            <Link href={siteConfig.routes.contact}>Contact</Link>
          </FooterColumn>

          {/* Contact */}
          <FooterColumn title="Contact">
            <a href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phone}</a>
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            <a href={`mailto:${siteConfig.contact.email}`}>Email us</a>
            {siteConfig.social.instagram && (
              <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            )}
            {siteConfig.social.facebook && (
              <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            )}
            {siteConfig.social.tiktok && (
              <a href={siteConfig.social.tiktok} target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            )}
          </FooterColumn>

          {/* Hours */}
          <FooterColumn title="Hours">
            <span>{hours.daysLong}</span>
            <span>{hours.timeLong}</span>
            <span>{hours.cutoffShort}</span>
          </FooterColumn>
        </div>

        {/* Bottom row — legal links + copyright */}
        <div className="flex flex-wrap justify-between gap-4 pt-5 font-serif text-[13px] italic text-[#F1E5CD8C]">
          <span>
            © {new Date().getFullYear()} {siteConfig.name} · Middlesbrough, UK
          </span>
          <span>
            <FooterLegalLink href={siteConfig.routes.legal.terms}>Terms</FooterLegalLink>
            <span className="mx-2 text-bronze">·</span>
            <FooterLegalLink href={siteConfig.routes.legal.privacy}>Privacy</FooterLegalLink>
            <span className="mx-2 text-bronze">·</span>
            <FooterLegalLink href={siteConfig.routes.legal.refund}>Refunds</FooterLegalLink>
            <span className="mx-2 text-bronze">·</span>
            <FooterLegalLink href={siteConfig.routes.legal.cookies}>Cookies</FooterLegalLink>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="m-0 mb-4 font-serif text-[14px] font-medium tracking-[0.16em] text-bronze [font-variant:small-caps]">
        {title}
      </h4>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0 font-serif text-[15px] text-[#F1E5CDD2] [&_a]:transition-colors [&_a:hover]:text-bronze">
        {Array.isArray(children)
          ? children.map((child, i) => <li key={i}>{child}</li>)
          : <li>{children}</li>}
      </ul>
    </div>
  );
}

function FooterLegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="border-b border-[rgba(241,229,205,0.2)] pb-px text-[#F1E5CD8C] transition-colors hover:text-bronze"
    >
      {children}
    </Link>
  );
}
