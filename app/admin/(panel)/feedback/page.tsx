import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import { isGoogleReviewConfigured } from '@/lib/review/google';
import { REVIEW_SOURCES, REVIEW_SOURCE_LABELS, type ReviewSource } from '@/lib/review/source';
import { siteConfig } from '@/constants/siteConfig';
import FeedbackTable, { type FeedbackRow } from './FeedbackTable';

export const dynamic = 'force-dynamic';

type View = 'open' | 'handled' | 'all';

const VIEWS: { value: View; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'handled', label: 'Handled' },
  { value: 'all', label: 'All' },
];

const WINDOW_DAYS = 30;

function windowStart(): string {
  return new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  const view: View = sp.view === 'handled' || sp.view === 'all' ? sp.view : 'open';

  const supabase = getServiceClient();
  const since = windowStart();

  let listQuery = supabase
    .from('feedback')
    .select('id, created_at, src, message, name, contact, handled, handled_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (view === 'open') listQuery = listQuery.eq('handled', false);
  if (view === 'handled') listQuery = listQuery.eq('handled', true);

  const [{ data: list, error }, { data: flags }, { data: events }] = await Promise.all([
    listQuery,
    supabase.from('feedback').select('handled'),
    supabase.from('review_events').select('event, src').gte('created_at', since),
  ]);

  const counts = { open: 0, handled: 0, all: (flags ?? []).length };
  for (const f of flags ?? []) {
    if (f.handled) counts.handled += 1;
    else counts.open += 1;
  }

  // 30-day funnel, overall and by QR source.
  type Funnel = { view: number; google_click: number; feedback_submit: number };
  const empty = (): Funnel => ({ view: 0, google_click: 0, feedback_submit: 0 });
  const total = empty();
  const bySource = Object.fromEntries(REVIEW_SOURCES.map((s) => [s, empty()])) as Record<
    ReviewSource,
    Funnel
  >;
  for (const e of events ?? []) {
    total[e.event] += 1;
    bySource[e.src][e.event] += 1;
  }
  const clickRate = total.view > 0 ? Math.round((total.google_click / total.view) * 100) : null;
  const activeSources = REVIEW_SOURCES.filter(
    (s) => bySource[s].view + bySource[s].google_click + bySource[s].feedback_submit > 0
  );

  const rows: FeedbackRow[] = (list ?? []).map((f) => ({
    id: f.id,
    createdAt: f.created_at,
    src: f.src,
    message: f.message,
    name: f.name,
    contact: f.contact,
    handled: f.handled,
    handledAt: f.handled_at,
  }));

  const googleOn = isGoogleReviewConfigured();

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">The Reader&apos;s Column · last {WINDOW_DAYS} days</div>
          <h1 className="admin-page-head__title">
            Customer <em>feedback</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <a
            href={`${siteConfig.routes.review}?src=site`}
            target="_blank"
            rel="noopener noreferrer"
            className="receipt-btn"
          >
            View the review page →
          </a>
        </div>
      </div>

      {error && (
        <div className="warning-banner">
          <BannerIcon />
          <div className="warning-banner__content">
            <h3 className="warning-banner__title">Couldn&apos;t load feedback</h3>
            <p className="warning-banner__body">{error.message}</p>
          </div>
        </div>
      )}

      {!googleOn && (
        <div className="warning-banner">
          <BannerIcon />
          <div className="warning-banner__content">
            <h3 className="warning-banner__title">Google review card is not live yet</h3>
            <p className="warning-banner__body">
              The review page currently shows only the private-feedback form. Once the Google
              Business Profile is approved, set <b>GOOGLE_REVIEW_URL</b> (or{' '}
              <b>GOOGLE_PLACE_ID</b>) in the hosting environment and redeploy —{' '}
              <em>the QR codes don&apos;t need reprinting.</em>
            </p>
          </div>
        </div>
      )}

      <div className="admin-stats">
        <Stat
          label="Open feedback"
          value={String(counts.open)}
          sub={counts.open === 1 ? 'awaiting a reply' : 'awaiting replies'}
          tone={counts.open > 0 ? 'danger' : undefined}
        />
        <Stat label="Page views" value={String(total.view)} sub="QR scans + link opens (approx.)" />
        <Stat
          label="Google clicks"
          value={String(total.google_click)}
          sub={clickRate === null ? 'no views yet' : `${clickRate}% of views`}
        />
        <Stat
          label="Sent to kitchen"
          value={String(total.feedback_submit)}
          sub="private messages"
        />
      </div>

      <div className="admin-toolbar">
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={v.value === 'open' ? '/admin/feedback' : `/admin/feedback?view=${v.value}`}
            className={`admin-filter ${view === v.value ? 'is-active' : ''}`}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            {v.label}
            {counts[v.value] > 0 && <span className="admin-filter__count">{counts[v.value]}</span>}
          </Link>
        ))}
      </div>

      <FeedbackTable rows={rows} view={view} />

      <p className="t-body-muted" style={{ marginTop: 16, textAlign: 'center' }}>
        Showing {rows.length} {rows.length === 1 ? 'message' : 'messages'} ·{' '}
        {VIEWS.find((v) => v.value === view)?.label.toLowerCase()}
      </p>

      {/* Where the scans come from */}
      <div style={{ marginTop: 40 }}>
        <div className="admin-page-head" style={{ marginBottom: 12 }}>
          <div className="admin-page-head__text">
            <div className="admin-page-head__eyebrow">By source · last {WINDOW_DAYS} days</div>
            <h2 className="admin-page-head__title" style={{ fontSize: 'clamp(22px, 2.6vw, 28px)' }}>
              Which <em>sticker</em> gets scanned
            </h2>
          </div>
        </div>
        {activeSources.length === 0 ? (
          <div className="admin-table-wrap" style={{ padding: '32px 16px', textAlign: 'center' }}>
            <p className="t-body-muted" style={{ margin: 0 }}>
              No activity yet. Once the QR codes are out, each source appears here.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Views</th>
                  <th>Google clicks</th>
                  <th>Click-through</th>
                  <th>Sent to kitchen</th>
                </tr>
              </thead>
              <tbody>
                {activeSources.map((s) => {
                  const f = bySource[s];
                  const rate = f.view > 0 ? `${Math.round((f.google_click / f.view) * 100)}%` : '—';
                  return (
                    <tr key={s}>
                      <td>
                        <div className="admin-table__ref">{REVIEW_SOURCE_LABELS[s]}</div>
                        <div className="admin-table__time">?src={s}</div>
                      </td>
                      <td>{f.view}</td>
                      <td>{f.google_click}</td>
                      <td>{rate}</td>
                      <td>{f.feedback_submit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="t-body-muted" style={{ marginTop: 12 }}>
          Views are approximate — WhatsApp and email clients fetch links to build previews, which
          counts as a view. Clicks and messages are real people.
        </p>
      </div>
    </>
  );
}

function BannerIcon() {
  return (
    <svg
      className="warning-banner__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'danger';
}) {
  return (
    <div className="admin-stat">
      <div className="admin-stat__label">{label}</div>
      <div
        className="admin-stat__value"
        style={tone === 'danger' ? { color: '#8B2A1A' } : undefined}
      >
        {value}
      </div>
      {sub && <div className="admin-stat__delta">{sub}</div>}
    </div>
  );
}
