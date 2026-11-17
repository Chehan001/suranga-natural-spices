export const PRODUCT_CATALOG = [
  { id: 'paddy', nameEn: 'Paddy', nameSi: 'වී', category: 'Grains' },
  { id: 'rice', nameEn: 'Rice', nameSi: 'සහල්', category: 'Grains' },
  { id: 'coconut', nameEn: 'Coconut', nameSi: 'පොල්', category: 'Coconut' },
  { id: 'copra', nameEn: 'Copra', nameSi: 'කොප්පරා', category: 'Coconut' },
  { id: 'pepper', nameEn: 'Pepper', nameSi: 'ගම්මිරිස්', category: 'Spices' },
  { id: 'arecanut', nameEn: 'Arecanut', nameSi: 'පුවක්', category: 'Arecanut' },
  { id: 'karunka', nameEn: 'Karunka', nameSi: 'කරුණ්කා', category: 'Spices' },
];

const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/[\s()\/]/g, '');

export const findCatalogProduct = (product) => {
  const rawName = typeof product === 'object' && product !== null
    ? (product.nameEn ?? product.n ?? product.name ?? '')
    : product;
  const normalized = normalize(rawName);
  return PRODUCT_CATALOG.find(({ nameEn, nameSi }) =>
    normalized === normalize(nameEn) ||
    normalized === normalize(nameSi) ||
    normalized === normalize(`${nameEn} (${nameSi})`) ||
    normalized === normalize(`${nameEn} / ${nameSi}`));
};

/** Legacy helper — not used for persistence. Products load from PostgreSQL via the API. */
export const createCatalogProducts = (existingProducts = []) => {
  const selectedIds = new Set();
  const catalogProducts = PRODUCT_CATALOG.map((catalogProduct) => {
    const existing = existingProducts.find((product) => findCatalogProduct(product)?.id === catalogProduct.id);
    if (existing) selectedIds.add(existing.id);
    return {
      id: existing?.id ?? catalogProduct.id,
      n: catalogProduct.nameEn,
      nameEn: catalogProduct.nameEn,
      nameSi: catalogProduct.nameSi,
      c: catalogProduct.category,
      u: existing?.u ?? 'kg',
      p: existing?.p ?? 0,
      ro: existing?.ro ?? 100,
    };
  });
  const legacyProducts = existingProducts.filter((product) => !selectedIds.has(product.id));
  return [...catalogProducts, ...legacyProducts];
};
