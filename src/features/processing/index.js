import { state, persist } from '../../core/store.js';
import { productName } from '../../core/selectors.js';
import { rerender } from '../../core/router.js';
import { rs, esc, today } from '../../utils/format.js';
import { $ } from '../../utils/dom.js';
import { table, options, productOptions } from '../../components/ui.js';
import { toast } from '../../components/toast.js';

export const processing = {
  id: 'processing', title: 'Processing', icon: 'factory',
  render() {
    const d = state.data;
    return `<div class="card"><h3>New production</h3><div class="g">
      <label>Raw material (input)<select id="p-in">${productOptions()}</select></label>
      <label>Input quantity (kg)<input id="p-qty" type="number" min="0" step="any"></label>
      <label>Finished product (output)<select id="p-out">${options(d.prod.map((p) => [p.id, p.n]).reverse())}</select></label>
      <label>Output quantity (kg)<input id="p-oqty" type="number" min="0" step="any"></label>
      <label>Processing cost (Rs.)<input id="p-cost" type="number" min="0"></label></div>
      <p class="note">Waste / loss = input − output. Yield % = output ÷ input × 100.</p>
      <button class="btn big" data-act="saveProduction">Save production ✓</button></div>
      <div class="card"><h3>Production history &amp; yield</h3>${table(['Date', 'Input', 'Output', 'Waste', 'Yield', 'Cost'],
        d.tx.filter((x) => x.t === 'prod').reverse().map((x) => [x.d, x.q + ' kg ' + esc(productName(x.pid)), x.oq + ' kg ' + esc(productName(x.out)), x.q - x.oq + ' kg', x.y.toFixed(1) + '%', rs(x.a)]))}</div>`;
  },
};

export const processingActions = {
  saveProduction() {
    const d = state.data;
    const i = $('#p-in').value, o = $('#p-out').value, q = +$('#p-qty').value, oq = +$('#p-oqty').value, costValue = $('#p-cost').value;
    const cost = costValue === '' ? 0 : Number(costValue);
    if (!i || !o || i === o) return toast('Choose two different products (add products in Settings first)', true);
    if (!(q > 0 && oq > 0)) return toast('Enter input and output quantities', true);
    if (!Number.isFinite(cost) || cost < 0) return toast('Enter a valid non-negative processing cost', true);
    if (q > (d.stock[i] || 0)) return toast(`Only ${d.stock[i] || 0} kg ${productName(i)} in stock`, true);
    if (oq > q) return toast('Output cannot be more than input (kg to kg)', true);
    const outHand = d.stock[o] || 0;
    d.cost[o] = Math.round((outHand * (d.cost[o] || 0) + q * d.cost[i] + cost) / (outHand + oq));
    d.stock[i] -= q;
    d.stock[o] = outHand + oq;
    d.tx.push({ d: today(), t: 'prod', pid: i, out: o, q, oq, a: cost, pd: cost, y: (oq / q) * 100 });
    if (!persist()) return toast('Could not save the production record. No changes were saved.', true);
    toast(`Production saved. Yield ${((oq / q) * 100).toFixed(1)}%`);
    rerender();
  },
};
