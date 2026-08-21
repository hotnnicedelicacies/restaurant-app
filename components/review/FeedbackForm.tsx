'use client';

import { useActionState } from 'react';
import { submitFeedback, type FeedbackState } from '@/lib/review/feedback';
import type { ReviewSource } from '@/lib/review/source';

const INITIAL: FeedbackState = { status: 'idle' };

const LABEL_CLS =
  'font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]';
const OPTIONAL_CLS =
  'ml-1.5 font-serif text-[12px] italic tracking-normal text-ink-muted [font-variant:normal]';
const INPUT_CLS =
  'w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted';

interface Props {
  src: ReviewSource;
  whatsappNumber: string;
  whatsappDisplay: string;
}

/**
 * Private-feedback form on `/review`. Progressive enhancement via
 * `useActionState`: with JS it submits in place; without JS the browser
 * POSTs the form and the server re-renders this component with the
 * returned state — success note, or the error plus the typed values.
 */
export default function FeedbackForm({ src, whatsappNumber, whatsappDisplay }: Props) {
  const [state, formAction, pending] = useActionState(submitFeedback, INITIAL);

  if (state.status === 'success') {
    return (
      <div role="status" aria-live="polite" className="border-l-2 border-bronze py-1 pl-5">
        <p className="m-0 font-serif text-[clamp(18px,2.2vw,22px)] italic leading-[1.45] text-walnut">
          Received — thank you. If it needs putting right, we&apos;ll be in touch today.
        </p>
      </div>
    );
  }

  const values = state.status === 'error' ? state.values : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="src" value={src} />
      {/* Honeypot — hidden from real users; bots will fill it. */}
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {state.status === 'error' && (
        <p
          role="alert"
          className="m-0 rounded-[2px] border border-[#8B2A1A]/40 bg-cream-soft px-3.5 py-2.5 font-serif text-[14px] italic text-[#8B2A1A]"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="feedback-message" className={LABEL_CLS}>
          Your message
        </label>
        <textarea
          id="feedback-message"
          name="message"
          required
          maxLength={2000}
          rows={5}
          defaultValue={values?.message ?? ''}
          placeholder="What was good, what wasn't, what you'd like to see on the menu…"
          className={`${INPUT_CLS} min-h-[120px] resize-y italic leading-[1.55]`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="feedback-name" className={LABEL_CLS}>
            Your name
            <small className={OPTIONAL_CLS}>· optional</small>
          </label>
          <input
            id="feedback-name"
            name="name"
            type="text"
            maxLength={80}
            autoComplete="name"
            defaultValue={values?.name ?? ''}
            className={INPUT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="feedback-contact" className={LABEL_CLS}>
            How can we reach you?
            <small className={OPTIONAL_CLS}>· optional</small>
          </label>
          <input
            id="feedback-contact"
            name="contact"
            type="text"
            maxLength={120}
            defaultValue={values?.contact ?? ''}
            placeholder="Phone or email"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 min-h-[48px] rounded-[2px] border-0 bg-walnut px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send to the kitchen'}
      </button>

      <p className="m-0 text-center font-serif text-[13px] italic text-ink-muted">
        Prefer WhatsApp? Message us on{' '}
        <a
          href={`https://wa.me/${whatsappNumber}`}
          className="link-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {whatsappDisplay}
        </a>
      </p>
    </form>
  );
}
