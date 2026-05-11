#!/usr/bin/env node
/**
 * Hot N Nice · Supabase seed runner.
 *
 *   pnpm seed          # full seed (categories + items + zones + settings)
 *   pnpm seed --admin EMAIL  # flip is_admin=true on that profile
 *
 * Idempotent: re-running is safe — categories/items/zones are upserted on
 * `slug`/`name`; images skip if already in Storage; settings replace.
 *
 * Requires env vars (read from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import WebSocket from 'ws';

// Node < 22 lacks native WebSocket; Supabase JS client requires one even
// when we don't use realtime. Polyfill globally before creating the client.
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

// Load .env.local
loadEnv({ path: join(REPO_ROOT, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = 'menu-images';

// --- CLI args ---
const args = process.argv.slice(2);
const adminFlag = args.indexOf('--admin');
const adminEmail = adminFlag >= 0 ? args[adminFlag + 1] : null;
const createAdminFlag = args.indexOf('--create-admin');
const createAdminEmail = createAdminFlag >= 0 ? args[createAdminFlag + 1] : null;
const createAdminPassword = createAdminFlag >= 0 ? args[createAdminFlag + 2] : null;

// --- Helpers ---
function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

async function loadSeedData() {
  // Import the TS data through a transpile-on-the-fly path. We use the
  // pure-JS shape (no TS-only features used) by reading the file and
  // running it through a JSON-friendly subset, OR we re-state the data
  // in plain JS here. To keep one source of truth, we use tsx if available;
  // otherwise we instruct the user.
  try {
    // dynamic import — needs tsx loader for .ts
    const mod = await import('./data.ts');
    return mod;
  } catch (err) {
    console.error('✗ Could not load supabase/seed/data.ts. Make sure you run with:');
    console.error('    npx tsx supabase/seed/seed.mjs');
    console.error('  (or add `"seed": "tsx supabase/seed/seed.mjs"` to package.json scripts)');
    throw err;
  }
}

async function uploadImage(filename) {
  const localPath = join(REPO_ROOT, 'assets', 'meals', filename);
  if (!existsSync(localPath)) {
    log('  ⚠', `Image not found: ${filename}`);
    return null;
  }
  const storagePath = `meals/${filename}`;
  const buffer = readFileSync(localPath);
  const ext = filename.split('.').pop().toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : ext === 'jpeg' || ext === 'jpg' ? 'image/jpeg' : 'application/octet-stream';

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    log('  ✗', `${filename} → ${error.message}`);
    return null;
  }
  return storagePath;
}

function variantsToJson(seed) {
  if (!seed) return { groups: [] };
  return {
    groups: seed.groups.map((g) => ({
      name: g.name,
      is_required: g.isRequired,
      options: g.options.map((o) => ({
        label: o.label,
        price_delta_gbp: o.priceDeltaGbp,
      })),
    })),
  };
}

function addonsToJson(seed) {
  if (!seed) return { items: [] };
  return {
    items: seed.items.map((a) => ({
      label: a.label,
      description: a.description ?? '',
      price_delta_gbp: a.priceDeltaGbp,
    })),
  };
}

async function createAdmin(email, password) {
  log('👤', `Creating + admin-marking ${email}…`);
  // Try to create the user (auto-confirms email)
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: email.split('@')[0] },
  });

  let userId = created?.user?.id ?? null;

  if (createErr) {
    if (createErr.message.toLowerCase().includes('already')) {
      // User exists — look them up and continue to admin-flag them
      log('  ⚠', `User exists; flagging admin only.`);
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) {
        log('  ✗', error.message);
        return;
      }
      const existing = data.users.find((u) => u.email === email);
      if (!existing) {
        log('  ✗', `Could not locate existing user with email ${email}.`);
        return;
      }
      userId = existing.id;
    } else {
      log('  ✗', createErr.message);
      return;
    }
  } else {
    log('  ✓', `User created.`);
  }

  if (!userId) return;
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', userId);
  if (updateErr) {
    log('  ✗', `Could not flag is_admin: ${updateErr.message}`);
    return;
  }
  log('  ✓', `${email} is now an admin. Sign in with the password you provided.`);
}

async function seedAdmin(email) {
  log('👤', `Marking ${email} as admin…`);
  // Find the user
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    log('  ✗', error.message);
    return;
  }
  const user = data.users.find((u) => u.email === email);
  if (!user) {
    log('  ⚠', `No user found with email ${email}. Sign up first, then re-run with --admin.`);
    return;
  }
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', user.id);
  if (updateErr) {
    log('  ✗', updateErr.message);
    return;
  }
  log('  ✓', `${email} is now admin.`);
}

async function seedSettings(SETTINGS) {
  log('⚙️', 'Seeding settings…');
  for (const s of SETTINGS) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: s.key, value: s.value, updated_at: new Date().toISOString() });
    if (error) log('  ✗', `${s.key} → ${error.message}`);
    else log('  ✓', s.key);
  }
}

async function seedDeliveryZones(zones) {
  log('🚚', 'Seeding delivery zones…');
  // Wipe + reinsert (idempotent for v1; admin will manage afterwards)
  await supabase.from('delivery_zones').delete().is('archived_at', null);
  for (const z of zones) {
    const { error } = await supabase.from('delivery_zones').insert({
      name: z.name,
      postcodes: z.postcodes,
      base_fee_gbp: z.baseFeeGbp,
      min_order_gbp: z.minOrderGbp,
      prep_time_min: z.prepTimeMin,
      prep_time_max: z.prepTimeMax,
      is_quoted: z.isQuoted,
      allows_cod: z.allowsCod,
      is_active: z.isActive,
      display_order: z.displayOrder,
    });
    if (error) log('  ✗', `${z.name} → ${error.message}`);
    else log('  ✓', z.name);
  }
}

async function seedCategories(CATEGORIES) {
  log('🗂️', 'Seeding menu categories…');
  const idBySlug = new Map();
  for (const c of CATEGORIES) {
    const { data, error } = await supabase
      .from('menu_categories')
      .upsert(
        {
          name: c.name,
          slug: c.slug,
          description: c.description ?? null,
          display_order: c.displayOrder,
          is_visible: true,
        },
        { onConflict: 'slug' }
      )
      .select('id, slug')
      .single();
    if (error) {
      log('  ✗', `${c.name} → ${error.message}`);
      continue;
    }
    idBySlug.set(data.slug, data.id);
    log('  ✓', c.name);
  }
  return idBySlug;
}

async function seedItems(ITEMS, categoryIdBySlug) {
  log('🍲', 'Seeding menu items…');
  for (const it of ITEMS) {
    const categoryId = categoryIdBySlug.get(it.categorySlug);
    if (!categoryId) {
      log('  ⚠', `Skipping ${it.slug} (unknown category ${it.categorySlug})`);
      continue;
    }

    // Upload primary photo
    log('  📷', `${it.slug}: uploading photo…`);
    const primaryPath = await uploadImage(it.imageFile);

    // Upload gallery photos
    const galleryPaths = [];
    if (it.galleryFiles) {
      for (const g of it.galleryFiles) {
        const p = await uploadImage(g);
        if (p) galleryPaths.push(p);
      }
    }

    const { error } = await supabase.from('menu_items').upsert(
      {
        category_id: categoryId,
        name: it.name,
        slug: it.slug,
        description: it.description,
        long_description: it.longDescription ?? null,
        price_gbp: it.priceGbp,
        image_path: primaryPath,
        gallery_paths: galleryPaths,
        is_available_today: it.isAvailable ?? true,
        is_cod_eligible: it.isCodEligible ?? true,
        is_featured: it.isFeatured ?? false,
        is_hidden: false,
        dietary_tags: it.dietaryTags ?? [],
        allergen_tags: it.allergenTags ?? [],
        badges: it.badges ?? [],
        variants: variantsToJson(it.variants),
        addons: addonsToJson(it.addons),
        display_order: it.displayOrder,
      },
      { onConflict: 'slug' }
    );

    if (error) log('  ✗', `${it.slug} → ${error.message}`);
    else log('  ✓', it.name);
  }
}

// --- Run ---
async function main() {
  console.log('\n=== Hot N Nice · Supabase seed ===\n');

  if (createAdminEmail && createAdminPassword) {
    await createAdmin(createAdminEmail, createAdminPassword);
    return;
  }

  if (adminEmail) {
    await seedAdmin(adminEmail);
    return;
  }

  const { CATEGORIES, ITEMS, DELIVERY_ZONES, SETTINGS } = await loadSeedData();

  await seedSettings(SETTINGS);
  await seedDeliveryZones(DELIVERY_ZONES);
  const idBySlug = await seedCategories(CATEGORIES);
  await seedItems(ITEMS, idBySlug);

  console.log('\n✓ Seed complete.\n');
  console.log('Next step: mark your admin user:');
  console.log('  npm run seed -- --admin you@example.com\n');
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err);
  process.exit(1);
});
