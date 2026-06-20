// ============================================================================
// base44-export.mjs — dump your Base44 data to local JSON files.
// ----------------------------------------------------------------------------
// Reads the User / AnalyticsEvent / Invite entities from Base44 and writes them
// to ./migration/*.json. It exports whatever exists and skips (with a warning)
// any entity that is missing or unreadable — so it's safe to run even if you're
// not sure which entities are populated.
//
// Run:   npm run migrate:export
// Needs (in .env.migration):
//   BASE44_APP_ID    your app id (default below matches this project)
//   BASE44_TOKEN     an ADMIN access token (see MIGRATION.md for how to grab it)
//   BASE44_BASE_URL  optional, default https://base44.app
// ============================================================================

import { createClient } from '@base44/sdk';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const APP_ID = process.env.BASE44_APP_ID || '69c37219f83ff2b34462675d';
const TOKEN = process.env.BASE44_TOKEN;
const BASE_URL = process.env.BASE44_BASE_URL || 'https://base44.app';
const OUT_DIR = resolve(process.cwd(), 'migration');
const MAX = Number(process.env.BASE44_EXPORT_LIMIT || 50000);

if (!TOKEN) {
  console.error('✖ BASE44_TOKEN is required. See MIGRATION.md → "Get a Base44 admin token".');
  process.exit(1);
}

const base44 = createClient({
  appId: APP_ID,
  token: TOKEN,
  serverUrl: BASE_URL,
  appBaseUrl: BASE_URL,
  requiresAuth: true,
});

// Best-effort: also push the token through any setter the SDK exposes.
try { base44.auth?.setToken?.(TOKEN); } catch { /* ignore */ }

async function dump(name, entity) {
  if (!entity) {
    console.warn(`⚠ ${name}: entity not present on this app — skipped.`);
    return { name, count: 0, skipped: true };
  }
  try {
    const rows = await entity.list('-created_date', MAX);
    const data = Array.isArray(rows) ? rows : [];
    await writeFile(resolve(OUT_DIR, `${name}.json`), JSON.stringify(data, null, 2));
    console.log(`✔ ${name}: ${data.length} record(s) → migration/${name}.json`);
    return { name, count: data.length };
  } catch (err) {
    const msg = err?.message || err?.data?.detail || String(err);
    console.warn(`⚠ ${name}: could not export (${msg}) — skipped.`);
    return { name, count: 0, error: msg };
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Exporting from Base44 app ${APP_ID} (${BASE_URL})\n`);

  const results = [];
  results.push(await dump('users', base44.entities?.User));
  results.push(await dump('analytics_events', base44.entities?.AnalyticsEvent));
  results.push(await dump('invites', base44.entities?.Invite));

  await writeFile(resolve(OUT_DIR, '_export-summary.json'), JSON.stringify({ exportedAt: new Date().toISOString(), results }, null, 2));

  console.log('\nDone. Review the JSON files in ./migration before importing.');
  const total = results.reduce((n, r) => n + (r.count || 0), 0);
  if (total === 0) console.log('Note: nothing was exported — the entities may be empty or unreadable with this token.');
}

main().catch((err) => {
  console.error('Export failed:', err?.message || err);
  process.exit(1);
});
