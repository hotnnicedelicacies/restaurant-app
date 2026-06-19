import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';
import { getHours } from '@/lib/data/hours';
import { getContact } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms and conditions for using ${siteConfig.name} — governed by the laws of England & Wales.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.legal.terms) },
  robots: { index: true, follow: true },
};

export default async function TermsPage() {
  const [hours, contact] = await Promise.all([getHours(), getContact()]);
  const cutoffLabel = hours.cutoffShort
    .replace(/^Order by /i, '')
    .replace(/ for same-day delivery$/i, '');
  return (
    <LegalLayout
      eyebrow="Legal · Terms"
      title={
        <>
          Terms of <em>Service</em>
        </>
      }
      updatedLine="Last updated: 13 May 2026 · Governed by the laws of England & Wales"
      tags={[
        // { label: 'Template — for lawyer review before publication', warning: true },
        { label: 'Consumer Rights Act 2015' },
        { label: 'E-Commerce Regs 2002' },
      ]}
    >
      <div className="legal-toc">
        <p className="legal-toc__title">In these terms</p>
        <ol>
          <li>
            <a href="#about">About us</a>
          </li>
          <li>
            <a href="#account">Your account</a>
          </li>
          <li>
            <a href="#orders">Placing an order</a>
          </li>
          <li>
            <a href="#prices">Prices &amp; payment</a>
          </li>
          <li>
            <a href="#delivery">Delivery</a>
          </li>
          <li>
            <a href="#cancellation">Cancellation &amp; refunds</a>
          </li>
          <li>
            <a href="#allergens">Allergens &amp; food safety</a>
          </li>
          <li>
            <a href="#liability">Liability</a>
          </li>
          <li>
            <a href="#ip">Intellectual property</a>
          </li>
          <li>
            <a href="#law">Governing law</a>
          </li>
          <li>
            <a href="#changes">Changes</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ol>
      </div>

      <h2 id="about">
        1. About <em>us</em>
      </h2>
      <p>
        These terms govern your use of <code>{siteConfig.domain}</code> and your orders placed
        through it. By using the site or placing an order, you agree to be bound by these terms. If
        you don't agree, please don't use the site.
      </p>
      <p>
        We are {siteConfig.name}, a home-kitchen meal delivery service operating from Middlesbrough,
        North Yorkshire, United Kingdom. Contact details are at the bottom of this page.
      </p>

      <h2 id="account">
        2. Your <em>account</em>
      </h2>
      <p>You don't need an account to place an order. If you create one, you agree to:</p>
      <ul>
        <li>Provide accurate, up-to-date information</li>
        <li>Keep your password confidential — you're responsible for activity on your account</li>
        <li>Tell us promptly if you suspect unauthorised access</li>
      </ul>
      <p>You must be at least 16 years old to create an account.</p>
      <p>
        <b>Closing your account.</b> You can close your account at any time from the{' '}
        <a href={siteConfig.routes.account}>account page</a>. To protect orders already in progress:
      </p>
      <ul>
        <li>
          If you have an order that is <i>received, preparing, or out for delivery</i>, you cannot
          close your account until that order is delivered or cancelled. Our kitchen and driver need
          your name, phone and delivery address to perform the contract you placed with us. UK GDPR
          (Art. 6(1)(b)) lets us keep that data for as long as it takes to fulfil the order. If you
          want to cancel the order first, message us on WhatsApp.
        </li>
        <li>
          Once all your orders are delivered or cancelled, closing your account will: scrub your
          profile details (name, phone, marketing preferences), delete your saved addresses,
          anonymise the personal details on your historical orders (name, email, phone and delivery
          address are replaced), and revoke your sign-in.
        </li>
        <li>
          We keep the <i>line items, amounts and order references</i> on closed accounts for at
          least six years so we can meet HMRC VAT record-keeping obligations. These records are no
          longer linked to you personally.
        </li>
        <li>
          Closing your account is not reversible — if you change your mind you'll need to sign up
          from scratch.
        </li>
      </ul>

      <h2 id="orders">
        3. Placing an <em>order</em>
      </h2>
      <p>
        When you place an order, you're making us an offer to buy the items in your basket. We
        accept your offer when we send you the order confirmation email — at that point a binding
        contract is formed between you and us.
      </p>
      <p>We may refuse an order at our discretion — for example if:</p>
      <ul>
        <li>An item has unexpectedly sold out</li>
        <li>The delivery address is outside our service area</li>
        <li>We suspect fraud</li>
        <li>The kitchen is closed for the day</li>
      </ul>
      <p>If we can't fulfil your order we'll refund you in full and let you know why.</p>

      <h2 id="prices">
        4. Prices &amp; <em>payment</em>
      </h2>
      <p>
        All prices are in pounds sterling (£) and include VAT where applicable. Delivery fees are
        shown at checkout before you pay.
      </p>
      <p>We accept payment by:</p>
      <ul>
        <li>
          <b>Card</b> — handled securely by Stripe. We never see or store your card details.
        </li>
        <li>
          <b>Cash on Delivery</b> — where the item allows it and the delivery zone permits it.
          Payable in pounds sterling cash to the driver. Please have correct change where possible.
        </li>
      </ul>
      <p>
        If a price is obviously wrong (e.g., a £25 lasagna listed at £2.50 by mistake), we may
        cancel the order and refund you — we'll let you know before the kitchen starts cooking.
      </p>

      <h2 id="delivery">
        5. <em>Delivery</em>
      </h2>
      <p>
        We deliver {hours.daysLong} between {hours.timeLong} to postcodes within our zones (see{' '}
        <a href={siteConfig.routes.contact}>Contact</a> for current zones). Orders placed before{' '}
        {cutoffLabel} are eligible for same-day delivery; later orders go onto the next available
        day&apos;s list.
      </p>
      <p>
        Delivery times shown at checkout are estimates. We do our best to hit them, but kitchen
        volume, weather, or traffic can cause delays. If we're going to be substantially late, we'll
        text or call.
      </p>
      <p>
        Risk in the food passes to you on delivery. Please refrigerate promptly if you're not eating
        immediately.
      </p>

      <h2 id="cancellation">
        6. Cancellation &amp; <em>refunds</em>
      </h2>
      <p>
        Under the Consumer Contracts Regulations 2013, perishable goods (which includes prepared hot
        food) are <b>exempt from the 14-day right of withdrawal</b>. However, we operate the
        following voluntary cancellation policy:
      </p>
      <ul>
        <li>
          <b>Before the kitchen starts cooking</b> (status: Received): cancel from your order
          tracking page — instant full refund
        </li>
        <li>
          <b>After cooking has started</b> (status: Preparing or later): contact us via WhatsApp —
          we'll do our best but a refund may not be possible if ingredients are committed
        </li>
      </ul>
      <p>
        If something is wrong with your order (missing item, food not as described, allergen
        concern), contact us within 24 hours of delivery and we'll make it right.
      </p>
      <p>
        Full details in our <a href={siteConfig.routes.legal.refund}>Refund Policy</a>.
      </p>

      <h2 id="allergens">
        7. Allergens &amp; food <em>safety</em>
      </h2>
      <p>
        We hold a <b>5-star Food Hygiene Rating</b> from the UK Food Standards Agency. Each menu
        item lists known allergens (gluten, dairy, nuts, seafood, etc.) — please check before
        ordering.
      </p>
      <p>
        Our kitchen is not allergen-free. We handle wheat, dairy, eggs, fish, shellfish, peanuts and
        other tree nuts on shared equipment. Trace cross-contact is possible. If you have a serious
        allergy, please contact us before ordering so we can advise.
      </p>
      <p>
        You're responsible for verifying that listed allergen information meets your needs. We are
        not liable for allergic reactions caused by ingredients clearly listed in the item
        description.
      </p>

      <h2 id="liability">
        8. <em>Liability</em>
      </h2>
      <p>Nothing in these terms limits or excludes our liability for:</p>
      <ul>
        <li>Death or personal injury caused by our negligence</li>
        <li>Fraud or fraudulent misrepresentation</li>
        <li>
          Any breach of your statutory rights as a consumer under the Consumer Rights Act 2015
          (including the right to goods of satisfactory quality, fit for purpose, and as described)
        </li>
        <li>Any other liability that cannot be lawfully excluded</li>
      </ul>
      <p>
        Subject to that, our total liability to you in connection with any order is limited to the
        amount you paid for that order.
      </p>

      <h2 id="ip">
        9. Intellectual <em>property</em>
      </h2>
      <p>
        The site content (photography, copy, branding, layout) is owned by {siteConfig.name} or
        licensed to us. You may not copy, reproduce, or use it commercially without our written
        permission. Personal, non-commercial use is fine.
      </p>

      <h2 id="law">
        10. Governing <em>law</em>
      </h2>
      <p>
        These terms are governed by the laws of England and Wales. Any disputes will be resolved in
        the courts of England and Wales, subject to your statutory consumer rights.
      </p>

      <h2 id="changes">
        11. <em>Changes</em>
      </h2>
      <p>
        We may update these terms from time to time. The current version is always at this URL with
        the "Last updated" date at the top. Material changes will be communicated by email to
        account holders at least 14 days before they take effect. Orders placed under previous terms
        are governed by the terms in force at the time of the order.
      </p>

      <h2 id="contact">
        12. <em>Contact</em>
      </h2>
      <p>Questions, complaints, or feedback:</p>
      <ul>
        <li>
          Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          Phone / WhatsApp: <a href={`tel:${contact.phone}`}>{contact.phone}</a>
        </li>
        <li>Post: {siteConfig.name}, Middlesbrough, UK</li>
      </ul>

      {/* <blockquote>This document is a template prepared for the rebuild of hotnnicedelicacies.com and should be reviewed by a qualified solicitor in England &amp; Wales before publication.</blockquote> */}
    </LegalLayout>
  );
}
