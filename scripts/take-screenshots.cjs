// @ts-check
const { chromium } = require('playwright');
const path = require('path');

const OUT = path.join(__dirname, '../docs/screenshots');
const URL = 'http://localhost:5199';
const EMAIL = 'guilherme.cortes@getstream.io';

async function shot(page, name, opts = {}) {
  const dest = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: dest, ...opts });
  console.log(`  ✓ ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();

  // ── Login ──────────────────────────────────────────────────────────────────
  console.log('\nLogging in…');
  await page.goto(URL);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', EMAIL);
  await page.click('button[type="submit"]');

  // Wait for board columns to appear
  console.log('Waiting for board to load…');
  await page.waitForSelector('[data-col]', { timeout: 30000 });
  await page.waitForTimeout(2500);

  console.log('\nCapturing screenshots…');

  // ── 1. Board overview ──────────────────────────────────────────────────────
  await shot(page, 'board-overview');

  // ── 2. Column tooltip ──────────────────────────────────────────────────────
  const infoBtn = page.locator('button[aria-label="How tickets are routed into this column"]').first();
  await infoBtn.hover();
  await page.waitForTimeout(500);
  // clip to the column + tooltip area
  const colBox = await page.locator('[data-col]').first().boundingBox();
  if (colBox) {
    await shot(page, 'column-tooltip', {
      clip: { x: colBox.x - 4, y: colBox.y - 4, width: colBox.width + 340, height: 280 },
    });
  } else {
    await shot(page, 'column-tooltip');
  }
  await page.mouse.move(0, 400);
  await page.waitForTimeout(300);

  // ── 3. Ticket card close-up ────────────────────────────────────────────────
  const cards = page.locator('[data-ticket-id]');
  await cards.first().waitFor({ timeout: 10000 });
  const cardBox = await cards.first().boundingBox();
  if (cardBox) {
    await shot(page, 'ticket-card', {
      clip: { x: cardBox.x - 6, y: cardBox.y - 6, width: cardBox.width + 12, height: cardBox.height + 12 },
    });
  }

  // ── 4. Side panel – thread ─────────────────────────────────────────────────
  await cards.first().click();
  await page.waitForSelector('[data-sidepanel]', { timeout: 15000 });
  await page.waitForTimeout(2000); // let comments load
  await shot(page, 'sidepanel-thread');

  // ── 5. Side panel – reply box ─────────────────────────────────────────────
  // Scroll the fixed side panel itself to the bottom so the editor is visible
  await page.evaluate(() => {
    const panel = document.querySelector('[data-sidepanel]');
    if (panel) panel.scrollTop = panel.scrollHeight;
    // also scroll any inner scrollable div
    const inner = document.querySelector('[data-sidepanel] > div');
    if (inner) inner.scrollTop = inner.scrollHeight;
  });
  await page.waitForTimeout(400);
  // Use JS click to bypass viewport check
  const editor = page.locator('[contenteditable="true"]').last();
  await editor.evaluate(el => el.click());
  await page.waitForTimeout(400);
  await shot(page, 'sidepanel-reply');

  // Close panel via the dedicated close button
  await page.locator('[data-close-panel]').first().evaluate(el => el.click());
  await page.waitForTimeout(800);

  // ── 6. Top bar ─────────────────────────────────────────────────────────────
  const topbarBox = await page.locator('[data-topbar]').boundingBox();
  if (topbarBox) {
    await shot(page, 'topbar-filters', {
      clip: { x: 0, y: topbarBox.y, width: 1600, height: topbarBox.height + 2 },
    });
  } else {
    await shot(page, 'topbar-filters', { clip: { x: 0, y: 0, width: 1600, height: 58 } });
  }

  // ── 7. Stats modal ─────────────────────────────────────────────────────────
  // The StatsBar button is a <button> with a numeric text inside it (in the topbar area)
  // It contains stale/medium/okay numbers and is near the right side of topbar
  const statsBtn = page.locator('[data-topbar] button[title]').filter({ hasText: /\d/ }).last();
  if (await statsBtn.count() > 0) {
    await statsBtn.click();
  } else {
    // fallback: find any button containing a number in the topbar area
    await page.locator('[data-topbar] button').last().click();
  }
  await page.waitForTimeout(1000);
  await shot(page, 'stats-modal');
  // Close stats modal by clicking its close button via JS (avoids backdrop overlap)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const close = btns.find(b => b.textContent?.trim() === '×' || b.title === 'Close');
    if (close) close.click();
  });
  await page.waitForTimeout(600);

  // ── 8. Theme / preferences picker ─────────────────────────────────────────
  const gearBtn = page.locator('button[title="Preferences"]').first();
  await gearBtn.evaluate(el => el.click());
  await page.waitForTimeout(500);
  await shot(page, 'theme-picker');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ── 9. Drag in progress ────────────────────────────────────────────────────
  const srcCard = page.locator('[data-ticket-id]').first();
  const dstCol = page.locator('[data-col]').nth(3); // target a different column
  const srcBox2 = await srcCard.boundingBox();
  const dstBox2 = await dstCol.boundingBox();
  if (srcBox2 && dstBox2) {
    const sx = srcBox2.x + srcBox2.width / 2;
    const sy = srcBox2.y + srcBox2.height / 2;
    const dx = dstBox2.x + dstBox2.width / 2;
    const dy = dstBox2.y + 100;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.waitForTimeout(300);
    // move in steps so drag-over fires
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(sx + (dx - sx) * (i / 20), sy + (dy - sy) * (i / 20));
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(400);
    await shot(page, 'drag-drop');
    await page.mouse.up();
  }

  await browser.close();
  console.log('\n✅ All screenshots saved to docs/screenshots/\n');
})();
