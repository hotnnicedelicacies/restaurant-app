import { siteConfig } from '@/constants/siteConfig';
import type { OrderView } from '@/lib/data/orders';
import { absoluteUrl, formatGBP, formatLongDate } from '@/lib/utils';

/**
 * HTML email templates for transactional order communications.
 *
 * Heritage-styled (Cormorant-ish via Georgia fallback) and email-client
 * safe — uses inline styles + tables for compatibility. No React Email
 * dependency — plain string templates for v1 simplicity.
 */

const COLOURS = {
  cream: '#F1E5CD',
  creamSoft: '#ECDFC0',
  walnut: '#2D1F18',
  inkMuted: '#4a3a2c',
  bronze: '#A56F40',
  bronzeDeep: '#7E5530',
  rule: 'rgba(45,31,24,0.18)',
};

const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const MONO = "'Geist Mono', 'SF Mono', Menlo, monospace";

function shell(args: {
  preheader: string;
  title: string;
  body: string;
}): string {
  const { preheader, title, body } = args;
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOURS.creamSoft};font-family:${SERIF};color:${COLOURS.walnut};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${COLOURS.creamSoft}">${escapeHtml(preheader)}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${COLOURS.creamSoft};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:${COLOURS.cream};border:1px solid ${COLOURS.rule};border-radius:4px;">
      <tr>
        <td style="padding:32px 32px 16px;text-align:center;">
          <a href="${absoluteUrl()}" style="text-decoration:none;color:${COLOURS.walnut};">
            <strong style="display:block;font-family:${SERIF};font-weight:500;font-size:22px;letter-spacing:-0.005em;color:${COLOURS.walnut};">${escapeHtml(siteConfig.name)}</strong>
            <span style="display:block;font-family:${MONO};font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:${COLOURS.bronzeDeep};margin-top:6px;">Middlesbrough · Est. 2019</span>
          </a>
        </td>
      </tr>
      <tr><td style="padding:8px 32px 32px;">${body}</td></tr>
      <tr>
        <td style="padding:24px 32px;border-top:1px solid ${COLOURS.rule};text-align:center;color:${COLOURS.inkMuted};font-family:${SERIF};font-size:13px;font-style:italic;line-height:1.6;">
          <div style="margin-bottom:8px;color:${COLOURS.bronzeDeep};font-style:normal;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">★ ★ ★ ★ ★&nbsp;&nbsp;Food Hygiene · FSA</div>
          ${escapeHtml(siteConfig.name)} · Middlesbrough, UK<br>
          Questions? <a href="mailto:${siteConfig.contact.email}" style="color:${COLOURS.bronzeDeep};">${siteConfig.contact.email}</a> · <a href="https://wa.me/${siteConfig.contact.whatsapp}" style="color:${COLOURS.bronzeDeep};">WhatsApp</a>
        </td>
      </tr>
    </table>
    <p style="font-family:${SERIF};font-size:11px;font-style:italic;color:${COLOURS.inkMuted};text-align:center;margin:16px auto 0;max-width:600px;">
      You're receiving this email because you placed an order with ${escapeHtml(siteConfig.name)}.
    </p>
  </td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lineItemsTable(order: OrderView): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-family:${SERIF};font-size:14px;color:${COLOURS.walnut};margin:24px 0;">
      <tr>
        <td colspan="3" style="border-bottom:1px solid ${COLOURS.walnut};padding-bottom:8px;font-family:${MONO};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${COLOURS.bronzeDeep};">
          ${order.items.length} item${order.items.length === 1 ? '' : 's'}
        </td>
      </tr>
      ${order.items
        .map((item) => {
          const variantParts: string[] = [];
          for (const [k, v] of Object.entries(item.variantsChosen ?? {})) {
            variantParts.push(`${k}: ${v.label}`);
          }
          const addonsLine =
            (item.addonsChosen ?? []).map((a) => a.label).join(', ');
          const allMeta = [...variantParts, addonsLine].filter(Boolean).join(' · ');

          return `
            <tr>
              <td style="padding:14px 0;border-bottom:1px dashed ${COLOURS.rule};">
                <div style="font-weight:500;font-size:15px;">${escapeHtml(String(item.name))}</div>
                ${allMeta ? `<div style="font-style:italic;font-size:13px;color:${COLOURS.inkMuted};margin-top:2px;">${escapeHtml(allMeta)}</div>` : ''}
                ${item.specialInstructions ? `<div style="font-style:italic;font-size:12.5px;color:${COLOURS.inkMuted};margin-top:6px;padding-left:10px;border-left:2px solid ${COLOURS.rule};">"${escapeHtml(item.specialInstructions)}"</div>` : ''}
              </td>
              <td style="text-align:center;padding:14px 12px;border-bottom:1px dashed ${COLOURS.rule};vertical-align:top;">× ${item.quantity}</td>
              <td style="text-align:right;padding:14px 0;border-bottom:1px dashed ${COLOURS.rule};vertical-align:top;font-weight:600;white-space:nowrap;">${formatGBP(item.lineTotalGbp)}</td>
            </tr>`;
        })
        .join('')}
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-family:${SERIF};font-size:14px;color:${COLOURS.walnut};margin:0 0 8px;">
      <tr><td style="padding:4px 0;">Subtotal</td><td style="padding:4px 0;text-align:right;">${formatGBP(order.subtotalGbp)}</td></tr>
      <tr><td style="padding:4px 0;font-style:italic;color:${COLOURS.inkMuted};">Delivery</td><td style="padding:4px 0;text-align:right;font-style:italic;color:${COLOURS.inkMuted};">${formatGBP(order.delivery.feeGbp)}</td></tr>
      <tr>
        <td style="padding:12px 0 0;border-top:1px solid ${COLOURS.walnut};font-size:18px;font-weight:600;">Total ${order.paymentMethod === 'cod' ? 'due on delivery' : 'paid'}</td>
        <td style="padding:12px 0 0;border-top:1px solid ${COLOURS.walnut};text-align:right;font-size:18px;font-weight:600;">${formatGBP(order.totalGbp)}</td>
      </tr>
    </table>
  `;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr><td style="background:${COLOURS.walnut};border-radius:2px;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${SERIF};font-weight:600;font-size:14px;letter-spacing:0.16em;text-transform:uppercase;color:${COLOURS.cream};text-decoration:none;font-variant:small-caps;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

// =====================================================================
// 1. Order confirmation
// =====================================================================
export function orderConfirmationEmail(order: OrderView) {
  const firstName = order.customer.firstName;
  const trackUrl = absoluteUrl(siteConfig.routes.track(order.ref));
  const receiptUrl = absoluteUrl(siteConfig.routes.receipt(order.ref));

  const paymentLine = order.paymentMethod === 'card'
    ? (order.cardBrand
      ? `Paid · ${escapeHtml(order.cardBrand)} ending ${escapeHtml(order.cardLast4 ?? '')}`
      : 'Paid · Card')
    : `Cash on delivery · ${formatGBP(order.totalGbp)} due to driver`;

  const body = `
    <p style="font-family:${MONO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${COLOURS.bronzeDeep};margin:0 0 12px;">Order received · ${formatLongDate(order.delivery.date)}</p>
    <h1 style="font-family:${SERIF};font-weight:500;font-size:36px;line-height:1.04;letter-spacing:-0.005em;color:${COLOURS.walnut};margin:0 0 12px;">
      Thank you, <em style="font-style:italic;font-weight:400;color:${COLOURS.bronzeDeep};">${escapeHtml(firstName)}.</em>
    </h1>
    <p style="font-family:${SERIF};font-size:17px;font-style:italic;line-height:1.5;color:${COLOURS.inkMuted};margin:0 0 24px;">
      Your order is in. The kitchen has it on the pass — you'll get a text when it leaves the kitchen, and another when it's at your door.
    </p>

    <p style="font-family:${MONO};font-size:12px;letter-spacing:0.2em;text-transform:uppercase;border:1px solid ${COLOURS.rule};padding:10px 16px;display:inline-block;margin:0 0 24px;">
      Order № ${escapeHtml(order.ref)}
    </p>

    ${lineItemsTable(order)}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;font-family:${SERIF};font-size:14px;color:${COLOURS.walnut};">
      <tr>
        <td valign="top" style="padding:0 12px 0 0;width:50%;">
          <div style="font-family:${MONO};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${COLOURS.bronzeDeep};margin-bottom:4px;">Delivering to</div>
          <strong>${escapeHtml(`${order.customer.firstName} ${order.customer.lastName}`)}</strong><br>
          ${escapeHtml(order.delivery.line1)}${order.delivery.line2 ? `, ${escapeHtml(order.delivery.line2)}` : ''}<br>
          ${escapeHtml(order.delivery.city)} · ${escapeHtml(order.delivery.postcode)}
        </td>
        <td valign="top" style="padding:0 0 0 12px;width:50%;">
          <div style="font-family:${MONO};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${COLOURS.bronzeDeep};margin-bottom:4px;">When</div>
          <strong>${escapeHtml(formatLongDate(order.delivery.date))}</strong><br>
          Window · ${order.delivery.windowStart.slice(0, 5)} – ${order.delivery.windowEnd.slice(0, 5)}<br>
          <em style="font-style:italic;color:${COLOURS.inkMuted};">Cooked this morning</em>
        </td>
      </tr>
    </table>

    <p style="font-family:${SERIF};font-size:14px;color:${COLOURS.walnut};margin:0 0 24px;">${paymentLine}</p>

    ${ctaButton(trackUrl, 'Track your order →')}

    <p style="font-family:${SERIF};font-size:13px;font-style:italic;color:${COLOURS.inkMuted};margin:24px 0 0;">
      Bookmark <a href="${trackUrl}" style="color:${COLOURS.bronzeDeep};">your tracking page</a> — you can check status, request changes, or cancel before we start cooking. View your <a href="${receiptUrl}" style="color:${COLOURS.bronzeDeep};">printable receipt</a> any time.
    </p>
  `;

  return {
    subject: `Order received · № ${order.ref} · ${siteConfig.name}`,
    preheader: `Thank you ${firstName} — your order is in. We'll deliver on ${formatLongDate(order.delivery.date)}.`,
    html: shell({ preheader: `Thank you ${firstName} — your order is in.`, title: 'Order received', body }),
    text: `Thank you ${firstName}.\n\nYour order ${order.ref} is in. We'll deliver on ${formatLongDate(order.delivery.date)} between ${order.delivery.windowStart} and ${order.delivery.windowEnd}.\n\nTotal: ${formatGBP(order.totalGbp)} (${order.paymentMethod === 'card' ? 'paid' : 'cash on delivery'})\n\nTrack your order: ${trackUrl}\nView your receipt: ${receiptUrl}\n\n— ${siteConfig.name}`,
  };
}

