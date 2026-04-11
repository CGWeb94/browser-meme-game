import { createRequire } from 'module';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/Chris/AppData/Roaming/npm/node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js');

const CHROME_PATH = 'C:/Users/Chris/.cache/puppeteer/chrome/win64-146.0.7680.31/chrome-win64/chrome.exe';
const OUT_DIR = resolve('./temporary screenshots');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Auto-increment filename, never overwrite
function nextFilename(label) {
  const files = existsSync(OUT_DIR) ? readdirSync(OUT_DIR) : [];
  const nums = files
    .map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1]))
    .filter(n => !isNaN(n));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return join(OUT_DIR, label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`);
}

const url   = process.argv[2] || 'http://localhost:3001';
const label = process.argv[3] || '';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

  // Force GSAP animations to complete if present
  await page.evaluate(() => {
    if (window.gsap) {
      gsap.globalTimeline.progress(1, true);
      gsap.globalTimeline.pause();
    }
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 800));

  const file = nextFilename(label);
  await page.screenshot({ path: file, fullPage: false });
  await browser.close();

  console.log('Saved:', file);
})();
