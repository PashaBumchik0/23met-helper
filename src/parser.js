import { normalizeItem } from './catalog.js';

export function parseInput(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const m = line.match(/^(.*?)\s*[–—-]\s*([\d.,]+)\s*(?:тн|т|тонн?ы?)?\s*$/i);
    const rawName = m ? m[1].trim() : line;
    const tonnage = m ? Number(m[2].replace(',', '.')) : null;
    return { ...normalizeItem(rawName), tonnage };
  });
}
