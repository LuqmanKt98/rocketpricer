// Visual smoke-test for Mission Control: intercepts Base44 entity calls with
// mock data and screenshots every admin page.
// Run with the dev server up: node scripts/preview-admin.mjs
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const now = Date.now();
const DAY = 86400000;
const iso = (daysAgo, hour = 12) => new Date(now - daysAgo * DAY - hour * 3600000).toISOString();

let id = 0;
const ev = (event_type, email, name, daysAgo, data = {}) => ({
  id: `ev${++id}`,
  event_type,
  email,
  name,
  session_id: 's1',
  data,
  created_date: iso(daysAgo),
  updated_date: iso(daysAgo),
});

const people = [
  ['sarah@brandco.com', 'Sarah Chen'],
  ['james@exportify.io', 'James Miller'],
  ['olivia@purebotanics.com', 'Olivia Park'],
  ['dan@summitgear.co', 'Dan Kowalski'],
  ['mei@lunasnacks.com', 'Mei Tanaka'],
];

const events = [];
people.forEach(([email, name], i) => {
  events.push(ev('signup', email, name, 25 - i * 5));
  for (let l = 0; l < i + 1; l++) events.push(ev('login', email, name, 20 - i * 4 - l));
});
// launch attempts
events.push(ev('launch_attempt', 'sarah@brandco.com', 'Sarah Chen', 18, { result: 'stalled', prices: ['15', '22', '40', '70'], stages: ['valid', 'warning', 'invalid', 'invalid'], attempt_number: 1 }));
events.push(ev('launch_attempt', 'sarah@brandco.com', 'Sarah Chen', 17, { result: 'launched', prices: ['15', '27', '50', '100'], stages: ['valid', 'valid', 'valid', 'valid'], attempt_number: 2 }));
events.push(ev('cta_click', 'sarah@brandco.com', 'Sarah Chen', 17, { source: 'success_modal' }));
events.push(ev('launch_attempt', 'james@exportify.io', 'James Miller', 12, { result: 'stuttered', prices: ['10', '16', '28', '52'], stages: ['valid', 'warning', 'warning', 'valid'], attempt_number: 1 }));
events.push(ev('launch_attempt', 'james@exportify.io', 'James Miller', 11, { result: 'stalled', prices: ['10', '14', '24', '44'], stages: ['valid', 'invalid', 'warning', 'invalid'], attempt_number: 2 }));
events.push(ev('launch_attempt', 'james@exportify.io', 'James Miller', 10, { result: 'stalled', prices: ['10', '13', '22', '40'], stages: ['valid', 'invalid', 'invalid', 'invalid'], attempt_number: 3 }));
events.push(ev('launch_attempt', 'james@exportify.io', 'James Miller', 9, { result: 'stalled', prices: ['10', '12', '20', '36'], stages: ['valid', 'invalid', 'invalid', 'invalid'], attempt_number: 4 }));
events.push(ev('attempts_exhausted', 'james@exportify.io', 'James Miller', 9, { attempts: 4 }));
events.push(ev('cta_click', 'james@exportify.io', 'James Miller', 9, { source: 'exhausted_button' }));
events.push(ev('launch_attempt', 'olivia@purebotanics.com', 'Olivia Park', 4, { result: 'launched', prices: ['8', '15', '28', '58'], stages: ['valid', 'valid', 'valid', 'valid'], attempt_number: 1 }));
events.push(ev('launch_attempt', 'mei@lunasnacks.com', 'Mei Tanaka', 1, { result: 'stuttered', prices: ['5', '8', '14', '26'], stages: ['valid', 'warning', 'valid', 'warning'], attempt_number: 1 }));
events.push(ev('email_sent', 'sarah@brandco.com', 'Sarah Chen', 25, { email_type: 'signup', to: 'admin' }));
events.push(ev('email_sent', 'olivia@purebotanics.com', 'Olivia Park', 4, { email_type: 'login', to: 'admin' }));
events.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

const invites = [
  { id: 'inv1', email: 'olivia@purebotanics.com', name: 'Olivia Park', status: 'sent', invited_by: 'admin@rocketpricer.com', created_date: iso(16) },
  { id: 'inv2', email: 'ceo@freshbrands.com', name: null, status: 'sent', invited_by: 'admin@rocketpricer.com', created_date: iso(2) },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.route('**/entities/AnalyticsEvent**', (route) => route.fulfill({ json: events }));
await page.route('**/entities/Invite**', (route) => route.fulfill({ json: invites }));
await page.route('**/api/notify', (route) =>
  route.fulfill({ json: { resendConfigured: true, from: 'Rocket Pricer <notify@rocketpricer.com>', notifyTo: 'mike.todd@dearinassociates.com', signupAlerts: true, loginAlerts: true } })
);

// Admin signs in on the app's regular /signin page; the bootstrap credential
// kicks in after the Base44 login attempt fails.
await page.goto(`${BASE}/signin`);
await page.waitForSelector('input[type=email]');
await page.fill('input[type=email]', 'admin@rocketpricer.com');
await page.fill('input[type=password]', 'Test@123');
await page.click('button[type=submit]');
await page.waitForURL('**/admin', { timeout: 30000 });

for (const [path, name] of [
  ['/admin', 'preview-overview'],
  ['/admin/users', 'preview-users'],
  ['/admin/leads', 'preview-leads'],
  ['/admin/invites', 'preview-invites'],
  ['/admin/notifications', 'preview-notifications'],
  ['/admin/setup', 'preview-setup'],
]) {
  await page.goto(`${BASE}${path}`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  console.log(`✓ ${name}.png`);
}

await browser.close();