// =====================================================================
// 2. Status update (kitchen note)
// =====================================================================
export function statusUpdateEmail(order: OrderView, note: { author: string; body: string; statusLabel: string }) {
  const trackUrl = absoluteUrl(siteConfig.routes.track(order.ref));
  const body = `
    <p style="font-family:${MONO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${COLOURS.bronzeDeep};margin:0 0 12px;">
      Status update · ${escapeHtml(note.statusLabel)}
    </p>
    <h1 style="font-family:${SERIF};font-weight:500;font-size:30px;line-height:1.04;letter-spacing:-0.005em;color:${COLOURS.walnut};margin:0 0 16px;">
      A note from the <em style="font-style:italic;font-weight:400;color:${COLOURS.bronzeDeep};">kitchen</em>.
    </h1>
    <blockquote style="margin:0 0 24px;padding:18px 20px;background:${COLOURS.creamSoft};border-left:3px solid ${COLOURS.bronze};font-family:${SERIF};font-style:italic;font-size:17px;line-height:1.55;color:${COLOURS.walnut};">
      ${escapeHtml(note.body)}
    </blockquote>
    <p style="font-family:${SERIF};font-size:14px;color:${COLOURS.inkMuted};margin:0 0 24px;">
      Order № ${escapeHtml(order.ref)} · ${escapeHtml(note.author)}
    </p>
    ${ctaButton(trackUrl, 'See your order →')}
  `;
  return {
    subject: `${note.statusLabel} · Order № ${order.ref}`,
    preheader: note.body.slice(0, 100),
    html: shell({ preheader: note.body.slice(0, 100), title: note.statusLabel, body }),
    text: `Order ${order.ref}: ${note.body}\n\nTrack: ${trackUrl}`,
  };
}

