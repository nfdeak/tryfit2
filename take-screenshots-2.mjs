import puppeteer from 'puppeteer';
import { setTimeout as sleep } from 'timers/promises';
import path from 'path';

const DIR = './screenshots';
const BASE = 'http://localhost:5173';
let n = 11;

async function shot(page, name, waitMs = 500) {
  await sleep(waitMs);
  const file = path.join(DIR, `${String(n).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  saved ${file}`);
  n++;
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], protocolTimeout: 60000 });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1 });

  // Login
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await page.type('input[placeholder="harshit"]', 'harshit');
  await page.type('input[type="password"]', 'harshit123');
  await page.click('button[type="submit"]');
  await sleep(2000);

  // Navigate to Profile tab using bottom nav (last button with "Profile" text)
  console.log('Navigating to Profile...');
  await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const profileBtn = allBtns.reverse().find(b => b.textContent.includes('Profile'));
    if (profileBtn) profileBtn.click();
  });
  await sleep(1500);

  // 11. Profile top
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 0;
  });
  await shot(page, 'profile-tab-top');

  // 12. Profile body stats & nutrition
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 280;
  });
  await shot(page, 'profile-tab-stats');

  // 13. Profile preferences & customiser header
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 520;
  });
  await shot(page, 'profile-tab-customiser');

  // 14. Customiser textarea + chips + button
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 700;
  });
  await shot(page, 'profile-tab-customiser-full');

  // 15. Bottom with logout
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 'profile-tab-bottom');

  // 16. Type custom instructions
  console.log('Typing custom instructions...');
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 600;
  });
  await sleep(300);
  const textarea = await page.$('textarea');
  if (textarea) {
    await textarea.click();
    await textarea.type('Add more eggs to breakfast, avoid rajma this week, include at least one soup every day', { delay: 5 });
  }
  await shot(page, 'customiser-with-text', 800);

  // 17. Click a suggestion chip
  console.log('Clicking chip...');
  await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const chip = allBtns.find(b => b.textContent.trim() === '+ Quick recipes');
    if (chip) chip.click();
  });
  await shot(page, 'customiser-chip-added', 600);

  // 18. Show regenerate button with instructions
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await shot(page, 'customiser-regen-button');

  // 19. Click regenerate - confirmation dialog WITH instructions
  console.log('Showing confirmation dialog...');
  await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const regen = allBtns.find(b => b.textContent.includes('Regenerate with My Changes'));
    if (regen) regen.click();
  });
  await shot(page, 'confirm-dialog-with-instructions', 500);

  // 20. Cancel
  await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const cancel = allBtns.find(b => b.textContent.trim() === 'Cancel');
    if (cancel) cancel.click();
  });
  await sleep(300);

  // 21. Clear instructions
  console.log('Clearing instructions...');
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = 700;
  });
  await sleep(200);
  await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const clear = allBtns.find(b => b.textContent.trim() === 'Clear');
    if (clear) clear.click();
  });
  await shot(page, 'customiser-cleared', 600);

  // 22. Regenerate with no instructions - confirmation dialog
  await page.evaluate(() => {
    const el = document.querySelector('.overflow-y-auto');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await sleep(200);
  await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const regen = allBtns.find(b => b.textContent.includes('Regenerate Meal Plan'));
    if (regen) regen.click();
  });
  await shot(page, 'confirm-dialog-no-instructions', 500);

  console.log(`\nDone! Screenshots saved to ./screenshots/`);
  await browser.close();
})();
