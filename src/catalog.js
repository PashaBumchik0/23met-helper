export const categoryAliases = [
  { test: /^(двутавр|балка)\s*/i, category: 'balka', label: 'Балка' },
  { test: /^швеллер\s*/i, category: 'shveller', label: 'Швеллер' },
  { test: /^уголок\s*/i, category: 'ugolok', label: 'Уголок равнополочный' },
  { test: /^полоса\s*/i, category: 'polosa', label: 'Полоса' },
  { test: /^лист\s*/i, category: 'list', label: 'Лист' },
  { test: /^труба\s*/i, category: 'truba', label: 'Труба электросварная круглая' }
];

export function normalizeItem(rawName) {
  const source = rawName.trim().replace(/[хХxX*]/g, '×').replace(/\s+/g, ' ');
  const alias = categoryAliases.find((x) => x.test.test(source));
  if (!alias) return { source, category: null, normalized: source, size: source };

  let size = source.replace(alias.test, '').trim();
  if (alias.category === 'ugolok') {
    const m = size.match(/^(\d+(?:[.,]\d+)?)×(\d+(?:[.,]\d+)?)$/);
    if (m) size = `${m[1]}×${m[1]}×${m[2]}`;
  }
  if (alias.category === 'list') {
    const thickness = size.match(/^\d+(?:[.,]\d+)?$/)?.[0];
    if (thickness) size = `${thickness}×1500×3000`;
  }
  return {
    source,
    category: alias.category,
    label: alias.label,
    size,
    normalized: `${alias.label} ${size}`
  };
}
