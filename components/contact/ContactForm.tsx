'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { siteConfig } from '@/constants/siteConfig';

/**
 * Contact form. Posts to `/api/contact` in Phase 5; for now, builds a
 * pre-filled WhatsApp message and opens it in a new tab (matching the
 * existing fallback). Heritage form styling.
 */
export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name');
    const phone = form.get('phone');
    const email = form.get('email');
    const topic = form.get('topic');
    const message = form.get('message');

    setSubmitting(true);
    const text = encodeURIComponent(
      `Hi! ${name}.\n\nTopic: ${topic}\n\n${message}\n\nEmail: ${email}${
        phone ? `\nPhone: ${phone}` : ''
      }`
    );
    toast.success('Opening WhatsApp with your message…');
    setTimeout(() => {
      window.open(`https://wa.me/${siteConfig.contact.whatsapp}?text=${text}`, '_blank');
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className="rounded-[2px] border border-rule bg-cream p-6 sm:p-8">
      <header className="mb-5 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
        <h2 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
          Send us a <em>message</em>
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">№ 01</span>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Your name" name="name" required placeholder="e.g., Sarah Whitfield" />
          <Field
            label="Phone"
            sublabel="· optional"
            name="phone"
            type="tel"
            placeholder="+44 7700 900123"
          />
        </div>
        <Field label="Email" name="email" type="email" required placeholder="you@example.co.uk" />
        <div className="flex flex-col gap-1.5">
          <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
            What's it about?
          </label>
          <select name="topic" className={INPUT_CLS} required defaultValue="">
            <option value="" disabled>Choose a topic…</option>
            <option>A live order I've placed</option>
            <option>Catering / larger order</option>
            <option>Delivery outside Teesside</option>
            <option>Dietary or allergen question</option>
            <option>Feedback</option>
            <option>Something else</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
            Your message
          </label>
          <textarea
            name="message"
            required
            placeholder="Tell us what you need…"
            rows={6}
            className={`${INPUT_CLS} resize-vertical min-h-[140px] italic leading-[1.55]`}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-[2px] border-0 bg-walnut px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-60"
        >
          {submitting ? 'Opening WhatsApp…' : 'Send message'}
        </button>
        <p className="m-0 text-center text-ink-muted italic font-serif text-[13px]">
          For anything urgent about a live order, message us on{' '}
          <a
            href={`https://wa.me/${siteConfig.contact.whatsapp}`}
            className="link-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>{' '}
          instead — we'll see it faster.
        </p>
      </form>
    </div>
  );
}

const INPUT_CLS =
  'w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted';

function Field({
  label,
  sublabel,
  name,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  sublabel?: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
        {label}
        {sublabel && (
          <small className="ml-1.5 font-serif text-[12px] italic tracking-normal text-ink-muted [font-variant:normal]">
            {sublabel}
          </small>
        )}
      </label>
      <input name={name} type={type} required={required} placeholder={placeholder} className={INPUT_CLS} />
    </div>
  );
}
