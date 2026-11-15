import { state, persist, clearAll } from '../../core/store.js';
import { rerender } from '../../core/router.js';
import { rs, esc } from '../../utils/format.js';
import { $ } from '../../utils/dom.js';
import { table, productDisplayName, renderProductSelect } from '../../components/ui.js';
import { toast } from '../../components/toast.js';

let armed = false;

export const settings = {
  id: 'settings', title: 'Settings', icon: 'settings',
  render() {
    armed = false;
    return `<div class="card"><h3>Product defaults</h3><div class="g">
      <label class="field">Product${renderProductSelect({ id: 'settings-product', value: '', changeHandler: 'loadProductDefaults' })}</label>
      <label>Default price (Rs./kg)<input id="s-price" type="number" min="0" step="any"></label>
      <label>Reorder level (kg)<input id="s-reorder" type="number" min="0" step="any"></label>
      <button class="btn" data-act="updateProductDefaults">Save product defaults</button>
      <p class="note">New product selections are limited to the seven standard products. Existing legacy products are retained for historical records.</p></div></div>
      <div class="card"><h3>Products &amp; prices</h3>${table(['Product', 'Category', 'Unit', 'Default price', 'Reorder at'],
        state.data.prod.map((p) => [esc(productDisplayName(p)), esc(p.c), p.u, rs(p.p), p.ro]))}</div>
      <div class="card"><h3>Business</h3><p>Suranga Natural Spices · Currency LKR · Timezone Asia/Colombo</p>
      <button id="clear-btn" class="btn r" data-act="clearData">Clear all data</button></div>`;
  },
};

export const settingsActions = {
  loadProductDefaults(_, el) {
    const product = state.data.prod.find((entry) => entry.id === el.value);
    if (!product) {
      $('#s-price').value = '';
      $('#s-reorder').value = '';
      return;
    }
    $('#s-price').value = product.p;
    $('#s-reorder').value = product.ro;
  },
  updateProductDefaults() {
    const product = state.data.prod.find((entry) => entry.id === $('#settings-product').value);
    if (!product) return toast('Select a product first', true);
    const price = Number($('#s-price').value);
    const reorder = Number($('#s-reorder').value);
    if ($('#s-price').value === '' || !Number.isFinite(price) || price < 0) return toast('Enter a valid non-negative price', true);
    if ($('#s-reorder').value === '' || !Number.isFinite(reorder) || reorder < 0) return toast('Enter a valid non-negative reorder level', true);
    product.p = price;
    product.ro = reorder;
    if (!persist()) return toast('Could not save the product. No changes were saved.', true);
    toast('Product defaults saved'); rerender();
  },
  clearData() {
    if (!armed) { armed = true; $('#clear-btn').textContent = 'Click again to confirm: this deletes everything'; return; }
    if (!clearAll()) return toast('Could not clear data from browser storage. No changes were made.', true);
    toast('All data cleared'); rerender();
  },
};
