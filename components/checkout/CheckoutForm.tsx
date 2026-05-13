'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Elements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart/store';
import { getStripeClient } from '@/lib/stripe/client';
import { createOrder } from '@/lib/orders/create';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl, formatGBP } from '@/lib/utils';
import StripePaymentSection from './StripePaymentSection';

interface ZoneResponse {
  ok: true;
  matched: boolean;
  zone?: {
    id: string;
    name: string;
    baseFeeGbp: number;
    minOrderGbp: number;
    prepTimeMin: number;
    prepTimeMax: number;
    allowsCod: boolean;
  };
}

/**
 * Checkout form. Manages the customer + delivery + payment fields, runs an
 * inline postcode → zone lookup, and handles the two-stage submit:
 *
 *   Card flow:  fill form → "Place order" → server creates order + Stripe
 *               PaymentIntent → PaymentElement appears → confirmPayment →
 *               Stripe redirects to /confirmation/[ref]?payment_intent=…
 *   COD flow:   fill form → "Place order" → server creates order → redirect
 *               to /confirmation/[ref]
 */
export interface SavedAddress {
  id: string;
  label: string | null;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
  phone: string | null;
  isDefault: boolean;
}

export interface CheckoutDefaults {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  /** Full list of the customer's saved addresses — for the picker. */
  savedAddresses?: SavedAddress[];
  /** Which one (if any) is initially selected. */
  selectedAddressId?: string | null;
}

