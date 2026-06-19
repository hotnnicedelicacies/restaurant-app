import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';
import { getContact } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${siteConfig.name} collects, uses and protects your personal data — UK GDPR + Data Protection Act 2018 compliant.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.legal.privacy) },
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const contact = await getContact();
  return (
    <LegalLayout
      eyebrow="Legal · Privacy"
      title={
        <>
          Privacy <em>Policy</em>
        </>
      }
      updatedLine="Last updated: 11 May 2026 · UK GDPR · Data Protection Act 2018"
      tags={[
        // { label: 'Template — for lawyer review before publication', warning: true },
        { label: 'UK GDPR + Data Protection Act 2018' },
        { label: 'PECR 2003' },
      ]}
    >
      <div className="legal-toc">
        <p className="legal-toc__title">In this policy</p>
        <ol>
          <li>
            <a href="#who">Who we are</a>
          </li>
          <li>
            <a href="#what">What data we collect</a>
          </li>
          <li>
            <a href="#why">Why &amp; how we use it</a>
          </li>
          <li>
            <a href="#share">Who we share with</a>
          </li>
          <li>
            <a href="#keep">How long we keep it</a>
          </li>
          <li>
            <a href="#rights">Your rights</a>
          </li>
          <li>
            <a href="#cookies">Cookies</a>
          </li>
          <li>
            <a href="#children">Children's data</a>
          </li>
          <li>
            <a href="#international">International transfers</a>
          </li>
          <li>
            <a href="#changes">Changes to this policy</a>
          </li>
          <li>
            <a href="#contact">Contact us</a>
          </li>
        </ol>
      </div>

      <h2 id="who">
        1. Who we <em>are</em>
      </h2>
      <p>
        {siteConfig.name} ("<b>we</b>", "<b>us</b>", "<b>our</b>") is a home-kitchen meal delivery
        service operating from Middlesbrough, North Yorkshire, United Kingdom. We are the{' '}
        <b>data controller</b> for the personal information described in this policy.
      </p>
      <p>Our registered contact for data protection matters is:</p>
      <ul>
        <li>
          Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          Phone: <a href={`tel:${contact.phone}`}>{contact.phone}</a>
        </li>
        <li>Post: {siteConfig.name}, Middlesbrough, UK</li>
      </ul>

      <h2 id="what">
        2. What data we <em>collect</em>
      </h2>
      <p>We collect the minimum we need to run the kitchen. Specifically:</p>

      <h3>2.1 When you place an order</h3>
      <ul>
        <li>
          <b>Contact details</b> — your name, phone number, email address
        </li>
        <li>
          <b>Delivery address</b> — street, flat, city, postcode
        </li>
        <li>
          <b>Order contents</b> — items, variants, add-ons, special instructions
        </li>
        <li>
          <b>Payment data</b> — handled by Stripe (we never see your card number). We store the last
          four digits and card brand for reconciliation
        </li>
      </ul>

      <h3>2.2 When you create an account</h3>
      <ul>
        <li>Your email address, password (stored hashed — never in plain text), display name</li>
        <li>Saved addresses (you choose what to save)</li>
        <li>Order history (linked from orders above)</li>
      </ul>

      <h3>2.3 Technical data (everyone)</h3>
      <ul>
        <li>IP address (abuse prevention, never sold or shared for advertising)</li>
        <li>Browser type, device type, referring page</li>
        <li>
          Strictly necessary cookies — see our{' '}
          <a href={siteConfig.routes.legal.cookies}>Cookie Notice</a>
        </li>
      </ul>

      <h3>
        2.4 What we do <em>not</em> collect
      </h3>
      <ul>
        <li>We do not collect financial data beyond what Stripe handles</li>
        <li>We do not use third-party analytics or advertising trackers at this time</li>
        <li>We do not track customers across other websites</li>
      </ul>

      <h2 id="why">
        3. Why &amp; how we <em>use</em> your data
      </h2>
      <p>UK GDPR requires us to have a lawful basis for each processing activity. Ours are:</p>

      <table>
        <thead>
          <tr>
            <th style={{ width: '40%' }}>What we do with it</th>
            <th>Lawful basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fulfil and deliver your order</td>
            <td>Contract (Article 6(1)(b))</td>
          </tr>
          <tr>
            <td>Send transactional emails (confirmation, status, receipt)</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Maintain your account, saved addresses, order history</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Take payment via Stripe</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Comply with tax, accounting, and food-safety law</td>
            <td>Legal obligation (Article 6(1)(c))</td>
          </tr>
          <tr>
            <td>Prevent fraud and abuse, protect the site</td>
            <td>Legitimate interest (Article 6(1)(f))</td>
          </tr>
          <tr>
            <td>Communicate about your order via phone, WhatsApp, or email</td>
            <td>Contract / legitimate interest</td>
          </tr>
        </tbody>
      </table>

      <p>
        We do <b>not</b> use your data for marketing without your explicit opt-in. We don't sell,
        rent, or trade your data to anyone.
      </p>

      <h2 id="share">
        4. Who we <em>share</em> with
      </h2>
      <p>
        We use a small number of trusted third-party processors. Each is contractually bound to
        handle your data per UK GDPR.
      </p>

      <table>
        <thead>
          <tr>
            <th>Processor</th>
            <th>What they do</th>
            <th>Where</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>Stripe Payments UK Ltd</b>
            </td>
            <td>Process card payments</td>
            <td>UK / EU</td>
          </tr>
          <tr>
            <td>
              <b>Supabase Inc</b>
            </td>
            <td>Database, file storage, authentication</td>
            <td>EU (region: London)</td>
          </tr>
          <tr>
            <td>
              <b>Vercel Inc</b>
            </td>
            <td>Website hosting</td>
            <td>UK / EU edge</td>
          </tr>
          <tr>
            <td>
              <b>Resend Inc</b>
            </td>
            <td>Send order-related emails</td>
            <td>EU</td>
          </tr>
          <tr>
            <td>
              <b>Our delivery driver(s)</b>
            </td>
            <td>Receive name, phone, address to deliver your order</td>
            <td>UK</td>
          </tr>
        </tbody>
      </table>

      <p>
        We may also share data when legally compelled — e.g., a court order, tax inspection, or
        regulatory request from the Food Standards Agency, HMRC, or the ICO.
      </p>

      <h2 id="keep">
        5. How long we <em>keep</em> it
      </h2>
      <ul>
        <li>
          <b>Order records (incl. customer name on the order):</b> 6 years from the order date —
          required by HMRC for tax records
        </li>
        <li>
          <b>Invoices:</b> 6 years (same)
        </li>
        <li>
          <b>Account data (email, password, addresses):</b> until you ask us to delete it, or 2
          years after your last order, whichever comes first
        </li>
        <li>
          <b>Marketing preferences:</b> until you opt out
        </li>
        <li>
          <b>Server logs:</b> 30 days
        </li>
        <li>
          <b>Stripe payment records:</b> retained by Stripe per their policy (typically 7 years)
        </li>
      </ul>

      <h2 id="rights">
        6. Your <em>rights</em>
      </h2>
      <p>
        Under UK GDPR you have the following rights — exercise any of them by emailing{' '}
        <a href={`mailto:${contact.email}`}>{contact.email}</a>. We'll respond within{' '}
        <b>one calendar month</b>.
      </p>
      <ul>
        <li>
          <b>Right to be informed</b> — this policy is that
        </li>
        <li>
          <b>Right of access</b> — request a copy of your personal data we hold
        </li>
        <li>
          <b>Right to rectification</b> — correct anything inaccurate
        </li>
        <li>
          <b>Right to erasure ("right to be forgotten")</b> — delete your account and personal data;
          tax-record requirements may mean some order data is retained but anonymised
        </li>
        <li>
          <b>Right to restrict processing</b> — pause our use of your data
        </li>
        <li>
          <b>Right to data portability</b> — request your data in a machine-readable format (we
          provide CSV or JSON)
        </li>
        <li>
          <b>Right to object</b> — to processing based on legitimate interest
        </li>
        <li>
          <b>Rights related to automated decision-making</b> — we don't make automated decisions
          about you
        </li>
      </ul>

      <p>
        If you're not satisfied with our response, you can complain to the{' '}
        <b>Information Commissioner's Office (ICO)</b>:
      </p>
      <ul>
        <li>
          Web:{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
            ico.org.uk
          </a>
        </li>
        <li>Helpline: 0303 123 1113</li>
      </ul>

      <h2 id="cookies">
        7. <em>Cookies</em>
      </h2>
      <p>
        We use a small number of cookies that are strictly necessary for the site to work (e.g., to
        keep your shopping cart together, to remember you're signed in). We don't use advertising or
        cross-site tracking cookies. Full details in our{' '}
        <a href={siteConfig.routes.legal.cookies}>Cookie Notice</a>.
      </p>

      <h2 id="children">
        8. <em>Children's</em> data
      </h2>
      <p>
        This site isn't aimed at children under 16. We don't knowingly collect personal data from
        anyone under 16. If you believe a child has provided us with personal data, contact us and
        we'll delete it.
      </p>

      <h2 id="international">
        9. International <em>transfers</em>
      </h2>
      <p>
        Our infrastructure is hosted in the UK and EU. Some processors (notably Stripe and Vercel)
        may transfer data to the US under <b>UK International Data Transfer Agreements</b> or{' '}
        <b>EU Standard Contractual Clauses</b>, which provide an adequate level of protection.
        Stripe is certified under the EU-US Data Privacy Framework.
      </p>

      <h2 id="changes">
        10. Changes to this <em>policy</em>
      </h2>
      <p>
        If we make material changes we'll email account holders at least 14 days before they take
        effect. The "Last updated" date at the top always reflects the current version.
      </p>

      <h2 id="contact">
        11. <em>Contact</em>
      </h2>
      <p>For privacy questions, data subject access requests, or any other concerns:</p>
      <ul>
        <li>
          Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          Phone: <a href={`tel:${contact.phone}`}>{contact.phone}</a>
        </li>
        <li>Post: {siteConfig.name}, Middlesbrough, UK</li>
      </ul>

      {/* <blockquote>This document is a template prepared for the rebuild of hotnnicedelicacies.com and should be reviewed by a qualified solicitor in England &amp; Wales before publication. Specific operational details (retention periods, sub-processor list, registered address) should be verified against actual practice.</blockquote> */}
    </LegalLayout>
  );
}