// =====================================================================
// 3. Order cancelled / refunded
// =====================================================================
export function cancellationEmail(order: OrderView, reason?: string) {
  const refundLine = order.refundAmountGbp
    ? `A refund of ${formatGBP(order.refundAmountGbp)} has been issued. It typically arrives in 5–10 business days.`
    : 'No payment was taken.';

  const body = `
    <p style="font-family:${MONO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${COLOURS.bronzeDeep};margin:0 0 12px;">Order cancelled</p>
    <h1 style="font-family:${SERIF};font-weight:500;font-size:30px;line-height:1.04;color:${COLOURS.walnut};margin:0 0 16px;">
      Your order has been <em style="font-style:italic;font-weight:400;">cancelled</em>.
    </h1>
    <p style="font-family:${SERIF};font-size:16px;line-height:1.55;color:${COLOURS.walnut};margin:0 0 16px;">${escapeHtml(refundLine)}</p>
    ${reason ? `<p style="font-family:${SERIF};font-size:14px;font-style:italic;color:${COLOURS.inkMuted};margin:0 0 16px;">Reason: ${escapeHtml(reason)}</p>` : ''}
    <p style="font-family:${SERIF};font-size:14px;color:${COLOURS.inkMuted};">Order № ${escapeHtml(order.ref)}</p>
  `;
  return {
    subject: `Order cancelled · № ${order.ref}`,
    preheader: refundLine,
    html: shell({ preheader: refundLine, title: 'Order cancelled', body }),
    text: `Your order ${order.ref} has been cancelled.\n${refundLine}${reason ? `\nReason: ${reason}` : ''}`,
  };
}