export default function CheckoutForm({ defaults }: { defaults?: CheckoutDefaults | null }) {
  const router = useRouter();
  const cartLines = useCart((s) => s.lines);
  const cartCount = useCart((s) => s.count());
  const clearCart = useCart((s) => s.clear);

  // Avoid hydration mismatch — cart loads from localStorage
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Form fields — pre-filled from saved profile + default address when
  // the customer is signed in; empty for guests.
  const [form, setForm] = useState({
    firstName: defaults?.firstName ?? '',
    lastName: defaults?.lastName ?? '',
    phone: defaults?.phone ?? '',
    email: defaults?.email ?? '',
    address1: defaults?.address1 ?? '',
    address2: defaults?.address2 ?? '',
    city: defaults?.city ?? 'Middlesbrough',
    postcode: defaults?.postcode ?? '',
    deliveryDate: '',
    deliveryWindowStart: '12:00',
    deliveryWindowEnd: '14:00',
    deliveryNotes: '',
    paymentMethod: 'card' as 'card' | 'cod',
  });

  // Saved-address picker state. `null` = "use a different address" (manual entry).
  const savedAddresses = defaults?.savedAddresses ?? [];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaults?.selectedAddressId ?? null
  );

  function selectSavedAddress(id: string | null) {
    setSelectedAddressId(id);
    if (id === null) {
      // "Use a different address" — clear the address fields for fresh entry.
      setForm((f) => ({ ...f, address1: '', address2: '', city: 'Middlesbrough', postcode: '' }));
      return;
    }
    const addr = savedAddresses.find((a) => a.id === id);
    if (!addr) return;
    setForm((f) => ({
      ...f,
      address1: addr.line1,
      address2: addr.line2 ?? '',
      city: addr.city,
      postcode: addr.postcode,
    }));
  }

  // Zone match state
  const [zone, setZone] = useState<ZoneResponse['zone'] | null>(null);
  const [zoneStatus, setZoneStatus] = useState<'idle' | 'checking' | 'matched' | 'no_match'>('idle');

  // Payment flow state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Computed totals (server validates; this is for display)
  const subtotal = useMemo(
    () => cartLines.reduce((s, l) => s + l.unitPriceGbp * l.quantity, 0),
    [cartLines]
  );
  const deliveryFee = zone?.baseFeeGbp ?? 0;
  const total = subtotal + deliveryFee;
  const meetsMin = !zone || subtotal >= (zone.minOrderGbp ?? 0);
  // Per-meal: any line flagged COD-ineligible blocks cash payment for the
  // whole order. (Stored `isCodEligible !== false` keeps older persisted
  // carts that pre-date the field permissive — the server still re-checks.)
  const codIneligibleItems = cartLines.filter((l) => l.isCodEligible === false);
  const cartCodEligible = codIneligibleItems.length === 0;
  const zoneCodEligible = zone?.allowsCod ?? true;
  const codAvailable = cartCodEligible && zoneCodEligible;

  // Debounced postcode → zone check
  useEffect(() => {
    const pc = form.postcode.trim();
    if (pc.length < 3) {
      setZone(null);
      setZoneStatus('idle');
      return;
    }
    setZoneStatus('checking');
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/zones/check?postcode=${encodeURIComponent(pc)}`);
        const data: ZoneResponse = await res.json();
        if (data.matched && data.zone) {
          setZone(data.zone);
          setZoneStatus('matched');
        } else {
          setZone(null);
          setZoneStatus('no_match');
        }
      } catch {
        setZoneStatus('idle');
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [form.postcode]);

  // If chosen method becomes invalid (COD on a no-COD zone, or any cart
  // line is COD-ineligible), bounce to card
  useEffect(() => {
    if (form.paymentMethod === 'cod' && !codAvailable) {
      setForm((f) => ({ ...f, paymentMethod: 'card' }));
    }
  }, [codAvailable, form.paymentMethod]);

  // --- Submit ---
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cartLines.length === 0) {
      toast.error('Your basket is empty.');
      router.push(siteConfig.routes.menu);
      return;
    }
    if (zoneStatus !== 'matched' || !zone) {
      toast.error('We need a deliverable postcode before we can place the order.');
      return;
    }
    if (!meetsMin) {
      toast.error(
        `Minimum order for ${zone.name} is ${formatGBP(zone.minOrderGbp)} — your basket is ${formatGBP(subtotal)}.`
      );
      return;
    }

    setSubmitting(true);
    const result = await createOrder({
      ...form,
      lines: cartLines.map((l) => ({
        menuItemId: l.menuItemId,
        slug: l.slug,
        name: l.name,
        basePriceGbp: l.basePriceGbp,
        unitPriceGbp: l.unitPriceGbp,
        quantity: l.quantity,
        variantsChosen: l.variantsChosen,
        addonsChosen: l.addonsChosen,
        specialInstructions: l.specialInstructions,
        imageSrc: l.imageSrc,
      })),
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setOrderRef(result.ref);

    if (form.paymentMethod === 'card' && result.clientSecret) {
      // Surface the Stripe PaymentElement
      setClientSecret(result.clientSecret);
    } else {
      // COD: order is placed, clear cart, redirect
      clearCart();
      router.push(`${siteConfig.routes.confirmation(result.ref)}`);
    }
  };

  // --- Loading state until cart hydrates ---
  if (!mounted) {
    return <div className="h-[600px] animate-pulse rounded-[2px] bg-cream-soft" />;
  }

  // --- Empty cart guard ---
  // Important: don't show the empty state once an order has been created
  // and we're awaiting Stripe confirmation — the user is mid-payment.
  if (cartLines.length === 0 && !clientSecret) {
    return (
      <div className="mx-auto max-w-[480px] py-[clamp(48px,8vw,96px)] text-center">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
          Empty basket
        </p>
        <h2 className="m-0 mb-3 font-serif text-[clamp(26px,3.4vw,36px)] font-medium text-walnut">
          Nothing to <em className="font-normal italic">checkout</em>.
        </h2>
        <p className="m-0 mb-7 font-serif text-[16px] italic leading-[1.5] text-ink-muted">
          Add something from today's menu first.
        </p>
        <Link
          href={siteConfig.routes.menu}
          className="inline-block rounded-[2px] bg-walnut px-7 py-3.5 font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps]"
        >
          See today's menu →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-[clamp(28px,5vw,64px)] md:grid-cols-[1.4fr_1fr]">
      <main className="min-w-0">
        <header className="mb-6">
          <h1 className="t-display-l">Almost <em>there</em></h1>
          <p className="t-body-l mt-2">Three quick steps and we'll have your order on the kitchen pass.</p>
        </header>

        {/* If a PaymentIntent was created, render Stripe Elements; otherwise the form */}
        {clientSecret && orderRef ? (
          <Elements
            stripe={getStripeClient()}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#2D1F18',
                  colorBackground: '#F1E5CD',
                  colorText: '#2D1F18',
                  colorDanger: '#8B2A1A',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSizeBase: '16px',
                  borderRadius: '2px',
                },
              },
            }}
          >
            <StripePaymentSection orderRef={orderRef} returnUrl={absoluteUrl(siteConfig.routes.confirmation(orderRef))} />
          </Elements>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* 1. Contact */}
            <Section num="01" title={<>Your <em>details</em></>}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name" name="firstName" value={form.firstName} onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} required />
                <Field label="Last name" name="lastName" value={form.lastName} onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} required />
                <Field label="Phone" sublabel="· for delivery driver" name="phone" type="tel" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} required />
                <Field label="Email" sublabel="· receipt + status updates" name="email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
              </div>
            </Section>

            {/* 2. Delivery */}
            <Section num="02" title={<>Where &amp; <em>when</em></>}>
              <div className="flex flex-col gap-4">
                {savedAddresses.length > 0 && (
                  <div>
                    <div className="mb-2 font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
                      Deliver to <small className="ml-1 font-serif text-[12px] italic tracking-normal text-ink-muted [font-variant:normal]">· your saved addresses</small>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((a) => {
                        const isActive = selectedAddressId === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => selectSavedAddress(a.id)}
                            className={`flex min-w-[180px] flex-1 cursor-pointer flex-col items-start gap-0.5 rounded-[2px] border bg-cream p-3 text-left transition-colors ${
                              isActive ? 'border-walnut bg-cream-soft' : 'border-rule hover:border-walnut'
                            }`}
                          >
                            <span className="flex w-full items-baseline justify-between gap-2">
                              <span className="font-serif text-[14px] font-medium text-walnut">
                                {a.label || 'Address'}
                              </span>
                              {a.isDefault && (
                                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-bronze-deep">
                                  Default
                                </span>
                              )}
                            </span>
                            <span className="font-serif text-[12.5px] italic leading-[1.4] text-ink-muted">
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ''} · {a.postcode}
                            </span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => selectSavedAddress(null)}
                        className={`flex min-w-[160px] cursor-pointer items-center justify-center gap-1.5 rounded-[2px] border bg-cream p-3 font-serif text-[13px] italic transition-colors ${
                          selectedAddressId === null
                            ? 'border-walnut bg-cream-soft text-walnut'
                            : 'border-dashed border-rule text-ink-muted hover:border-walnut hover:text-walnut'
                        }`}
                      >
                        + Use a different address
                      </button>
                    </div>
                  </div>
                )}
                <Field label="Street address" name="address1" value={form.address1} onChange={(v) => { setForm((f) => ({ ...f, address1: v })); setSelectedAddressId(null); }} required />
                <Field label="Flat / unit" sublabel="· optional" name="address2" value={form.address2} onChange={(v) => { setForm((f) => ({ ...f, address2: v })); setSelectedAddressId(null); }} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="City / town" name="city" value={form.city} onChange={(v) => { setForm((f) => ({ ...f, city: v })); setSelectedAddressId(null); }} required />
                  <div className="flex flex-col gap-1.5">
                    <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
                      Postcode <small className="ml-1 font-serif text-[12px] italic tracking-normal text-ink-muted [font-variant:normal]">· checks delivery</small>
                    </label>
                    <input
                      name="postcode"
                      value={form.postcode}
                      onChange={(e) => { setForm((f) => ({ ...f, postcode: e.target.value.toUpperCase() })); setSelectedAddressId(null); }}
                      required
                      placeholder="TS1 3AB"
                      className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] uppercase text-walnut outline-none transition-colors focus:border-walnut"
                    />
                  </div>
                </div>
                <ZoneBanner status={zoneStatus} zone={zone} subtotal={subtotal} postcode={form.postcode} customerForm={form} cartLines={cartLines} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
                      Delivery day
                    </label>
                    <select
                      value={form.deliveryDate}
                      onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                      required
                      className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none focus:border-walnut"
                    >
                      <option value="">Choose a date…</option>
                      {nextSevenDays().map((d) => (
                        <option key={d.iso} value={d.iso}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-1.5">
                    <label className="col-span-2 font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps] sm:col-span-1">
                      Delivery window
                    </label>
                    <select
                      value={form.deliveryWindowStart}
                      onChange={(e) => setForm((f) => ({ ...f, deliveryWindowStart: e.target.value }))}
                      className="rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none focus:border-walnut"
                    >
                      {DELIVERY_WINDOWS.map((w) => <option key={w.start} value={w.start}>{w.start}</option>)}
                    </select>
                    <select
                      value={form.deliveryWindowEnd}
                      onChange={(e) => setForm((f) => ({ ...f, deliveryWindowEnd: e.target.value }))}
                      className="rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none focus:border-walnut"
                    >
                      {DELIVERY_WINDOWS.map((w) => <option key={w.end} value={w.end}>{w.end}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
                    Notes for the kitchen / driver <small className="ml-1 font-serif text-[12px] italic tracking-normal text-ink-muted [font-variant:normal]">· optional</small>
                  </label>
                  <textarea
                    value={form.deliveryNotes}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryNotes: e.target.value }))}
                    placeholder="Buzz at the gate, leave on the porch, ring on arrival…"
                    rows={3}
                    className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[15px] italic leading-[1.55] text-walnut outline-none focus:border-walnut"
                  />
                </div>
              </div>
            </Section>

            {/* 3. Payment */}
            <Section num="03" title={<>How you'd like to <em>pay</em></>}>
              <div className="flex flex-col gap-2.5">
                <PaymentOption
                  checked={form.paymentMethod === 'card'}
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: 'card' }))}
                  title="Pay by card"
                  description="Visa, Mastercard, Amex, Apple Pay, Google Pay — handled securely by Stripe."
                  badge="Stripe"
                />
                <PaymentOption
                  checked={form.paymentMethod === 'cod'}
                  onClick={() => codAvailable && setForm((f) => ({ ...f, paymentMethod: 'cod' }))}
                  title="Cash on delivery"
                  description={
                    codAvailable
                      ? 'Pay the driver in cash when your order arrives.'
                      : !cartCodEligible
                        ? `Not available for: ${codIneligibleItems.map((l) => l.name).join(', ')}. Pay by card to keep this item.`
                        : `Not available for ${zone?.name ?? 'this zone'}.`
                  }
                  badge={codAvailable ? 'Cash' : 'Unavailable'}
                  disabled={!codAvailable}
                />
              </div>
              <p className="mt-4 text-center font-serif text-[13px] italic text-ink-muted">
                By placing your order you agree to our{' '}
                <Link href={siteConfig.routes.legal.terms} className="link-underline">Terms</Link>,{' '}
                <Link href={siteConfig.routes.legal.refund} className="link-underline">Refund Policy</Link> and{' '}
                <Link href={siteConfig.routes.legal.privacy} className="link-underline">Privacy Policy</Link>.
              </p>
            </Section>

            <button
              type="submit"
              disabled={submitting || zoneStatus !== 'matched' || !meetsMin}
              className="mt-2 w-full rounded-[2px] bg-walnut px-5 py-4 font-serif text-[15px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-50"
            >
              {submitting ? 'Placing order…' : `Place order · ${formatGBP(total)}`}
            </button>
          </form>
        )}
      </main>

      {/* Summary */}
      <aside className="sticky top-[92px]">
        <div className="rounded-[2px] border border-rule bg-cream p-6">
          <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
            <h2 className="m-0 font-serif text-[22px] font-medium text-walnut">
              Your <em className="italic font-normal">order</em>
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bronze-deep">
              {cartCount} item{cartCount === 1 ? '' : 's'}
            </span>
          </header>

          <div className="mb-4 flex flex-col gap-3 border-b border-rule pb-4">
            {cartLines.map((l) => (
              <div key={l.id} className="grid grid-cols-[44px_1fr_auto] items-start gap-3">
                <Image
                  src={l.imageSrc}
                  alt={l.name}
                  width={88}
                  height={88}
                  className="aspect-square w-11 rounded-[2px] object-cover"
                />
                <div className="min-w-0">
                  <h3 className="m-0 font-serif text-[15px] font-medium leading-tight text-walnut">{l.name}</h3>
                  {(Object.keys(l.variantsChosen).length > 0 || l.addonsChosen.length > 0) && (
                    <p className="m-0 mt-0.5 font-serif text-[12.5px] italic leading-[1.4] text-ink-muted">
                      {[
                        ...Object.entries(l.variantsChosen).map(([k, v]) => `${k}: ${v.label}`),
                        ...(l.addonsChosen.length > 0 ? [l.addonsChosen.map((a) => a.label).join(', ')] : []),
                      ].join(' · ')}
                    </p>
                  )}
                  <span className="font-mono text-[11px] text-ink-muted">× {l.quantity}</span>
                </div>
                <span className="whitespace-nowrap font-serif text-[15px] font-semibold text-walnut">
                  {formatGBP(l.unitPriceGbp * l.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <SummaryRow label="Subtotal" value={formatGBP(subtotal)} />
            <SummaryRow
              label={
                <span>
                  Delivery {zone && <em className="italic text-ink-muted">· {zone.name}</em>}
                </span>
              }
              value={zone ? formatGBP(deliveryFee) : '—'}
              muted
            />
            <SummaryRow label="Total" value={formatGBP(total)} grand />
          </div>

          <div className="text-center font-serif text-[12px] italic leading-[1.5] text-ink-muted">
            <b className="block font-medium not-italic tracking-[0.12em] text-bronze-deep [font-variant:small-caps]">
              Cooked this morning
            </b>
            Delivered hot to your door
            <br />
            Secure card payment via Stripe
          </div>
        </div>
      </aside>
    </div>
  );
}

// =========================================================================
// Helpers
// =========================================================================

const DELIVERY_WINDOWS = [
  { start: '12:00', end: '14:00' },
  { start: '14:00', end: '16:00' },
  { start: '16:00', end: '18:00' },
  { start: '18:00', end: '20:00' },
];

function nextSevenDays(): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const start = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
    if (dayName === 'Monday') continue; // closed Mondays
    const label = i === 0 ? `Today · ${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` :
                  i === 1 ? `Tomorrow · ${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` :
                  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    out.push({ iso, label });
  }
  return out;
}

function Section({ num, title, children }: { num: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[2px] border border-rule bg-cream p-6 sm:p-7">
      <header className="mb-5 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
        <h2 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
          {title}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">№ {num}</span>
      </header>
      {children}
    </section>
  );
}

function Field({
  label, sublabel, name, type = 'text', value, onChange, required, placeholder,
}: {
  label: string; sublabel?: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
        {label}
        {sublabel && (
          <small className="ml-1.5 font-serif text-[12px] italic tracking-normal text-ink-muted [font-variant:normal]">
            {sublabel}
          </small>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted"
      />
    </div>
  );
}

function PaymentOption({
  checked, onClick, title, description, badge, disabled,
}: {
  checked: boolean; onClick: () => void; title: string; description: string;
  badge: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`grid grid-cols-[auto_1fr_auto] items-start gap-4 rounded-[2px] border bg-cream p-[18px] text-left transition-colors ${
        checked
          ? 'border-walnut bg-cream-soft shadow-[inset_0_0_0_1px_var(--color-walnut)]'
          : 'border-rule hover:border-walnut'
      } ${disabled ? 'cursor-not-allowed opacity-50 hover:border-rule' : ''}`}
    >
      <span className="relative mt-1 inline-block h-5 w-5 rounded-full border border-walnut">
        {checked && <span className="absolute inset-1 rounded-full bg-walnut" />}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <h3 className="m-0 font-serif text-[17px] font-medium text-walnut">{title}</h3>
        <p className="m-0 font-serif text-[14px] italic text-ink-muted">{description}</p>
      </span>
      <span className="pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-bronze-deep">{badge}</span>
    </button>
  );
}

function SummaryRow({ label, value, muted, grand }: {
  label: React.ReactNode; value: string; muted?: boolean; grand?: boolean;
}) {
  return (
    <div className={`flex justify-between font-serif text-[15px] text-walnut ${muted ? 'italic text-ink-muted' : ''} ${grand ? 'mt-1.5 border-t border-rule pt-3 text-[20px] font-semibold not-italic text-walnut' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ZoneBanner({
  status, zone, subtotal, postcode, customerForm, cartLines,
}: {
  status: 'idle' | 'checking' | 'matched' | 'no_match';
  zone: ZoneResponse['zone'] | null;
  subtotal: number;
  postcode: string;
  customerForm: { firstName: string; lastName: string; phone: string; email: string; address1: string; address2: string; city: string };
  cartLines: ReturnType<typeof useCart.getState>['lines'];
}) {
  if (status === 'idle' || status === 'checking') return null;

  if (status === 'matched' && zone) {
    const belowMin = subtotal < zone.minOrderGbp;
    return (
      <div className={`rounded-[2px] border-l-[3px] px-4 py-3 ${belowMin ? 'border-[#8B2A1A] bg-[rgba(139,42,26,0.06)]' : 'border-bronze bg-cream-soft'}`}>
        <p className="m-0 font-serif text-[14px] text-walnut">
          {belowMin ? (
            <>Add <b className="font-medium">{formatGBP(zone.minOrderGbp - subtotal)}</b> to reach the {formatGBP(zone.minOrderGbp)} minimum for {zone.name}.</>
          ) : (
            <>We deliver to <b className="font-medium">{zone.name}</b> · <b className="font-medium">{formatGBP(zone.baseFeeGbp)}</b></>
          )}
        </p>
        {!belowMin && (
          <p className="m-0 font-serif text-[13px] italic text-ink-muted">
            Estimated {zone.prepTimeMin}–{zone.prepTimeMax} minutes from kitchen to door.
          </p>
        )}
      </div>
    );
  }

  // No match — pre-fill the WhatsApp message with full order context
  const message = encodeURIComponent([
    "Hi Hot N Nice — I'd like to place an order but my postcode appears to be outside your usual delivery area.",
    '',
    '*Delivery to*',
    `Name: ${[customerForm.firstName, customerForm.lastName].filter(Boolean).join(' ') || '[your name]'}`,
    `Phone: ${customerForm.phone || '[your phone]'}`,
    `Email: ${customerForm.email || '[your email]'}`,
    `Address: ${[customerForm.address1, customerForm.address2, customerForm.city, postcode].filter(Boolean).join(', ')}`,
    '',
    '*In my basket*',
    ...cartLines.map((l) => `• ${l.name} × ${l.quantity}`),
    '',
    `Subtotal: ${formatGBP(subtotal)} (delivery TBD)`,
    '',
    'Many thanks.',
  ].join('\n'));

  return (
    <div className="rounded-[2px] border-l-[3px] border-[#8B2A1A] bg-[rgba(139,42,26,0.06)] px-4 py-3">
      <p className="m-0 mb-1 font-serif text-[14px] font-medium text-walnut">Outside our usual delivery area</p>
      <p className="m-0 font-serif text-[13px] italic text-ink-muted">
        We don't deliver to this postcode by default — but get in touch with your order details and we may be able to arrange it.{' '}
        <a
          href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline italic"
        >
          Message us on WhatsApp →
        </a>
      </p>
    </div>
  );
}
