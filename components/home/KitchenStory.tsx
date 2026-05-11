import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/constants/siteConfig';

interface Props {
  image: string | StaticImageData;
  imageAlt: string;
  eyebrow?: string;
  /** Title with optional <em>…</em> emphasis. */
  title: React.ReactNode;
  /** Body — can be multiple <p> elements. */
  body: React.ReactNode;
  /** Optional link below body. */
  link?: { label: string; href: string };
  /** Reverse the column order. */
  reverse?: boolean;
}

/**
 * Asymmetric two-column "kitchen story" section. Used on Home (story arc),
 * Confirmation (while-you-wait), and About (intro). Mobile collapses to
 * single column.
 */
export default function KitchenStory({
  image,
  imageAlt,
  eyebrow,
  title,
  body,
  link = { label: 'Read our story →', href: siteConfig.routes.about },
  reverse,
}: Props) {
  return (
    <section className="bg-cream-soft py-[clamp(56px,8vw,96px)]">
      <div className="container">
        <div
          className={`mx-auto grid max-w-[1100px] items-center gap-[clamp(40px,6vw,80px)] md:grid-cols-[1.1fr_1fr] ${reverse ? 'md:[&>div:first-child]:order-2' : ''}`}
        >
          <div className="relative">
            <Image
              src={image}
              alt={imageAlt}
              width={900}
              height={1125}
              className="aspect-[4/5] w-full rounded-[2px] object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-4 -right-4 left-4 top-4 -z-10 rounded-[2px] border border-bronze opacity-40"
            />
          </div>
          <div className="flex flex-col gap-5">
            {eyebrow && (
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
                {eyebrow}
              </span>
            )}
            <h2 className="m-0 font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.05] tracking-[-0.005em] text-walnut [&_em]:font-normal [&_em]:italic">
              {title}
            </h2>
            <div className="font-serif text-[17px] leading-[1.6] text-ink-muted [&_b]:font-medium [&_b]:text-walnut [&_em]:italic [&_em]:text-walnut [&_p]:m-0 [&_p+p]:mt-4">
              {body}
            </div>
            {link && (
              <Link href={link.href} className="link-underline w-fit">
                {link.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
