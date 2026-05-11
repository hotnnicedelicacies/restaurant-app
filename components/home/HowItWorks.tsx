import SectionHead from '@/components/ui/SectionHead';
import { romanLower } from '@/lib/utils';
import { getHours } from '@/lib/data/hours';

interface Step {
  title: React.ReactNode;
  body: string;
}

interface Props {
  eyebrow?: string;
  title?: React.ReactNode;
  steps?: Step[];
}

/**
 * Heritage three-step "How it works" section with italic Roman-numeral step
 * markers (i. / ii. / iii.). Centered grid, stacks on mobile. Step copy
 * pulls trading hours from admin settings so the "delivered hot" line
 * stays in sync with /admin/settings.
 */
export default async function HowItWorks({
  eyebrow = 'How it works',
  title = <>Three steps, <em>before dinner.</em></>,
  steps,
}: Props) {
  const hours = await getHours();
  const defaultSteps: Step[] = steps ?? [
    {
      title: 'Order by ten o\'clock',
      body: `Browse today's kitchen and place your order online — ${hours.cutoffShort.toLowerCase()}.`,
    },
    {
      title: 'We cook fresh',
      body: 'Pots go on at ten. Every meal is made from scratch — no frozen, no microwave.',
    },
    {
      title: <>Delivered <em className="italic font-normal">hot</em></>,
      body: `Brought to your door ${hours.timeLong}, ${hours.daysLong.toLowerCase()}.`,
    },
  ];
  return (
    <section className="py-[clamp(56px,8vw,96px)]">
      <div className="container">
        <SectionHead eyebrow={eyebrow} title={title} className="mb-10" />
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {defaultSteps.map((step, i) => (
            <article key={i} className="flex flex-col items-center gap-3 text-center">
              <div className="font-serif text-[56px] italic font-normal leading-none text-bronze">
                {romanLower(i + 1)}.
              </div>
              <h3 className="m-0 font-serif text-[22px] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
                {step.title}
              </h3>
              <p className="m-0 max-w-[24ch] font-serif text-[15px] italic leading-[1.55] text-ink-muted">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
