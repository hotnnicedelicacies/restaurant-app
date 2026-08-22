/**
 * Run with: npx tsx lib/menu-sheet/layout.test.ts
 * (No test runner in this repo yet — plain assertions.)
 */
import assert from 'node:assert/strict';
import { layoutSheet, TIERS, type SheetCategory } from './layout';

const OPTS = { descriptions: true, bodyHeight: 2200, bodyWidth: 2200, columnGap: 120 };

function fake(categories: number, perCategory: number, descLen = 90): SheetCategory[] {
  return Array.from({ length: categories }, (_, c) => ({
    name: `Category ${c + 1}`,
    items: Array.from({ length: perCategory }, (_, i) => ({
      name: `Dish ${c + 1}.${i + 1} with a medium-length name`,
      description: 'x'.repeat(Math.max(0, descLen - 1)).replace(/x{9}/g, 'lorem ips'),
      price: 9.5 + i,
    })),
  }));
}

// 1. A short menu gets the generous single-column tier and nothing is omitted.
{
  const l = layoutSheet(fake(2, 4), OPTS);
  assert.equal(l.tier.key, 'L');
  assert.equal(l.omitted, 0);
  assert.equal(l.columns.length, 1);
  assert.equal(l.placed, 8);
}

// 2. A medium menu steps down to two columns, still fits.
{
  const l = layoutSheet(fake(4, 6), OPTS);
  assert.notEqual(l.tier.key, 'L');
  assert.equal(l.columns.length, 2);
  assert.equal(l.omitted, 0);
  assert.equal(l.placed, 24);
}

// 3. Turning descriptions off fits more at a more generous tier.
{
  const withDesc = layoutSheet(fake(4, 6), OPTS);
  const noDesc = layoutSheet(fake(4, 6), { ...OPTS, descriptions: false });
  assert.ok(
    TIERS.findIndex((t) => t.key === noDesc.tier.key) <= TIERS.findIndex((t) => t.key === withDesc.tier.key),
    'no-description layout should be at least as generous'
  );
}

// 4. An absurdly long menu is truncated honestly at the tightest tier.
{
  const l = layoutSheet(fake(12, 12), OPTS);
  assert.equal(l.tier.key, 'XS');
  assert.ok(l.omitted > 0);
  assert.equal(l.placed + l.omitted, 144);
  assert.equal(
    l.columns.reduce((n, c) => n + c.blocks.reduce((m, b) => m + b.items.length, 0), 0),
    l.placed
  );
}

// 5. Category order is preserved and a split category is flagged as continued.
{
  const l = layoutSheet(fake(3, 14, 60), { ...OPTS, descriptions: false });
  const names = l.columns.flatMap((c) => c.blocks.map((b) => b.category));
  const firstSeen = [...new Set(names)];
  assert.deepEqual(firstSeen, ['Category 1', 'Category 2', 'Category 3']);
  const continuedBlocks = l.columns.flatMap((c) => c.blocks.filter((b) => b.continued));
  for (const b of continuedBlocks) assert.ok(b.items.length > 0, 'continued blocks carry items');
  const col2First = l.columns[1]?.blocks[0];
  if (col2First && names.indexOf(col2First.category) !== names.lastIndexOf(col2First.category)) {
    assert.equal(col2First.continued, true);
  }
}

// 6b. Two-column layouts that fit are balanced: column two carries a fair share.
{
  const l = layoutSheet(fake(5, 5, 0), { ...OPTS, descriptions: false });
  assert.equal(l.omitted, 0);
  assert.equal(l.columns.length, 2);
  const count = (i: number) => l.columns[i].blocks.reduce((n, b) => n + b.items.length, 0);
  assert.ok(count(1) >= Math.floor(l.total / 3), `column two holds ${count(1)} of ${l.total} — unbalanced`);
  assert.equal(count(0) + count(1), l.total);
}

// 6. Empty categories are skipped; empty input is a valid empty sheet.
{
  const l = layoutSheet([{ name: 'Empty', items: [] }, ...fake(1, 2)], OPTS);
  assert.equal(l.columns[0].blocks[0].category, 'Category 1');
  const e = layoutSheet([], OPTS);
  assert.equal(e.total, 0);
  assert.equal(e.omitted, 0);
}

console.log('layout.test.ts: all assertions passed');
