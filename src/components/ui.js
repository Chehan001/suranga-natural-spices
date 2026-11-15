import { esc } from '../utils/format.js';
import { state } from '../core/store.js';
import { PRODUCT_CATALOG, findCatalogProduct } from '../data/productCatalog.js';

export const getProductDisplayParts = (product) => {
  const rawName = product && typeof product === 'object'
    ? (product.nameEn ?? product.n ?? product.name ?? '')
    : `${product ?? ''}`;
  const trimmed = String(rawName).trim();
  if (!trimmed) return { nameEn: 'Product', nameSi: '' };

  const catalogProduct = findCatalogProduct(product);
  if (catalogProduct) return { nameEn: catalogProduct.nameEn, nameSi: catalogProduct.nameSi };

  const englishPart = trimmed.replace(/\s*(?:\/|\().*$/, '').trim() || trimmed;
  const sinhalesePart = trimmed.match(/\(([^)]+)\)/)?.[1]?.trim() || trimmed.match(/\/\s*([^/]+)\s*$/)?.[1]?.trim() || '';
  return { nameEn: englishPart, nameSi: sinhalesePart };
};

export const productDisplayName = (product) => getProductDisplayParts(product).nameEn || 'Product';

export const productOptions = (products = state.data.prod) => {
  return getProductList(products)
    .map((product) => [product.id, `${product.nameEn} (${product.nameSi})`])
    .map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`)
    .join('');
};

const getProductList = (products = state.data.prod) => PRODUCT_CATALOG.map((catalogProduct) => {
  const product = products.find((entry) =>
    String(entry.id) === catalogProduct.id || findCatalogProduct(entry)?.id === catalogProduct.id);
  return { ...catalogProduct, id: product?.id ?? catalogProduct.id };
});

const productPlaceholder = 'Select Product / නිෂ්පාදනය තෝරන්න';

const syncProductDropdown = (id, value) => {
  const wrapper = document.querySelector(`[data-product-select="${id}"]`);
  if (!wrapper) return;

  const list = getProductList(state.data.prod);
  const current = list.find((product) => String(product.id) === String(value));
  const label = current ? current.nameEn : productPlaceholder;
  const trigger = wrapper.querySelector('.product-select__value');
  if (trigger) trigger.textContent = label;
  const button = wrapper.querySelector('.product-select__trigger');
  if (button) button.setAttribute('aria-label', label);

  const buttons = wrapper.querySelectorAll('[data-product-option]');
  buttons.forEach((button) => {
    const selected = String(button.dataset.productValue) === String(value);
    button.setAttribute('aria-selected', String(selected));
    button.classList.toggle('selected', selected);
  });
};

const setProductDropdownOpen = (wrapper, open) => {
  const menu = wrapper.querySelector('.product-select__menu');
  const trigger = wrapper.querySelector('.product-select__trigger');
  if (open) {
    document.querySelectorAll('.product-select__menu').forEach((entry) => {
      if (entry !== menu) entry.hidden = true;
    });
    document.querySelectorAll('.product-select__trigger').forEach((button) => {
      if (button !== trigger) button.setAttribute('aria-expanded', 'false');
    });
    const search = wrapper.querySelector('.product-select__search');
    search.value = '';
    wrapper.querySelectorAll('[data-product-option]').forEach((button) => {
      button.closest('li').hidden = false;
    });
    wrapper.querySelector('[data-product-empty]').hidden = true;
  }
  menu.hidden = !open;
  trigger.setAttribute('aria-expanded', String(open));
  if (open) wrapper.querySelector('.product-select__search')?.focus();
};

export const renderProductSelect = ({ id, value = '', products = state.data.prod, changeHandler = '' }) => {
  const list = getProductList(products);
  const selected = list.find((product) => String(product.id) === String(value));
  const selectedLabel = selected ? selected.nameEn : productPlaceholder;
  const nativeOptions = list.map((product) => {
    const optionText = `${product.nameEn} (${product.nameSi})`;
    const isSelected = String(product.id) === String(value);
    return `<option value="${esc(product.id)}" ${isSelected ? 'selected' : ''}>${esc(optionText)}</option>`;
  }).join('');

  return `<div class="product-select" data-product-select="${esc(id)}">
    <button class="product-select__trigger" type="button" data-act="toggleProductDropdown" data-arg="${esc(id)}" data-keydown="productDropdownKeydown" aria-expanded="false" aria-haspopup="listbox" aria-controls="${esc(id)}-list" aria-label="${esc(selectedLabel)}">
      <span class="product-select__value">${esc(selectedLabel)}</span>
      <span class="product-select__caret" aria-hidden="true">▾</span>
    </button>
    <div class="product-select__menu" hidden>
      <span class="product-select__search-label" id="${esc(id)}-search-label">Search products</span>
      <input id="${esc(id)}-search" class="product-select__search" type="search" autocomplete="off" aria-labelledby="${esc(id)}-search-label" placeholder="Search in English or Sinhala" data-input="filterProductOptions" data-keydown="productDropdownKeydown">
      <button class="product-select__clear" type="button" data-act="clearProductSelection" data-arg="${esc(id)}" data-keydown="productDropdownKeydown">Clear selection</button>
      <ul class="product-select__options" id="${esc(id)}-list" role="listbox" aria-label="Products">
        ${list.map((product) => `<li><button class="product-select__option${String(product.id) === String(value) ? ' selected' : ''}" type="button" role="option" aria-selected="${String(product.id) === String(value)}" data-product-option data-product-value="${esc(product.id)}" data-act="selectProductOption" data-keydown="productDropdownKeydown">
          <span>${esc(`${product.nameEn} (${product.nameSi})`)}</span>
          <span class="product-select__check" aria-hidden="true">✓</span>
        </button></li>`).join('')}
        <li class="product-select__empty" data-product-empty hidden>No matching products</li>
      </ul>
    </div>
    <select id="${esc(id)}" class="product-select__native" ${changeHandler ? `data-change="${esc(changeHandler)}"` : ''} aria-label="Product" hidden>
      <option value="" ${!value ? 'selected' : ''}>${esc(productPlaceholder)}</option>
      ${nativeOptions}
    </select>
  </div>`;
};

export const productSelectActions = {
  toggleProductDropdown(_, el) {
    const wrapper = el.closest('[data-product-select]');
    if (!wrapper) return;
    const menu = wrapper.querySelector('.product-select__menu');
    setProductDropdownOpen(wrapper, menu.hidden);
  },
  selectProductOption(_, el) {
    const wrapper = el.closest('[data-product-select]');
    if (!wrapper) return;
    const id = wrapper.dataset.productSelect;
    const nativeSelect = wrapper.querySelector('select');
    const nextValue = el.dataset.productValue ?? '';
    if (!nativeSelect) return;
    nativeSelect.value = nextValue;
    syncProductDropdown(id, nextValue);
    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    setProductDropdownOpen(wrapper, false);
    const trigger = wrapper.querySelector('.product-select__trigger');
    trigger?.focus();
  },
  clearProductSelection(id, el) {
    const wrapper = el.closest('[data-product-select]');
    if (!wrapper) return;
    const nativeSelect = wrapper.querySelector('select');
    if (!nativeSelect) return;
    nativeSelect.value = '';
    syncProductDropdown(id, '');
    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    setProductDropdownOpen(wrapper, false);
    const trigger = wrapper.querySelector('.product-select__trigger');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  },
  filterProductOptions(_, el) {
    const wrapper = el.closest('[data-product-select]');
    if (!wrapper) return;
    const query = el.value.trim().toLocaleLowerCase();
    const buttons = [...wrapper.querySelectorAll('[data-product-option]')];
    let visibleCount = 0;
    buttons.forEach((button) => {
      const visible = button.textContent.toLocaleLowerCase().includes(query);
      button.closest('li').hidden = !visible;
      if (visible) visibleCount += 1;
    });
    wrapper.querySelector('[data-product-empty]').hidden = visibleCount > 0;
  },
  productDropdownKeydown(_, el, event) {
    const wrapper = el.closest('[data-product-select]');
    if (!wrapper) return;
    const trigger = wrapper.querySelector('.product-select__trigger');
    const menu = wrapper.querySelector('.product-select__menu');
    const visibleOptions = [...wrapper.querySelectorAll('[data-product-option]')]
      .filter((button) => !button.closest('li').hidden);
    const activeIndex = visibleOptions.indexOf(document.activeElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
      return;
    }

    if (el === trigger && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (menu.hidden) setProductDropdownOpen(wrapper, true);
      const options = [...wrapper.querySelectorAll('[data-product-option]')]
        .filter((button) => !button.closest('li').hidden);
      (event.key === 'ArrowUp' ? options.at(-1) : options[0])?.focus();
      return;
    }

    if (event.key === 'Tab') {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = activeIndex < 0
        ? (event.key === 'ArrowDown' ? 0 : visibleOptions.length - 1)
        : Math.max(0, Math.min(visibleOptions.length - 1, activeIndex + (event.key === 'ArrowDown' ? 1 : -1)));
      visibleOptions[nextIndex]?.focus();
    } else if (event.key === 'Enter' && el.classList.contains('product-select__search')) {
      event.preventDefault();
      visibleOptions[0]?.click();
    }
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
