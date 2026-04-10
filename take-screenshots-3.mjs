import puppeteer from 'puppeteer';
import { setTimeout as sleep } from 'timers/promises';
import path from 'path';

const DIR = './screenshots';
const BASE = 'http://localhost:5173';

async function shot(page, num, name, waitMs = 500) {
  await sleep(waitMs);
  const file = path.join(DIR, `${String(num).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  saved ${file}`);
}

function clickBottomNav(page, tabName) {
  return page.evaluate((name) => {
    // Bottom nav buttons are in the last row of buttons
    const navBtns = document.querySelectorAll('nav button, footer button, .fixed button');
    // Fallback: find buttons at bottom of page
    const allBtns = Array.from(document.querySelectorAll('button'));
    const bottomBtns = allBtns.filter(b => {
      const rect = b.getBoundingClientRect();
      return rect.top > window.innerHeight - 80;
    });
    const target = bottomBtns.find(b => b.textContent.includes(name));
    if (target) { target.click(); return `clicked ${name}`; }
    // Fallback to any button
    const any = allBtns.reverse().find(b => b.textContent.trim().endsWith(name));
    if (any) { any.click(); return `clicked ${name} (fallback)`; }
    return `not found: ${name}`;
  }, tabName);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], protocolTimeout: 60000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });

  // Login
  console.log('Logging in...');
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await shot(page, 1, 'login-screen');

  await page.type('input[placeholder="harshit"]', 'harshit');
  await page.type('input[type="password"]', 'harshit123');
  await shot(page, 2, 'login-filled');

  await page.click('button[type="submit"]');
  await sleep(2500);

  // MEALS TAB
  console.log('Meals tab...');
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 0;
  });
  await shot(page, 3, 'meals-monday-top', 500);

  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 4, 'meals-monday-bottom');

  // Click Tuesday
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 0;
  });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tue = btns.find(b => b.textContent.trim() === 'Tue');
    if (tue) tue.click();
  });
  await shot(page, 5, 'meals-tuesday');

  // TRACKER TAB
  console.log('Tracker tab...');
  let result = await clickBottomNav(page, 'Tracker');
  console.log('  nav:', result);
  await shot(page, 6, 'tracker-tab', 1500);

  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 7, 'tracker-tab-bottom');

  // SHOPPING TAB
  console.log('Shopping tab...');
  result = await clickBottomNav(page, 'Shopping');
  console.log('  nav:', result);
  await shot(page, 8, 'shopping-tab', 1500);

  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 9, 'shopping-tab-bottom');

  // TIPS TAB
  console.log('Tips tab...');
  result = await clickBottomNav(page, 'Tips');
  console.log('  nav:', result);
  await shot(page, 10, 'tips-tab', 1500);

  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 11, 'tips-tab-bottom');

  // PROFILE TAB
  console.log('Profile tab...');
  result = await clickBottomNav(page, 'Profile');
  console.log('  nav:', result);
  await sleep(1500);

  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 0;
  });
  await shot(page, 12, 'profile-top');

  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 350;
  });
  await shot(page, 13, 'profile-nutrition-prefs');

  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 600;
  });
  await shot(page, 14, 'profile-customiser-empty');

  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 15, 'profile-bottom');

  // TYPE IN CUSTOMISER using React-compatible input simulation
  console.log('Custom instructions...');
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 550;
  });
  await sleep(300);

  // Use page.evaluate to set the textarea value in a React-compatible way
  await page.evaluate(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeInputValueSetter.call(textarea, 'Add more eggs to breakfast, avoid rajma this week, include at least one soup every day');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await shot(page, 16, 'customiser-typed', 800);

  // Click chip
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const chip = btns.find(b => b.textContent.trim() === '+ Add soups');
    if (chip) chip.click();
  });
  await shot(page, 17, 'customiser-chip-added', 500);

  // Scroll to show button
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 18, 'customiser-regen-button');

  // Click regenerate - show dialog with instructions
  console.log('Confirmation dialogs...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const regen = btns.find(b => b.textContent.includes('Regenerate with My Changes'));
    if (regen) regen.click();
  });
  await shot(page, 19, 'confirm-with-instructions', 500);

  // Cancel
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find(b => b.textContent.trim() === 'Cancel');
    if (cancel) cancel.click();
  });
  await sleep(300);

  // Clear and show no-instructions dialog
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const clear = btns.find(b => b.textContent.trim() === 'Clear');
    if (clear) clear.click();
  });
  await sleep(500);
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 20, 'customiser-cleared');

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const regen = btns.find(b => b.textContent.includes('Regenerate Meal Plan'));
    if (regen) regen.click();
  });
  await shot(page, 21, 'confirm-no-instructions', 500);

  console.log('\nAll done! 21 screenshots in ./screenshots/');
  await browser.close();
})();
