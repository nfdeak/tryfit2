import puppeteer from 'puppeteer';
import { setTimeout as sleep } from 'timers/promises';
import path from 'path';

const DIR = './screenshots';
const BASE = 'http://localhost:5173';
let n = 1;

async function shot(page, name, waitMs = 500) {
  await sleep(waitMs);
  const file = path.join(DIR, `${String(n).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  saved ${file}`);
  n++;
}

async function scrollAndShot(page, name) {
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, name, 800);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], protocolTimeout: 60000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });

  // 1. Login screen
  console.log('1. Login screen');
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await shot(page, 'login-screen');

  // 2. Login with credentials
  console.log('2. Logging in...');
  await page.type('input[placeholder="harshit"]', 'harshit');
  await page.type('input[type="password"]', 'harshit123');
  await shot(page, 'login-filled');

  // 3. Click sign in
  await page.click('button[type="submit"]');
  await sleep(2000);
  await shot(page, 'meals-tab-monday', 1000);

  // 4. Scroll down on meals
  console.log('3. Meals tab scrolled');
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 'meals-tab-scrolled');

  // 5. Click Tuesday
  console.log('4. Tuesday tab');
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 0;
  });
  const dayBtns = await page.$$('button');
  for (const btn of dayBtns) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text === 'Tue') { await btn.click(); break; }
  }
  await shot(page, 'meals-tab-tuesday');

  // 6. Tracker tab
  console.log('5. Tracker tab');
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Tracker')) { await btn.click(); break; }
  }
  await shot(page, 'tracker-tab', 1500);

  // 7. Shopping tab
  console.log('6. Shopping tab');
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Shopping')) { await btn.click(); break; }
  }
  await shot(page, 'shopping-tab', 1500);

  // 8. Shopping scrolled
  await scrollAndShot(page, 'shopping-tab-scrolled');

  // 9. Tips tab
  console.log('7. Tips tab');
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Tips')) { await btn.click(); break; }
  }
  await shot(page, 'tips-tab', 1000);

  // 10. Tips scrolled
  await scrollAndShot(page, 'tips-tab-scrolled');

  // 11. Profile tab (top)
  console.log('8. Profile tab');
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Profile')) { await btn.click(); break; }
  }
  await shot(page, 'profile-tab-top', 1500);

  // 12. Profile scrolled to stats
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 300;
  });
  await shot(page, 'profile-tab-stats');

  // 13. Profile scrolled to customiser
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 600;
  });
  await shot(page, 'profile-tab-customiser');

  // 14. Profile scrolled to bottom (regen button + logout)
  await scrollAndShot(page, 'profile-tab-bottom');

  // 15. Type custom instructions
  console.log('9. Custom instructions flow');
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 500;
  });
  await sleep(300);
  const textarea = await page.$('textarea');
  if (textarea) {
    await textarea.click();
    await textarea.type('Add more eggs to breakfast, avoid rajma this week, include at least one soup every day', { delay: 10 });
  }
  await shot(page, 'customiser-with-text', 1000);

  // 16. Click a suggestion chip
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text === '+ Quick recipes') { await btn.click(); break; }
  }
  await shot(page, 'customiser-chip-added');

  // 17. Regenerate button state with instructions
  await scrollAndShot(page, 'customiser-regen-button');

  // 18. Click regenerate - show confirmation dialog
  console.log('10. Confirmation dialog');
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Regenerate with My Changes')) { await btn.click(); break; }
  }
  await shot(page, 'confirm-dialog-with-instructions', 500);

  // 19. Cancel and clear instructions
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text === 'Cancel') { await btn.click(); break; }
  }
  await sleep(300);

  // 20. Clear instructions and show empty confirm dialog
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text === 'Clear') { await btn.click(); break; }
  }
  await sleep(500);
  await scrollAndShot(page, 'customiser-cleared');

  // 21. Click regenerate with no instructions
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Regenerate Meal Plan')) { await btn.click(); break; }
  }
  await shot(page, 'confirm-dialog-no-instructions', 500);

  // 22. Cancel
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text === 'Cancel') { await btn.click(); break; }
  }

  // 23. Go back to meals and mark a meal as eaten
  console.log('11. Meal interaction');
  for (const btn of await page.$$('button')) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Meals')) { await btn.click(); break; }
  }
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 0;
  });
  await sleep(1000);

  // Click the checkbox circle for first meal
  const circles = await page.$$('.rounded-full');
  for (const c of circles) {
    const isCheckbox = await c.evaluate(el => {
      return el.classList.contains('border') && (el.clientWidth === 24 || el.clientWidth === 28 || el.clientWidth >= 20 && el.clientWidth <= 32) && el.clientHeight === el.clientWidth;
    });
    if (isCheckbox) { await c.click(); break; }
  }
  await shot(page, 'meal-eaten-toggled', 1000);

  console.log(`\nDone! ${n - 1} screenshots saved to ./screenshots/`);
  await browser.close();
})();
