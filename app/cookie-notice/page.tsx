import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';
import { getContact } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Cookie Notice',
  description: `What cookies ${siteConfig.name} uses and why — UK PECR + GDPR compliant.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.legal.cookies) },
  robots: { index: true, follow: true },
};

export default async function CookieNoticePage() {
  const contact = await getContact();
  return (
    <LegalLayout
      eyebrow="Legal · Cookies"
      title={
        <>
          Cookie <em>Notice</em>
        </>
      }
      updatedLine="Last updated: 11 May 2026 · PECR 2003 + UK GDPR"
      tags={[
        // { label: 'Template — for lawyer review before publication', warning: true },
        { label: 'PECR 2003' },
        { label: 'ICO Cookie Guidance' },
      ]}
    >
      <h2>
        The <em>short version</em>
      </h2>
      <p>
        We use a small number of cookies — only what's needed for the site to work (cart, sign-in,
        payment). We don't use advertising cookies. We don't track you across other websites.
        There's no analytics in v1.
      </p>

      <h2>
        1. What is a <em>cookie?</em>
      </h2>
      <p>
        A cookie is a small text file your browser stores when you visit a website. It lets the site
        remember things between page loads — like keeping items in your basket, or knowing you're
        signed in. Some cookies are essential; others are optional and tracking-related.
      </p>

      <h2>
        2. What we <em>use</em>
      </h2>

      <h3>
        2.1 Strictly necessary cookies <code>No consent needed</code>
      </h3>
      <p>
        Required for the site to function. You can't opt out and still order — turning these off
        would break the basket and login.
      </p>

      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>What it does</th>
            <th>Lifetime</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>hnn_session</code>
            </td>
            <td>Your shopping basket — keeps items together between pages</td>
            <td>Session (deleted when you close the browser)</td>
          </tr>
          <tr>
            <td>
              <code>hnn_auth</code>
            </td>
            <td>Keeps you signed in to your account if you tick "Keep me signed in"</td>
            <td>30 days</td>
          </tr>
          <tr>
            <td>
              <code>hnn_csrf</code>
            </td>
            <td>Cross-site request forgery protection — security</td>
            <td>Session</td>
          </tr>
          <tr>
            <td>
              <code>__stripe_mid</code> / <code>__stripe_sid</code>
            </td>
            <td>Set by Stripe to prevent payment fraud (Stripe's domain, not ours)</td>
            <td>1 year / 30 minutes</td>
          </tr>
          <tr>
            <td>
              <code>hnn_consent</code>
            </td>
            <td>Remembers your cookie banner choice so we don't ask again</td>
            <td>1 year</td>
          </tr>
        </tbody>
      </table>

      <h3>
        2.2 Functional cookies <code>Consent based</code>
      </h3>
      <p>
        Help us remember your preferences. Currently <b>none in use</b> — we'll list any we add and
        ask for your consent first.
      </p>

      <h3>
        2.3 Analytics cookies <code>Consent based</code>
      </h3>
      <p>
        Currently <b>none in use</b>. We're not using Google Analytics, Plausible, Fathom, or any
        similar tool at this time. If we add analytics in future, we'll update this notice and ask
        for your consent.
      </p>

      <h3>
        2.4 Advertising / tracking cookies <code>We don't use any</code>
      </h3>
      <p>
        We don't run ads, retarget you across other sites, or share data with advertising platforms.
        There are no Facebook pixels, Google Ads tags, or similar trackers.
      </p>

      <h2>
        3. Your <em>controls</em>
      </h2>

      <h3>3.1 The cookie banner</h3>
      <p>
        When you first visit, you'll see a banner explaining what we use. Because we currently use
        only strictly-necessary cookies, the banner is informational — there's nothing to opt out
        of. If we add optional cookies in future, the banner will offer you a real choice (Accept /
        Reject / Manage) before any optional cookies are set.
      </p>

      <h3>3.2 Browser controls</h3>
      <p>
        You can block all cookies via your browser settings. Note that this will break the basket
        and sign-in — you won't be able to order. Instructions for major browsers:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
            target="_blank"
            rel="noopener noreferrer"
          >
            Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari (Mac)
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
            target="_blank"
            rel="noopener noreferrer"
          >
            Edge
          </a>
        </li>
      </ul>

      <h2>
        4. Third-party <em>cookies</em>
      </h2>
      <p>
        When you pay via Stripe, Stripe sets its own cookies on its iframe (which we embed for the
        card payment form). These are on Stripe's domain, not ours, and are governed by Stripe's
        privacy policy. We have no access to them.
      </p>

      <h2>
        5. <em>Changes</em>
      </h2>
      <p>
        If we add new cookies (especially analytics or any optional category), we'll update this
        page and re-show the consent banner so you can opt in or out before they're set.
      </p>

      <h2>
        6. <em>Contact</em>
      </h2>
      <p>Questions about cookies, or want to revoke a consent decision?</p>
      <ul>
        <li>
          Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          Or refer to our <a href={siteConfig.routes.legal.privacy}>Privacy Policy</a> for your full
          data rights
        </li>
      </ul>

      {/* <blockquote>This document is a template prepared for the rebuild of hotnnicedelicacies.com and should be reviewed against the live implementation before publication. If analytics or marketing tools are added later, the cookie inventory must be updated and a Consent Management Platform may be required.</blockquote> */}
    </LegalLayout>
  );
}
