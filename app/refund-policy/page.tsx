import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';
import { getContact } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: `Refund and cancellation policy for ${siteConfig.name} — Consumer Rights Act 2015 aligned.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.legal.refund) },
  robots: { index: true, follow: true },
};

export default async function RefundPage() {
  const contact = await getContact();
  return (
    <LegalLayout
      eyebrow="Legal · Refunds & Cancellation"
      title={<>Refund <em>Policy</em></>}
      updatedLine="Last updated: 11 May 2026"
      tags={[
        { label: 'Template — for lawyer review before publication', warning: true },
        { label: 'Consumer Rights Act 2015' },
      ]}
    >
      <h2>The <em>short version</em></h2>
      <p>We want you to enjoy your food. If something goes wrong, tell us — we'll do what's fair.</p>
      <ul>
        <li><b>Cancel before we start cooking</b> → instant full refund</li>
        <li><b>Cancel after we start cooking</b> → at our discretion; contact us</li>
        <li><b>Item missing, wrong, or unsatisfactory</b> → tell us within 24 hours; we'll refund the affected item(s) or the full order depending on the issue</li>
        <li><b>Allergen / food safety issue</b> → contact us immediately; full refund + we investigate</li>
      </ul>

      <h2>1. Cancelling an <em>order</em></h2>

      <h3>1.1 Before cooking starts (status: <em>Received</em>)</h3>
      <p>You can cancel any time before the kitchen starts cooking — that's roughly the window between placing your order and 11am on the delivery day. To cancel:</p>
      <ul>
        <li>Open your order tracking page (link in your confirmation email) and click <b>Cancel order</b></li>
        <li>Or if you have an account: My account → Orders → Cancel</li>
      </ul>
      <p>A full refund is issued automatically via Stripe back to the card you paid with. It typically arrives in your bank within 5–10 business days.</p>

      <h3>1.2 After cooking starts (status: <em>Preparing</em> or later)</h3>
      <p>Once we've started cooking, we've committed ingredients and labour. We can't always refund — but contact us as soon as possible via WhatsApp on <a href={`tel:${contact.phone}`}>{contact.phone}</a> and we'll work something out. Possibilities include:</p>
      <ul>
        <li>Partial refund (e.g., we refund items we haven't started yet)</li>
        <li>Credit toward a future order</li>
        <li>In limited cases, no refund — depending on how far along the order is</li>
      </ul>
      <p>We will not unreasonably refuse a cancellation in unusual circumstances (e.g., medical emergency).</p>

      <h2>2. Something is <em>wrong</em> with your order</h2>
      <p>Tell us within <b>24 hours</b> of delivery via WhatsApp, phone or email. Send photos if relevant. Common situations:</p>

      <h3>2.1 Missing item</h3>
      <p>We refund the missing item in full. If you'd prefer, we'll re-deliver it the next available day at no extra charge.</p>

      <h3>2.2 Wrong item delivered</h3>
      <p>We refund the wrong item and re-deliver the correct one at no charge (within delivery hours that day or the next available day).</p>

      <h3>2.3 Food quality below standard</h3>
      <p>Under the Consumer Rights Act 2015, food must be of <b>satisfactory quality, fit for purpose, and as described</b>. If it's not — undercooked, cold on arrival, materially different from the description — we'll refund the affected item(s). For serious or repeated issues we may refund the entire order.</p>

      <h3>2.4 Allergen issue</h3>
      <p>If you've had an allergic reaction or believe the dish contained an allergen not listed:</p>
      <ul>
        <li>Seek medical attention first if needed</li>
        <li>Contact us immediately on <a href={`tel:${contact.phone}`}>{contact.phone}</a></li>
        <li>We will refund in full, investigate, and report to the FSA if appropriate</li>
      </ul>

      <h2>3. How <em>refunds</em> are processed</h2>

      <table>
        <thead><tr><th>Original payment method</th><th>Refund method</th><th>Typical timing</th></tr></thead>
        <tbody>
          <tr><td>Card (Stripe)</td><td>Back to the same card</td><td>5–10 business days</td></tr>
          <tr><td>Cash on Delivery</td><td>Bank transfer (we ask for sort code + account number)</td><td>3–5 business days after we receive your details</td></tr>
          <tr><td>Partial refunds</td><td>Same as above</td><td>Same as above</td></tr>
        </tbody>
      </table>

      <p>You'll receive an email confirmation when the refund is issued from our end. The actual arrival timing is set by your bank.</p>

      <h2>4. What's <em>not</em> covered</h2>
      <p>We can't refund for:</p>
      <ul>
        <li>Items that arrived as described and were of satisfactory quality, even if you changed your mind</li>
        <li>Failed delivery attempts where the customer wasn't available and no instructions were left</li>
        <li>Issues reported more than 24 hours after delivery (food spoilage after delivery is your responsibility)</li>
        <li>Cosmetic differences from the menu photo (within reason — e.g., the exact plating)</li>
      </ul>

      <h2>5. Your statutory <em>rights</em></h2>
      <p>This policy doesn't affect your statutory rights as a consumer under the <b>Consumer Rights Act 2015</b>. If you're not happy with our resolution, you can:</p>
      <ul>
        <li>Pursue a chargeback with your card issuer</li>
        <li>Refer the matter to Citizens Advice on <a href="tel:08082231133">0808 223 1133</a> or <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer">citizensadvice.org.uk</a></li>
        <li>Make a complaint to your local Trading Standards office</li>
      </ul>

      <h2>6. <em>Contact</em></h2>
      <p>For refund requests or disputes:</p>
      <ul>
        <li>WhatsApp (fastest): <a href={`https://wa.me/${contact.whatsapp}`}>{contact.whatsappDisplay}</a></li>
        <li>Email: <a href={`mailto:${contact.email}`}>{contact.email}</a></li>
        <li>Phone (kitchen hours): <a href={`tel:${contact.phone}`}>{contact.phone}</a></li>
      </ul>

      <blockquote>This document is a template prepared for the rebuild of hotnnicedelicacies.com and should be reviewed by a qualified solicitor in England &amp; Wales before publication, and aligned with the operator's actual practice.</blockquote>
    </LegalLayout>
  );
}
