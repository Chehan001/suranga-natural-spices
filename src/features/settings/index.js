import { refreshProducts, state } from '../../core/store.js';
import { rerender } from '../../core/router.js';
import { rs, esc } from '../../utils/format.js';
import { $ } from '../../utils/dom.js';
import { table, options, renderProductSelect, productDisplayName } from '../../components/ui.js';
import { toast } from '../../components/toast.js';
import { api, ApiError } from '../../services/api.js';

const CATEGORIES = ['Grains', 'Spices', 'Coconut', 'Arecanut'];
let savingProduct = false;
let updatingDefaults = false;

function productErrorMessage(error) {
  if (!(error instanceof ApiError)) return 'Could not save product. Try again.';
  if (error.code === 'DUPLICATE_PRODUCT') return 'A product with this name already exists.';
  if (error.code === 'USER_NOT_PROVISIONED') return 'Your account is not assigned to an active business yet.';
  if (error.code === 'INSUFFICIENT_PERMISSION') return 'Only the business owner can manage products.';
  if (error.code === 'UNAUTHENTICATED') return 'Sign in is required to manage products.';
  if (error.code === 'API_UNAVAILABLE') return error.message;
  if (error.code === 'PRODUCT_NOT_FOUND') return 'That product was not found in the database.';
  return error.message;
}

function productTable() {
  if (state.products.status === 'loading' || state.products.status === 'idle') {
    return '<p role="status" aria-live="polite">Loading products from PostgreSQL…</p>';
  }
  if (state.products.status === 'error') {
    return `<p class="err" role="alert">${esc(state.products.error || 'Could not load products.')}</p>
      <button class="btn" data-act="refreshProducts">Retry loading products</button>`;
  }
  if (!state.data.prod.length) {
    return '<p class="note">No products in PostgreSQL yet. Add a product above.</p>';
  }
  return table(['Product', 'Category', 'Unit', 'Default price', 'Reorder at'],
    state.data.prod.map((p) => [esc(productDisplayName(p)), esc(p.c), esc(p.u), rs(p.p), p.ro]));
}

export const settings = {
  id: 'settings', title: 'Settings', icon: 'settings',
  render() {
    const productsReady = state.products.status === 'ready';
    return `<div class="card"><h3>Add product</h3><div class="g">
      <label>Name<input id="s-name"></label>
      <label>Category<select id="s-cat">${options(CATEGORIES.map((x) => [x, x]))}</select></label>
      <label>Default price (Rs./kg)<input id="s-price" type="number" min="0" step="any"></label>
      <label>Reorder level (kg)<input id="s-reorder" type="number" min="0" step="any"></label>
      <button class="btn" data-act="addProduct" ${savingProduct || !productsReady ? 'disabled' : ''}>${savingProduct ? 'Saving…' : '+ Add to PostgreSQL'}</button></div>
      <p class="note">Products are saved in the connected PostgreSQL database through the NestJS API.</p></div>
      <div class="card"><h3>Product defaults</h3><div class="g">
      <label class="field">Product${renderProductSelect({ id: 'settings-product', value: '', changeHandler: 'loadProductDefaults', products: state.data.prod })}</label>
      <label>Default price (Rs./kg)<input id="s-price-edit" type="number" min="0" step="any"></label>
      <label>Reorder level (kg)<input id="s-reorder-edit" type="number" min="0" step="any"></label>
      <button class="btn" data-act="updateProductDefaults" ${updatingDefaults || !productsReady ? 'disabled' : ''}>${updatingDefaults ? 'Saving…' : 'Save product defaults'}</button></div></div>
      <div class="card"><h3>Products &amp; prices</h3>${productTable()}
      <button class="btn" data-act="refreshProducts" ${state.products.status === 'loading' ? 'disabled' : ''}>Refresh products</button></div>
      <div class="card"><h3>Legacy browser data</h3>
      <p class="note">Download a backup before changing storage. Non-product screens still use browser storage until their APIs exist. Existing browser records are never deleted automatically.</p>
      <button class="btn" data-act="backupLegacyData">Download local data backup</button>
      <button class="btn r" disabled title="Disabled to protect existing browser records">Clear all data</button></div>
      <div class="card"><h3>Business</h3><p>Suranga Natural Spices · Currency LKR · Timezone Asia/Colombo</p></div>`;
  },
};

export const settingsActions = {
  loadProductDefaults(_, el) {
    const product = state.data.prod.find((entry) => entry.id === el.value);
    if (!product) {
      $('#s-price-edit').value = '';
      $('#s-reorder-edit').value = '';
      return;
    }
    $('#s-price-edit').value = product.p;
    $('#s-reorder-edit').value = product.ro;
  },
  async addProduct(_, button) {
    if (savingProduct) return;
    const name = $('#s-name').value.trim();
    const price = $('#s-price').value.trim();
    const reorderInput = $('#s-reorder').value.trim();
    if (!name || !(Number(price) > 0)) return toast('Enter name and a price greater than zero', true);
    if (reorderInput && (!Number.isFinite(Number(reorderInput)) || Number(reorderInput) < 0)) {
      return toast('Enter a non-negative reorder level', true);
    }
    const reorderLevel = !reorderInput ? '100' : reorderInput;
    savingProduct = true;
    if (button) {
      button.disabled = true;
      button.textContent = 'Saving…';
    }
    try {
      await api.createProduct({
        name,
        category: $('#s-cat').value,
        unit: 'kg',
        defaultPrice: price,
        reorderLevel,
      });
      if (!await refreshProducts()) {
        return toast('Product was saved, but the list could not refresh. Use Refresh products before retrying.', true);
      }
      toast('Product saved to PostgreSQL');
      rerender();
    } catch (error) {
      toast(productErrorMessage(error), true);
    } finally {
      savingProduct = false;
      if (button?.isConnected) {
        button.disabled = false;
        button.textContent = '+ Add to PostgreSQL';
      }
    }
  },
  async updateProductDefaults(_, button) {
    if (updatingDefaults) return;
    const product = state.data.prod.find((entry) => entry.id === $('#settings-product').value);
    if (!product) return toast('Select a product first', true);
    const price = $('#s-price-edit').value.trim();
    const reorder = $('#s-reorder-edit').value.trim();
    if (price === '' || !Number.isFinite(Number(price)) || Number(price) <= 0) {
      return toast('Enter a price greater than zero', true);
    }
    if (reorder === '' || !Number.isFinite(Number(reorder)) || Number(reorder) < 0) {
      return toast('Enter a valid non-negative reorder level', true);
    }
    updatingDefaults = true;
    if (button) {
      button.disabled = true;
      button.textContent = 'Saving…';
    }
    try {
      await api.updateProduct(product.id, {
        defaultPrice: price,
        reorderLevel: reorder,
      });
      if (!await refreshProducts()) {
        return toast('Defaults were saved, but the list could not refresh. Use Refresh products.', true);
      }
      toast('Product defaults saved to PostgreSQL');
      rerender();
    } catch (error) {
      toast(productErrorMessage(error), true);
    } finally {
      updatingDefaults = false;
      if (button?.isConnected) {
        button.disabled = false;
        button.textContent = 'Save product defaults';
      }
    }
  },
  async refreshProducts() {
    await refreshProducts();
    rerender();
  },
  backupLegacyData() {
    try {
      const count = api.downloadLegacyBackup();
      toast(`Backup downloaded. ${count} legacy product record(s) included.`);
    } catch {
      toast('Could not read the existing browser data for backup.', true);
    }
  },
};
