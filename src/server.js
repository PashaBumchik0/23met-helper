import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseInput } from './parser.js';
import { scrapeItems } from './scraper.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/prices', async (req, res) => {
  try {
    const text = String(req.body?.text ?? '').trim();
    if (!text) return res.status(400).json({ error: 'Вставьте список сортамента' });
    const items = parseInput(text);
    if (items.length > 50) return res.status(400).json({ error: 'За один запрос допускается до 50 позиций' });
    const results = await scrapeItems(items);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ошибка сервера' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`23met helper: http://localhost:${port}`));
