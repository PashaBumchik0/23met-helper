import { chromium } from 'playwright';

const BASE = 'https://23met.ru/price';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const numberFrom = (s) => {
  const nums = clean(s).match(/\d[\d\s]{3,}/g) ?? [];
  return nums.map((x) => Number(x.replace(/\s/g, ''))).find((x) => x >= 10000 && x <= 1000000) ?? null;
};

async function findProductLink(page, category, size) {
  const categoryUrl = `${BASE}/${encodeURIComponent(category)}`;
  await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(1200);
  const wanted = size.toLowerCase().replace(/[×хx*\s]/g, '');
  const links = await page.locator('a[href]').evaluateAll((els) => els.map((a) => ({
    href: a.href,
    text: (a.textContent || '').trim()
  })));
  const exact = links.find((l) => l.text.toLowerCase().replace(/[×хx*\s]/g, '') === wanted);
  const fuzzy = links.find((l) => l.text.toLowerCase().replace(/[×хx*\s]/g, '').includes(wanted));
  if (exact || fuzzy) return (exact || fuzzy).href;
  return `${categoryUrl}/${encodeURIComponent(size.replace(/×/g, 'х'))}`;
}

async function extractMetallservice(page) {
  const bodyText = await page.locator('body').innerText();
  if (/429|too many requests/i.test(bodyText)) throw new Error('Сайт временно ограничил запросы (429)');

  const rows = page.locator('tr');
  for (let i = 0; i < await rows.count(); i++) {
    const text = clean(await rows.nth(i).innerText().catch(() => ''));
    if (/металлсервис/i.test(text)) {
      const price = numberFrom(text);
      if (price) return { price, rowText: text };
    }
  }

  const lines = bodyText.split(/\n/).map(clean).filter(Boolean);
  const idx = lines.findIndex((x) => /металлсервис/i.test(x));
  if (idx >= 0) {
    const nearby = lines.slice(idx, idx + 8).join(' ');
    const price = numberFrom(nearby);
    if (price) return { price, rowText: nearby };
  }
  throw new Error('Строка «Металлсервис» или цена не найдена');
}

export async function scrapeItems(items) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'ru-RU',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  const results = [];
  try {
    for (const item of items) {
      if (!item.category) {
        results.push({ ...item, error: 'Не удалось определить категорию' });
        continue;
      }
      try {
        const url = await findProductLink(page, item.category, item.size);
        await sleep(900 + Math.random() * 900);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await sleep(1200 + Math.random() * 1000);
        const found = await extractMetallservice(page);
        results.push({
          ...item,
          url,
          steel: /с255|ст3/i.test(found.rowText) ? 'С255 / Ст3' : (/с355/i.test(found.rowText) ? 'С355' : 'не определена'),
          pricePerTon: found.price,
          total: item.tonnage ? Math.round(found.price * item.tonnage) : null,
          sourceRow: found.rowText
        });
      } catch (error) {
        results.push({ ...item, error: error.message });
      }
      await sleep(1600 + Math.random() * 1800);
    }
  } finally {
    await browser.close();
  }
  return results;
}
