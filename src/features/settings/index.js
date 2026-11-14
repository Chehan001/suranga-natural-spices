import { state, persist, clearAll } from '../../core/store.js';
import { rerender } from '../../core/router.js';
import { rs, esc } from '../../utils/format.js';
import { $ } from '../../utils/dom.js';
import { table, options } from '../../components/ui.js';
import { toast } from '../../components/toast.js';

const CATEGORIES = ['Grains', 'Spices', 'Coconut', 'Arecanut'];
let armed = false;

export const settings = {
  id: 'settings', title: 'Settings', icon: 'settings',
  render() {
    armed = false;
    return `<div class="card"><h3>Add product</h3><div class="g">
      <label>Name<input id="s-name"></label>
      <label>Category<select id="s-cat">${options(CATEGORIES.map((x) => [x, x]))}</select></label>
      <label>Default price (Rs./kg)<input id="s-price" type="number" min="0"></label>
      <label>Reorder level (kg)<input id="s-reorder" type="number" min="0"></label>
      <button class="btn" data-act="addProduct">+ Add</button></div></div>
      <div class="card"><h3>Products &amp; prices</h3>${table(['Product', 'Category', 'Unit', 'Default price', 'Reorder at'],
        state.data.prod.map((p) => [esc(p.n), esc(p.c), p.u, rs(p.p), p.ro]))}</div>
      <div class="card"><h3>Business</h3><p>Suranga Natural Spices · Currency LKR · Timezone Asia/Colombo</p>
      <button id="clear-btn" class="btn r" data-act="clearData">Clear all data</button></div>`;
  },
};

export const settingsActions = {
  addProduct() {
    const name = $('#s-name').value.trim(), price = +$('#s-price').value;
    if (!name || !Number.isFinite(price) || !(price > 0)) return toast('Enter name and price', true);
    const reorderValue = $('#s-reorder').value;
    const reorder = reorderValue === '' ? 100 : Number(reorderValue);
    if (!Number.isFinite(reorder) || reorder < 0) return toast('Enter a valid non-negative reorder level', true);
    const baseId = name.toLowerCase().replace(/\W/g, '') || 'product';
    let id = `${baseId}-${Date.now()}`;
    while (state.data.prod.some((product) => product.id === id)) id = `${baseId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    state.data.prod.push({ id, n: name, c: $('#s-cat').value, u: 'kg', ro: reorder, p: price });
    if (!persist()) return toast('Could not save the product. No changes were saved.', true);
    toast('Product added'); rerender();
  },
  clearData() {
    if (!armed) { armed = true; $('#clear-btn').textContent = 'Click again to confirm: this deletes everything'; return; }
    if (!clearAll()) return toast('Could not clear data from browser storage. No changes were made.', true);
    toast('All data cleared'); rerender();
  },
};
