/**
 * The printable menu sheet, as JSX for next/og (Satori).
 *
 * Satori rules: every element with more than one child must be
 * `display: flex`; only flexbox, no grid; inline styles only; font
 * families must match the names passed to ImageResponse. Sizes are
 * authored in px on an A4 @ 300 dpi canvas (2480 × 3508) and multiplied
 * by `scale` for smaller outputs — a CSS transform is NOT used because
 * Satori drops thin borders and rules under a scaled root.
 *
 * Which tier and which column gets what is decided beforehand by
 * `layoutSheet` (in full-size coordinates).
 */

import type { SheetLayout } from './layout';
import { priceLabel } from './layout';
import type { SheetMeta } from './data';
import { siteConfig } from '@/constants/siteConfig';

export const SHEET_W = 2480;
export const SHEET_H = 3508;
export const SHEET_PAD_X = 140;
export const SHEET_PAD_Y = 120;
export const MASTHEAD_H = 560;
export const FOOTER_H = 300;
export const BODY_H = SHEET_H - SHEET_PAD_Y * 2 - MASTHEAD_H - FOOTER_H;
export const BODY_W = SHEET_W - SHEET_PAD_X * 2;
export const COLUMN_GAP = 120;

const CREAM = '#F1E5CD';
const WALNUT = '#2D1F18';
const BRONZE = '#A56F40';
const BRONZE_DEEP = '#7E5530';
const INK_MUTED = '#4a3a2c';
const RULE = 'rgba(45, 31, 24, 0.22)';
const SERIF = 'Cormorant Garamond';
const MONO = 'Geist Mono';

interface Props {
  layout: SheetLayout;
  meta: SheetMeta;
  descriptions: boolean;
  /** data: URI of the logo. */
  logoSrc: string;
  /** Output scale: 1 = 300 dpi A4 (2480 × 3508); 0.5 = 150 dpi preview. Layout is unchanged. */
  scale?: number;
}

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.3l-6 3.3 1.3-6.6L2.4 9.4l6.7-.8z"
        fill={BRONZE}
      />
    </svg>
  );
}

export default function MenuSheet({ layout, meta, descriptions, logoSrc, scale = 1 }: Props) {
  const { tier } = layout;
  const colWidth = (BODY_W - COLUMN_GAP * (tier.columns - 1)) / tier.columns;
  /** Scale a full-size px value for this output. */
  const u = (n: number) => n * scale;
  /** Hairlines stay ≥1px so rules never vanish at small scales. */
  const hair = Math.max(1, Math.round(u(2)));

  return (
    <div
      style={{
        width: u(SHEET_W),
        height: u(SHEET_H),
        display: 'flex',
        flexDirection: 'column',
        background: CREAM,
        color: WALNUT,
        fontFamily: SERIF,
        padding: `${u(SHEET_PAD_Y)}px ${u(SHEET_PAD_X)}px`,
      }}
    >
      {/* Masthead */}
      <div
        style={{
          height: u(MASTHEAD_H),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders raw <img>; next/image cannot be used here */}
        <img src={logoSrc} width={u(190)} height={u(190)} alt="" style={{ objectFit: 'contain' }} />
        <div
          style={{
            marginTop: u(26),
            fontSize: u(92),
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: u(-1),
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            marginTop: u(22),
            fontFamily: MONO,
            fontSize: u(25),
            letterSpacing: u(6),
            textTransform: 'uppercase',
            color: BRONZE_DEEP,
          }}
        >
          {meta.eyebrow}
        </div>
        <div style={{ marginTop: u(26), width: u(80), height: hair, background: BRONZE }} />
        <div
          style={{
            marginTop: u(24),
            fontSize: u(34),
            fontStyle: 'italic',
            color: INK_MUTED,
          }}
        >
          {meta.sub}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          height: u(BODY_H),
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: u(COLUMN_GAP),
          overflow: 'hidden',
        }}
      >
        {layout.columns.map((column, ci) => (
          <div key={ci} style={{ width: u(colWidth), display: 'flex', flexDirection: 'column' }}>
            {column.blocks.map((block, bi) => (
              <div
                key={`${ci}-${bi}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginBottom: u(tier.gapCategory),
                }}
              >
                {/* Category heading */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    gap: u(18),
                    paddingBottom: u(10),
                    marginBottom: u(24),
                    borderBottom: `${hair}px solid ${RULE}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: u(tier.head),
                      fontWeight: 600,
                      letterSpacing: u(tier.head * 0.14),
                      textTransform: 'uppercase',
                      color: BRONZE_DEEP,
                      lineHeight: 1.2,
                    }}
                  >
                    {block.category}
                  </div>
                  {block.continued && (
                    <div
                      style={{
                        fontSize: u(tier.desc),
                        fontStyle: 'italic',
                        color: INK_MUTED,
                      }}
                    >
                      continued
                    </div>
                  )}
                </div>

                {block.items.map((item, ii) => (
                  <div
                    key={ii}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      marginBottom: u(tier.gapItem),
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: u(28),
                      }}
                    >
                      <div
                        style={{
                          fontSize: u(tier.name),
                          fontWeight: 500,
                          lineHeight: 1.22,
                          flexGrow: 1,
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: u(tier.name),
                          fontWeight: 600,
                          lineHeight: 1.22,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {priceLabel(item.price)}
                      </div>
                    </div>
                    {descriptions && item.description && (
                      <div
                        style={{
                          marginTop: u(6),
                          fontSize: u(tier.desc),
                          fontStyle: 'italic',
                          lineHeight: 1.32,
                          color: INK_MUTED,
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          height: u(FOOTER_H),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {layout.omitted > 0 && (
          <div
            style={{
              fontSize: u(30),
              fontStyle: 'italic',
              color: INK_MUTED,
              marginBottom: u(28),
            }}
          >
            {`+ ${layout.omitted} more ${layout.omitted === 1 ? 'dish' : 'dishes'} — ${meta.moreAt}`}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            borderTop: `${hair}px solid ${RULE}`,
            paddingTop: u(40),
            gap: u(80),
          }}
        >
          {meta.footer.map((col, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: u(21),
                  letterSpacing: u(5),
                  textTransform: 'uppercase',
                  color: BRONZE_DEEP,
                  marginBottom: u(14),
                }}
              >
                {col.label}
              </div>
              {col.stars ? (
                <div style={{ display: 'flex', flexDirection: 'row', gap: u(6), marginBottom: u(10) }}>
                  {Array.from({ length: col.stars }).map((_, si) => (
                    <Star key={si} size={u(30)} />
                  ))}
                </div>
              ) : null}
              {col.lines.map((line, li) => (
                <div key={li} style={{ fontSize: u(31), lineHeight: 1.4, color: WALNUT }}>
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
