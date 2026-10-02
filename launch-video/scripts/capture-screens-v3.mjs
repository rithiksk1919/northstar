// Round-3 captures: directions + route, role choice, volunteer Home, Donate.
// Usage: start the app (PORT=3456 node server.js), then `node scripts/capture-screens-v3.mjs`.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.NS_URL || 'http://localhost:3456';
const OUT = path.resolve('public/screens');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SEATTLE = { latitude: 47.6062, longitude: -122.3321 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

async function phonePage(session) {
  const ctx = await browser.createBrowserContext();
  await ctx.overridePermissions(BASE, ['geolocation']);
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.setGeolocation(SEATTLE);
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((s) => {
    localStorage.clear();
    sessionStorage.clear();
    if (s) {
      localStorage.setItem('northstar_session', JSON.stringify(s));
      localStorage.setItem('northstar_user_role', s.role);
      localStorage.setItem('northstar_location_asked', 'true');
      localStorage.setItem('northstar_last_location', JSON.stringify({ lat: 47.6062, lng: -122.3321 }));
    }
  }, session);
  return page;
}

const clean = (page) =>
  page.evaluate(() => {
    document.querySelectorAll('[id^="nate-"],[class*="nate-"]').forEach((el) => el.remove());
  });

async function shot(page, name) {
  await clean(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('captured', name);
}

async function open(page, file) {
  await page.goto(`${BASE}/${file}`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  await wait(4500);
}

// Guest sessions: signed-in sessions now need a real Supabase token (js/user-data.js), and we don't create accounts for a video.
const seeker = { username: 'Guest', role: 'seeker', isGuest: true };
const helper = { username: 'Guest', role: 'volunteer', isGuest: true };

// Directions to the shelter shown on the dashboard's "Right now" card.
{
  const page = await phonePage(seeker);
  await open(page, 'resource-map.html');
  // Tap the place card's real Directions button (the map opens on the nearest shelter).
  const tapped = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /^\s*Directions/.test(b.textContent) && b.getClientRects().length);
    btn?.click();
    return btn ? btn.closest('[class]')?.innerText.slice(0, 80) : null;
  });
  console.log('tapped directions on:', JSON.stringify(tapped));
  await wait(9000);
  await shot(page, 'map-directions');
  const info = await page.evaluate(() => document.getElementById('transit-directions-modal')?.innerText.slice(0, 400));
  console.log('directions text:', JSON.stringify(info));
  await page.evaluate(() => document.getElementById('view-on-map-route-btn')?.click());
  await wait(5000);
  await shot(page, 'map-route');
}

// Role choice (onboarding, no session).
{
  const page = await phonePage(null);
  await open(page, 'index.html');
  await page.evaluate(() => {
    document.querySelectorAll('.ob-screen').forEach((s) => (s.style.display = 'none'));
    const step = document.getElementById('onboarding-step-3');
    if (step) step.style.display = 'flex';
  });
  await wait(800);
  await shot(page, 'role');
}

// Giving side.
{
  const page = await phonePage(helper);
  await open(page, 'helper-dashboard.html');
  await shot(page, 'helper');
  await open(page, 'donate.html');
  await shot(page, 'donate');
}

await browser.close();
