import { esc } from '../utils/format.js';
import { state } from '../core/store.js';

const PRODUCT_TRANSLATIONS = {
  paddy: { en: 'Paddy', si: 'වී' },
  rice: { en: 'Rice', si: 'සහල්' },
  coconut: { en: 'Coconut', si: 'පොල්' },
  copra: { en: 'Copra', si: 'කොප්පරා' },
  pepper: { en: 'Pepper', si: 'ගම්මිරිස්' },
  arecanut: { en: 'Arecanut', si: 'පුවක්' },
  karunka: { en: 'Karunka', si: 'කරුණ්කා' },
};

const matchProductTranslation = (rawName) => {
  const value = String(rawName ?? '').trim();
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[^a-z]/g, '');
  return Object.entries(PRODUCT_TRANSLATIONS).find(([, details]) => {
    const nameKey = normalized;
    const englishKey = details.en.toLowerCase().replace(/[^a-z]/g, '');
    const rawKey = value.replace(/\s*(?:\/|\().*$/, '').trim().toLowerCase().replace(/[^a-z]/g, '');
    return nameKey === englishKey || rawKey === englishKey || nameKey === rawKey;
  })?.[1] || null;
};

export const getProductDisplayParts = (product) => {
  const rawName = product && typeof product === 'object' ? (product.n ?? product.name ?? '') : `${product ?? ''}`;
  const trimmed = String(rawName).trim();
  if (!trimmed) return { nameEn: 'Product', nameSi: '' };

  const translation = matchProductTranslation(trimmed);
  if (translation) return { nameEn: translation.en, nameSi: translation.si };

  const englishPart = trimmed.replace(/\s*(?:\/|\().*$/, '').trim() || trimmed;
  const sinhalesePart = trimmed.match(/\(([^)]+)\)/)?.[1]?.trim() || trimmed.match(/\/\s*([^/]+)\s*$/)?.[1]?.trim() || '';
  return { nameEn: englishPart, nameSi: sinhalesePart };
};

export const productDisplayName = (product) => getProductDisplayParts(product).nameEn || 'Product';

export const productOptions = (products = state.data.prod) => {
  const list = products.map((product) => {
    const { nameEn, nameSi } = getProductDisplayParts(product);
    const label = nameSi ? `${nameEn} (${nameSi})` : nameEn;
    return [product.id, label];
  });
  return list.map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`).join('');
};

const getProductList = (products = state.data.prod) => products.map((product) => ({
  id: product.id,
  ...getProductDisplayParts(product),
}));

const syncProductDropdown = (id, value) => {
  const wrapper = document.querySelector(`[data-product-select="${id}"]`);
  if (!wrapper) return;

  const list = getProductList(state.data.prod);
  const current = list.find((product) => String(product.id) === String(value));
  const label = current ? current.nameEn : 'Select Product';
  const trigger = wrapper.querySelector('.product-select__value');
  if (trigger) trigger.textContent = label;

  const buttons = wrapper.querySelectorAll('[data-product-option]');
  buttons.forEach((button) => {
    const selected = String(button.dataset.productValue) === String(value);
    button.setAttribute('aria-selected', String(selected));
    button.classList.toggle('selected', selected);
  });
};

export const renderProductSelect = ({ id, value = '', products = state.data.prod, changeHandler = '' }) => {
  const list = getProductList(products);
  const selected = list.find((product) => String(product.id) === String(value));
  const selectedLabel = selected ? selected.nameEn : 'Select Product';
  const nativeOptions = list.map((product) => {
    const optionText = product.nameSi ? `${product.nameEn} (${product.nameSi})` : product.nameEn;
    const isSelected = String(product.id) === String(value);
    return `<option value="${esc(product.id)}" ${isSelected ? 'selected' : ''}>${esc(optionText)}</option>`;
  }).join('');

  return `<div class="product-select" data-product-select="${esc(id)}">
    <button class="product-select__trigger" type="button" data-act="toggleProductDropdown" data-arg="${esc(id)}" aria-expanded="false" aria-haspopup="listbox" aria-controls="${esc(id)}-list" aria-label="${esc(selectedLabel || 'Select Product')}" role="combobox">
      <span class="product-select__value">${esc(selectedLabel)}</span>
      <span class="product-select__caret" aria-hidden="true">▾</span>
    </button>
    <ul class="product-select__menu" id="${esc(id)}-list" role="listbox" hidden>
      ${list.map((product) => `<li><button class="product-select__option${String(product.id) === String(value) ? ' selected' : ''}" type="button" role="option" aria-selected="${String(product.id) === String(value)}" data-product-option data-product-value="${esc(product.id)}" data-product-id="${esc(id)}" data-act="selectProductOption" data-arg="${esc(id)}:${esc(product.id)}">
        <span>${esc(product.nameSi ? `${product.nameEn} (${product.nameSi})` : product.nameEn)}</span>
        <span class="product-select__check" aria-hidden="true">✓</span>
      </button></li>`).join('')}
    </ul>
    <select id="${esc(id)}" class="product-select__native" ${changeHandler ? `data-change="${esc(changeHandler)}"` : ''} aria-label="Product">
      <option value="" ${!value ? 'selected' : ''}>Select Product</option>
      ${nativeOptions}
    </select>
  </div>`;
};

export const productSelectActions = {
  toggleProductDropdown(id, el) {
    const wrapper = el.closest('[data-product-select]');
    if (!wrapper) return;
    const menu = wrapper.querySelector('.product-select__menu');
    const trigger = wrapper.querySelector('.product-select__trigger');
    const shouldOpen = menu.hidden;
    document.querySelectorAll('.product-select__menu').forEach((entry) => {
      if (entry !== menu) entry.hidden = true;
    });
    document.querySelectorAll('.product-select__trigger').forEach((button) => {
      if (button !== trigger) button.setAttribute('aria-expanded', 'false');
    });
    menu.hidden = !shouldOpen;
    trigger.setAttribute('aria-expanded', String(shouldOpen));
  },
  selectProductOption(arg, el) {
    const [id, value] = arg.split(':');
    const wrapper = el.closest('[data-product-select]');
    if (!wrapper) return;
    const nativeSelect = wrapper.querySelector('select');
    const nextValue = value ?? '';
    if (!nativeSelect) return;
    nativeSelect.value = nextValue;
    syncProductDropdown(id, nextValue);
    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    const menu = wrapper.querySelector('.product-select__menu');
    const trigger = wrapper.querySelector('.product-select__trigger');
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  },
};

export const kpi = (label, value, color) => `<div class="kpi ${color}"><small>${label}</small><b>${value}</b></div>`;

export const table = (headers, rows) =>
  '<div class="tw"><table><tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr>' +
  (rows.length
    ? rows.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('')
    : `<tr><td colspan="${headers.length}">No records yet</td></tr>`) +
  '</table></div>';

export const tabs = (key, list) =>
  '<div class="tabs" role="tablist">' +
  list.map(([v, t]) => `<button role="tab" class="${state.tab[key] === v ? 'on' : ''}" data-act="setTab" data-arg="${key}:${v}">${t}</button>`).join('') +
  '</div>';

export const options = (pairs) => pairs.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
