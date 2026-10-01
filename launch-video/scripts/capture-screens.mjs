// Captures real Northstar screens at phone size for the launch film.
// Usage: start the app (PORT=3456 node server.js), then `node scripts/capture-screens.mjs`.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.NS_URL || 'http://localhost:3456';
const OUT = path.resolve('public/screens');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const PAGES = [
  ['companion', 'companion.html'],
  ['dashboard', 'seeker-dashboard.html'],
  ['map', 'resource-map.html'],
  ['gigs', 'opportunities.html'],
  ['resume', 'resume-builder.html'],
  ['call', 'call-shelter.html'],
];

const session = { id: 'demo-seeker', username: 'Sam', full_name: 'Sam', role: 'seeker', isGuest: false, email: 'sam@example.com' };

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const ctx = browser.defaultBrowserContext();
await ctx.overridePermissions(BASE, ['geolocation']);

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.setGeolocation({ latitude: 47.6062, longitude: -122.3321 });
await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
await page.evaluate((s) => {
  localStorage.setItem('northstar_session', JSON.stringify(s));
  localStorage.setItem('northstar_user_role', 'seeker');
  localStorage.setItem('northstar_location_asked', 'true');
  localStorage.setItem('northstar_last_location', JSON.stringify({ lat: 47.6062, lng: -122.3321 }));
  sessionStorage.removeItem('show_nate_dashboard_tour');
}, session);

for (const [name, file] of PAGES) {
  await page.goto(`${BASE}/${file}`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 5000));
  // Dismiss any onboarding overlay so the real screen shows.
  await page.evaluate(() => {
    for (const id of ['nate-tour-overlay', 'nate-tour-dim', 'nate-welcome-overlay']) document.getElementById(id)?.remove();
    document.querySelectorAll('[class*="nate-"],[id^="nate-"]').forEach((el) => el.remove());
  });
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  // A taller capture lets the film scroll inside the phone.
  const h = await page.evaluate(() => Math.min(document.documentElement.scrollHeight, 2400));
  if (h > 900) await page.screenshot({ path: path.join(OUT, `${name}-full.png`), fullPage: true });
  console.log('captured', name, h);
}
await browser.close();
