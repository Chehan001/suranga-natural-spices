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
    if (!name || !(price > 0)) return toast('Enter name and price', true);
    state.data.prod.push({ id: name.toLowerCase().replace(/\W/g, '') + (Date.now() % 1000), n: name, c: $('#s-cat').value, u: 'kg', ro: +$('#s-reorder').value || 100, p: price });
    persist(); toast('Product added'); rerender();
  },
  clearData() {
    if (!armed) { armed = true; $('#clear-btn').textContent = 'Click again to confirm: this deletes everything'; return; }
    clearAll(); toast('All data cleared'); rerender();
  },
};
